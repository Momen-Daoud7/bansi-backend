import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import invoiceRoutes from './routes/invoiceRoutes';
import supplierRoutes from './routes/supplierRoutes';
import { errorHandler } from './middleware/errorHandler';
import fs from 'fs';
import path from 'path';
// Add this line with other imports
import authRoutes from './routes/authRoutes';
import morgan from 'morgan';

dotenv.config();

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
  origin: ['http://localhost:3000', 'http://127.0.0.1:5173', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
