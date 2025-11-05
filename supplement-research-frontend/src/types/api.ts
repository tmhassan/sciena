export interface PaginationParams {
  page?: number;
  per_page?: number;
}

export interface SearchParams extends PaginationParams {
  q?: string;
  category?: string;
  safety_rating?: string;
  evidence_grade?: string;
  legal_status?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

export interface ApiMetadata {
  total_count: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  metadata: ApiMetadata;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
}

export interface SearchParams extends PaginationParams {
  q?: string;
  category?: string;
  safety_rating?: string;
  evidence_grade?: string;
  legal_status?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

export interface ApiMetadata {
  total_count: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  metadata: ApiMetadata;
}

// Add the missing ApiResponse interface
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}
