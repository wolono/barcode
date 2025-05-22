import { initDatabase, importProductsFromJson } from '../lib/db-sqlite';

// 初始化数据库
console.log('正在初始化SQLite数据库...');
initDatabase();

// 导入数据
console.log('正在从JSON导入数据到SQLite...');
const count = importProductsFromJson();

console.log(`成功导入 ${count} 条商品记录到SQLite数据库`);
console.log('数据导入完成！');