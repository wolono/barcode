'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import JsBarcode from 'jsbarcode';
import BatchImportForm from './components/BatchImportForm';

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
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [showBatchImport, setShowBatchImport] = useState<boolean>(false);
  const [newProducts, setNewProducts] = useState<Product[]>([emptyProduct]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditForm, setShowEditForm] = useState<boolean>(false);
  
  // 条形码引用
  const barcodeRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const locationBarcodeRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  // 生成条形码
  useEffect(() => {
    if (products.length > 0) {
      products.forEach((product, index) => {
        const barcodeCanvas = barcodeRefs.current[index];
        const locationBarcodeCanvas = locationBarcodeRefs.current[index];
        
        if (barcodeCanvas) {
          JsBarcode(barcodeCanvas, product.upc, {
            format: "CODE128",
            displayValue: true,
            fontSize: 14,
            height: 50,
            margin: 10
          });
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
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        setProducts([]);
      } else {
        setProducts(data.products);
        if (data.products.length === 0) {
          setError('未找到匹配的商品');
        }
      }
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
      
      JsBarcode(barcodeCanvas, product.upc, {
        format: "CODE128",
        displayValue: true,
        fontSize: 14,
        height: 50,
        margin: 10
      });
      
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
    <div className="min-h-screen p-6">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">预售上架系统</h1>
        <p className="text-gray-600">根据商品itemID匹配数据库生成条形码与库位条形码</p>
      </header>
      
      <main className="max-w-6xl mx-auto">
        {/* 批量查询区域 */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">批量查询</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <textarea 
              className="flex-grow p-2 border rounded-md" 
              placeholder="输入商品ID，多个ID请用逗号或空格分隔" 
              value={searchIds}
              onChange={(e) => setSearchIds(e.target.value)}
              rows={3}
            />
            <div className="flex flex-col gap-2">
              <button 
                className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
                onClick={searchProducts}
                disabled={isLoading}
              >
                {isLoading ? '查询中...' : '查询'}
              </button>
              <div className="flex flex-col gap-2">
                <button 
                  className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors"
                  onClick={() => {
                    setShowAddForm(!showAddForm);
                    if (!showAddForm) setShowBatchImport(false);
                  }}
                >
                  {showAddForm ? '取消添加' : '添加商品'}
                </button>
                <button 
                  className="bg-purple-500 text-white py-2 px-4 rounded-md hover:bg-purple-600 transition-colors"
                  onClick={() => {
                    setShowBatchImport(!showBatchImport);
                    if (!showBatchImport) setShowAddForm(false);
                  }}
                >
                  {showBatchImport ? '取消批量导入' : '批量导入'}
                </button>
              </div>
            </div>
          </div>
          
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
        
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
              } catch (err) {
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
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">添加商品</h2>
            {newProducts.map((product, index) => (
              <div key={index} className="p-4 border rounded-md mb-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">商品ID</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border rounded-md" 
                      value={product.itemID}
                      onChange={(e) => updateNewProduct(index, 'itemID', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">商品UPC</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border rounded-md" 
                      value={product.upc}
                      onChange={(e) => updateNewProduct(index, 'upc', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">商品名称</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border rounded-md" 
                      value={product.name}
                      onChange={(e) => updateNewProduct(index, 'name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">商品库位</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border rounded-md" 
                      value={product.location}
                      onChange={(e) => updateNewProduct(index, 'location', e.target.value)}
                    />
                  </div>
                </div>
                <button 
                  className="text-red-500 text-sm"
                  onClick={() => removeNewProduct(index)}
                  disabled={newProducts.length === 1}
                >
                  移除
                </button>
              </div>
            ))}
            <div className="flex justify-between">
              <button 
                className="bg-gray-200 py-1 px-3 rounded-md hover:bg-gray-300 transition-colors"
                onClick={addNewProductForm}
              >
                + 添加更多
              </button>
              <button 
                className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors"
                onClick={submitNewProducts}
                disabled={isLoading}
              >
                {isLoading ? '提交中...' : '提交'}
              </button>
            </div>
          </div>
        )}
        
        {/* 编辑商品表单 */}
        {showEditForm && editingProduct && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">编辑商品</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">商品ID</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded-md bg-gray-100" 
                  value={editingProduct.itemID}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">商品UPC</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded-md" 
                  value={editingProduct.upc}
                  onChange={(e) => updateEditingProduct('upc', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">商品名称</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded-md" 
                  value={editingProduct.name}
                  onChange={(e) => updateEditingProduct('name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">商品库位</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded-md" 
                  value={editingProduct.location}
                  onChange={(e) => updateEditingProduct('location', e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button 
                className="bg-gray-200 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                onClick={() => setShowEditForm(false)}
              >
                取消
              </button>
              <button 
                className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
                onClick={submitEditProduct}
                disabled={isLoading}
              >
                {isLoading ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        )}
        
        {/* 查询结果与条形码展示 */}
        {products.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">查询结果 ({products.length})</h2>
              <button 
                className="bg-purple-500 text-white py-2 px-4 rounded-md hover:bg-purple-600 transition-colors"
                onClick={printBarcodes}
              >
                打印条形码
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left border">商品ID</th>
                    <th className="p-2 text-left border">商品名称</th>
                    <th className="p-2 text-left border">商品条形码</th>
                    <th className="p-2 text-left border">库位条形码</th>
                    <th className="p-2 text-left border">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr key={product.itemID} className="border-b hover:bg-gray-50">
                      <td className="p-2 border">{product.itemID}</td>
                      <td className="p-2 border">{product.name}</td>
                      <td className="p-2 border">
                        <canvas 
                          ref={(el) => { barcodeRefs.current[index] = el; }} 
                          className="max-w-full"
                        />
                      </td>
                      <td className="p-2 border">
                        <canvas 
                          ref={(el) => { locationBarcodeRefs.current[index] = el; }} 
                          className="max-w-full"
                        />
                      </td>
                      <td className="p-2 border">
                        <button 
                          className="text-blue-500 hover:underline"
                          onClick={() => startEdit(product)}
                        >
                          编辑
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
