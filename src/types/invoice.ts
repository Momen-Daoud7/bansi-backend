export interface InvoiceData {
    invoiceNumber: string;
    date: Date;
    totalAmount: number;
    vatAmount: number;
    supplier: {
      name: string;
      email?: string;
      phone?: string;
      address?: string;
      trn?: string;
    };
    items: {
      description: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }[];
  }
  
  export type InvoiceStatus = 'pending' | 'processing' | 'ready' | 'completed' | 'failed';