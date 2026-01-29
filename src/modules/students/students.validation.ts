import { z } from 'zod';

export const createStudentSchema = z.object({
  // User information
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase, lowercase, and number'
    ),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneNumber: z.string().optional(),

  // Student-specific information
  studentId: z.string().min(1, 'Student ID is required'),
  dateOfBirth: z.string().datetime('Invalid date format'),
  gender: z.enum(['Male', 'Female', 'Other']),
  address: z.string().optional(),
  enrollmentDate: z.string().datetime('Invalid date format').optional(),
});

export const updateStudentSchema = z.object({
  // User information (optional)
  email: z.string().email('Invalid email address').optional(),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  phoneNumber: z.string().optional(),

  // Student information (optional)
  dateOfBirth: z.string().datetime('Invalid date format').optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  address: z.string().optional(),
});

export const enrollStudentSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  academicYearId: z.string().uuid('Invalid academic year ID'),
  enrollmentDate: z.string().datetime('Invalid date format').optional(),
});

export const updateEnrollmentStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'COMPLETED', 'WITHDRAWN']),
});