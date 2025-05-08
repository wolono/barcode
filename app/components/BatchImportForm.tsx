'use client';

import { useState } from 'react';
import { Product } from '@/lib/db';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

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
      const products: Product[] = [];
      // 将lines变量提升到更高作用域，使其在整个函数中可访问
      const lines = importText.trim().split('\n');
      let hasHeader = false;
      
      if (importType === 'csv') {
        // 处理CSV格式
        // 检查是否有标题行
        hasHeader = lines[0].includes('itemID') || lines[0].includes('商品ID');
        // 跳过可能的标题行
        const startIndex = hasHeader ? 1 : 0;
        
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
      // 定义一个类型来明确指定invalidProducts中的元素类型
      type InvalidProduct = { index: number; missingFields: string[] };
      
      const invalidProducts = products.map((p, index) => {
        const missingFields: string[] = [];
        if (!p.itemID) missingFields.push('商品ID');
        if (!p.upc) missingFields.push('UPC');
        if (!p.name) missingFields.push('商品名称');
        if (!p.location) missingFields.push('库位');
        
        return missingFields.length > 0 ? { index, missingFields } : null;
      }).filter(Boolean) as InvalidProduct[];
      
      if (invalidProducts.length > 0) {
        const errorDetails = invalidProducts.map(item => {
          // 现在TypeScript知道item不可能为null
          const lineNumber = importType === 'csv' ? 
            (hasHeader ? item.index + 2 : item.index + 1) : 
            item.index + 1;
          return `第${lineNumber}行缺少: ${item.missingFields.join(', ')}`;
        }).join('\n');
        
        setError(`有${invalidProducts.length}条商品数据不完整，请确保所有字段都已填写:\n${errorDetails}`);
        return;
      }
      
      onImport(products);
    } catch (_) {
      setError('解析数据时出错，请检查格式是否正确');
    }
  };
  
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>批量导入商品</CardTitle>
        <CardDescription>
          请选择导入格式并粘贴商品数据
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <RadioGroup 
            defaultValue={importType} 
            onValueChange={(value) => setImportType(value as 'csv' | 'text')}
            className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="text" id="text" />
              <Label htmlFor="text">文本格式 (每行一个商品，字段用制表符或多个空格分隔)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="csv" id="csv" />
              <Label htmlFor="csv">CSV格式 (每行一个商品，字段用逗号分隔)</Label>
            </div>
          </RadioGroup>
          
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              {importType === 'csv' 
                ? '格式: 商品ID,UPC,商品名称,库位' 
                : '格式: 商品ID    UPC    商品名称    库位'}
            </p>
            <p>示例: {importType === 'csv' 
              ? 'A001,123456789012,测试商品1,A-01-01' 
              : 'A001    123456789012    测试商品1    A-01-01'}</p>
          </div>
          
          <Textarea
            className="font-mono"
            rows={10}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={importType === 'csv' 
              ? '商品ID,UPC,商品名称,库位\nA001,123456789012,测试商品1,A-01-01' 
              : '商品ID    UPC    商品名称    库位\nA001    123456789012    测试商品1    A-01-01'}
          />
        </div>
        
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>导入错误</AlertTitle>
            <AlertDescription className="whitespace-pre-wrap">{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={onCancel}
        >
          取消
        </Button>
        <Button
          variant="default"
          onClick={handleImport}
        >
          导入
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BatchImportForm;