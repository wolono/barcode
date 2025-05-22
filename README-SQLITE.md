# SQLite 数据库配置说明

本项目已配置SQLite数据库，用于存储商品信息。同时保留了原有的JSON文件作为数据备份和更新源。

## 功能特点

- 使用SQLite数据库存储商品信息，提高数据查询和操作效率
- 保留products.json文件作为数据备份和导入源
- 提供数据同步机制，确保SQLite数据库和JSON文件的数据一致性
- 支持从JSON文件导入数据到SQLite数据库
- 支持从SQLite数据库更新JSON文件

## 安装依赖

项目需要安装以下依赖：

```bash
npm install
```

这将安装所有必要的依赖，包括better-sqlite3和ts-node。

## 数据导入

首次使用SQLite数据库时，需要将现有的JSON数据导入到数据库中：

```bash
npm run import-data
```

这将执行scripts/import-data.ts脚本，将products.json中的数据导入到SQLite数据库中。

## 数据库结构

SQLite数据库包含以下表：

### products表

| 字段名 | 类型 | 说明 |
|-------|------|------|
| itemID | TEXT | 主键，商品ID |
| upc | TEXT | 商品条形码 |
| name | TEXT | 商品名称 |
| location | TEXT | 商品位置 |

## 数据同步机制

- 当通过API添加、更新或删除商品时，系统会自动同步更新SQLite数据库和JSON文件
- 如果SQLite数据库操作失败，系统会自动回退到使用JSON文件
- 可以使用`updateJsonFromSqlite()`函数手动将SQLite数据库中的数据同步到JSON文件
- 可以使用`importFromJsonToSqlite()`函数手动将JSON文件中的数据导入到SQLite数据库

## 故障排除

如果遇到SQLite数据库问题，可以尝试以下步骤：

1. 删除data/products.db文件，然后重新运行导入命令
2. 确保better-sqlite3依赖安装正确
3. 检查数据库文件权限

## 注意事项

- SQLite数据库文件(products.db)和JSON文件(products.json)都位于data目录下
- 建议定期备份数据库文件
- 在更新商品信息时，可以先更新JSON文件，然后使用导入命令更新数据库