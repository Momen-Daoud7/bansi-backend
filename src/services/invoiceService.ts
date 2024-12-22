import { PrismaClient } from '@prisma/client';
import { OpenAIService } from './openaiService';
import { PDFService } from './pdfService';
import { InvoiceData } from '../types/invoice';
import { AppError } from '../middleware/errorHandler';
import multer from 'multer';
import path from 'path';

export class InvoiceService {
  private prisma: PrismaClient;
  private openaiService: OpenAIService;
  private pdfService: PDFService;
  private uploadDir: string;

  constructor() {
    this.prisma = new PrismaClient();
    this.openaiService = new OpenAIService();
    this.pdfService = new PDFService();
    this.uploadDir = path.join(__dirname, '../../uploads');
  }

  async processInvoices(files: Express.Multer.File[], userId: string) {
    const results = [];
    
    // Process files concurrently
    const processPromises = files.map(async (file) => {
      const invoice = await this.prisma.invoice.create({
        data: {
          fileName: file.filename,
          status: 'pending',
          user: { connect: { id: userId } }
        }
      });

      try {
        const pdfText = await this.pdfService.extractText(file.path);
        const processedData = await this.openaiService.processInvoice(pdfText);
        await this.updateInvoiceWithData(invoice.id, processedData);
        return { id: invoice.id, status: 'completed', data: processedData };
      } catch (error) {
        await this.prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: 'failed' }
        });
        return { id: invoice.id, status: 'failed' };
      }
    });

    const processedResults = await Promise.all(processPromises);
    return processedResults;
  }

  async getStatus(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id }
    });

    if (!invoice) {
      throw new AppError(404, 'Invoice not found');
    }

    return invoice;
  }

  async updateInvoice(id: string, processedData: any) {
    return await this.prisma.invoice.update({
      where: { id },
      data: {
          status: 'completed',
          invoiceNumber: processedData.invoice.invoice_number,
          date: processedData.invoice.date,
          type: processedData.invoice.type,
          totalAmount: processedData.invoice.total_amount,
          vatAmount: processedData.invoice.vat_amount,
          supplier: {
            connectOrCreate: {
              where: { name: processedData.supplier.name },
              create: {
                name: processedData.supplier.name,
                email: processedData.supplier.email,
                phone: processedData.supplier.phone,
                address: processedData.supplier.address,
                trn: processedData.supplier.trn
              }
            }
          },
          customer: {
            create: {
              name: processedData.customer.name,
              email: processedData.customer.email,
              phone: processedData.customer.phone,
              address: processedData.customer.address
            }
          },
          items: {
            create: processedData.items.map((item: any) => ({
              itemName: item.item_name,
              itemCode: item.item_code,
              description: item.description || '',
              quantity: item.quantity,
              unitPrice: item.unit_price,
              totalPrice: item.total_price
            }))
          }
        }
    });
  }

  async saveFile(file: Express.Multer.File, invoiceId: string) {
    try {
      // return await this.prisma.invoiceFile.create({
      //   data: {
      //     fileName: file.filename,
      //     originalName: file.originalname,
      //     mimeType: file.mimetype,
      //     size: file.size,
      //     path: file.path,
      //     invoiceId: invoiceId
      //   }
      // });
      return "Hello";
    } catch (error) {
      throw new Error('Failed to save file metadata');
    }
  }

  private async updateInvoiceWithData(id: string, processedData: any) {
    try {
      return await this.prisma.invoice.update({
        where: { id },
        data: {
          status: 'completed',
          invoiceNumber: processedData.invoice.invoice_number,
          date: processedData.invoice.date,
          type: processedData.invoice.type,
          totalAmount: processedData.invoice.total_amount,
          vatAmount: processedData.invoice.vat_amount,
          supplier: {
            connectOrCreate: {
              where: { name: processedData.supplier.name },
              create: {
                name: processedData.supplier.name,
                email: processedData.supplier.email,
                phone: processedData.supplier.phone,
                address: processedData.supplier.address,
                trn: processedData.supplier.trn
              }
            }
          },
          customer: {
            create: {
              name: processedData.customer.name,
              email: processedData.customer.email,
              phone: processedData.customer.phone,
              address: processedData.customer.address
            }
          },
          items: {
            create: processedData.items.map((item: any) => ({
              itemName: item.item_name,
              itemCode: item.item_code,
              description: item.description || '',
              quantity: item.quantity,
              unitPrice: item.unit_price,
              totalPrice: item.total_price
            }))
          }
        }
      });
    } catch (error) {
      console.error('Error updating invoice with data:', error);
      throw new AppError(500, 'Failed to update invoice with processed data');
    }
  }

  async saveInvoice(invoiceData: any) {
    try {
        console.log('Service received data:', invoiceData);

        const userExists = await this.prisma.user.findUnique({
            where: { id: invoiceData.userId }
        });

        if (!userExists) {
            throw new AppError(404, 'User not found');
        }

        const savedInvoice = await this.prisma.invoice.create({
            data: {
                invoiceNumber: invoiceData.invoiceNumber,
                date: new Date(invoiceData.date),
                type: invoiceData.type,
                totalAmount: invoiceData.totalAmount,
                vatAmount: invoiceData.vatAmount,
                customer: {
                    create: {
                        name: invoiceData.customerName,
                        email: invoiceData.customerEmail,
                        phone: invoiceData.customerPhone,
                        address: invoiceData.customerAddress
                    }
                },
                status: invoiceData.status,
                fileName: invoiceData.originalFilename,
                user: {
                    connect: {
                        id: invoiceData.userId
                    }
                },
                items: {
                    create: invoiceData.items.map((item: any) => ({
                        itemName: item.itemName,
                        itemCode: item.itemCode || '',
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.totalPrice
                    }))
                }
            },
            include: {
                items: true,
                customer: true,
                supplier: true
            }
        });

        console.log('Invoice saved successfully:', savedInvoice);
        return savedInvoice;
    } catch (error) {
        console.error('Error saving invoice:', error);
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError(500, 'Failed to save invoice');
    }
  }

  async saveMultipleInvoices(invoicesData: any[]) {
    try {
      const savedInvoices = await this.prisma.$transaction(
        invoicesData.map(invoiceData => 
          this.prisma.invoice.create({
            data: {
              invoiceNumber: invoiceData.invoiceNumber,
              date: new Date(invoiceData.date),
              type: invoiceData.type || 'standard',
              totalAmount: invoiceData.totalAmount,
              vatAmount: invoiceData.vatAmount,
              supplier: {
                connectOrCreate: {
                  where: { name: invoiceData.supplierName },
                  create: {
                    name: invoiceData.supplierName,
                    email: invoiceData.supplierEmail,
                    phone: invoiceData.supplierPhone,
                    address: invoiceData.supplierAddress
                  }
                }
              },
              customer: {
                create: {
                  name: invoiceData.customerName,
                  email: invoiceData.customerEmail,
                  phone: invoiceData.customerPhone,
                  address: invoiceData.customerAddress
                }
              },
              status: 'saved',
              user: { connect: { id: invoiceData.userId } },
              items: {
                create: invoiceData.items.map((item: any) => ({
                  itemName: item.itemName,
                  itemCode: item.itemCode || '',
                  description: item.description || '',
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  totalPrice: item.totalPrice
                }))
              }
            },
            include: {
              items: true,
              customer: true,
              supplier: true
            }
          })
        )
      );

      return savedInvoices;
    } catch (error) {
      console.error('Error saving multiple invoices:', error);
      throw new AppError(500, 'Failed to save multiple invoices');
    }
  }
}
