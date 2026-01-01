import { corsHeaders } from "@/utils/api.origin-header";
import { NextRequest, NextResponse } from "next/server";
import docs from "@/data/product-guide.json"

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return NextResponse.json({}, { headers: corsHeaders(origin) });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const searchParams = request.nextUrl.searchParams;
  const productFilter = searchParams.get('product');
  
  try {
    type ProductId = 'commerce' | 'terminal' | 'corp';
    
    interface Guide {
      id: string;
      slug: string;
      title: string;
      description: string;
      order: number;
    }
    
    interface Category {
      id: string;
      title: string;
      description: string;
      icon: string;
      order: number;
      guides: Guide[];
    }
    
    interface CategoryWithProduct extends Category {
      productId: string;
      productTitle: string;
    }
    
    const allCategories: CategoryWithProduct[] = [];
    
    // Add shared categories
    docs.documentation.shared.categories.forEach(category => {
      allCategories.push({
        id: category.id,
        title: category.title,
        description: category.description,
        icon: category.icon,
        order: category.order,
        productId: 'shared',
        productTitle: 'Shared',
        guides: category.guides.map(guide => ({
          id: guide.id,
          slug: guide.slug,
          title: guide.title,
          description: guide.description,
          order: guide.order
        }))
      });
    });
    
    // Add product-specific categories
    const products: ProductId[] = ['commerce', 'terminal', 'corp'];
    products.forEach(productId => {
      const productData = docs.documentation[productId];
      const productInfo = docs.documentation.products.find(p => p.id === productId);
      
      if (productData && productData.categories) {
        productData.categories.forEach(category => {
          allCategories.push({
            id: category.id,
            title: category.title,
            description: category.description,
            icon: category.icon,
            order: category.order,
            productId: productId,
            productTitle: productInfo?.title || productId,
            guides: category.guides.map(guide => ({
              id: guide.id,
              slug: guide.slug,
              title: guide.title,
              description: guide.description,
              order: guide.order
            }))
          });
        });
      }
    });
    
    // Filter by product if specified
    let filteredCategories = allCategories;
    if (productFilter) {
      if (productFilter === 'shared') {
        filteredCategories = allCategories.filter(c => c.productId === 'shared');
      } else if (['commerce', 'terminal', 'corp'].includes(productFilter)) {
        // Include shared + product-specific
        filteredCategories = allCategories.filter(
          c => c.productId === 'shared' || c.productId === productFilter
        );
      }
    }
    
    return NextResponse.json({
      success: true,
      data: filteredCategories
    }, { 
      headers: corsHeaders(origin) 
    });
  } catch (_error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch categories'
    }, { 
      status: 500,
      headers: corsHeaders(origin)
    });
  }
}