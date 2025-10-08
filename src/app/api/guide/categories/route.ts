import { corsHeaders } from "@/utils/api.origin-header";
import { NextRequest, NextResponse } from "next/server";
import docs from "@/data/product-guide.json"

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return NextResponse.json({}, { headers: corsHeaders(origin) });
}


export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    const categories = docs.documentation.categories.map(category => ({
      id: category.id,
      title: category.title,
      description: category.description,
      icon: category.icon,
      order: category.order,
      guides: category.guides.map(guide => ({
        id: guide.id,
        slug: guide.slug,
        title: guide.title,
        description: guide.description,
        order: guide.order
      }))
    }));

    return NextResponse.json({
      success: true,
      data: categories
    }, { 
      headers: corsHeaders(origin) 
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch categories'
    }, { 
      status: 500,
      headers: corsHeaders(origin)
    });
  }
}