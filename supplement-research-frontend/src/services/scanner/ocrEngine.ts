import { OCRResult, BoundingBox } from '../../types/scanner';

export class OCREngine {
  private worker: any = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Dynamic import for browser compatibility
      const Tesseract = await import('tesseract.js');
      
      this.worker = await Tesseract.createWorker('eng', 1, {
        logger: (m: any) => console.log('OCR:', m.status, m.progress)
      });

      await this.worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,()%-/ ',
        tessedit_pageseg_mode: '6',
        preserve_interword_spaces: '1'
      });

      this.isInitialized = true;
      console.log('OCR Engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OCR engine:', error);
      throw new Error('OCR engine initialization failed');
    }
  }

  async extractText(imageFile: File | Blob): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const { data } = await this.worker.recognize(imageFile);
      return data.text || '';
    } catch (error) {
      console.error('Text extraction failed:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  async extractStructuredText(imageFile: File | Blob): Promise<OCRResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const { data } = await this.worker.recognize(imageFile);
      
      const boundingBoxes: BoundingBox[] = (data.words || []).map((word: any) => ({
        text: word.text || '',
        x: word.bbox?.x0 || 0,
        y: word.bbox?.y0 || 0,
        width: (word.bbox?.x1 || 0) - (word.bbox?.x0 || 0),
        height: (word.bbox?.y1 || 0) - (word.bbox?.y0 || 0),
        confidence: (word.confidence || 0) / 100
      }));

      return {
        text: data.text || '',
        confidence: (data.confidence || 0) / 100,
        boundingBoxes
      };
    } catch (error) {
      console.error('Structured text extraction failed:', error);
      throw new Error('Failed to extract structured text from image');
    }
  }

  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }
}
