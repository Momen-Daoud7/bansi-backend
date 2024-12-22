// @ts-nocheck
import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { Settings } from '../config/settings';
import logger from '../utils/logger';
import fetch from 'node-fetch';  // Add this import
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log('Multer destination called for file:', file.originalname);
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const filename = Date.now() + '-' + file.originalname;
        console.log('Multer filename generated:', filename);
        cb(null, filename);
    }
});

const upload = multer({ storage: storage }).array('invoices', 5);

// Helper function to process a single file
async function processFile(file: Express.Multer.File, maxRetries: number = 3): Promise<any> {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            logger.info(`Processing file ${file.filename}, attempt ${attempt + 1}`);
            const text = await extractTextFromPDF(file);
            
            // Process with OpenAI
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${Settings.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
                            content: "You are an AI assistant that extracts structured invoice data from text."
                        },
                        {
                            role: "user",
                            content: `Extract the invoice data from the following text:\n\n${text}`
                        }
                    ],
                    functions: [{
                        name: "extract_invoice_data",
                        description: "Extract structured data from invoice text",
                        parameters: {
                            type: "object",
                            properties: {
                                invoiceNumber: {
                                    type: "string",
                                    description: "The invoice number"
                                },
                                date: {
                                    type: "string",
                                    description: "The invoice date"
                                },
                                totalAmount: {
                                    type: "number",
                                    description: "The total amount of the invoice"
                                },
                                customerName: {
                                    type: "string",
                                    description: "The name of the customer"
                                },
                                items: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            description: {
                                                type: "string",
                                                description: "Description of the item"
                                            },
                                            quantity: {
                                                type: "number",
                                                description: "Quantity of the item"
                                            },
                                            unitPrice: {
                                                type: "number",
                                                description: "Price per unit"
                                            },
                                            amount: {
                                                type: "number",
                                                description: "Total amount for this item"
                                            }
                                        }
                                    }
                                }
                            },
                            required: ["invoiceNumber", "date", "totalAmount"]
                        }
                    }],
                    function_call: { name: "extract_invoice_data" }
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API request failed: ${response.status}`);
            }

            const data = await response.json();
            return {
                filename: file.filename,
                text: text,
                processedData: data
            };

        } catch (error) {
            logger.error(`Error processing file ${file.filename}:`, error);
            attempt++;
            if (attempt === maxRetries) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
    }
}

// Helper function to extract text from PDF
async function extractTextFromPDF(file: Express.Multer.File): Promise<string> {
    try {
        const pdfPath = file.path;
        const pdfData = await fs.readFile(pdfPath);
        
        const loadingTask = pdfjsLib.getDocument({
            data: pdfData,
            useWorkerFetch: false,
            isEvalSupported: false,
            disableFontFace: true
        });

        const pdfDocument = await loadingTask.promise;
        let fullText = '';

        for (let i = 1; i <= pdfDocument.numPages; i++) {
            const page = await pdfDocument.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
            fullText += pageText + '\n';
        }

        return fullText;
    } catch (error) {
        logger.error(`Error extracting text from PDF ${file.filename}:`, error);
        throw error;
    }
}

// Function to process PDFs in batches
async function processPDFInBatches(files: Express.Multer.File[], batchSize: number = 2) {
    const batches = [];
    for (let i = 0; i < files.length; i += batchSize) {
        batches.push(files.slice(i, i + batchSize));
    }

    const processedResults = [];
    for (const batch of batches) {
        const batchPromises = batch.map(file => processFile(file));
        const batchResults = await Promise.all(batchPromises);
        processedResults.push(...batchResults);
    }
    return processedResults;
}

const uploadController = {
    upload: async (req: Request, res: Response) => {
        console.log('Upload endpoint called');
        try {
            upload(req, res, function (err) {
                if (err) {
                    logger.error('Upload error:', err);
                    return res.status(400).json({ error: 'File upload error' });
                }
                
                const files = req.files as Express.Multer.File[];
                console.log('Files uploaded successfully:', files.map(f => f.filename));
                res.status(200).json({ 
                    message: 'Files uploaded successfully',
                    files: files.map(file => ({
                        filename: file.filename,
                        path: file.path
                    }))
                });
            });
        } catch (error) {
            logger.error('Upload error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    process: async (req: Request, res: Response) => {
        try {
            upload(req, res, async function(err) {
                if (err) {
                    logger.error('Upload error:', err);
                    return res.status(400).json({ error: 'File upload error' });
                }

                const files = req.files as Express.Multer.File[];
                logger.info(`Processing ${files.length} files`);

                try {
                    const results = await processPDFInBatches(files, Settings.BATCH_SIZE);
                    res.status(200).json({
                        message: 'Files processed successfully',
                        data: results
                    });
                } catch (error: any) {
                    logger.error('Processing error:', error);
                    res.status(500).json({ 
                        error: 'Processing failed',
                        details: error.message 
                    });
                }
            });
        } catch (error) {
            logger.error('Controller error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    saveInvoice: async (req: Request, res: Response) => {
        try {
            const { filename, updatedData } = req.body;
            // Save to database or update file
            res.status(200).json({ message: 'Invoice updated successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to save invoice' });
        }
    }
};

export default uploadController;
