import { Request, Response } from 'express';
import { GradingService } from './grading.service';
import { successResponse, errorResponse } from '../../utils/response.util';
import {
  createScoreSchema,
  updateScoreSchema,
  bulkCreateScoresSchema,
} from './grading.validation';

const gradingService = new GradingService();

export class GradingController {
  async listScores(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, classSubjectId, subjectId, scoreType, page, limit } = req.query;

      const result = await gradingService.listScores({
        studentId: studentId as string,
        classSubjectId: classSubjectId as string,
        subjectId: subjectId as string,
        scoreType: scoreType as any,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.scores,
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      errorResponse(res, 'LIST_SCORES_ERROR', error.message, 400);
    }
  }

  async getScoreById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const score = await gradingService.getScoreById(id);

      successResponse(res, score, 'Score retrieved successfully');
    } catch (error: any) {
      errorResponse(res, 'GET_SCORE_ERROR', error.message, 404);
    }
  }

  async createScore(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const validatedData = createScoreSchema.parse(req.body);

      const score = await gradingService.createScore(validatedData, req.user.userId);

      successResponse(res, score, 'Score created successfully', 201);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid input', 422, error.errors);
      } else {
        errorResponse(res, 'CREATE_SCORE_ERROR', error.message, 400);
      }
    }
  }

  async bulkCreateScores(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const validatedData = bulkCreateScoresSchema.parse(req.body);

      const scores = await gradingService.bulkCreateScores(validatedData, req.user.userId);

      successResponse(
        res,
        { scores, count: scores.length },
        `${scores.length} scores created successfully`,
        201
      );
    } catch (error: any) {
      if (error.name === 'ZodError') {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid input', 422, error.errors);
      } else {
        errorResponse(res, 'BULK_CREATE_SCORES_ERROR', error.message, 400);
      }
    }
  }

  async updateScore(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const { id } = req.params;

      const validatedData = updateScoreSchema.parse(req.body);

      const score = await gradingService.updateScore(id, validatedData, req.user.userId);

      successResponse(res, score, 'Score updated successfully');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid input', 422, error.errors);
      } else {
        errorResponse(res, 'UPDATE_SCORE_ERROR', error.message, 400);
      }
    }
  }

  async deleteScore(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const { id } = req.params;

      const result = await gradingService.deleteScore(id, req.user.userId);

      successResponse(res, result, 'Score deleted successfully');
    } catch (error: any) {
      errorResponse(res, 'DELETE_SCORE_ERROR', error.message, 400);
    }
  }

  async getStudentGrades(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const { semesterId } = req.query;

      const grades = await gradingService.getStudentGrades(
        studentId,
        semesterId as string
      );

      successResponse(res, grades, 'Student grades retrieved successfully');
    } catch (error: any) {
      errorResponse(res, 'GET_STUDENT_GRADES_ERROR', error.message, 400);
    }
  }

  async getClassSubjectScores(req: Request, res: Response): Promise<void> {
    try {
      const { classSubjectId } = req.params;

      const result = await gradingService.getClassSubjectScores(classSubjectId);

      successResponse(res, result, 'Class subject scores retrieved successfully');
    } catch (error: any) {
      errorResponse(res, 'GET_CLASS_SUBJECT_SCORES_ERROR', error.message, 400);
    }
  }
}