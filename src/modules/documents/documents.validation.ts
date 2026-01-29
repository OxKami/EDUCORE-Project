import { z } from 'zod';

export const uploadDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum([
    'POLICY',
    'REPORT',
    'LETTER',
    'CERTIFICATE',
    'FORM',
    'CURRICULUM',
    'TEACHING_MATERIAL',
    'STUDENT_RECORD',
    'OTHER',
  ]),
  accessLevel: z.enum(['PUBLIC', 'INTERNAL', 'RESTRICTED', 'CONFIDENTIAL']).default('INTERNAL'),
  tags: z.array(z.string()).optional(),
  expiryDate: z.string().datetime('Invalid date format').optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  type: z.enum([
    'POLICY',
    'REPORT',
    'LETTER',
    'CERTIFICATE',
    'FORM',
    'CURRICULUM',
    'TEACHING_MATERIAL',
    'STUDENT_RECORD',
    'OTHER',
  ]).optional(),
  accessLevel: z.enum(['PUBLIC', 'INTERNAL', 'RESTRICTED', 'CONFIDENTIAL']).optional(),
  tags: z.array(z.string()).optional(),
  expiryDate: z.string().datetime('Invalid date format').optional(),
});