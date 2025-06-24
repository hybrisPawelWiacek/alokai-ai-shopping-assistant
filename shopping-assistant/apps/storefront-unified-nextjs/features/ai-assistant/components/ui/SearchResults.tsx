import { useEffect } from 'react';
import type { Product } from './ProductGrid';
import ProductGrid from './ProductGrid';

interface SearchResultsProps {
  products: Product[];
  totalResults: number;
  query: string;
}

export default function SearchResults({ products, totalResults, query }: SearchResultsProps) {
  // Only log once when component mounts
  useEffect(() => {
    console.log('[SearchResults] Mounted with:', {
      productsCount: products.length,
      totalResults,
      query,
    });
  }, [products.length, totalResults, query]);
  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        Found {totalResults} results for "{query}"
      </div>
      <ProductGrid products={products} />
    </div>
  );
}
