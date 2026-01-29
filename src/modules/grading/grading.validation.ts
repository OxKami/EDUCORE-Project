import { z } from 'zod';

export const createScoreSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  classSubjectId: z.string().uuid('Invalid class subject ID'),
  subjectId: z.string().uuid('Invalid subject ID'),
  scoreType: z.enum(['HOMEWORK', 'QUIZ', 'MIDTERM', 'FINAL', 'PROJECT', 'PARTICIPATION']),
  score: z.number().min(0, 'Score cannot be negative'),
  maxScore: z.number().positive('Max score must be positive'),
  weight: z.number().min(0).max(1, 'Weight must be between 0 and 1'),
  notes: z.string().optional(),
  dateRecorded: z.string().datetime('Invalid date format').optional(),
});

export const updateScoreSchema = z.object({
  score: z.number().min(0, 'Score cannot be negative').optional(),
  maxScore: z.number().positive('Max score must be positive').optional(),
  weight: z.number().min(0).max(1, 'Weight must be between 0 and 1').optional(),
  notes: z.string().optional(),
});

export const bulkCreateScoresSchema = z.object({
  classSubjectId: z.string().uuid('Invalid class subject ID'),
  subjectId: z.string().uuid('Invalid subject ID'),
  scoreType: z.enum(['HOMEWORK', 'QUIZ', 'MIDTERM', 'FINAL', 'PROJECT', 'PARTICIPATION']),
  maxScore: z.number().positive('Max score must be positive'),
  weight: z.number().min(0).max(1, 'Weight must be between 0 and 1'),
  scores: z.array(z.object({
    studentId: z.string().uuid('Invalid student ID'),
    score: z.number().min(0, 'Score cannot be negative'),
    notes: z.string().optional(),
  })),
  dateRecorded: z.string().datetime('Invalid date format').optional(),
});