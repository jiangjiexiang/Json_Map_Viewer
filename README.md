# JSON Map Viewer

一个简单的地图查看器，用于可视化和交互式浏览JSON格式的地图文件。

## 功能特点

- 加载和显示JSON格式的地图文件
- 交互式操作：放大、缩小、平移、重置视图
- 显示网格（可选）
- 点击道路线显示详细信息面板

## 如何启动应用

这是一个纯前端应用程序，您需要一个HTTP服务器来托管这些文件。以下是几种启动方法：

### 方法一：使用Python（推荐）

如果您的电脑上安装了Python，可以使用内置的HTTP服务器：

1. 打开命令提示符（CMD）或终端
2. 导航到项目根目录（`f:\Json_map`）
3. 运行以下命令：
   
   ```bash
   python -m http.server 8080
   ```
4. 打开浏览器，访问 `http://localhost:8080`

### 方法二：使用Node.js

如果您的电脑上安装了Node.js，可以使用`http-server`包：

1. 打开命令提示符（CMD）或终端
2. 导航到项目根目录（`f:\Json_map`）
3. 运行以下命令：
   
   ```bash
   npx http-server -p 8080
   ```
4. 打开浏览器，访问 `http://localhost:8080`

## 如何导入新地图

有两种方法可以导入新的地图文件：

### 方法一：通过mapIndex.json导入（推荐）

1. 将您的JSON格式地图文件复制到`map/`目录中
2. 编辑`map/mapIndex.json`文件，按照以下格式添加您的地图信息：
   
   ```json
   {
     "maps": [
       {
         "name": "您的地图名称",
         "file": "您的地图文件名.json"
       },
       // 其他地图...
     ]
   }
   ```
3. 重新启动应用程序，您的新地图将出现在地图选择下拉框中

### 方法二：通过修改代码导入

如果`mapIndex.json`文件不存在或您不想修改它，可以通过修改代码来添加新地图：

1. 将您的JSON格式地图文件复制到`map/`目录中
2. 编辑`src/app.js`文件，找到`fallbackMapList()`方法
3. 在`knownMaps`数组中添加您的地图信息：
   
   ```javascript
   const knownMaps = [
     { name: 'AI Town Reconstructed', file: 'AITownReconstructed_V0103_200518.xodr.json' },
     { name: 'GESM2', file: 'GESM2.xodr.json' },
     { name: '您的地图名称', file: '您的地图文件名.json' }
   ];
   ```
4. 保存文件并重新启动应用程序

## 地图文件格式要求

地图文件应为JSON格式，包含以下主要结构：

```json
{
  "offset": { "x": 0, "y": 0, "z": 0 },
  "roadLine": [
    {
      "RoadId": "道路ID",
      "BoundaryPoints": [
        {
          "x": 坐标X,
          "y": 坐标Y,
          "LineColor": "white"或"standard",
          "LineType": "solid"或"broken"
        },
        // 更多点...
      ]
    },
    // 更多道路...
  ]
}
```

## 使用说明

1. 从下拉框中选择一个地图文件
2. 使用工具栏中的按钮或键盘快捷键进行操作：
   - `+` 或 `=`：放大
   - `-`：缩小
   - `R` 或 `r`：重置视图
   - `G` 或 `g`：切换网格显示
3. 拖拽地图可以平移视图
4. 使用鼠标滚轮可以放大或缩小
5. 点击道路线可以查看其详细信息

## 项目结构

```
├── index.html       # 主HTML页面
├── styles.css       # 样式表
├── src/
│   ├── app.js       # 应用程序主类，处理用户交互
│   └── render.js    # 地图渲染器
└── map/
    ├── mapIndex.json                 # 地图索引文件
    ├── AITownReconstructed_V0103_200518.xodr.json  # 示例地图文件
    └── GESM2.xodr.json               # 示例地图文件
```

## 注意事项

- 确保地图文件格式正确，否则可能无法正常加载
- 对于大型地图，加载时间可能会稍长
- 如果点击道路线没有显示信息面板，请确保您的点击位置准确