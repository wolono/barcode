'use client';

import { useState, useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

// 计算EAN-13/UPC-A校验位的函数
function calculateCheckDigit(barcode: string): string {
  // 确保输入的是数字
  const numericCode = barcode.replace(/\D/g, '');
  
  // 如果长度不是11位或12位，则返回原始码
  if (numericCode.length !== 12 && numericCode.length !== 11) {
    return barcode;
  }
  
  // 对于11位的UPC码，需要补齐到12位再计算校验位
  const codeForCalculation = numericCode.length === 11 ? '0' + numericCode : numericCode;
  
  // 计算校验位 - 修正EAN-13/UPC-A校验位计算
  // 奇数位(索引为偶数)乘以1，偶数位(索引为奇数)乘以3
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(codeForCalculation[i]) * (i % 2 === 0 ? 1 : 3);
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  
  // 返回带校验位的条形码
  return codeForCalculation + checkDigit;
}

// 引入shadcn组件
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


// 产品类型定义
interface Product {
  itemID: string;
  upc: string;
  name: string;
  location: string;
}

// Product interface is used for type checking throughout the component

export default function Home() {
  // 状态管理
  const [searchIds, setSearchIds] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [duplicateInfo, setDuplicateInfo] = useState<{hasDuplicates: boolean; duplicateCount: number; message: string} | null>(null);

  const [closedRows, setClosedRows] = useState<Set<string>>(new Set());
  
  // 条形码引用
  const barcodeRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const locationBarcodeRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  // 页面加载时检查重复的itemID
  useEffect(() => {
    const checkDuplicates = async () => {
      try {
        const response = await fetch('/api/products');
        const data = await response.json();
        
        // 处理重复itemID信息
        if (data.duplicateInfo && data.duplicateInfo.hasDuplicates) {
          setDuplicateInfo({
            hasDuplicates: data.duplicateInfo.hasDuplicates,
            duplicateCount: data.duplicateInfo.duplicateCount,
            message: data.duplicateInfo.message
          });
        }
      } catch (error) {
        console.error('检查重复itemID失败:', error);
      }
    };
    
    checkDuplicates();
  }, []);

  // 生成条形码
  useEffect(() => {
    // 过滤掉已关闭的行
    const filteredProducts = products.filter(product => !closedRows.has(product.itemID));
    
    if (filteredProducts.length > 0) {
      filteredProducts.forEach((product, index) => {
        const barcodeCanvas = barcodeRefs.current[index];
        const locationBarcodeCanvas = locationBarcodeRefs.current[index];
        
        if (barcodeCanvas) {
          // 确保UPC码完整（包含校验位）
          const completeUpc = (product.upc.length === 12 || product.upc.length === 11) ? calculateCheckDigit(product.upc) : product.upc;
          
          try {
            // 对于11位和12位的UPC码，尝试使用EAN-13格式
            const format = (product.upc.length === 11 || product.upc.length === 12) ? "EAN13" : "CODE128";
            
            JsBarcode(barcodeCanvas, completeUpc, {
        width: 3,
        height: 100,
              format: format,
              displayValue: true,
              fontSize: 14,
              margin: 10,
              valid: function(valid) {
                if (!valid) {
                  console.warn("条形码无效：", product.upc, "补全后：", completeUpc, "格式：", format);
                  // 如果EAN13格式失败，回退到CODE128
                  if (format === "EAN13") {
                    JsBarcode(barcodeCanvas, completeUpc, {
        width: 3,
        height: 50,
                      format: "CODE128",
                      displayValue: true,
                      fontSize: 14,
                      margin: 10
                    });
                  }
                }
                return true; // 即使无效也尝试渲染
              }
            });
          } catch (error) {
            console.error("生成条形码出错：", error, "UPC:", product.upc);
            // 出错时回退到CODE128格式
            try {
              JsBarcode(barcodeCanvas, product.upc, {
                format: "CODE128",
                displayValue: true,
                fontSize: 14,
                height: 50,
                margin: 10
              });
            } catch (e) {
              console.error("回退到CODE128也失败：", e);
            }
          }
        }
        
        if (locationBarcodeCanvas) {
          JsBarcode(locationBarcodeCanvas, product.location, {
        width: 3,
        height: 100,
            format: "CODE128",
            displayValue: true,
            fontSize: 14,
            margin: 10
          });
        }
      });
    }
  }, [products, closedRows]);

  // 批量查询产品
  const searchProducts = async () => {
    if (!searchIds.trim()) {
      setError('请输入商品ID');
      return;
    }
    
    setIsLoading(true);
    setError('');
    // 重置closedRows状态，确保新查询的结果能够正常显示
    setClosedRows(new Set());
    
    try {
      const ids = searchIds.split(/[,，\s]+/).filter(id => id.trim());
      const response = await fetch(`/api/products?ids=${ids.join(',')}`);
      setDuplicateInfo(null);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        setProducts([]);
      } else {
        setProducts(data.products);
        
        // 处理未找到的itemID
        if (data.notFoundMessage) {
          setError(data.notFoundMessage);
        } else if (data.products.length === 0) {
          setError('未找到匹配的商品');
        }
      }
    } catch {
      setError('查询失败，请稍后重试');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };





  // 关闭行
  const closeRow = (itemID: string) => {
    setClosedRows(prev => {
      const newSet = new Set(prev);
      newSet.add(itemID);
      return newSet;
    });
  };





  // 打印条形码
  

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">预售上架系统</h1>
        <p className="text-gray-600">根据商品itemID匹配数据库生成条形码与库位条形码</p>
      </header>
      
      <main className="max-w-6xl mx-auto">
        {/* 批量查询区域 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>批量查询</CardTitle>
            <CardDescription>输入商品ID进行批量查询，多个ID请用逗号或空格分隔</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <Textarea 
                className="w-full" 
                placeholder="输入商品ID，多个ID请用逗号或空格分隔" 
                value={searchIds}
                onChange={(e) => setSearchIds(e.target.value)}
                rows={3}
              />
              <Button 
                variant="default"
                onClick={searchProducts}
                disabled={isLoading}
                className="mx-auto"
              >
                {isLoading ? '查询中...' : '查询'}
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            {error && (
              <Alert variant="destructive" className="w-full">
                <AlertTitle>错误</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {duplicateInfo && duplicateInfo.hasDuplicates && (
              <Alert variant="warning" className="mb-4 bg-yellow-50 border-yellow-200">
                <AlertTitle>警告：发现重复的商品ID</AlertTitle>
                <AlertDescription className="whitespace-pre-line">
                  系统中存在{duplicateInfo.duplicateCount}个重复的商品ID。
                  <details>
                    <summary className="cursor-pointer font-medium text-yellow-700 hover:text-yellow-800">点击查看详情</summary>
                    <div className="mt-2 text-sm">{duplicateInfo.message}</div>
                  </details>
                </AlertDescription>
              </Alert>
            )}
          </CardFooter>
        </Card>
        

        

        
        {/* 查询结果与条形码展示 */}
        {products.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>查询结果 ({products.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">商品ID</TableHead>
                      <TableHead className="text-center">商品名称</TableHead>
                      <TableHead className="text-center">商品条形码</TableHead>
                      <TableHead className="text-center">库位条形码</TableHead>
                      <TableHead className="text-center">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products
                      .filter(product => !closedRows.has(product.itemID))
                      .map((product, index) => (
                      <TableRow key={product.itemID}>
                        <TableCell>{product.itemID}</TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>
                          <canvas 
                            ref={(el) => { barcodeRefs.current[index] = el; }} 
                            className="max-w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <canvas 
                            ref={(el) => { locationBarcodeRefs.current[index] = el; }} 
                            className="max-w-full"
                          />
                        </TableCell>

                        <TableCell>
                          <Button 
                            variant="ghost"
                            size="sm"
                            className="p-0 h-auto text-red-500 hover:text-red-700"
                            onClick={() => closeRow(product.itemID)}
                          >
                            关闭
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
