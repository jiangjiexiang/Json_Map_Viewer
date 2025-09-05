// src/app.js

/**
 * 应用程序主类，负责初始化、事件处理和用户交互。
 */
class MapApp {
  constructor() {
    this.canvas = document.getElementById('mapCanvas');
    this.mapSelect = document.getElementById('mapSelect');
    this.status = document.getElementById('status');
    this.infoPanel = document.getElementById('infoPanel'); // 信息面板
    this.renderer = new MapRenderer(this.canvas);

    this.init();
  }

  /**
   * 初始化应用程序。
   */
  async init() {
    this.setupEventListeners();
    this.setupResizeHandler();
    await this.loadMapIndex();
    this.handleUrlParams();
  }

  /**
   * 设置事件监听器。
   */
  setupEventListeners() {
    // 地图选择下拉框
    this.mapSelect.addEventListener('change', (e) => {
      if (e.target.value) {
        this.loadMapFile(e.target.value);
      }
    });

    // 控制按钮
    document.getElementById('zoomIn').addEventListener('click', () => {
      const centerX = this.canvas.clientWidth / 2;
      const centerY = this.canvas.clientHeight / 2;
      this.renderer.zoom(1.2, centerX, centerY);
    });

    document.getElementById('zoomOut').addEventListener('click', () => {
      const centerX = this.canvas.clientWidth / 2;
      const centerY = this.canvas.clientHeight / 2;
      this.renderer.zoom(0.8, centerX, centerY);
    });

    document.getElementById('resetView').addEventListener('click', () => {
      this.renderer.resetView();
    });

    document.getElementById('toggleGrid').addEventListener('click', () => {
      this.renderer.toggleGrid();
    });

    // 鼠标交互
    this.setupMouseInteractions();

    // 键盘快捷键
    this.setupKeyboardShortcuts();
    // ▼▼▼ 添加下面的 Canvas 点击事件监听器 ▼▼▼
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const info = this.renderer.selectRoadAt(mouseX, mouseY);

      if (info) {
        this.infoPanel.innerHTML = `
          <h4>道路信息</h4>
          <p><strong>道路ID:</strong> ${info.id}</p>
          <p><strong>长度:</strong> ${info.length.toFixed(2)} 米</p>
        `;
        this.infoPanel.style.display = 'block';
      } else {
        this.infoPanel.style.display = 'none';
      }
    });
  }

  /**
   * 设置鼠标交互（拖拽平移和滚轮缩放）。
   */
  setupMouseInteractions() {
    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    // 鼠标按下
    this.canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      this.canvas.style.cursor = 'grabbing';
      e.preventDefault();
    });

    // 鼠标移动
    this.canvas.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        this.renderer.pan(dx, dy);
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      }
    });

    // 鼠标抬起
    this.canvas.addEventListener('mouseup', () => {
      isDragging = false;
      this.canvas.style.cursor = 'grab';
    });

    // 鼠标离开画布
    this.canvas.addEventListener('mouseleave', () => {
      isDragging = false;
      this.canvas.style.cursor = 'default';
    });

    // 滚轮缩放
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      this.renderer.zoom(zoomFactor, mouseX, mouseY);
    });

    // 设置默认鼠标样式
    this.canvas.style.cursor = 'grab';
  }

  /**
   * 设置键盘快捷键。
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case '+':
        case '=':
          e.preventDefault();
          const centerX = this.canvas.clientWidth / 2;
          const centerY = this.canvas.clientHeight / 2;
          this.renderer.zoom(1.2, centerX, centerY);
          break;
        case '-':
          e.preventDefault();
          const centerX2 = this.canvas.clientWidth / 2;
          const centerY2 = this.canvas.clientHeight / 2;
          this.renderer.zoom(0.8, centerX2, centerY2);
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          this.renderer.resetView();
          break;
        case 'g':
        case 'G':
          e.preventDefault();
          this.renderer.toggleGrid();
          break;
      }
    });
  }

  /**
   * 设置窗口大小调整处理器。
   */
  setupResizeHandler() {
    window.addEventListener('resize', () => {
      this.renderer.setupCanvas();
      this.renderer.draw();
    });
  }

  /**
   * 加载地图索引文件。
   */
  async loadMapIndex() {
    try {
      this.setStatus('加载地图列表...');
      const response = await fetch('map/mapIndex.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const mapIndex = await response.json();
      this.populateMapSelect(mapIndex);
      this.setStatus('就绪');
    } catch (error) {
      console.error('加载地图索引失败:', error);
      this.setStatus('加载地图列表失败');
      // 如果索引文件不存在，尝试直接列出 map 目录中的文件
      this.fallbackMapList();
    }
  }

  /**
   * 填充地图选择下拉框。
   * @param {Object} mapIndex - 地图索引数据。
   */
  populateMapSelect(mapIndex) {
    this.mapSelect.innerHTML = '<option value="">请选择地图...</option>';
    
    if (mapIndex.maps && Array.isArray(mapIndex.maps)) {
      mapIndex.maps.forEach(map => {
        const option = document.createElement('option');
        option.value = map.file;
        option.textContent = map.name || map.file;
        this.mapSelect.appendChild(option);
      });
    }
  }

  /**
   * 备用方案：直接列出已知的地图文件。
   */
  fallbackMapList() {
    const knownMaps = [
      { name: 'AI Town Reconstructed', file: 'AITownReconstructed_V0103_200518.xodr.json' },
      { name: 'GESM2', file: 'GESM2.xodr.json' }
    ];

    this.mapSelect.innerHTML = '<option value="">请选择地图...</option>';
    knownMaps.forEach(map => {
      const option = document.createElement('option');
      option.value = map.file;
      option.textContent = map.name;
      this.mapSelect.appendChild(option);
    });
    this.setStatus('使用默认地图列表');
  }

  /**
   * 处理 URL 参数，自动加载指定的地图文件。
   */
  handleUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const fileParam = urlParams.get('file');
    if (fileParam) {
      this.mapSelect.value = fileParam;
      this.loadMapFile(fileParam);
    }
  }

  /**
   * 加载指定的地图文件。
   * @param {string} filename - 地图文件名。
   */
  async loadMapFile(filename) {
    try {
      this.setStatus(`加载地图: ${filename}...`);
      const response = await fetch(`map/${filename}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const mapData = await response.json();
      this.renderer.loadData(mapData);
      this.setStatus(`已加载: ${filename}`);
      
      // 更新 URL 参数
      const url = new URL(window.location);
      url.searchParams.set('file', filename);
      window.history.replaceState({}, '', url);
    } catch (error) {
      console.error('加载地图文件失败:', error);
      this.setStatus(`加载失败: ${filename}`);
    }
  }

  /**
   * 设置状态文本。
   * @param {string} message - 状态消息。
   */
  setStatus(message) {
    this.status.textContent = message;
  }
}

// 当 DOM 加载完成后初始化应用程序
document.addEventListener('DOMContentLoaded', () => {
  new MapApp();
});
