import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts, getProductsByIds, addProducts, updateProducts, Product } from '@/lib/db';

// 获取所有产品或根据ID查询产品
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const ids = searchParams.get('ids');
  
  try {
    if (ids) {
      const idArray = ids.split(',');
      const products = getProductsByIds(idArray);
      return NextResponse.json({ products });
    } else {
      const products = getAllProducts();
      return NextResponse.json({ products });
    }
  } catch (error) {
    return NextResponse.json({ error: '获取产品数据失败' }, { status: 500 });
  }
}

// 添加产品
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const products: Product[] = Array.isArray(body.products) ? body.products : [body.product];
    
    if (!products.length) {
      return NextResponse.json({ error: '没有提供有效的产品数据' }, { status: 400 });
    }
    
    // 验证产品数据
    const isValid = products.every(product => 
      product.itemID && product.upc && product.name && product.location
    );
    
    if (!isValid) {
      return NextResponse.json({ error: '产品数据不完整' }, { status: 400 });
    }
    
    const addedProducts = addProducts(products);
    return NextResponse.json({ success: true, products: addedProducts });
  } catch (error) {
    return NextResponse.json({ error: '添加产品失败' }, { status: 500 });
  }
}

// 更新产品
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const products: Product[] = Array.isArray(body.products) ? body.products : [body.product];
    
    if (!products.length) {
      return NextResponse.json({ error: '没有提供有效的产品数据' }, { status: 400 });
    }
    
    // 验证产品数据
    const isValid = products.every(product => 
      product.itemID && product.upc && product.name && product.location
    );
    
    if (!isValid) {
      return NextResponse.json({ error: '产品数据不完整' }, { status: 400 });
    }
    
    const updatedProducts = updateProducts(products);
    return NextResponse.json({ success: true, products: updatedProducts });
  } catch (error) {
    return NextResponse.json({ error: '更新产品失败' }, { status: 500 });
  }
}