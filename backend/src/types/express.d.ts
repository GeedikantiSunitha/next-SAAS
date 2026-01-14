/**
 * Express Request type augmentation
 * Extends Express Request interface to include user property
 */

import { User as PrismaUser } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string | null;
        role: string;
      };
    }
  }
}

export {};
