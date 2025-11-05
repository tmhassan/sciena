import axios, { AxiosResponse } from 'axios';
import { ApiResponse, PaginatedResponse, SearchParams } from '../types/api';
import { Compound, CompoundDetailed, Study, DosageInfo } from '../types/compound';
import { mockCompounds, mockStats, featuredCompounds, mockSearch } from './mockData';
import { DEFAULT_PAGE_SIZE } from '../utils/constants';

// Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true' || false; // Set to false for real API

console.log('API Configuration:', {
  API_BASE_URL,
  USE_MOCK_DATA,
  NODE_ENV: process.env.NODE_ENV
});

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor for auth (when needed)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      // Don't redirect in development
      if (process.env.NODE_ENV === 'production') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Define proper types for API responses
interface StatsResponse {
  total_compounds: number;
  total_studies: number;
  total_with_studies: number;
  categories: Record<string, number>;
  total_summaries?: number;
  safety_ratings?: Record<string, number>;
  legal_statuses?: Record<string, number>;
  coverage?: {
    studies: number;
    summaries: number;
  };
  last_updated?: string;
}

// API helper functions
const handleApiResponse = <T>(response: AxiosResponse<any>): T => {
  // Handle both direct data and wrapped responses
  if (response.data.status === 'error') {
    throw new Error(response.data.message || 'API request failed');
  }
  
  // If data is wrapped in a 'data' property, unwrap it
  if (response.data.data !== undefined) {
    return response.data.data;
  }
  
  return response.data;
};

const handlePaginatedResponse = <T>(
  response: AxiosResponse<PaginatedResponse<T>>
): PaginatedResponse<T> => {
  return response.data;
};

export const compoundService = {
  // Get all compounds with optional filtering and pagination
  getAll: async (params?: SearchParams): Promise<PaginatedResponse<Compound>> => {
    if (USE_MOCK_DATA) {
      console.log('Using mock data for getAll');
      // Mock paginated response
      const compounds = mockCompounds;
      return {
        data: compounds,
        metadata: {
          total_count: compounds.length,
          page: 1,
          per_page: 20,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        }
      };
    }

    try {
      console.log('Fetching compounds from API with params:', params);
      const response = await api.get<PaginatedResponse<Compound>>('/api/compounds', { params });
      const result = handlePaginatedResponse(response);
      console.log('API Response:', result);
      return result;
    } catch (error) {
      console.error('API call failed, using mock data:', error);
      const compounds = mockCompounds;
      return {
        data: compounds,
        metadata: {
          total_count: compounds.length,
          page: 1,
          per_page: 20,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        }
      };
    }
  },

  // Get a single compound by ID with all related data
  getById: async (id: string): Promise<CompoundDetailed> => {
    if (USE_MOCK_DATA) {
      console.log('Using mock data for getById:', id);
      const compound = mockCompounds.find(c => c.id === id);
      if (!compound) throw new Error('Compound not found');
      return compound as CompoundDetailed;
    }

    try {
      console.log('Fetching compound by ID from API:', id);
      const response = await api.get<CompoundDetailed>(`/api/compounds/${id}`);
      const result = handleApiResponse<CompoundDetailed>(response);
      console.log('Compound detail response:', result);
      return result;
    } catch (error) {
      console.error('API call failed for compound detail:', error);
      throw new Error(`Failed to fetch compound ${id}: ${error}`);
    }
  },

  // Get detailed AI summary for a compound
  getSummary: async (id: string): Promise<any> => {
    if (USE_MOCK_DATA) {
      return null;
    }

    try {
      console.log('Fetching compound summary from API:', id);
      const response = await api.get(`/api/compounds/${id}/summary`);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Failed to fetch compound summary:', error);
      return null;
    }
  },

  // Get compound benefits
  getBenefits: async (id: string): Promise<any[]> => {
    if (USE_MOCK_DATA) {
      return [];
    }

    try {
      const response = await api.get(`/api/compounds/${id}/benefits`);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Failed to fetch compound benefits:', error);
      return [];
    }
  },

  // Search compounds with typeahead support
  search: async (query: string, limit: number = 10): Promise<Compound[]> => {
    if (USE_MOCK_DATA) {
      console.log('Using mock search for:', query);
      return mockSearch(query).slice(0, limit);
    }

    try {
      console.log('Searching compounds via API:', query);
      const response = await api.get<Compound[]>('/api/compounds/search', {
        params: { q: query, limit }
      });
      return handleApiResponse(response);
    } catch (error) {
      console.error('API search failed, using mock data:', error);
      return mockSearch(query).slice(0, limit);
    }
  },

  // Get studies for a specific compound
  getStudies: async (id: string): Promise<Study[]> => {
    if (USE_MOCK_DATA) {
      return [];
    }

    try {
      const response = await api.get<Study[]>(`/api/studies/compound/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      console.warn('API call failed for studies:', error);
      return [];
    }
  },

  // Get dosage information for a specific compound
  getDosage: async (id: string): Promise<DosageInfo[]> => {
    if (USE_MOCK_DATA) {
      return [];
    }

    try {
      const response = await api.get<DosageInfo[]>(`/api/compounds/${id}/dosage`);
      return handleApiResponse(response);
    } catch (error) {
      console.warn('API call failed for dosage:', error);
      return [];
    }
  },

  // Get featured compounds for homepage
  getFeatured: async (): Promise<Compound[]> => {
    if (USE_MOCK_DATA) {
      console.log('Using mock featured compounds');
      return featuredCompounds;
    }

    try {
      console.log('Fetching featured compounds from API');
      const response = await api.get<Compound[]>('/api/compounds/featured');
      const result = handleApiResponse<Compound[]>(response);
      console.log('Featured compounds response:', result);
      return result;
    } catch (error) {
      console.error('API call failed for featured compounds, using mock data:', error);
      return featuredCompounds;
    }
  },

  // Get compounds by category
  getByCategory: async (category: string): Promise<Compound[]> => {
    if (USE_MOCK_DATA) {
      return mockCompounds.filter(c => c.category === category);
    }

    try {
      const response = await api.get<Compound[]>(`/api/compounds/category/${category}`);
      return handleApiResponse(response);
    } catch (error) {
      console.warn('API call failed for category:', error);
      return mockCompounds.filter(c => c.category === category);
    }
  },

  // Get platform statistics
  getStats: async (): Promise<StatsResponse> => {
    if (USE_MOCK_DATA) {
      console.log('Using mock stats');
      return mockStats;
    }

    try {
      console.log('Fetching stats from API');
      const response = await api.get<StatsResponse>('/api/stats');
      const result = handleApiResponse<StatsResponse>(response);
      console.log('Stats API response:', result);
      return result;
    } catch (error) {
      console.error('API call failed for stats, using mock data:', error);
      return mockStats;
    }
  },
};

// Test API connection
export const testApiConnection = async (): Promise<boolean> => {
  try {
    const response = await api.get('/health');
    console.log('API Health Check:', response.data);
    return response.status === 200;
  } catch (error) {
    console.error('API Health Check Failed:', error);
    return false;
  }
};
