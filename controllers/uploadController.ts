import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';


const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ... existing multer config ...

const uploadController = {
    // ... existing upload method ...


};

export default uploadController;
