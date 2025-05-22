// 数据库操作函数
import fs from 'fs';
import path from 'path';
import * as sqliteDb from './db-sqlite';

// 定义产品类型
export interface Product {
  itemID: string;
  upc: string;
  name: string;
  location: string;
}

// 数据库文件路径
const DB_PATH = path.join(process.cwd(), 'data', 'products.json');

// 初始化SQLite数据库
try {
  sqliteDb.initDatabase();
  console.log('SQLite数据库初始化成功');
} catch (error) {
  console.error('SQLite数据库初始化失败', error);
}

// 确保数据库文件存在
const ensureDbExists = () => {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2), 'utf8');
  }
};

// 获取所有产品
export const getAllProducts = (): Product[] => {
  ensureDbExists();
  const data = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(data);
};

// 获取所有产品并检查重复的itemID
export const getAllProductsWithDuplicateCheck = () => {
  const products = getAllProducts();
  
  // 检查重复的itemID
  const itemIDMap = new Map<string, Product[]>();
  const duplicates: Record<string, Product[]> = {};
  
  products.forEach(product => {
    if (!product.itemID) return;
    
    if (!itemIDMap.has(product.itemID)) {
      itemIDMap.set(product.itemID, [product]);
    } else {
      const existingProducts = itemIDMap.get(product.itemID) || [];
      itemIDMap.set(product.itemID, [...existingProducts, product]);
    }
  });
  
  // 找出有多个产品的itemID
  itemIDMap.forEach((productList, itemID) => {
    if (productList.length > 1) {
      duplicates[itemID] = productList;
    }
  });
  
  return {
    products,
    hasDuplicates: Object.keys(duplicates).length > 0,
    duplicateCount: Object.keys(duplicates).length,
    duplicates
  };
};

// 根据itemID获取产品
export const getProductsByIds = (ids: string[]): { products: Product[], notFoundIds: string[] } => {
  const products = getAllProducts();
  const foundProducts = products.filter(product => ids.includes(product.itemID));
  
  // 找出未找到的itemID
  const foundIds = foundProducts.map(product => product.itemID);
  const notFoundIds = ids.filter(id => !foundIds.includes(id));
  
  return {
    products: foundProducts,
    notFoundIds: notFoundIds
  };
};

// 添加多个产品
export const addProducts = (newProducts: Product[]): Product[] => {
  try {
    // 优先使用SQLite数据库
    // sqliteDb.addProductsToDb 会处理已存在产品的过滤，并返回实际添加的产品列表
    const addedToSqlite = sqliteDb.addProductsToDb(newProducts);
    // sqliteDb.addProductsToDb 内部在成功添加后会调用 updateJsonFromDb() 来同步JSON文件
    return addedToSqlite;
  } catch (error) {
    // 如果SQLite出错，回退到JSON文件
    console.error('在SQLite添加数据失败，回退到JSON文件', error);
    ensureDbExists();
    const products = getAllProducts(); // 从JSON读取
    
    // 过滤掉已存在的产品 (JSON中的)
    const filteredNewProducts = newProducts.filter(newProduct => 
      !products.some(product => product.itemID === newProduct.itemID)
    );
    
    if (filteredNewProducts.length > 0) {
        const updatedProductsList = [...products, ...filteredNewProducts];
        fs.writeFileSync(DB_PATH, JSON.stringify(updatedProductsList, null, 2), 'utf8'); // 写入JSON
    }
    return filteredNewProducts;
  }
};

// 更新产品
export const updateProduct = (updatedProduct: Product): Product | null => {
  try {
    // 优先使用SQLite数据库
    return sqliteDb.updateProductInDb(updatedProduct);
  } catch (error) {
    // 如果SQLite出错，回退到JSON文件
    console.error('在SQLite更新数据失败，回退到JSON文件', error);
    const products = getAllProducts();
    const index = products.findIndex(p => p.itemID === updatedProduct.itemID);
    
    if (index === -1) {
      return null;
    }
    
    products[index] = updatedProduct;
    fs.writeFileSync(DB_PATH, JSON.stringify(products, null, 2), 'utf8');
    
    return updatedProduct;
  }
};

// 批量更新产品
export const updateProducts = (updatedProducts: Product[]): Product[] => {
  try {
    // 优先使用SQLite数据库
    return sqliteDb.updateProductsInDb(updatedProducts);
  } catch (error) {
    // 如果SQLite出错，回退到JSON文件
    console.error('在SQLite批量更新数据失败，回退到JSON文件', error);
    const products = getAllProducts();
    const result: Product[] = [];
    
    updatedProducts.forEach(updatedProduct => {
      const index = products.findIndex(p => p.itemID === updatedProduct.itemID);
      if (index !== -1) {
        products[index] = updatedProduct;
        result.push(updatedProduct);
      }
    });
    
    fs.writeFileSync(DB_PATH, JSON.stringify(products, null, 2), 'utf8');
    return result;
  }
};

// 删除产品
export const deleteProduct = (itemID: string): boolean => {
  try {
    // 优先使用SQLite数据库
    return sqliteDb.deleteProductFromDb(itemID);
  } catch (error) {
    // 如果SQLite出错，回退到JSON文件
    console.error('从SQLite删除数据失败，回退到JSON文件', error);
    const products = getAllProducts();
    const initialLength = products.length;
    
    const filteredProducts = products.filter(product => product.itemID !== itemID);
    
    if (filteredProducts.length === initialLength) {
      return false;
    }
    
    fs.writeFileSync(DB_PATH, JSON.stringify(filteredProducts, null, 2), 'utf8');
    
    return true;
  }
};

// 从JSON导入数据到SQLite
export const importFromJsonToSqlite = (): number => {
  try {
    return sqliteDb.importProductsFromJson();
  } catch (error) {
    console.error('从JSON导入数据到SQLite失败', error);
    return 0;
  }
};

// 从SQLite更新JSON文件
export const updateJsonFromSqlite = (): number => {
  try {
    return sqliteDb.updateJsonFromDb();
  } catch (error) {
    console.error('从SQLite更新JSON文件失败', error);
    return 0;
  }
};