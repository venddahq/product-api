import { corsHeaders } from "@/utils/api.origin-header";
import { NextRequest, NextResponse } from "next/server";
import docs from "@/data/product-guide.json"

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return NextResponse.json({}, { headers: corsHeaders(origin) });
}

interface Guide {
  id: string;
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  order: number;
  content: {
    introduction: string;
    steps?: Array<{ number: number; title: string; description: string }>;
    tips?: string[];
    important?: string;
    relatedGuides?: string[];
    videoId?: string;
    [key: string]: unknown;
  };
}

interface Category {
  id: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  guides: Guide[];
}

type ProductId = 'commerce' | 'terminal' | 'corp';

// Helper to find a guide across all products
function findGuide(slug: string): { guide: Guide; category: Category; productId: string } | null {
  // Search shared categories
  for (const category of docs.documentation.shared.categories) {
    const guide = category.guides.find(g => g.slug === slug);
    if (guide) {
      return { guide: guide as Guide, category: category as Category, productId: 'shared' };
    }
  }
  
  // Search product categories
  const products: ProductId[] = ['commerce', 'terminal', 'corp'];
  for (const productId of products) {
    const productData = docs.documentation[productId];
    if (productData && productData.categories) {
      for (const category of productData.categories) {
        const guide = category.guides.find(g => g.slug === slug);
        if (guide) {
          return { guide: guide as Guide, category: category as Category, productId };
        }
      }
    }
  }
  
  return null;
}

// Helper to find a guide by ID
function findGuideById(id: string): { guide: Guide; category: Category; productId: string } | null {
  // Search shared categories
  for (const category of docs.documentation.shared.categories) {
    const guide = category.guides.find(g => g.id === id);
    if (guide) {
      return { guide: guide as Guide, category: category as Category, productId: 'shared' };
    }
  }
  
  // Search product categories
  const products: ProductId[] = ['commerce', 'terminal', 'corp'];
  for (const productId of products) {
    const productData = docs.documentation[productId];
    if (productData && productData.categories) {
      for (const category of productData.categories) {
        const guide = category.guides.find(g => g.id === id);
        if (guide) {
          return { guide: guide as Guide, category: category as Category, productId };
        }
      }
    }
  }
  
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const origin = request.headers.get('origin');
  const { slug } = await params;
  
  try {
    const result = findGuide(slug);
    
    if (!result) {
      return NextResponse.json({
        success: false,
        error: 'Guide not found'
      }, { 
        status: 404,
        headers: corsHeaders(origin)
      });
    }
    
    const { guide, category, productId } = result;
    const productInfo = docs.documentation.products.find(p => p.id === productId);
    
    // Get related guides details
    const relatedGuides = (guide.content.relatedGuides || []).map(relatedId => {
      const related = findGuideById(relatedId);
      if (related) {
        return {
          id: related.guide.id,
          slug: related.guide.slug,
          title: related.guide.title,
          description: related.guide.description
        };
      }
      return null;
    }).filter(Boolean);

    return NextResponse.json({
      success: true,
      data: {
        guide,
        category: {
          id: category.id,
          title: category.title,
          icon: category.icon
        },
        product: productId === 'shared' ? null : {
          id: productId,
          title: productInfo?.title
        },
        relatedGuides
      }
    }, { 
      headers: corsHeaders(origin) 
    });
  } catch (_error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch guide'
    }, { 
      status: 500,
      headers: corsHeaders(origin)
    });
  }
}