import { Request, Response, NextFunction } from 'express';
import { InvoiceService } from '../services/invoiceService';
import { AppError } from '../utils/appError';
import { PrismaClient } from '@prisma/client';
// Update interface to match the user object from auth middleware
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role?: string;
    };
}

export class InvoiceController {
  private prisma: PrismaClient;

  constructor(private invoiceService: InvoiceService) {
    this.prisma = new PrismaClient();
  }

  uploadInvoices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('Request headers:', req.headers);
      console.log('Files received:', req.files?.length);
      const files = req.files as Express.Multer.File[];
    
      if (!files || files.length === 0) {
        throw new AppError(400, 'No files uploaded');
      }
  
      // Assuming you have the user ID in the request object after authentication
      console.log('User from request:', req.user);
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(401, 'User not authenticated');
      }
      
      console.log('Processing files for user:', userId);
      const results = await this.invoiceService.processInvoices(files,userId);
      res.status(200).json(results);
    } catch (error) {
      console.error('Upload error:', error);
      next(error);
    }
  };

  getInvoiceStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const status = await this.invoiceService.getStatus(id);
      res.status(200).json(status);
    } catch (error) {
      next(error);
    }
  };

  updateInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const updated = await this.invoiceService.updateInvoice(id, data);
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  };

  saveInvoice = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'User not authenticated');
      }

      const { 
        extractedData, 
        supplierInfo,
        customerId
      } = req.body;

      const savedInvoice = await this.invoiceService.saveInvoice({
        extractedData,
        supplierInfo,
        customerId,
        userId: req.user.id
      });

      res.status(201).json({
        status: 'success',
        data: { invoice: savedInvoice }
      });
    } catch (error) {
      next(error);
    }
  };

  saveMultipleInvoices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(401, 'User not authenticated');
      }

      const invoices = req.body;
      if (!Array.isArray(invoices) || invoices.length === 0) {
        throw new AppError(400, 'No invoices provided or invalid format');
      }

      // Add userId and timestamps to each invoice
      const dataToSave = invoices.map(invoice => ({
        ...invoice,
        userId,
        status: 'saved',
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const savedInvoices = await this.invoiceService.saveMultipleInvoices(dataToSave);
      
      res.status(201).json({
        message: 'Invoices saved successfully',
        invoices: savedInvoices
      });
    } catch (error) {
      console.error('Save multiple invoices error:', error);
      next(error);
    }
  };
}
