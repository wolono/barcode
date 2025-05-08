'use client';

import { useState } from 'react';
import { Product } from '@/lib/db';

interface BatchImportFormProps {
  onImport: (products: Product[]) => void;
  onCancel: () => void;
}

const BatchImportForm = ({ onImport, onCancel }: BatchImportFormProps) => {
  const [importText, setImportText] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [importType, setImportType] = useState<'csv' | 'text'>('text');
  
  // 处理批量导入
  const handleImport = () => {
    if (!importText.trim()) {
      setError('请输入商品数据');
      return;
    }
    
    try {
      let products: Product[] = [];
      
      if (importType === 'csv') {
        // 处理CSV格式
        const lines = importText.trim().split('\n');
        
        // 跳过可能的标题行
        const startIndex = lines[0].includes('itemID') || 
                          lines[0].includes('商品ID') ? 1 : 0;
        
        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(',');
          if (values.length < 4) {
            setError(`第${i + 1}行数据不完整，请确保包含商品ID、UPC、名称和库位`);
            return;
          }
          
          products.push({
            itemID: values[0].trim(),
            upc: values[1].trim(),
            name: values[2].trim(),
            location: values[3].trim()
          });
        }
      } else {
        // 处理文本格式 (每行一个商品，字段用制表符或多个空格分隔)
        const lines = importText.trim().split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // 支持制表符或多个空格作为分隔符
          const values = line.split(/\t|\s{2,}/);
          if (values.length < 4) {
            setError(`第${i + 1}行数据不完整，请确保包含商品ID、UPC、名称和库位`);
            return;
          }
          
          products.push({
            itemID: values[0].trim(),
            upc: values[1].trim(),
            name: values[2].trim(),
            location: values[3].trim()
          });
        }
      }
      
      if (products.length === 0) {
        setError('未能解析出有效的商品数据');
        return;
      }
      
      // 验证所有必填字段
      const invalidProducts = products.map((p, index) => {
        const missingFields = [];
        if (!p.itemID) missingFields.push('商品ID');
        if (!p.upc) missingFields.push('UPC');
        if (!p.name) missingFields.push('商品名称');
        if (!p.location) missingFields.push('库位');
        
        return missingFields.length > 0 ? { index, missingFields } : null;
      }).filter(Boolean);
      
      if (invalidProducts.length > 0) {
        const errorDetails = invalidProducts.map(item => {
          const lineNumber = importType === 'csv' ? 
            (lines[0].includes('itemID') || lines[0].includes('商品ID') ? item.index + 2 : item.index + 1) : 
            item.index + 1;
          return `第${lineNumber}行缺少: ${item.missingFields.join(', ')}`;
        }).join('\n');
        
        setError(`有${invalidProducts.length}条商品数据不完整，请确保所有字段都已填写:\n${errorDetails}`);
        return;
      }
      
      onImport(products);
    } catch (err) {
      setError('解析数据时出错，请检查格式是否正确');
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-semibold mb-4">批量导入商品</h2>
      
      <div className="mb-4">
        <div className="flex space-x-4 mb-2">
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio"
              name="importType"
              checked={importType === 'text'}
              onChange={() => setImportType('text')}
            />
            <span className="ml-2">文本格式 (每行一个商品，字段用制表符或多个空格分隔)</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio"
              name="importType"
              checked={importType === 'csv'}
              onChange={() => setImportType('csv')}
            />
            <span className="ml-2">CSV格式 (每行一个商品，字段用逗号分隔)</span>
          </label>
        </div>
        
        <div className="mb-2">
          <p className="text-sm text-gray-600 mb-1">
            {importType === 'csv' 
              ? '格式: 商品ID,UPC,商品名称,库位' 
              : '格式: 商品ID    UPC    商品名称    库位'}
          </p>
          <p className="text-sm text-gray-600">示例: {importType === 'csv' 
            ? 'A001,123456789012,测试商品1,A-01-01' 
            : 'A001    123456789012    测试商品1    A-01-01'}</p>
        </div>
        
        <textarea
          className="w-full p-2 border rounded-md font-mono"
          rows={10}
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder={importType === 'csv' 
            ? '商品ID,UPC,商品名称,库位\nA001,123456789012,测试商品1,A-01-01' 
            : '商品ID    UPC    商品名称    库位\nA001    123456789012    测试商品1    A-01-01'}
        />
      </div>
      
      {error && <pre className="text-red-500 mb-4 whitespace-pre-wrap">{error}</pre>}
      
      <div className="flex justify-end space-x-2">
        <button
          className="bg-gray-300 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
          onClick={onCancel}
        >
          取消
        </button>
        <button
          className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors"
          onClick={handleImport}
        >
          导入
        </button>
      </div>
    </div>
  );
};

export default BatchImportForm;