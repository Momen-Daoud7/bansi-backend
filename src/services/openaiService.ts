import OpenAI from 'openai';
import { InvoiceData } from '../types/invoice';
import { AppError } from '../middleware/errorHandler';

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async processInvoice(pdfText: string): Promise<InvoiceData> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Extract invoice information from the following text. Return a JSON object with invoiceNumber, date, totalAmount, vatAmount, supplier details, and line items."
          },
          {
            role: "user",
            content: pdfText
          }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      return this.validateInvoiceData(result);
    } catch (error) {
      throw new AppError(500, 'Failed to process invoice with OpenAI');
    }
  }

  private validateInvoiceData(data: any): InvoiceData {
    // Basic validation
    if (!data.invoiceNumber || !data.date || !data.totalAmount) {
      throw new AppError(422, 'Invalid invoice data format');
    }

    return {
      invoiceNumber: data.invoiceNumber,
      date: new Date(data.date),
      totalAmount: Number(data.totalAmount),
      vatAmount: Number(data.vatAmount || 0),
      supplier: data.supplier || {},
      items: data.items || []
    };
  }
}