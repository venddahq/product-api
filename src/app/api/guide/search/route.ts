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
  const query = searchParams.get('q');

  if (!query || query.trim().length === 0) {
    return NextResponse.json({
      success: false,
      error: 'Search query is required'
    }, { 
      status: 400,
      headers: corsHeaders(origin)
    });
  }

  try {
    const results: any[] = [];
    const lowerQuery = query.toLowerCase().trim();

    docs.documentation.categories.forEach(category => {
      category.guides.forEach(guide => {
        let matchScore = 0;
        let matchType = '';

        // Check title match (highest priority)
        if (guide.title.toLowerCase().includes(lowerQuery)) {
          matchScore = 5;
          matchType = 'title';
        }
        // Check exact keyword match
        else if (guide.keywords.some(k => k.toLowerCase() === lowerQuery)) {
          matchScore = 4;
          matchType = 'keyword-exact';
        }
        // Check partial keyword match
        else if (guide.keywords.some(k => k.toLowerCase().includes(lowerQuery))) {
          matchScore = 3;
          matchType = 'keyword-partial';
        }
        // Check description match
        else if (guide.description.toLowerCase().includes(lowerQuery)) {
          matchScore = 2;
          matchType = 'description';
        }
        // Check category match
        else if (category.title.toLowerCase().includes(lowerQuery)) {
          matchScore = 1;
          matchType = 'category';
        }

        if (matchScore > 0) {
          results.push({
            id: guide.id,
            slug: guide.slug,
            title: guide.title,
            description: guide.description,
            category: {
              id: category.id,
              title: category.title,
              icon: category.icon
            },
            matchScore,
            matchType
          });
        }
      });
    });

    // Sort by match score (descending)
    results.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({
      success: true,
      query,
      count: results.length,
      data: results
    }, { 
      headers: corsHeaders(origin) 
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Search failed'
    }, { 
      status: 500,
      headers: corsHeaders(origin)
    });
  }
}