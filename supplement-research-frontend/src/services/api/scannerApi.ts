import { ScanRequest, ScanResult } from '../../types/scanner';

export class ScannerAPI {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  async uploadAndScan(file: File, scanType: string = 'auto'): Promise<ScanResult> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('scan_type', scanType);
    formData.append('enhance_image', 'true');
    formData.append('use_ai_parsing', 'true');
    formData.append('include_safety_analysis', 'true');

    try {
      const response = await fetch(`${this.baseUrl}/scanner/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      return data.data;
    } catch (error) {
      console.error('Scanner API error:', error);
      throw error;
    }
  }

  async scanBatch(files: File[]): Promise<Array<{ filename: string; result?: ScanResult; error?: string }>> {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('images', file);
    });

    try {
      const response = await fetch(`${this.baseUrl}/scanner/batch`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Batch upload failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Batch upload failed');
      }

      return data.data;
    } catch (error) {
      console.error('Scanner batch API error:', error);
      throw error;
    }
  }

  async getScanResult(scanId: string): Promise<ScanResult> {
    try {
      const response = await fetch(`${this.baseUrl}/scanner/result/${scanId}`);

      if (!response.ok) {
        throw new Error(`Failed to get scan result: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get scan result');
      }

      return data.data;
    } catch (error) {
      console.error('Get scan result API error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const scannerApi = new ScannerAPI();
