export interface PagefindResultData {
  url: string;
  content: string;
  excerpt: string;
  meta: Record<string, string>;
  filters: Record<string, string[]>;
  locations: number[];
  word_count: number;
}

export interface PagefindSearchResult {
  id: string;
  data: () => Promise<PagefindResultData>;
}

export interface PagefindSearchResponse {
  results: PagefindSearchResult[];
  unfilteredResultCount: number;
  filters: Record<string, Record<string, number>>;
  totalFilters: Record<string, Record<string, number>>;
  timings: { preload: number; search: number; total: number };
}

export interface PagefindModule {
  init: () => Promise<void>;
  options: (options: {
    baseUrl?: string;
    excerptLength?: number;
    highlightParam?: string;
  }) => Promise<void>;
  search: (
    query: string,
    options?: { filters?: Record<string, string | string[]> },
  ) => Promise<PagefindSearchResponse>;
  filters: () => Promise<Record<string, Record<string, number>>>;
  preload: (query: string) => Promise<void>;
}
