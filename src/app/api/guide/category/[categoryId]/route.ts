import { corsHeaders } from "@/utils/api.origin-header";
import { NextRequest, NextResponse } from "next/server";
import docs from "@/data/product-guide.json"

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return NextResponse.json({}, { headers: corsHeaders(origin) });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const origin = request.headers.get('origin');
  const { categoryId } = await params;
  
  try {
    const category = docs.documentation.categories.find(
      cat => cat.id === categoryId
    );

    if (!category) {
      return NextResponse.json({
        success: false,
        error: 'Category not found'
      }, { 
        status: 404,
        headers: corsHeaders(origin)
      });
    }

    return NextResponse.json({
      success: true,
      data: category
    }, { 
      headers: corsHeaders(origin) 
    });
  } catch (_error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch category'
    }, { 
      status: 500,
      headers: corsHeaders(origin)
    });
  }
}