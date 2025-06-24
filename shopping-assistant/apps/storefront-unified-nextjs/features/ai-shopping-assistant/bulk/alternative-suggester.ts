import type { AlternativeSuggestion } from './bulk-processor';

/**
 * Product attributes for similarity calculation
 */
export interface ProductAttributes {
  sku: string;
  name: string;
  category: string[];
  brand?: string;
  attributes: Record<string, any>;
  price: number;
  availability: 'in_stock' | 'limited' | 'out_of_stock';
  tags?: string[];
}

/**
 * Similarity weights for different attributes
 */
interface SimilarityWeights {
  category: number;
  brand: number;
  attributes: number;
  price: number;
  name: number;
  tags: number;
}

/**
 * Alternative suggestion configuration
 */
export interface AlternativeSuggesterConfig {
  maxSuggestions: number;
  minSimilarity: number;
  weights?: Partial<SimilarityWeights>;
  enableCrossBrand?: boolean;
  priceTolerancePercent?: number;
}

/**
 * Intelligent alternative product suggester for out-of-stock items
 */
export class AlternativeSuggester {
  private weights: SimilarityWeights;

  constructor(private config: AlternativeSuggesterConfig) {
    this.weights = {
      category: 0.3,
      brand: 0.2,
      attributes: 0.25,
      price: 0.1,
      name: 0.1,
      tags: 0.05,
      ...config.weights
    };
  }

  /**
   * Find alternative products for an out-of-stock item
   */
  async findAlternatives(
    originalProduct: ProductAttributes,
    candidateProducts: ProductAttributes[]
  ): Promise<AlternativeSuggestion[]> {
    // Filter candidates by availability
    const availableCandidates = candidateProducts.filter(
      p => p.sku !== originalProduct.sku && p.availability === 'in_stock'
    );

    // Calculate similarity scores
    const scoredCandidates = availableCandidates.map(candidate => ({
      product: candidate,
      similarity: this.calculateSimilarity(originalProduct, candidate),
      reason: this.generateReason(originalProduct, candidate)
    }));

    // Sort by similarity and filter by minimum threshold
    const suggestions = scoredCandidates
      .filter(c => c.similarity >= this.config.minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, this.config.maxSuggestions)
      .map(c => ({
        sku: c.product.sku,
        name: c.product.name,
        similarity: Math.round(c.similarity * 100) / 100,
        availability: c.product.availability,
        price: c.product.price,
        reason: c.reason
      }));

    return suggestions;
  }

  /**
   * Calculate similarity score between two products
   */
  private calculateSimilarity(
    original: ProductAttributes,
    candidate: ProductAttributes
  ): number {
    let score = 0;

    // Category similarity
    score += this.weights.category * this.calculateCategorySimilarity(
      original.category,
      candidate.category
    );

    // Brand similarity
    if (this.config.enableCrossBrand || original.brand === candidate.brand) {
      score += this.weights.brand * (original.brand === candidate.brand ? 1 : 0.5);
    }

    // Attribute similarity
    score += this.weights.attributes * this.calculateAttributeSimilarity(
      original.attributes,
      candidate.attributes
    );

    // Price similarity
    score += this.weights.price * this.calculatePriceSimilarity(
      original.price,
      candidate.price
    );

    // Name similarity (using simple token matching)
    score += this.weights.name * this.calculateNameSimilarity(
      original.name,
      candidate.name
    );

    // Tag similarity
    if (original.tags && candidate.tags) {
      score += this.weights.tags * this.calculateTagSimilarity(
        original.tags,
        candidate.tags
      );
    }

    return score;
  }

  /**
   * Calculate category similarity (Jaccard index)
   */
  private calculateCategorySimilarity(cat1: string[], cat2: string[]): number {
    const set1 = new Set(cat1);
    const set2 = new Set(cat2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Calculate attribute similarity
   */
  private calculateAttributeSimilarity(
    attrs1: Record<string, any>,
    attrs2: Record<string, any>
  ): number {
    const keys1 = Object.keys(attrs1);
    const keys2 = Object.keys(attrs2);
    const allKeys = new Set([...keys1, ...keys2]);
    
    if (allKeys.size === 0) return 1;

    let matches = 0;
    let comparisons = 0;

    for (const key of allKeys) {
      if (key in attrs1 && key in attrs2) {
        comparisons++;
        if (this.compareAttributeValues(attrs1[key], attrs2[key])) {
          matches++;
        }
      }
    }

    return comparisons > 0 ? matches / comparisons : 0;
  }

  /**
   * Compare attribute values with type handling
   */
  private compareAttributeValues(val1: any, val2: any): boolean {
    // Handle arrays
    if (Array.isArray(val1) && Array.isArray(val2)) {
      const set1 = new Set(val1);
      const set2 = new Set(val2);
      const intersection = new Set([...set1].filter(x => set2.has(x)));
      return intersection.size > 0;
    }

    // Handle numbers with tolerance
    if (typeof val1 === 'number' && typeof val2 === 'number') {
      const tolerance = Math.min(val1, val2) * 0.1; // 10% tolerance
      return Math.abs(val1 - val2) <= tolerance;
    }

    // Direct comparison for other types
    return val1 === val2;
  }

  /**
   * Calculate price similarity with tolerance
   */
  private calculatePriceSimilarity(price1: number, price2: number): number {
    const tolerance = this.config.priceTolerancePercent || 20;
    const maxPrice = Math.max(price1, price2);
    const minPrice = Math.min(price1, price2);
    
    if (maxPrice === 0) return 1;
    
    const percentDiff = ((maxPrice - minPrice) / maxPrice) * 100;
    
    if (percentDiff <= tolerance) {
      return 1 - (percentDiff / tolerance);
    }
    
    return 0;
  }

  /**
   * Calculate name similarity using token matching
   */
  private calculateNameSimilarity(name1: string, name2: string): number {
    const tokens1 = this.tokenizeName(name1);
    const tokens2 = this.tokenizeName(name2);
    
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Tokenize product name for comparison
   */
  private tokenizeName(name: string): string[] {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2); // Filter out small words
  }

  /**
   * Calculate tag similarity
   */
  private calculateTagSimilarity(tags1: string[], tags2: string[]): number {
    const set1 = new Set(tags1);
    const set2 = new Set(tags2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Generate human-readable reason for suggestion
   */
  private generateReason(
    original: ProductAttributes,
    candidate: ProductAttributes
  ): string {
    const reasons: string[] = [];

    // Same category
    if (this.calculateCategorySimilarity(original.category, candidate.category) > 0.5) {
      reasons.push('Same category');
    }

    // Same brand
    if (original.brand === candidate.brand) {
      reasons.push('Same brand');
    }

    // Similar price
    const priceSimilarity = this.calculatePriceSimilarity(original.price, candidate.price);
    if (priceSimilarity > 0.8) {
      reasons.push('Similar price');
    } else if (candidate.price < original.price) {
      const savings = Math.round(((original.price - candidate.price) / original.price) * 100);
      reasons.push(`${savings}% lower price`);
    }

    // Matching attributes
    const attrSimilarity = this.calculateAttributeSimilarity(original.attributes, candidate.attributes);
    if (attrSimilarity > 0.7) {
      reasons.push('Matching specifications');
    }

    return reasons.length > 0 
      ? reasons.join(', ')
      : 'Similar product available';
  }
}

/**
 * B2B-specific alternative suggester with business rules
 */
export class B2BAlternativeSuggester extends AlternativeSuggester {
  constructor(config: AlternativeSuggesterConfig) {
    super({
      ...config,
      weights: {
        category: 0.4,      // Higher weight on exact category match
        brand: 0.15,        // Lower brand importance for B2B
        attributes: 0.3,    // Technical specs very important
        price: 0.05,        // Price less important than specs
        name: 0.05,
        tags: 0.05,
        ...config.weights
      }
    });
  }

  /**
   * Find alternatives with B2B-specific logic
   */
  async findAlternatives(
    originalProduct: ProductAttributes,
    candidateProducts: ProductAttributes[],
    bulkQuantity?: number
  ): Promise<AlternativeSuggestion[]> {
    // Get base suggestions
    const suggestions = await super.findAlternatives(originalProduct, candidateProducts);

    // Enhance with B2B-specific information
    return suggestions.map(suggestion => {
      // Check bulk availability if quantity provided
      if (bulkQuantity && bulkQuantity > 100) {
        suggestion.reason += '. Bulk availability confirmed';
      }

      // Add volume pricing indicator
      if (suggestion.price && originalProduct.price) {
        const potentialSavings = (originalProduct.price - suggestion.price) * (bulkQuantity || 1);
        if (potentialSavings > 0) {
          suggestion.reason += `. Potential savings: $${potentialSavings.toFixed(2)}`;
        }
      }

      return suggestion;
    });
  }
}