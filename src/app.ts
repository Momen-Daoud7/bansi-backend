import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import invoiceRoutes from './routes/invoiceRoutes';
import supplierRoutes from './routes/supplierRoutes';
import { errorHandler } from './middleware/errorHandler';
import fs from 'fs';
import path from 'path';

// Add this line with other imports
import authRoutes from './routes/authRoutes';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const port = process.env.PORT || 3001;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Add logging middleware
app.use(morgan('dev'));

// Log all requests
app.use((req, res, next) => {
    console.log('Request:', {
        method: req.method,
        path: req.path,
        body: req.body,
        files: req.files,
        headers: req.headers
    });
    next();
});

app.use(cors({
  origin: 'https://bansi-frontend.vercel.app',
}));

app.use(express.json());
app.use('/api/invoices', invoiceRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/auth', authRoutes);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
