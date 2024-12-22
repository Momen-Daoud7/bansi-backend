import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getSuppliers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const suppliers = await prisma.supplier.findMany({
            orderBy: {
                name: 'asc'
            }
        });

        res.status(200).json({
            status: 'success',
            suppliers
        });
    } catch (error) {
        next(error);
    }
};
