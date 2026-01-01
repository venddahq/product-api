import { corsHeaders } from "@/utils/api.origin-header";
import { NextRequest, NextResponse } from "next/server";
import docs from "@/data/product-guide.json"

interface SearchResult {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: {
    id: string;
    title: string;
    icon: string;
  };
  product: {
    id: string;
    title: string;
  } | null;
  matchScore: number;
  matchType: string;
}

interface Guide {
  id: string;
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  content?: {
    introduction?: string;
    steps?: Array<{ title: string; description: string }>;
  };
}

interface Category {
  id: string;
  title: string;
  icon: string;
}

type ProductId = 'commerce' | 'terminal' | 'corp';

// Tokenize and normalize text for search
function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')  // Remove special chars
    .split(/\s+/)
    .filter(word => word.length > 2);  // Filter short words
}

// Check if any query word matches any target word (partial match)
function fuzzyMatch(queryWords: string[], targetText: string): number {
  const targetWords = tokenize(targetText);
  let matches = 0;
  
  for (const queryWord of queryWords) {
    for (const targetWord of targetWords) {
      // Exact word match
      if (targetWord === queryWord) {
        matches += 2;
      }
      // Partial match (query word is part of target or vice versa)
      else if (targetWord.includes(queryWord) || queryWord.includes(targetWord)) {
        matches += 1;
      }
    }
  }
  
  return matches;
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return NextResponse.json({}, { headers: corsHeaders(origin) });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const productFilter = searchParams.get('product');

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
    const results: SearchResult[] = [];
    const queryWords = tokenize(query);
    const lowerQuery = query.toLowerCase().trim();

    // Search function for a category
    function searchCategory(
      category: Category, 
      guides: Guide[], 
      productId: string, 
      productTitle: string
    ) {
      guides.forEach(guide => {
        let matchScore = 0;
        let matchType = '';

        // 1. Exact phrase match in title (highest priority)
        if (guide.title.toLowerCase().includes(lowerQuery)) {
          matchScore = 100;
          matchType = 'title-exact';
        }
        // 2. Word match in title
        else {
          const titleScore = fuzzyMatch(queryWords, guide.title);
          if (titleScore > 0) {
            matchScore = 50 + titleScore * 10;
            matchType = 'title-fuzzy';
          }
        }

        // 3. Exact keyword match
        if (matchScore < 50) {
          const keywordExact = guide.keywords.some(k => 
            k.toLowerCase() === lowerQuery
          );
          if (keywordExact) {
            matchScore = Math.max(matchScore, 80);
            matchType = 'keyword-exact';
          }
        }

        // 4. Fuzzy keyword match
        if (matchScore < 40) {
          let keywordScore = 0;
          for (const keyword of guide.keywords) {
            keywordScore += fuzzyMatch(queryWords, keyword);
          }
          if (keywordScore > 0) {
            matchScore = Math.max(matchScore, 30 + keywordScore * 5);
            matchType = matchType || 'keyword-fuzzy';
          }
        }

        // 5. Description match
        if (matchScore < 30) {
          const descScore = fuzzyMatch(queryWords, guide.description);
          if (descScore > 0) {
            matchScore = Math.max(matchScore, 20 + descScore * 3);
            matchType = matchType || 'description';
          }
        }

        // 6. Content/introduction match
        if (matchScore < 20 && guide.content?.introduction) {
          const introScore = fuzzyMatch(queryWords, guide.content.introduction);
          if (introScore > 0) {
            matchScore = Math.max(matchScore, 10 + introScore * 2);
            matchType = matchType || 'content';
          }
        }

        // 7. Step titles match
        if (matchScore < 15 && guide.content?.steps) {
          for (const step of guide.content.steps) {
            const stepScore = fuzzyMatch(queryWords, step.title + ' ' + step.description);
            if (stepScore > 0) {
              matchScore = Math.max(matchScore, 5 + stepScore);
              matchType = matchType || 'steps';
              break;
            }
          }
        }

        // 8. Category match (catch-all)
        if (matchScore < 5) {
          const catScore = fuzzyMatch(queryWords, category.title);
          if (catScore > 0) {
            matchScore = catScore;
            matchType = 'category';
          }
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
            product: productId === 'shared' ? null : {
              id: productId,
              title: productTitle
            },
            matchScore,
            matchType
          });
        }
      });
    }

    // Search shared categories
    docs.documentation.shared.categories.forEach(category => {
      searchCategory(
        category as Category, 
        category.guides as Guide[], 
        'shared', 
        'Shared'
      );
    });

    // Search product categories
    const products: ProductId[] = ['commerce', 'terminal', 'corp'];
    products.forEach(productId => {
      // Skip if filtering by product and this isn't it
      if (productFilter && productFilter !== productId && productFilter !== 'shared') {
        return;
      }
      
      const productData = docs.documentation[productId];
      const productInfo = docs.documentation.products.find(p => p.id === productId);
      
      if (productData && productData.categories) {
        productData.categories.forEach(category => {
          searchCategory(
            category as Category, 
            category.guides as Guide[], 
            productId, 
            productInfo?.title || productId
          );
        });
      }
    });

    // Sort by match score (descending)
    results.sort((a, b) => b.matchScore - a.matchScore);

    // Limit results
    const limitedResults = results.slice(0, 20);

    return NextResponse.json({
      success: true,
      query,
      count: limitedResults.length,
      data: limitedResults
    }, { 
      headers: corsHeaders(origin) 
    });
  } catch (_error) {
    return NextResponse.json({
      success: false,
      error: 'Search failed'
    }, { 
      status: 500,
      headers: corsHeaders(origin)
    });
  }
}