# 条码管理系统

## 项目简介

这是一个基于条码(UPC)的商品管理系统，主要用于管理商品信息、库存位置等数据。系统支持商品信息的批量导入、条码扫描查询等功能。

## 功能说明

- 商品信息管理（名称、条码、库存位置）
- 商品数据批量导入/导出
- 条码扫描查询功能
- 商品库存位置管理

## 安装步骤

1. 克隆项目仓库
2. 安装依赖：`npm install`
3. 配置数据库连接
4. 启动开发服务器：`npm run dev`

## 使用指南

### 数据导入

将商品数据以JSON格式导入到`data/products.json`文件中，格式如下：
```json
{
  "itemID": "商品ID",
  "upc": "商品条码",
  "name": "商品名称",
  "location": "库存位置"
}
```

### API接口

- GET `/api/products` - 获取所有商品列表
- GET `/api/products/:upc` - 根据条码查询商品
- POST `/api/products` - 添加新商品
- PUT `/api/products/:id` - 更新商品信息
- DELETE `/api/products/:id` - 删除商品

### 前端功能

- 商品列表展示
- 条码扫描查询
- 商品位置导航
- 批量导入导出

## 项目结构

```
├── app/            # 前端应用
├── data/           # 数据文件
│   └── products.json
├── lib/            # 工具函数
└── public/         # 静态资源
```

## 开发

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```