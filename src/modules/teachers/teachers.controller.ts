import { Request, Response } from 'express';
import { TeachersService } from './teachers.service';
import { successResponse, errorResponse } from '../../utils/response.util';
import {
  createTeacherSchema,
  updateTeacherSchema,
  assignSubjectSchema,
} from './teachers.validation';

const teachersService = new TeachersService();

export class TeachersController {
  async listTeachers(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, search, specialization } = req.query;

      const result = await teachersService.listTeachers({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
        specialization: specialization as string,
      });

      res.status(200).json({
        success: true,
        data: result.teachers,
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      errorResponse(res, 'LIST_TEACHERS_ERROR', error.message, 400);
    }
  }

  async getTeacherById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const teacher = await teachersService.getTeacherById(id);

      successResponse(res, teacher, 'Teacher retrieved successfully');
    } catch (error: any) {
      errorResponse(res, 'GET_TEACHER_ERROR', error.message, 404);
    }
  }

  async createTeacher(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      // Validate input
      const validatedData = createTeacherSchema.parse(req.body);

      // Create teacher
      const teacher = await teachersService.createTeacher(
        validatedData,
        req.user.userId
      );

      successResponse(res, teacher, 'Teacher created successfully', 201);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid input', 422, error.errors);
      } else {
        errorResponse(res, 'CREATE_TEACHER_ERROR', error.message, 400);
      }
    }
  }

  async updateTeacher(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const { id } = req.params;

      // Validate input
      const validatedData = updateTeacherSchema.parse(req.body);

      // Update teacher
      const teacher = await teachersService.updateTeacher(
        id,
        validatedData,
        req.user.userId
      );

      successResponse(res, teacher, 'Teacher updated successfully');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid input', 422, error.errors);
      } else {
        errorResponse(res, 'UPDATE_TEACHER_ERROR', error.message, 400);
      }
    }
  }

  async deleteTeacher(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const { id } = req.params;

      const result = await teachersService.deleteTeacher(id, req.user.userId);

      successResponse(res, result, 'Teacher deleted successfully');
    } catch (error: any) {
      errorResponse(res, 'DELETE_TEACHER_ERROR', error.message, 400);
    }
  }

  async assignSubject(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const { id } = req.params;

      // Validate input
      const validatedData = assignSubjectSchema.parse(req.body);

      // Assign subject
      const assignment = await teachersService.assignSubject(
        id,
        validatedData,
        req.user.userId
      );

      successResponse(res, assignment, 'Subject assigned successfully', 201);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid input', 422, error.errors);
      } else {
        errorResponse(res, 'ASSIGN_SUBJECT_ERROR', error.message, 400);
      }
    }
  }

  async getTeacherSubjects(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const subjects = await teachersService.getTeacherSubjects(id);

      successResponse(res, subjects, 'Teacher subjects retrieved successfully');
    } catch (error: any) {
      errorResponse(res, 'GET_SUBJECTS_ERROR', error.message, 400);
    }
  }

  async removeSubjectAssignment(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const { assignmentId } = req.params;

      const result = await teachersService.removeSubjectAssignment(
        assignmentId,
        req.user.userId
      );

      successResponse(res, result, 'Subject assignment removed successfully');
    } catch (error: any) {
      errorResponse(res, 'REMOVE_ASSIGNMENT_ERROR', error.message, 400);
    }
  }
}