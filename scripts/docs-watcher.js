#!/usr/bin/env node
const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');

// 文档路径
const docsPath = path.join(__dirname, '..', 'docs', 'development.md');

// 监控的文件和目录
const watchPaths = [
  path.join(__dirname, '..', 'app'),
  path.join(__dirname, '..', 'components'),
  path.join(__dirname, '..', 'lib'),
  path.join(__dirname, '..', 'package.json'),
  path.join(__dirname, '..', 'components.json')
];

// 初始化监控器
const watcher = chokidar.watch(watchPaths, {
  ignored: /node_modules|.git/, // 忽略的目录
  persistent: true,
  ignoreInitial: true,
  depth: 5
});

// 记录最后更新时间
let lastUpdateTime = new Date();

// 文件变化处理函数
function handleFileChange(event, filePath) {
  const now = new Date();
  // 防止过于频繁的更新
  if (now - lastUpdateTime < 1000) return;

  lastUpdateTime = now;
  console.log(`[${now.toLocaleTimeString()}] 文件变化: ${event} - ${path.relative(process.cwd(), filePath)}`);

  // 这里可以添加具体的文档更新逻辑
  // 例如：更新文档中的进度、记录变更等

  // 简单示例：在文档末尾添加变更记录
  try {
    const docsContent = fs.readFileSync(docsPath, 'utf8');
    const changeLog = `
### 实时更新记录
- [${now.toLocaleString()}] ${event}: ${path.relative(process.cwd(), filePath)}
`;

    // 检查是否已有实时更新记录部分
    if (docsContent.includes('### 实时更新记录')) {
      // 替换现有的实时更新记录
      const updatedContent = docsContent.replace(
        /### 实时更新记录[\s\S]*/,
        `### 实时更新记录
- [${now.toLocaleString()}] ${event}: ${path.relative(process.cwd(), filePath)}
`
      );
      fs.writeFileSync(docsPath, updatedContent, 'utf8');
    } else {
      // 添加新的实时更新记录部分
      fs.writeFileSync(docsPath, docsContent + changeLog, 'utf8');
    }

    console.log('✅ 开发文档已更新');
  } catch (error) {
    console.error('❌ 更新文档失败:', error.message);
  }
}

// 监听各种文件事件
watcher
  .on('add', (path) => handleFileChange('添加', path))
  .on('change', (path) => handleFileChange('修改', path))
  .on('unlink', (path) => handleFileChange('删除', path))
  .on('addDir', (path) => handleFileChange('添加目录', path))
  .on('unlinkDir', (path) => handleFileChange('删除目录', path))
  .on('error', (error) => console.error('监控错误:', error));

console.log('🔍 开始监控项目文件变化...');
console.log('📄 开发文档路径:', docsPath);

// 保持脚本运行
process.stdin.resume();