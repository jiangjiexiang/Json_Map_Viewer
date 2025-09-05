// src/render.js

/**
 * 渲染器类，负责地图数据的解析、坐标转换和在 Canvas 上的绘制。
 */
class MapRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.data = null; // 存储加载的地图数据
    this.offset = { x: 0, y: 0 }; // JSON 中定义的坐标偏移
    this.minX = Infinity;
    this.maxX = -Infinity;
    this.minY = Infinity;
    this.maxY = -Infinity; // 地图边界，用于 fitBounds

    this.scale = 1.0; // 当前缩放级别
    this.translateX = 0; // 平移量 X
    this.translateY = 0; // 平移量 Y
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.showGrid = false; // 是否显示网格

    this.setupCanvas();
  }

  /**
   * 设置 Canvas 尺寸以适应高 DPI 屏幕。
   */
  setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.canvas.clientWidth * dpr;
    this.canvas.height = this.canvas.clientHeight * dpr;
    this.ctx.scale(dpr, dpr); // 缩放上下文以匹配 CSS 像素
  }

  /**
   * 加载并解析地图数据。
   * @param {Object} jsonData - 原始 JSON 地图数据。
   */
  loadData(jsonData) {
    this.data = jsonData;
    this.offset = this.data.offset || { x: 0, y: 0, z: 0 };
    this.calculateBounds();
    this.fitBounds(); // 加载新数据时自动适应边界
    this.draw();
  }

  /**
   * 计算地图数据的实际边界（minX, maxX, minY, maxY）。
   * 遍历所有 BoundaryPoints 来确定。
   */
  calculateBounds() {
    this.minX = Infinity;
    this.maxX = -Infinity;
    this.minY = Infinity;
    this.maxY = -Infinity;

    if (!this.data || !this.data.roadLine) {
      return;
    }

    this.data.roadLine.forEach(road => {
      road.BoundaryPoints.forEach(point => {
        const x = point.x - this.offset.x;
        const y = point.y - this.offset.y;
        this.minX = Math.min(this.minX, x);
        this.maxX = Math.max(this.maxX, x);
        this.minY = Math.min(this.minY, y);
        this.maxY = Math.max(this.maxY, y);
      });
    });
  }

  /**
   * 将地图视图调整到适合 Canvas 的大小，显示所有地图内容。
   */
  fitBounds() {
    if (this.minX === Infinity) return; // 没有数据

    const mapWidth = this.maxX - this.minX;
    const mapHeight = this.maxY - this.minY;
    const canvasWidth = this.canvas.clientWidth;
    const canvasHeight = this.canvas.clientHeight;

    // 计算缩放比例，留出一些边距
    const padding = 0.1; // 10% 边距
    const scaleX = (canvasWidth * (1 - padding)) / mapWidth;
    const scaleY = (canvasHeight * (1 - padding)) / mapHeight;
    this.scale = Math.min(scaleX, scaleY);

    // 计算平移量使地图居中
    const scaledMapWidth = mapWidth * this.scale;
    const scaledMapHeight = mapHeight * this.scale;

    this.translateX = (canvasWidth - scaledMapWidth) / 2 - this.minX * this.scale;
    this.translateY = (canvasHeight - scaledMapHeight) / 2 - this.minY * this.scale;

    this.draw();
  }

  /**
   * 将世界坐标转换为 Canvas 坐标。
   * @param {number} x - 世界坐标 X。
   * @param {number} y - 世界坐标 Y。
   * @returns {{x: number, y: number}} - Canvas 坐标。
   */
  worldToCanvas(x, y) {
    // 减去 offset，然后应用缩放和平移
    const transformedX = (x - this.offset.x) * this.scale + this.translateX;
    // Y 轴反转，因为 Canvas 的 Y 轴向下，而地图的 Y 轴向上
    const transformedY = this.canvas.clientHeight - ((y - this.offset.y) * this.scale + this.translateY);
    return { x: transformedX, y: transformedY };
  }

  /**
   * 绘制所有地图元素。
   */
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save(); // 保存当前状态

    // 绘制网格
    if (this.showGrid) {
      this.drawGrid();
    }

    if (!this.data || !this.data.roadLine) {
      this.ctx.restore();
      return;
    }

    this.data.roadLine.forEach(road => {
      this.drawRoadLine(road, this.ctx);
    });

    this.ctx.restore(); // 恢复之前保存的状态
  }

  /**
   * 绘制单条道路线。
   * @param {Object} road - 道路数据对象。
   */
  drawRoadLine(road, ctx) {
    if (!road.BoundaryPoints || road.BoundaryPoints.length < 2) {
      return;
    }

    const firstPoint = road.BoundaryPoints[0];
    // 注释掉这个检查，让所有类型的线都能渲染
    // if (firstPoint.LineType === 'none') {
    //   return; // 不渲染

    ctx.beginPath();
    ctx.lineWidth = 2; // 默认线宽

    // 根据 LineColor 设置颜色
    switch (firstPoint.LineColor) {
      case 'white':
        ctx.strokeStyle = 'white';
        break;
      case 'standard':
        ctx.strokeStyle = 'gray'; // 假设 standard 是灰色
        break;
      default:
        ctx.strokeStyle = 'white'; // 默认白色
    }

    // 根据 LineType 设置虚线
    if (firstPoint.LineType === 'broken') {
      ctx.setLineDash([5, 5]); // 虚线
    } else {
      ctx.setLineDash([]); // 实线
    }

    let start = this.worldToCanvas(firstPoint.x, firstPoint.y);
    ctx.moveTo(start.x, start.y);

    for (let i = 1; i < road.BoundaryPoints.length; i++) {
      const point = road.BoundaryPoints[i];
      let end = this.worldToCanvas(point.x, point.y);
      ctx.lineTo(end.x, end.y);
    }
    ctx.stroke();

    // 绘制箭头表示方向 (可选增强功能)
    if (road.BoundaryPoints.length > 1) {
      const p1 = this.worldToCanvas(road.BoundaryPoints[0].x, road.BoundaryPoints[0].y);
      const p2 = this.worldToCanvas(road.BoundaryPoints[1].x, road.BoundaryPoints[1].y);
      this.drawArrow(p1.x, p1.y, p2.x, p2.y, ctx.strokeStyle);
    }

    // 在中点标注 RoadId (可选增强功能)
    if (road.RoadId) {
      const midIndex = Math.floor(road.BoundaryPoints.length / 2);
      const midPoint = road.BoundaryPoints[midIndex];
      const canvasMid = this.worldToCanvas(midPoint.x, midPoint.y);
      ctx.fillStyle = 'cyan';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(road.RoadId, canvasMid.x, canvasMid.y - 10); // 稍微向上偏移
    }
  }

  /**
   * 绘制箭头。
   * @param {number} x1 - 起点 X。
   * @param {number} y1 - 起点 Y。
   * @param {number} x2 - 终点 X。
   * @param {number} y2 - 终点 Y。
   * @param {string} color - 箭头颜色。
   */
  drawArrow(x1, y1, x2, y2, color) {
    const headlen = 8; // 箭头头部长度
    const angle = Math.atan2(y2 - y1, x2 - x1);
    this.ctx.strokeStyle = color;
    this.ctx.fillStyle = color;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(x2, y2);
    this.ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
    this.ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
    this.ctx.closePath();
    this.ctx.fill();
  }

  /**
   * 绘制网格。
   */
  drawGrid() {
    const ctx = this.ctx;
    const canvasWidth = this.canvas.clientWidth;
    const canvasHeight = this.canvas.clientHeight;
    const gridSize = 50; // 网格大小，单位 Canvas 像素

    ctx.strokeStyle = 'rgba(128, 128, 128, 0.3)';
    ctx.lineWidth = 0.5;

    // 绘制垂直线
    for (let x = 0; x < canvasWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }

    // 绘制水平线
    for (let y = 0; y < canvasHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }
  }

  /**
   * 缩放视图。
   * @param {number} factor - 缩放因子 (例如 1.1 放大，0.9 缩小)。
   * @param {number} centerX - 缩放中心 X (Canvas 坐标)。
   * @param {number} centerY - 缩放中心 Y (Canvas 坐标)。
   */
  zoom(factor, centerX, centerY) {
    // 将 Canvas 坐标转换为世界坐标
    const worldX = (centerX - this.translateX) / this.scale + this.offset.x;
    const worldY = (this.canvas.clientHeight - centerY - this.translateY) / this.scale + this.offset.y;

    this.scale *= factor;

    // 重新计算平移量以保持缩放中心不变
    this.translateX = centerX - (worldX - this.offset.x) * this.scale;
    this.translateY = this.canvas.clientHeight - centerY - (worldY - this.offset.y) * this.scale;

    this.draw();
  }

  /**
   * 平移视图。
   * @param {number} dx - X 方向平移量 (Canvas 像素)。
   * @param {number} dy - Y 方向平移量 (Canvas 像素)。
   */
  pan(dx, dy) {
    this.translateX += dx;
    this.translateY -= dy;
    this.draw();
  }

  /**
   * 重置视图到初始状态（适应边界）。
   */
  resetView() {
    this.fitBounds();
  }

  /**
   * 切换网格显示。
   */
  toggleGrid() {
    this.showGrid = !this.showGrid;
    this.draw();
  }
}
