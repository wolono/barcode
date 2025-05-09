'use client';

import { useState, useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import BatchImportForm from './components/BatchImportForm';

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
import { Input } from "@/components/ui/input";
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

// 空白产品模板
const emptyProduct: Product = {
  itemID: '',
  upc: '',
  name: '',
  location: ''
};

export default function Home() {
  // 状态管理
  const [searchIds, setSearchIds] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [duplicateInfo, setDuplicateInfo] = useState<{hasDuplicates: boolean; duplicateCount: number; message: string} | null>(null);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [showBatchImport, setShowBatchImport] = useState<boolean>(false);
  const [newProducts, setNewProducts] = useState<Product[]>([emptyProduct]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditForm, setShowEditForm] = useState<boolean>(false);
  
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
    if (products.length > 0) {
      products.forEach((product, index) => {
        const barcodeCanvas = barcodeRefs.current[index];
        const locationBarcodeCanvas = locationBarcodeRefs.current[index];
        
        if (barcodeCanvas) {
          // 确保UPC码完整（包含校验位）
          const completeUpc = (product.upc.length === 12 || product.upc.length === 11) ? calculateCheckDigit(product.upc) : product.upc;
          
          try {
            // 对于11位和12位的UPC码，尝试使用EAN-13格式
            const format = (product.upc.length === 11 || product.upc.length === 12) ? "EAN13" : "CODE128";
            
            JsBarcode(barcodeCanvas, completeUpc, {
              format: format,
              displayValue: true,
              fontSize: 14,
              height: 50,
              margin: 10,
              valid: function(valid) {
                if (!valid) {
                  console.warn("条形码无效：", product.upc, "补全后：", completeUpc, "格式：", format);
                  // 如果EAN13格式失败，回退到CODE128
                  if (format === "EAN13") {
                    JsBarcode(barcodeCanvas, completeUpc, {
                      format: "CODE128",
                      displayValue: true,
                      fontSize: 14,
                      height: 50,
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
            format: "CODE128",
            displayValue: true,
            fontSize: 14,
            height: 50,
            margin: 10
          });
        }
      });
    }
  }, [products]);

  // 批量查询产品
  const searchProducts = async () => {
    if (!searchIds.trim()) {
      setError('请输入商品ID');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
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

  // 添加新的空白产品表单
  const addNewProductForm = () => {
    setNewProducts([...newProducts, {...emptyProduct}]);
  };

  // 更新新产品表单数据
  const updateNewProduct = (index: number, field: keyof Product, value: string) => {
    const updated = [...newProducts];
    updated[index] = { ...updated[index], [field]: value };
    setNewProducts(updated);
  };

  // 移除新产品表单
  const removeNewProduct = (index: number) => {
    const updated = [...newProducts];
    updated.splice(index, 1);
    setNewProducts(updated);
  };

  // 提交新产品
  const submitNewProducts = async () => {
    // 验证所有必填字段
    const isValid = newProducts.every(product => 
      product.itemID && product.upc && product.name && product.location
    );
    
    if (!isValid) {
      setError('所有字段都是必填的');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products: newProducts }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setNewProducts([emptyProduct]);
        setShowAddForm(false);
        setError('');
        // 如果添加成功，刷新产品列表
        if (searchIds.trim()) {
          searchProducts();
        }
      }
    } catch {
      setError('添加失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 开始编辑产品
  const startEdit = (product: Product) => {
    setEditingProduct({...product});
    setShowEditForm(true);
  };

  // 更新编辑中的产品
  const updateEditingProduct = (field: keyof Product, value: string) => {
    if (editingProduct) {
      setEditingProduct({...editingProduct, [field]: value});
    }
  };

  // 提交编辑后的产品
  const submitEditProduct = async () => {
    if (!editingProduct) return;
    
    // 验证所有必填字段
    if (!editingProduct.itemID || !editingProduct.upc || !editingProduct.name || !editingProduct.location) {
      setError('所有字段都是必填的');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product: editingProduct }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setEditingProduct(null);
        setShowEditForm(false);
        setError('');
        // 如果更新成功，刷新产品列表
        if (searchIds.trim()) {
          searchProducts();
        }
      }
    } catch {
      setError('更新失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 打印条形码
  const printBarcodes = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setError('无法打开打印窗口，请检查浏览器设置');
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>条形码打印</title>
          <style>
            body { font-family: Arial, sans-serif; }
            .barcode-container { margin: 20px 0; page-break-inside: avoid; }
            .product-info { margin-bottom: 5px; }
          </style>
        </head>
        <body>
    `);
    
    products.forEach(product => {
      const barcodeCanvas = document.createElement('canvas');
      const locationBarcodeCanvas = document.createElement('canvas');
      
      // 确保UPC码完整（包含校验位）
      const completeUpc = (product.upc.length === 12 || product.upc.length === 11) ? calculateCheckDigit(product.upc) : product.upc;
      
      try {
        // 对于11位和12位的UPC码，尝试使用EAN-13格式
        const format = (product.upc.length === 11 || product.upc.length === 12) ? "EAN13" : "CODE128";
        
        JsBarcode(barcodeCanvas, completeUpc, {
          format: format,
          displayValue: true,
          fontSize: 14,
          height: 50,
          margin: 10,
          valid: function(valid) {
            if (!valid) {
              console.warn("条形码无效：", product.upc, "补全后：", completeUpc, "格式：", format);
              // 如果EAN13格式失败，回退到CODE128
              if (format === "EAN13") {
                JsBarcode(barcodeCanvas, completeUpc, {
                  format: "CODE128",
                  displayValue: true,
                  fontSize: 14,
                  height: 50,
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
      
      JsBarcode(locationBarcodeCanvas, product.location, {
        format: "CODE128",
        displayValue: true,
        fontSize: 14,
        height: 50,
        margin: 10
      });
      
      printWindow.document.write(`
        <div class="barcode-container">
          <div class="product-info">
            <strong>商品ID:</strong> ${product.itemID} | <strong>名称:</strong> ${product.name}
          </div>
          <div>
            <strong>商品条形码:</strong><br>
            <img src="${barcodeCanvas.toDataURL('image/png')}" />
          </div>
          <div>
            <strong>库位条形码:</strong><br>
            <img src="${locationBarcodeCanvas.toDataURL('image/png')}" />
          </div>
        </div>
      `);
    });
    
    printWindow.document.write(`
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

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
            <div className="flex flex-col md:flex-row gap-4">
              <Textarea 
                className="flex-grow" 
                placeholder="输入商品ID，多个ID请用逗号或空格分隔" 
                value={searchIds}
                onChange={(e) => setSearchIds(e.target.value)}
                rows={3}
              />
              <div className="flex flex-col gap-2">
                <Button 
                  variant="default"
                  onClick={searchProducts}
                  disabled={isLoading}
                >
                  {isLoading ? '查询中...' : '查询'}
                </Button>
                <div className="flex flex-col gap-2">
                  <Button 
                    variant={showAddForm ? "outline" : "secondary"}
                    onClick={() => {
                      setShowAddForm(!showAddForm);
                      if (!showAddForm) setShowBatchImport(false);
                    }}
                  >
                    {showAddForm ? '取消添加' : '添加商品'}
                  </Button>
                  <Button 
                    variant={showBatchImport ? "outline" : "secondary"}
                    onClick={() => {
                      setShowBatchImport(!showBatchImport);
                      if (!showBatchImport) setShowAddForm(false);
                    }}
                  >
                    {showBatchImport ? '取消批量导入' : '批量导入'}
                  </Button>
                </div>
              </div>
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
        
        {/* 批量导入商品表单 */}
        {showBatchImport && (
          <BatchImportForm 
            onImport={async (importedProducts) => {
              setIsLoading(true);
              setError('');
              
              try {
                const response = await fetch('/api/products', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ products: importedProducts }),
                });
                
                const data = await response.json();
                
                if (data.error) {
                  setError(data.error);
                } else {
                  setShowBatchImport(false);
                  setError('');
                  // 如果添加成功，刷新产品列表
                  if (searchIds.trim()) {
                    searchProducts();
                  }
                }
              } catch {
                setError('添加失败，请稍后重试');
              } finally {
                setIsLoading(false);
              }
            }}
            onCancel={() => setShowBatchImport(false)}
          />
        )}
        
        {/* 添加商品表单 */}
        {showAddForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>添加商品</CardTitle>
            </CardHeader>
            <CardContent>
              {newProducts.map((product, index) => (
                <Card key={index} className="mb-4 bg-gray-50">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">商品ID</label>
                        <Input 
                          type="text" 
                          value={product.itemID}
                          onChange={(e) => updateNewProduct(index, 'itemID', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">商品UPC</label>
                        <Input 
                          type="text" 
                          value={product.upc}
                          onChange={(e) => updateNewProduct(index, 'upc', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">商品名称</label>
                        <Input 
                          type="text" 
                          value={product.name}
                          onChange={(e) => updateNewProduct(index, 'name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">商品库位</label>
                        <Input 
                          type="text" 
                          value={product.location}
                          onChange={(e) => updateNewProduct(index, 'location', e.target.value)}
                        />
                      </div>
                    </div>
                    <Button 
                      variant="ghost"
                      className="text-red-500 mt-2 p-0 h-auto"
                      onClick={() => removeNewProduct(index)}
                      disabled={newProducts.length === 1}
                    >
                      移除
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline"
                onClick={addNewProductForm}
              >
                + 添加更多
              </Button>
              <Button 
                variant="default"
                onClick={submitNewProducts}
                disabled={isLoading}
              >
                {isLoading ? '提交中...' : '提交'}
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {/* 编辑商品表单 */}
        {showEditForm && editingProduct && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>编辑商品</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">商品ID</label>
                  <Input 
                    type="text" 
                    className="bg-gray-100" 
                    value={editingProduct.itemID}
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">商品UPC</label>
                  <Input 
                    type="text" 
                    value={editingProduct.upc}
                    onChange={(e) => updateEditingProduct('upc', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">商品名称</label>
                  <Input 
                    type="text" 
                    value={editingProduct.name}
                    onChange={(e) => updateEditingProduct('name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">商品库位</label>
                  <Input 
                    type="text" 
                    value={editingProduct.location}
                    onChange={(e) => updateEditingProduct('location', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button 
                variant="outline"
                onClick={() => setShowEditForm(false)}
              >
                取消
              </Button>
              <Button 
                variant="default"
                onClick={submitEditProduct}
                disabled={isLoading}
              >
                {isLoading ? '保存中...' : '保存'}
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {/* 查询结果与条形码展示 */}
        {products.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>查询结果 ({products.length})</CardTitle>
              <Button 
                variant="secondary"
                onClick={printBarcodes}
              >
                打印条形码
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>商品ID</TableHead>
                      <TableHead>商品名称</TableHead>
                      <TableHead>商品条形码</TableHead>
                      <TableHead>库位条形码</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product, index) => (
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
                            variant="link"
                            className="p-0 h-auto"
                            onClick={() => startEdit(product)}
                          >
                            编辑
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
