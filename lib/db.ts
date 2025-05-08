// 数据库操作函数
import fs from 'fs';
import path from 'path';

// 定义产品类型
export interface Product {
  itemID: string;
  upc: string;
  name: string;
  location: string;
}

// 数据库文件路径
const DB_PATH = path.join(process.cwd(), 'data', 'products.json');

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

// 根据itemID获取产品
export const getProductsByIds = (ids: string[]): Product[] => {
  const products = getAllProducts();
  return products.filter(product => ids.includes(product.itemID));
};

// 添加多个产品
export const addProducts = (newProducts: Product[]): Product[] => {
  ensureDbExists();
  const products = getAllProducts();
  
  // 过滤掉已存在的产品
  const filteredNewProducts = newProducts.filter(newProduct => 
    !products.some(product => product.itemID === newProduct.itemID)
  );
  
  const updatedProducts = [...products, ...filteredNewProducts];
  fs.writeFileSync(DB_PATH, JSON.stringify(updatedProducts, null, 2), 'utf8');
  
  return filteredNewProducts;
};

// 更新产品
export const updateProduct = (updatedProduct: Product): Product | null => {
  const products = getAllProducts();
  const index = products.findIndex(p => p.itemID === updatedProduct.itemID);
  
  if (index === -1) return null;
  
  products[index] = updatedProduct;
  fs.writeFileSync(DB_PATH, JSON.stringify(products, null, 2), 'utf8');
  
  return updatedProduct;
};

// 批量更新产品
export const updateProducts = (updatedProducts: Product[]): Product[] => {
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
};