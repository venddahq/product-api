import { corsHeaders } from "@/utils/api.origin-header";
import { NextRequest, NextResponse } from "next/server";
import docs from "@/data/product-guide.json"

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return NextResponse.json({}, { headers: corsHeaders(origin) });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const origin = request.headers.get('origin');
  const { slug } = await params;
  
  try {
    let foundGuide = null;
    let categoryInfo = null;

    // Search for the guide across all categories
    for (const category of docs.documentation.categories) {
      const guide = category.guides.find(g => g.slug === slug);
      if (guide) {
        foundGuide = guide;
        categoryInfo = {
          id: category.id,
          title: category.title,
          icon: category.icon
        };
        break;
      }
    }

    if (!foundGuide) {
      return NextResponse.json({
        success: false,
        error: 'Guide not found'
      }, { 
        status: 404,
        headers: corsHeaders(origin)
      });
    }

    // Get navigation (previous/next)
    const navigation = docs.documentation.navigation.previousNext[foundGuide.id as keyof typeof docs.documentation.navigation.previousNext] ;
    
    // Get previous and next guide details
    let previousGuide = null;
    let nextGuide = null;

    if (navigation && 'previous' in navigation && navigation.previous) {
      for (const category of docs.documentation.categories) {
        const guide = category.guides.find(g => g.id === navigation.previous);
        if (guide) {
          previousGuide = {
            slug: guide.slug,
            title: guide.title
          };
          break;
        }
      }
    }

    if (navigation && 'next' in navigation && navigation.next) {
      for (const category of docs.documentation.categories) {
        const guide = category.guides.find(g => g.id === navigation.next);
        if (guide) {
          nextGuide = {
            slug: guide.slug,
            title: guide.title
          };
          break;
        }
      }
    }

    // Get related guides details
    const relatedGuides = foundGuide.content.relatedGuides?.map(relatedId => {
      for (const category of docs.documentation.categories) {
        const guide = category.guides.find(g => g.id === relatedId);
        if (guide) {
          return {
            id: guide.id,
            slug: guide.slug,
            title: guide.title,
            description: guide.description
          };
        }
      }
      return null;
    }).filter(Boolean) || [];

    return NextResponse.json({
      success: true,
      data: {
        guide: foundGuide,
        category: categoryInfo,
        navigation: {
          previous: previousGuide,
          next: nextGuide
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