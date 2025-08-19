'use client';
import { useState, useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Import, Settings, Printer } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

// 定义条码类型接口
interface BarcodeType {
  id: string;
  name: string;
  description: string;
}

// 可用的条码类型
const barcodeTypes: BarcodeType[] = [
  { id: 'code128', name: 'Code 128', description: '最常用的条码类型，支持所有ASCII字符' },
  { id: 'code128a', name: 'Code 128A', description: '支持ASCII 00-95、大写字母和控制字符' },
  { id: 'code128b', name: 'Code 128B', description: '支持ASCII 32-127、大小写字母和数字' },
  { id: 'code128c', name: 'Code 128C', description: '仅支持数字，效率更高' },
  { id: 'gs1-128', name: 'GS1-128', description: '用于供应链管理的标准' },
  { id: 'ean13', name: 'EAN-13', description: '用于全球零售商品的13位条码' },
  { id: 'ean8', name: 'EAN-8', description: '缩短版的EAN条码' },
  { id: 'upca', name: 'UPC-A', description: '北美零售商品条码' },
  { id: 'upce', name: 'UPC-E', description: '缩短版的UPC条码' },
  { id: 'code39', name: 'Code 39', description: '早期的条码标准，支持字母和数字' },
];

export default function BarcodeGenerator() {
  // 状态管理
  const [selectedType, setSelectedType] = useState<string>('code128');
  const [inputValue, setInputValue] = useState<string>('ABC-abc-1234');
  const [showText, setShowText] = useState<boolean>(true);
  const [width, setWidth] = useState<number>(260);
  const [height, setHeight] = useState<number>(80);
  const [margin, setMargin] = useState<number>(10);
  const [format, setFormat] = useState<string>('svg');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const barcodeRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGElement>(null);

  // 生成条码
  useEffect(() => {
    if (!barcodeRef.current) return;

    try {
      setIsLoading(true);
      // 清除之前的条码
      while (barcodeRef.current?.firstChild) {
        barcodeRef.current.removeChild(barcodeRef.current.firstChild);
      }

      // 创建新的SVG元素
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgRef.current = svg;
      barcodeRef.current.appendChild(svg);

      // 生成条码
      JsBarcode(svg, inputValue, {
        format: selectedType as any,
        width: 2,
        height: height,
        displayValue: showText,
        margin: margin,
      });
    } catch (error) {
      toast.error(`生成条码失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedType, inputValue, showText, height, margin]);

  // 下载条码
  const handleDownload = () => {
    if (!svgRef.current) {
      toast.error('没有可下载的条码');
      return;
    }

    try {
      if (format === 'svg') {
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgRef.current);
        const blob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>' + '\n' + svgString], {
          type: 'image/svg+xml',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `barcode-${Date.now()}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('条码已成功下载');
      } else if (format === 'png') {
        // 这里可以实现PNG下载逻辑
        toast.info('PNG下载功能即将支持');
      }
    } catch (error) {
      toast.error(`下载失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 导入CSV
  const handleImportCSV = () => {
    toast.info('CSV导入功能即将支持');
  };

  // 打印条码
  const handlePrint = () => {
    toast.info('打印功能即将支持');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <Toaster />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">条形码生成器</h1>
          <p className="text-center text-gray-600 dark:text-gray-400">快速生成和定制各种类型的条形码</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左侧：条码类型列表 */}
          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings size={18} />
                  条码类型列表
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-auto max-h-[calc(100vh-240px)] pr-2">
                {barcodeTypes.map((type) => (
                  <Tooltip key={type.id}>
                    <TooltipTrigger>
                      <div
                        className={`p-3 rounded-lg cursor-pointer mb-2 transition-colors ${
                        selectedType === type.id
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                        onClick={() => setSelectedType(type.id)}
                      >
                        <div className="flex items-center justify-between">
                        <span className="font-medium">{type.name}</span>
                        {selectedType === type.id && (
                          <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                        )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{type.id}</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>{type.description}</TooltipContent>
                  </Tooltip>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* 中间：输入和预览区域 */}
          <div className="lg:col-span-6">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>条码值 (每行一个)</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleImportCSV} className="text-gray-600 dark:text-gray-400">
                      <Import size={16} className="mr-1" /> 导入CSV
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="每行一个条码值"
                    className="min-h-[100px] w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  当前选择: {barcodeTypes.find(t => t.id === selectedType)?.name}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>输出</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handlePrint} className="text-gray-600 dark:text-gray-400">
                        <Printer size={16} className="mr-1" /> 打印布局
                      </Button>
                    <Select value={format} onValueChange={setFormat}>
                      <SelectTrigger className="h-8 w-28">
                        <SelectValue placeholder="格式" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="svg">SVG</SelectItem>
                        <SelectItem value="png">PNG</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={handleDownload}>
                      <Download size={16} className="mr-1" /> 下载
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center items-center min-h-[200px]">
                {isLoading ? (
                  <Skeleton className="h-[150px] w-[80%] rounded" />
                ) : (
                  <div
                    ref={barcodeRef}
                    className="flex justify-center items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-inner"
                    style={{ minWidth: `${width}px` }}
                  >
                    {/* 条码会动态生成在这里 */}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 右侧：选项面板 */}
          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings size={18} />
                  选项
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="showText">显示文本</Label>
                    <Switch
                      id="showText"
                      checked={showText}
                      onCheckedChange={setShowText}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="width" className="block mb-2">条码长度 (mm)</Label>
                  <Slider
                    id="width"
                    min={100}
                    max={500}
                    step={1}
                    value={[width]}
                    onValueChange={(value) => setWidth(value[0])}
                    className="mb-2"
                  />
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 gap-2">
                    <span>100</span>
                    <Input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(Number(e.target.value))}
                      className="w-16 text-center"
                      min="100"
                      max="500"
                    />
                    <span>500</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="height" className="block mb-2">条码高度 (mm)</Label>
                  <Slider
                    id="height"
                    min={20}
                    max={150}
                    step={1}
                    value={[height]}
                    onValueChange={(value) => setHeight(value[0])}
                    className="mb-2"
                  />
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 gap-2">
                    <span>20</span>
                    <Input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="w-16 text-center"
                      min="20"
                      max="150"
                    />
                    <span>150</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="margin" className="block mb-2">条码间距 (mm)</Label>
                  <Slider
                    id="margin"
                    min={0}
                    max={30}
                    step={1}
                    value={[margin]}
                    onValueChange={(value) => setMargin(value[0])}
                    className="mb-2"
                  />
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 gap-2">
                    <span>0</span>
                    <Input
                      type="number"
                      value={margin}
                      onChange={(e) => setMargin(Number(e.target.value))}
                      className="w-16 text-center"
                      min="0"
                      max="30"
                    />
                    <span>30</span>
                  </div>
                </div>

                <Alert variant="default" className="mt-6">
                  <AlertTitle>提示</AlertTitle>
                  <AlertDescription>
                    调整选项后条码会自动更新。点击下载按钮可保存条码图像。
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </div>

        <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} 条形码生成器 | 使用 Next.js 和 shadcn/ui 构建</p>
        </footer>
      </div>
    </div>
  );
}
