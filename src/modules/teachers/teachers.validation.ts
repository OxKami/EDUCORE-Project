import { z } from 'zod';

export const createTeacherSchema = z.object({
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

  // Teacher-specific information
  employeeId: z.string().min(1, 'Employee ID is required'),
  specialization: z.string().optional(),
  qualification: z.string().optional(),
  hireDate: z.string().datetime('Invalid date format'),
  salary: z.number().positive('Salary must be positive').optional(),
});

export const updateTeacherSchema = z.object({
  // User information (optional)
  email: z.string().email('Invalid email address').optional(),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  phoneNumber: z.string().optional(),

  // Teacher information (optional)
  specialization: z.string().optional(),
  qualification: z.string().optional(),
  salary: z.number().positive('Salary must be positive').optional(),
});

export const assignSubjectSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  subjectId: z.string().uuid('Invalid subject ID'),
  semesterId: z.string().uuid('Invalid semester ID'),
});