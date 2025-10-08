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
    return NextResponse.json({
      success: true,
      data: {
        title: docs.documentation.title,
        description: docs.documentation.description,
        version: docs.documentation.version,
        lastUpdated: docs.documentation.lastUpdated,
        categories: docs.documentation.categories
      }
    }, { 
      headers: corsHeaders(origin) 
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch documentation'
    }, { 
      status: 500,
      headers: corsHeaders(origin)
    });
  }
}