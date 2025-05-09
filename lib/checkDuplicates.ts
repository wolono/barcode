// 检测重复itemID的工具函数
import { Product } from './db';

/**
 * 检测产品列表中的重复itemID
 * @param products 产品列表
 * @returns 包含重复itemID及其对应产品的对象
 */
export const findDuplicateItemIDs = (products: Product[]) => {
  const itemIDMap = new Map<string, Product[]>();
  const duplicates: Record<string, Product[]> = {};
  
  // 遍历所有产品，按itemID分组
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
  itemIDMap.forEach((products, itemID) => {
    if (products.length > 1) {
      duplicates[itemID] = products;
    }
  });
  
  return {
    hasDuplicates: Object.keys(duplicates).length > 0,
    duplicateCount: Object.keys(duplicates).length,
    duplicates
  };
};

/**
 * 格式化重复itemID的提示信息
 * @param duplicateInfo 重复itemID信息
 * @returns 格式化的提示信息
 */
export const formatDuplicateMessage = (duplicateInfo: ReturnType<typeof findDuplicateItemIDs> | any) => {
  if (!duplicateInfo || !duplicateInfo.hasDuplicates) {
    return '';
  }
  
  let message = `发现${duplicateInfo.duplicateCount}个重复的商品ID：\n`;
  
  Object.entries(duplicateInfo.duplicates as Record<string, Product[]>).forEach(([itemID, products]) => {
    message += `\n商品ID: ${itemID} (${products.length}个重复项)\n`;
    products.forEach((product, index) => {
      message += `  ${index + 1}. 名称: ${product.name}, UPC: ${product.upc}, 库位: ${product.location}\n`;
    });
  });
  
  return message;
};