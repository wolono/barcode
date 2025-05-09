import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts, getAllProductsWithDuplicateCheck, getProductsByIds, addProducts, updateProducts, Product } from '@/lib/db';
import { findDuplicateItemIDs, formatDuplicateMessage } from '@/lib/checkDuplicates';
import { formatNotFoundMessage } from '@/lib/notFoundHelper';

// 获取所有产品或根据ID查询产品
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const ids = searchParams.get('ids');
  
  try {
    if (ids) {
      const idArray = ids.split(',');
      const result = getProductsByIds(idArray);
      const notFoundInfo = result.notFoundIds.length > 0 ? {
        hasNotFound: true,
        notFoundCount: result.notFoundIds.length,
        notFoundIds: result.notFoundIds
      } : null;
      
      return NextResponse.json({
        products: result.products,
        notFoundInfo: notFoundInfo,
        notFoundMessage: formatNotFoundMessage(notFoundInfo)
      });
    } else {
      // 使用带有重复检测的函数
      const result = getAllProductsWithDuplicateCheck();
      return NextResponse.json({
        products: result.products,
        duplicateInfo: result.hasDuplicates ? {
          hasDuplicates: result.hasDuplicates,
          duplicateCount: result.duplicateCount,
          duplicates: result.duplicates,
          message: formatDuplicateMessage(result)
        } : null
      });
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