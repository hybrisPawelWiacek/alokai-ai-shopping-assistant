import type { IntegrationContext } from "../../types";
import { getNormalizers } from "@vsf-enterprise/unified-api-sapcc/udl";

/**
 * Product similarity calculation for alternative suggestions
 * This is a custom method that extends Alokai's capabilities
 */
export async function findSimilarProducts(
  context: IntegrationContext,
  args: {
    sku: string;
    maxResults?: number;
    includeOutOfStock?: boolean;
    mode?: 'b2c' | 'b2b';
  }
): Promise<Array<{
  product: any; // Will be normalized UDL product
  similarity: number;
  reasons: string[];
}>> {
  const { sku, maxResults = 5, includeOutOfStock = false, mode = 'b2c' } = args;
  const { normalizeProduct } = getNormalizers(context);
  
  try {
    // 1. Get the original product details
    const originalProduct = await context.api.getProduct({ code: sku });
    if (!originalProduct) {
      throw new Error(`Product ${sku} not found`);
    }

    // 2. Build search criteria based on product attributes
    const searchCriteria = {
      // Search in same categories
      categoryCode: originalProduct.categories?.[0]?.code,
      // Exclude the original product
      excludeSkus: [sku],
      // Stock filter
      inStock: includeOutOfStock ? undefined : true,
      // For B2B, include bulk-eligible products
      ...(mode === 'b2b' && { bulkEligible: true })
    };

    // 3. Search for similar products
    const searchResults = await context.api.searchProducts({
      query: '',
      categoryCode: searchCriteria.categoryCode,
      pageSize: maxResults * 3, // Get more to filter by similarity
      currentPage: 0,
      sort: 'relevance'
    });

    // 4. Calculate similarity scores
    const scoredProducts = searchResults.products
      .filter(p => p.code !== sku)
      .map(candidate => {
        const similarity = calculateSimilarity(originalProduct, candidate, mode);
        const reasons = generateReasons(originalProduct, candidate, similarity);
        
        return {
          product: normalizeProduct(candidate),
          similarity: similarity.total,
          reasons,
          _scores: similarity // Keep detailed scores for debugging
        };
      })
      .filter(p => p.similarity > 0.5) // Minimum 50% similarity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxResults);

    return scoredProducts;
  } catch (error) {
    console.error('Error finding similar products:', error);
    return [];
  }
}

/**
 * Calculate similarity between two products
 */
function calculateSimilarity(
  original: any,
  candidate: any,
  mode: 'b2c' | 'b2b'
): {
  total: number;
  category: number;
  brand: number;
  price: number;
  attributes: number;
  name: number;
} {
  const weights = mode === 'b2b' 
    ? { category: 0.4, brand: 0.15, price: 0.05, attributes: 0.35, name: 0.05 }
    : { category: 0.3, brand: 0.25, price: 0.2, attributes: 0.15, name: 0.1 };

  const scores = {
    category: calculateCategorySimilarity(original.categories, candidate.categories),
    brand: original.manufacturer === candidate.manufacturer ? 1 : 0,
    price: calculatePriceSimilarity(original.price?.value, candidate.price?.value),
    attributes: calculateAttributeSimilarity(original, candidate),
    name: calculateNameSimilarity(original.name, candidate.name)
  };

  const total = Object.entries(scores).reduce((sum, [key, score]) => {
    return sum + (score * weights[key as keyof typeof weights]);
  }, 0);

  return { total, ...scores };
}

/**
 * Calculate category similarity (Jaccard index)
 */
function calculateCategorySimilarity(cats1: any[], cats2: any[]): number {
  if (!cats1?.length || !cats2?.length) return 0;
  
  const codes1 = new Set(cats1.map(c => c.code));
  const codes2 = new Set(cats2.map(c => c.code));
  
  const intersection = new Set([...codes1].filter(x => codes2.has(x)));
  const union = new Set([...codes1, ...codes2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Calculate price similarity
 */
function calculatePriceSimilarity(price1?: number, price2?: number): number {
  if (!price1 || !price2) return 0;
  
  const diff = Math.abs(price1 - price2);
  const avg = (price1 + price2) / 2;
  const percentDiff = (diff / avg) * 100;
  
  // Linear decay: 100% similar at 0% diff, 0% similar at 50% diff
  return Math.max(0, 1 - (percentDiff / 50));
}

/**
 * Calculate attribute similarity
 */
function calculateAttributeSimilarity(prod1: any, prod2: any): number {
  // Compare classification attributes
  const attrs1 = prod1.classifications?.[0]?.features || [];
  const attrs2 = prod2.classifications?.[0]?.features || [];
  
  if (!attrs1.length || !attrs2.length) return 0.5; // Neutral if no attributes
  
  let matches = 0;
  let comparisons = 0;
  
  attrs1.forEach((attr1: any) => {
    const attr2 = attrs2.find((a: any) => a.code === attr1.code);
    if (attr2) {
      comparisons++;
      if (compareAttributeValues(attr1.featureValues, attr2.featureValues)) {
        matches++;
      }
    }
  });
  
  return comparisons > 0 ? matches / comparisons : 0;
}

/**
 * Compare attribute values
 */
function compareAttributeValues(values1: any[], values2: any[]): boolean {
  if (!values1?.length || !values2?.length) return false;
  
  const vals1 = new Set(values1.map(v => v.value));
  const vals2 = new Set(values2.map(v => v.value));
  
  // Check if there's any overlap
  return [...vals1].some(v => vals2.has(v));
}

/**
 * Calculate name similarity using token overlap
 */
function calculateNameSimilarity(name1: string, name2: string): number {
  const tokens1 = tokenizeName(name1);
  const tokens2 = tokenizeName(name2);
  
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Tokenize product name
 */
function tokenizeName(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2);
}

/**
 * Generate human-readable reasons for similarity
 */
function generateReasons(
  original: any,
  candidate: any,
  scores: ReturnType<typeof calculateSimilarity>
): string[] {
  const reasons: string[] = [];
  
  if (scores.category > 0.8) {
    reasons.push('Same product category');
  } else if (scores.category > 0.5) {
    reasons.push('Related category');
  }
  
  if (scores.brand === 1) {
    reasons.push('Same brand');
  }
  
  if (scores.price > 0.8) {
    reasons.push('Similar price');
  } else if (candidate.price?.value < original.price?.value) {
    const savings = Math.round(((original.price.value - candidate.price.value) / original.price.value) * 100);
    if (savings > 10) {
      reasons.push(`${savings}% lower price`);
    }
  }
  
  if (scores.attributes > 0.7) {
    reasons.push('Matching specifications');
  }
  
  if (scores.name > 0.5) {
    reasons.push('Similar product line');
  }
  
  // Add stock status for B2B
  if (candidate.stock?.stockLevel > 100) {
    reasons.push('High stock availability');
  }
  
  return reasons.length > 0 ? reasons : ['Alternative product available'];
}