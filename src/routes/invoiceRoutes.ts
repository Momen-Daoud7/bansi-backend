import { Router } from 'express';
import { InvoiceController } from '../controllers/invoiceController';
import { InvoiceService } from '../services/invoiceService';
import { upload } from '../middleware/upload';
import { authenticateToken } from '../middleware/auth'; // Import auth middleware
import uploadController from '../controllers/uploadController';

const router = Router();
const invoiceService = new InvoiceService();
const invoiceController = new InvoiceController(invoiceService);

// router.post('/upload', authenticateToken, upload.array('invoices', 5), invoiceController.uploadInvoices);
router.post('/upload', uploadController.upload);
router.post('/process', uploadController.process);
router.get('/status/:id', authenticateToken, invoiceController.getInvoiceStatus);
router.post('/save', authenticateToken, invoiceController.saveInvoice);
router.post('/save-multiple', authenticateToken, invoiceController.saveMultipleInvoices);
router.put('/:id', authenticateToken, invoiceController.updateInvoice);

// New save endpoints

export default router