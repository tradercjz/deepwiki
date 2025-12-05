# 🐬 DeepWiki (DolphinMind) Frontend

DeepWiki 是一个专为 DolphinDB 文档设计的下一代 AI 智能问答前端。它不仅提供基于 RAG（检索增强生成）的流式对话体验，还创新性地集成了 **交互式 3D 可视化引擎**，用于直观展示复杂的数据处理逻辑（如流计算引擎、窗口函数、透视表等）。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Vite](https://img.shields.io/badge/Vite-5-purple)
![Three.js](https://img.shields.io/badge/Three.js-R3F-black)

## ✨ 核心特性

*   **🧠 智能 RAG 对话**:
    *   流式响应 (Server-Sent Events)。
    *   支持 Markdown 渲染、代码高亮、数学公式。
    *   **引用溯源**: 点击答案中的引用角标，自动高亮并滚动到侧边栏的源文档位置，并在两者之间绘制动态连线。
*   **🧊 3D 代码可视化 (The Visualizer)**:
    *   基于 React Three Fiber 的高性能 3D 场景。
    *   **插件化架构**: 支持动态加载不同的可视化特效。
    *   **支持场景**: 时间序列引擎 (TSE)、反应式状态引擎 (RSE)、横截面引擎 (CSE)、Pivot、AsOf Join、滑动窗口函数 (msum/tmsum) 等。
*   **🎨 沉浸式 UI**:
    *   Vanta.js 动态波浪背景。
    *   Google 风格流光输入框动效。
    *   自适应深色/浅色模式 (Dark Mode)。
*   **📂 文件与历史**:
    *   支持图片上传至 OSS 并进行多模态问答。
    *   本地存储的对话历史记录管理。
*   **🛠️ 调试模式**: 提供 RAG 检索管道的详细调试页面，展示向量检索、BM25 和 Rerank 结果。

## 🛠️ 技术栈

*   **构建工具**: [Vite](https://vitejs.dev/)
*   **核心框架**: [React 18](https://reactjs.org/)
*   **语言**: [TypeScript](https://www.typescriptlang.org/)
*   **样式**: [Tailwind CSS](https://tailwindcss.com/)
*   **3D 图形**:
    *   [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) (Three.js React 渲染器)
    *   [@react-three/drei](https://github.com/pmndrs/drei) (常用组件库)
    *   [@react-spring/three](https://www.react-spring.dev/) (物理动画)
    *   [@react-three/postprocessing](https://github.com/pmndrs/react-postprocessing) (后期处理：Bloom, Vignette)
*   **Markdown**: `react-markdown`, `remark-gfm`
*   **路由**: `react-router-dom`

## 🚀 快速开始

### 1. 环境准备
确保已安装 Node.js (推荐 v18+) 和 npm/yarn/pnpm。

### 2. 安装依赖

```bash
npm install
# 或者
yarn install
```

### 3. 配置环境变量
在项目根目录创建 `.env` 文件（参考 `.env.example`）：

```env
# 后端 API 地址
REACT_APP_API_URL=http://your-backend-api:8007


### 4. 启动开发服务器

```bash
npm run dev
```
访问 `http://localhost:3000` 即可看到应用。

### 5. 构建生产版本

```bash
npm run build
```

## 📂 项目结构

```text
src/
├── assets/                 # 静态资源
├── components/             # 通用 UI 组件 (ChatInterface, Sidebar, Icons...)
│   ├── ChatInterface.tsx   # 核心对话渲染组件
│   ├── VisualizerModal.tsx # 3D 可视化弹窗容器
│   └── ...
├── hooks/                  # React Hooks
│   ├── useRAGStream.ts     # RAG 流式请求逻辑
│   └── ...
├── visualizer/             # === 3D 可视化引擎核心 ===
│   ├── components/         # 3D 场景组件 (Scene, Stage, InputCube...)
│   ├── hooks/              # 可视化数学逻辑 (计算每一步的状态)
│   ├── plugins/            # 可视化插件定义 (将 Logic 与 Stage 绑定)
│   ├── types/              # 类型定义
│   ├── constants.ts        # 演示数据常量
│   ├── pluginRegistry.ts   # 插件注册表
│   └── DolphinDBVisualizer.tsx # 通用 3D 播放器组件
├── utils/                  # 工具函数 (OSS上传, History管理)
├── App.tsx                 # 主应用入口 (包含路由和全局状态)
└── main.tsx
```

## 🧩 可视化插件开发指南

DeepWiki 采用了插件化架构来扩展 3D 可视化效果。要添加一个新的函数可视化（例如 `newFunc`），请遵循以下步骤：

### 1. 实现逻辑 Hook
在 `src/visualizer/hooks/` 下创建 `useNewFuncLogic.ts`。该 Hook 应接收参数并返回动画所需的**步骤数组 (Steps Array)**。

### 2. 实现 3D 舞台组件
在 `src/visualizer/components/` 下创建 `NewFuncStage.tsx`。该组件接收 `progress` (0-N) 和 `logic` (步骤数据)，使用 `react-spring` 渲染 3D 动画。

### 3. 创建插件包装器
在 `src/visualizer/plugins/` 下创建 `NewFuncPlugin.tsx`，定义插件元数据、参数面板，并连接 Logic 和 Stage。

```typescript
// 示例结构
export const NewFuncPlugin: Plugin = {
  id: 'newFunc',
  name: 'New Function',
  description: 'Visualizes newFunc logic',
  SceneComponent: NewFuncScene, // 内部调用 Stage 和 Logic Hook
  ParameterPanelComponent: NewFuncPanel, // 右上角的参数控制 UI
  defaultParams: { arg1: 10 }
};
```

### 4. 注册插件
在 `src/visualizer/pluginRegistry.ts` 中引入并注册你的插件。

```typescript
import { NewFuncPlugin } from './plugins/NewFuncPlugin';

export const PLUGIN_REGISTRY = {
  // ... 其他插件
  [NewFuncPlugin.id]: NewFuncPlugin,
};
```

### 5. 配置触发映射
在 `src/components/ChatInterface.tsx` 中配置何时触发该插件。

```typescript
const FUNCTION_TO_PLUGIN_MAP = {
  // ...
  'newFunc': { pluginId: 'newFunc', initialParams: { ... } },
};
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1.  Fork 本仓库。
2.  创建你的特性分支 (`git checkout -b feature/AmazingFeature`)。
3.  提交你的更改 (`git commit -m 'Add some AmazingFeature'`)。
4.  推送到分支 (`git push origin feature/AmazingFeature`)。
5.  开启一个 Pull Request。

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。