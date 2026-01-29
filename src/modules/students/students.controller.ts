import { Request, Response } from 'express';
import { StudentsService } from './students.service';
import { successResponse, errorResponse } from '../../utils/response.util';
import {
  createStudentSchema,
  updateStudentSchema,
  enrollStudentSchema,
  updateEnrollmentStatusSchema,
} from './students.validation';

const studentsService = new StudentsService();

export class StudentsController {
  async listStudents(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, search, classId, gradeId, status } = req.query;

      const result = await studentsService.listStudents({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
        classId: classId as string,
        gradeId: gradeId as string,
        status: status as string,
      });

      res.status(200).json({
        success: true,
        data: result.students,
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      errorResponse(res, 'LIST_STUDENTS_ERROR', error.message, 400);
    }
  }

  async getStudentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const student = await studentsService.getStudentById(id);

      successResponse(res, student, 'Student retrieved successfully');
    } catch (error: any) {
      errorResponse(res, 'GET_STUDENT_ERROR', error.message, 404);
    }
  }

  async createStudent(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      // Validate input
      const validatedData = createStudentSchema.parse(req.body);

      // Create student
      const student = await studentsService.createStudent(
        validatedData,
        req.user.userId
      );

      successResponse(res, student, 'Student created successfully', 201);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid input', 422, error.errors);
      } else {
        errorResponse(res, 'CREATE_STUDENT_ERROR', error.message, 400);
      }
    }
  }

  async updateStudent(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const { id } = req.params;

      // Validate input
      const validatedData = updateStudentSchema.parse(req.body);

      // Update student
      const student = await studentsService.updateStudent(
        id,
        validatedData,
        req.user.userId
      );

      successResponse(res, student, 'Student updated successfully');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid input', 422, error.errors);
      } else {
        errorResponse(res, 'UPDATE_STUDENT_ERROR', error.message, 400);
      }
    }
  }

  async deleteStudent(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const { id } = req.params;

      const result = await studentsService.deleteStudent(id, req.user.userId);

      successResponse(res, result, 'Student deleted successfully');
    } catch (error: any) {
      errorResponse(res, 'DELETE_STUDENT_ERROR', error.message, 400);
    }
  }

  async enrollStudent(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const { id } = req.params;

      // Validate input
      const validatedData = enrollStudentSchema.parse(req.body);

      // Enroll student
      const enrollment = await studentsService.enrollStudent(
        id,
        validatedData,
        req.user.userId
      );

      successResponse(res, enrollment, 'Student enrolled successfully', 201);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid input', 422, error.errors);
      } else {
        errorResponse(res, 'ENROLL_STUDENT_ERROR', error.message, 400);
      }
    }
  }

  async getStudentEnrollments(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const enrollments = await studentsService.getStudentEnrollments(id);

      successResponse(res, enrollments, 'Student enrollments retrieved successfully');
    } catch (error: any) {
      errorResponse(res, 'GET_ENROLLMENTS_ERROR', error.message, 400);
    }
  }

  async updateEnrollmentStatus(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const { enrollmentId } = req.params;

      // Validate input
      const validatedData = updateEnrollmentStatusSchema.parse(req.body);

      // Update enrollment status
      const enrollment = await studentsService.updateEnrollmentStatus(
        enrollmentId,
        validatedData.status,
        req.user.userId
      );

      successResponse(res, enrollment, 'Enrollment status updated successfully');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid input', 422, error.errors);
      } else {
        errorResponse(res, 'UPDATE_ENROLLMENT_ERROR', error.message, 400);
      }
    }
  }

  async getStudentScores(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const scores = await studentsService.getStudentScores(id);

      successResponse(res, scores, 'Student scores retrieved successfully');
    } catch (error: any) {
      errorResponse(res, 'GET_SCORES_ERROR', error.message, 400);
    }
  }

  async getStudentTransactions(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const transactions = await studentsService.getStudentTransactions(id);

      successResponse(res, transactions, 'Student transactions retrieved successfully');
    } catch (error: any) {
      errorResponse(res, 'GET_TRANSACTIONS_ERROR', error.message, 400);
    }
  }
}