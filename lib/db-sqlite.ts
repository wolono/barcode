import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { Product } from './db';

// 数据库文件路径
const DB_FILE_PATH = path.join(process.cwd(), 'data', 'products.db');
const JSON_PATH = path.join(process.cwd(), 'data', 'products.json');

// 初始化数据库
export function initDatabase() {
  const dbDir = path.dirname(DB_FILE_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new Database(DB_FILE_PATH);

  // 创建产品表
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      itemID TEXT PRIMARY KEY,
      upc TEXT NOT NULL,
      name TEXT NOT NULL,
      location TEXT NOT NULL
    )
  `);

  return db;
}

// 获取数据库连接
export function getDb() {
  return new Database(DB_FILE_PATH);
}

// 从JSON导入数据到SQLite
export function importProductsFromJson() {
  const db = getDb();
  const jsonData = fs.readFileSync(JSON_PATH, 'utf8');
  const products: Product[] = JSON.parse(jsonData);

  // 开始事务
  const insertStmt = db.prepare(
    'INSERT OR REPLACE INTO products (itemID, upc, name, location) VALUES (?, ?, ?, ?)'
  );

  const insertMany = db.transaction((products: Product[]) => {
    for (const product of products) {
      insertStmt.run(product.itemID, product.upc, product.name, product.location);
    }
  });

  insertMany(products);
  
  return products.length;
}

// 获取所有产品
export function getAllProductsFromDb(): Product[] {
  const db = getDb();
  return db.prepare('SELECT * FROM products').all() as Product[];
}

// 根据itemID获取产品
export function getProductsByIdsFromDb(ids: string[]): { products: Product[], notFoundIds: string[] } {
  if (ids.length === 0) {
    return { products: [], notFoundIds: [] };
  }

  const db = getDb();
  const placeholders = ids.map(() => '?').join(',');
  const products = db.prepare(`SELECT * FROM products WHERE itemID IN (${placeholders})`).all(...ids) as Product[];

  // 找出未找到的itemID
  const foundIds = products.map(product => product.itemID);
  const notFoundIds = ids.filter(id => !foundIds.includes(id));

  return {
    products,
    notFoundIds
  };
}

// 添加多个产品
export function addProductsToDb(newProducts: Product[]): Product[] {
  if (newProducts.length === 0) {
    return [];
  }

  const db = getDb();
  
  // 检查哪些产品已存在
  const existingIds = new Set<string>();
  const stmt = db.prepare('SELECT itemID FROM products WHERE itemID = ?');
  
  for (const product of newProducts) {
    const exists = stmt.get(product.itemID);
    if (exists) {
      existingIds.add(product.itemID);
    }
  }
  
  // 过滤掉已存在的产品
  const filteredNewProducts = newProducts.filter(product => !existingIds.has(product.itemID));
  
  if (filteredNewProducts.length > 0) {
    const insertStmt = db.prepare(
      'INSERT INTO products (itemID, upc, name, location) VALUES (?, ?, ?, ?)'
    );
    
    const insertMany = db.transaction((products: Product[]) => {
      for (const product of products) {
        insertStmt.run(product.itemID, product.upc, product.name, product.location);
      }
    });
    
    insertMany(filteredNewProducts);
    
    // 同时更新JSON文件以保持同步
    updateJsonFromDb();
  }
  
  return filteredNewProducts;
}

// 更新产品
export function updateProductInDb(updatedProduct: Product): Product | null {
  const db = getDb();
  
  const stmt = db.prepare(
    'UPDATE products SET upc = ?, name = ?, location = ? WHERE itemID = ?'
  );
  
  const result = stmt.run(
    updatedProduct.upc,
    updatedProduct.name,
    updatedProduct.location,
    updatedProduct.itemID
  );
  
  if (result.changes === 0) {
    return null;
  }
  
  // 同时更新JSON文件以保持同步
  updateJsonFromDb();
  
  return updatedProduct;
}

// 批量更新产品
export function updateProductsInDb(updatedProducts: Product[]): Product[] {
  if (updatedProducts.length === 0) {
    return [];
  }

  const db = getDb();
  const result: Product[] = [];
  
  const updateStmt = db.prepare(
    'UPDATE products SET upc = ?, name = ?, location = ? WHERE itemID = ?'
  );
  
  const updateMany = db.transaction((products: Product[]) => {
    for (const product of products) {
      const updateResult = updateStmt.run(
        product.upc,
        product.name,
        product.location,
        product.itemID
      );
      
      if (updateResult.changes > 0) {
        result.push(product);
      }
    }
  });
  
  updateMany(updatedProducts);
  
  // 同时更新JSON文件以保持同步
  if (result.length > 0) {
    updateJsonFromDb();
  }
  
  return result;
}

// 删除产品
export function deleteProductFromDb(itemID: string): boolean {
  const db = getDb();
  
  const stmt = db.prepare('DELETE FROM products WHERE itemID = ?');
  const result = stmt.run(itemID);
  
  if (result.changes > 0) {
    // 同时更新JSON文件以保持同步
    updateJsonFromDb();
    return true;
  }
  
  return false;
}

// 将数据库中的数据更新到JSON文件
export function updateJsonFromDb() {
  const products = getAllProductsFromDb();
  fs.writeFileSync(JSON_PATH, JSON.stringify(products, null, 2), 'utf8');
  return products.length;
}