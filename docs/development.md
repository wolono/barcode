# 条形码生成应用开发文档

## 项目概述

本项目是一款基于Next.js和shadcn/ui的条形码生成应用，支持多种条形码格式的生成、预览和下载功能。

## 技术栈

- **框架**：Next.js 15.4.7 (App Router)
- **UI库**：React 19.1.0
- **类型系统**：TypeScript
- **样式**：Tailwind CSS 4
- **组件库**：shadcn/ui (New York风格)
- **图标**：lucide-react
- **工具类**：class-variance-authority, tailwind-merge
- **动画**：tw-animate-css
- **包管理器**：PNPM

## 功能规划

1. 条形码生成器
   - 支持多种条形码格式 (如Code 128, QR Code等)
   - 自定义条形码内容
   - 调整条形码大小和颜色
   - 实时预览

2. 历史记录
   - 保存最近生成的条形码
   - 快速重新生成

3. 导出功能
   - 下载为图片 (PNG, SVG)
   - 复制到剪贴板

## 组件规划

基于shadcn/ui提供的组件，我们将使用以下组件：

- **Button**：用于操作按钮
- **Card**：用于封装功能模块
- **Input**：用于文本输入
- **Select**：用于选择条形码格式
- **Slider**：用于调整大小
- **ColorPicker** (自定义实现)：用于颜色选择
- **Tabs**：用于切换不同功能区域
- **Sonner**：用于提示信息
- **Tooltip**：用于提供帮助信息
- **Alert**：用于显示错误和警告
- **Progress**：用于显示生成进度
- **Skeleton**：用于加载状态
- **Dropdown Menu**：用于更多选项
- **Dialog**：用于确认操作
- **Label**：用于表单标签
- **Textarea**：用于多行输入

## 目录结构

```
barcode/
├── app/
│   ├── api/
│   │   └── barcode/
│   │       └── route.ts
│   ├── components/
│   │   ├── barcode-generator/
│   │   ├── history/
│   │   └── ui/
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components.json
├── docs/
│   └── development.md
├── lib/
│   ├── hooks/
│   ├── utils.ts
│   └── barcode.ts
├── next.config.ts
├── package.json
└── ...
```

## 开发规范

### shadcn/ui 组件使用规范

1. 所有UI组件通过`@/components/ui`导入
2. 自定义组件遵循shadcn/ui的样式规范
3. 使用`class-variance-authority`管理组件变体
4. 使用`tailwind-merge`合并Tailwind类名
5. 组件Props定义清晰的类型

### 代码规范

1. 使用TypeScript严格模式
2. 组件命名采用PascalCase
3. 函数命名采用camelCase
4. 使用ESLint进行代码检查
5. 保持代码简洁，避免冗余

## 开发流程

1. 设置项目基础结构
2. 实现条形码生成核心功能
3. 开发UI组件和页面
4. 集成功能模块
5. 测试和优化
6. 部署

## 依赖项

除了现有的依赖项外，我们已添加以下依赖：

- `jsbarcode`：用于生成条形码（已安装）
- `qrcode`：用于生成二维码（已安装）

## 当前进度

1. 已完成项目基础结构设置
2. 已安装shadcn/ui组件库及其所需组件
3. 已安装条形码生成所需的依赖库
4. 开发文档已初步编写完成

## 后续扩展

1. 批量生成功能
2. 条形码扫描功能
3. 条形码模板保存
4. 集成第三方服务

---

本开发文档将指导团队成员进行条形码生成应用的开发工作，确保开发过程中的一致性和高效性。
### 实时更新记录
- [2025/8/19 23:26:41] 修改: app\page.tsx
