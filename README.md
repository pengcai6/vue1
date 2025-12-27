# Vue1 - 大模型平台管理系统

基于 Vue 3 + Vite + Element Plus + Tailwind CSS + Pinia 构建的现代化大模型平台管理系统。

## 技术栈

- **框架**: Vue 3.5+ (Composition API + TypeScript)
- **构建工具**: Vite 7+
- **UI 组件**: Element Plus
- **样式**: Tailwind CSS + SCSS
- **状态管理**: Pinia
- **路由**: Vue Router (使用 unplugin-vue-router 自动生成路由)
- **工具**: VueUse

## 项目结构

```
vue1/
├── src/
│   ├── components/          # 组件
│   │   └── layouts/         # 布局组件
│   ├── composables/         # 组合式函数
│   ├── pages/               # 页面 (自动路由)
│   ├── stores/              # Pinia 状态管理
│   ├── styles/              # 样式文件
│   ├── App.vue              # 根组件
│   └── main.ts              # 入口文件
├── public/                  # 静态资源
└── ...配置文件
```

## 安装

```bash
pnpm install
```

## 开发

```bash
pnpm dev
```

## 构建

```bash
pnpm build
```

## 代码规范

- 使用 `<script setup lang="ts">` 语法
- 使用箭头函数定义方法和计算属性
- 使用 camelCase 命名 composables
- 使用 PascalCase 命名组件
- 优先使用组合式 API 而非选项式 API
- 使用 Tailwind CSS 工具类进行样式编写

更多规范请参考 [claude.md](./claude.md)
