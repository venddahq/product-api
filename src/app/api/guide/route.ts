import { corsHeaders } from "@/utils/api.origin-header";
import { NextRequest, NextResponse } from "next/server";
import docs from "@/data/product-guide.json"

interface ProductInfo {
      id: string;
      title: string;
      description: string;
      icon: string;
      order: number;
    }
    
interface Category {
      id: string;
      title: string;
      description: string;
      icon: string;
      order: number;
      guides: Array<{
        id: string;
        slug: string;
        title: string;
        description: string;
      }>;
    }

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return NextResponse.json({}, { headers: corsHeaders(origin) });
}


export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const searchParams = request.nextUrl.searchParams;
  const productFilter = searchParams.get('product');
  
  try {
    // Return documentation overview with optional product filter
    type ProductId = 'commerce' | 'terminal' | 'corp';
    
    
    let response: {
      title: string;
      description: string;
      version: string;
      lastUpdated: string;
      products: ProductInfo[];
      shared?: { categories: Category[] };
      productCategories?: Category[];
    } = {
      title: docs.documentation.title,
      description: docs.documentation.description,
      version: docs.documentation.version,
      lastUpdated: docs.documentation.lastUpdated,
      products: docs.documentation.products,
    };
    
    if (productFilter && ['commerce', 'terminal', 'corp'].includes(productFilter)) {
      // Return specific product categories
      const productData = docs.documentation[productFilter as ProductId];
      response.productCategories = productData?.categories || [];
    } else {
      // Return shared categories for general overview
      response.shared = docs.documentation.shared;
    }
    
    return NextResponse.json({
      success: true,
      data: response
    }, { 
      headers: corsHeaders(origin) 
    });
  } catch (_error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch documentation'
    }, { 
      status: 500,
      headers: corsHeaders(origin)
    });
  }
}