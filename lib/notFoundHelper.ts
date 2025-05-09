// 处理未找到itemID的工具函数

/**
 * 格式化未找到itemID的提示信息
 * @param notFoundInfo 未找到itemID信息
 * @returns 格式化的提示信息
 */
export const formatNotFoundMessage = (notFoundInfo: { hasNotFound: boolean; notFoundCount: number; notFoundIds: string[] } | null) => {
  if (!notFoundInfo || !notFoundInfo.hasNotFound) {
    return '';
  }
  
  let message = `未找到${notFoundInfo.notFoundCount}个商品ID：\n`;
  message += notFoundInfo.notFoundIds.join('\n');
  
  return message;
};