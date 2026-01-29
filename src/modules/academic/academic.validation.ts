import { z } from 'zod';

// Academic Year Schemas
export const createAcademicYearSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  startDate: z.string().datetime('Invalid date format'),
  endDate: z.string().datetime('Invalid date format'),
  isCurrent: z.boolean().optional(),
});

export const updateAcademicYearSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  startDate: z.string().datetime('Invalid date format').optional(),
  endDate: z.string().datetime('Invalid date format').optional(),
  isCurrent: z.boolean().optional(),
});

// Semester Schemas
export const createSemesterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  academicYearId: z.string().uuid('Invalid academic year ID'),
  startDate: z.string().datetime('Invalid date format'),
  endDate: z.string().datetime('Invalid date format'),
});

export const updateSemesterSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  startDate: z.string().datetime('Invalid date format').optional(),
  endDate: z.string().datetime('Invalid date format').optional(),
});

// Grade Schemas
export const createGradeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  level: z.number().int().positive('Level must be a positive integer'),
  description: z.string().optional(),
});

export const updateGradeSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  level: z.number().int().positive('Level must be a positive integer').optional(),
  description: z.string().optional(),
});

// Class Schemas
export const createClassSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  gradeId: z.string().uuid('Invalid grade ID'),
  capacity: z.number().int().positive('Capacity must be a positive integer').optional(),
  room: z.string().optional(),
});

export const updateClassSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  capacity: z.number().int().positive('Capacity must be a positive integer').optional(),
  room: z.string().optional(),
});

// Subject Schemas
export const createSubjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required').toUpperCase(),
  description: z.string().optional(),
  credits: z.number().int().positive('Credits must be a positive integer').optional(),
});

export const updateSubjectSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  credits: z.number().int().positive('Credits must be a positive integer').optional(),
});