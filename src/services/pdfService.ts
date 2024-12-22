import * as pdfjs from 'pdfjs-dist';
import fs from 'fs/promises';
import logger from '../utils/logger';

export class PDFService {
  async extractText(filePath: string): Promise<string> {
    try {
      const data = await pdfjs.getDocument(filePath).promise;
      let text = '';
      
      for (let i = 1; i <= data.numPages; i++) {
        const page = await data.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ');
      }
      
      logger.info(`Successfully extracted text from PDF: ${filePath}`);
      return text;
    } catch (error) {
      logger.error(`Error extracting text from PDF ${filePath}:`, error);
      throw error;
    }
  }

  async extractTextFromFile(file: Express.Multer.File): Promise<string> {
    return this.extractText(file.path);
  }
}
