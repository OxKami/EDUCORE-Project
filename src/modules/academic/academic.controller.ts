import { Request, Response } from 'express';
import { AcademicService } from './academic.service';
import { successResponse, errorResponse } from '../../utils/response.util';
import {
  createAcademicYearSchema,
  updateAcademicYearSchema,
  createSemesterSchema,
  updateSemesterSchema,
  createGradeSchema,
  updateGradeSchema,
  createClassSchema,
  updateClassSchema,
  createSubjectSchema,
  updateSubjectSchema,
} from './academic.validation';

const academicService = new AcademicService();

export class AcademicController {
  // ============================================
  // ACADEMIC YEARS
  // ============================================

  async listAcademicYears(req: Request, res: Response): Promise<void> {
    try {
      const academicYears = await academicService.listAcademicYears();
      successResponse(res, academicYears, 'Academic years retrieved successfully');
    } catch (error: any) {
      errorResponse(res, 'LIST_ACADEMIC_YEARS_ERROR', error.message, 400);
    }
  }

  async getAcademicYearById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const academicYear = await academicService.getAcademicYearById(id);
      successResponse(res, academicYear, 'Academic year retrieved successfully');
    } catch (error: any) {
      errorResponse(res, 'GET_ACADEMIC_YEAR_ERROR', error.message, 404);
    }
  }

  async createAcademicYear(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const validatedData = createAcademicYearSchema.parse(req.body);
      const academicYear = await academicService.createAcademicYear(
        validatedData,
        req.user.userId
      );
      successResponse(res, academicYear, 'Academic year created successfully', 201);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid input', 422, error.errors);
      } else {
        errorResponse(res, 'CREATE_ACADEMIC_YEAR_ERROR', error.message, 400);
      }
    }
  }

  async updateAcademicYear(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const { id } = req.params;
      const validatedData = updateAcademicYearSchema.parse(req.body);
      const academicYear = await academicService.updateAcademicYear(
        id,
        validatedData,
        req.user.userId
      );
      successResponse(res, academicYear, 'Academic year updated successfully');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid input', 422, error.errors);
      } else {
        errorResponse(res, 'UPDATE_ACADEMIC_YEAR_ERROR', error.message, 400);
      }
    }
  }

  async deleteAcademicYear(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const { id } = req.params;
      const result = await academicService.deleteAcademicYear(id, req.user.userId);
      successResponse(res, result, 'Academic year deleted successfully');
    } catch (error: any) {
      errorResponse(res, 'DELETE_ACADEMIC_YEAR_ERROR', error.message, 400);
    }
  }

  // ============================================
  // SEMESTERS
  // ============================================

  async listSemesters(req: Request, res: Response): Promise<void> {
    try {
      const { academicYearId } = req.query;
      const semesters = await academicService.listSemesters(academicYearId as string);
      successResponse(res, semesters, 'Semesters retrieved successfully');
    } catch (error: any) {
      errorResponse(res, 'LIST_SEMESTERS_ERROR', error.message, 400);
    }
  }

  async getSemesterById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const semester = await academicService.getSemesterById(id);
      successResponse(res, semester, 'Semester retrieved successfully');
    } catch (error: any) {
      errorResponse(res, 'GET_SEMESTER_ERROR', error.message, 404);
    }
  }

  async createSemester(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const validatedData = createSemesterSchema.parse(req.body);
      const semester = await academicService.createSemester(validatedData, req.user.userId);
      successResponse(res, semester, 'Semester created successfully', 201);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid input', 422, error.errors);
      } else {
        errorResponse(res, 'CREATE_SEMESTER_ERROR', error.message, 400);
      }
    }
  }

  async updateSemester(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const { id } = req.params;
      const validatedData = updateSemesterSchema.parse(req.body);
      const semester = await academicService.updateSemester(id, validatedData, req.user.userId);
      successResponse(res, semester, 'Semester updated successfully');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid input', 422, error.errors);
      } else {
        errorResponse(res, 'UPDATE_SEMESTER_ERROR', error.message, 400);
      }
    }
  }

  async deleteSemester(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const { id } = req.params;
      const result = await academicService.deleteSemester(id, req.user.userId);
      successResponse(res, result, 'Semester deleted successfully');
    } catch (error: any) {
      errorResponse(res, 'DELETE_SEMESTER_ERROR', error.message, 400);
    }
  }

  // ============================================
  // GRADES
  // ============================================

  async listGrades(req: Request, res: Response): Promise<void> {
    try {
      const grades = await academicService.listGrades();
      successResponse(res, grades, 'Grades retrieved successfully');
    } catch (error: any) {
      errorResponse(res, 'LIST_GRADES_ERROR', error.message, 400);
    }
  }

  async getGradeById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const grade = await academicService.getGradeById(id);
      successResponse(res, grade, 'Grade retrieved successfully');
    } catch (error: any) {
      errorResponse(res, 'GET_GRADE_ERROR', error.message, 404);
    }
  }

  async createGrade(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const validatedData = createGradeSchema.parse(req.body);
      const grade = await academicService.createGrade(validatedData, req.user.userId);
      successResponse(res, grade, 'Grade created successfully', 201);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid input', 422, error.errors);
      } else {
        errorResponse(res, 'CREATE_GRADE_ERROR', error.message, 400);
      }
    }
  }

  async updateGrade(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const { id } = req.params;
      const validatedData = updateGradeSchema.parse(req.body);
      const grade = await academicService.updateGrade(id, validatedData, req.user.userId);
      successResponse(res, grade, 'Grade updated successfully');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid input', 422, error.errors);
      } else {
        errorResponse(res, 'UPDATE_GRADE_ERROR', error.message, 400);
      }
    }
  }

  async deleteGrade(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const { id } = req.params;
      const result = await academicService.deleteGrade(id, req.user.userId);
      successResponse(res, result, 'Grade deleted successfully');
    } catch (error: any) {
      errorResponse(res, 'DELETE_GRADE_ERROR', error.message, 400);
    }
  }

  // ============================================
  // CLASSES
  // ============================================

  async listClasses(req: Request, res: Response): Promise<void> {
    try {
      const { gradeId } = req.query;
      const classes = await academicService.listClasses(gradeId as string);
      successResponse(res, classes, 'Classes retrieved successfully');
    } catch (error: any) {
      errorResponse(res, 'LIST_CLASSES_ERROR', error.message, 400);
    }
  }

  async getClassById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const classData = await academicService.getClassById(id);
      successResponse(res, classData, 'Class retrieved successfully');
    } catch (error: any) {
      errorResponse(res, 'GET_CLASS_ERROR', error.message, 404);
    }
  }

  async createClass(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const validatedData = createClassSchema.parse(req.body);
      const classData = await academicService.createClass(validatedData, req.user.userId);
      successResponse(res, classData, 'Class created successfully', 201);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid input', 422, error.errors);
      } else {
        errorResponse(res, 'CREATE_CLASS_ERROR', error.message, 400);
      }
    }
  }

  async updateClass(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const { id } = req.params;
      const validatedData = updateClassSchema.parse(req.body);
      const classData = await academicService.updateClass(id, validatedData, req.user.userId);
      successResponse(res, classData, 'Class updated successfully');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid input', 422, error.errors);
      } else {
        errorResponse(res, 'UPDATE_CLASS_ERROR', error.message, 400);
      }
    }
  }

  async deleteClass(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const { id } = req.params;
      const result = await academicService.deleteClass(id, req.user.userId);
      successResponse(res, result, 'Class deleted successfully');
    } catch (error: any) {
      errorResponse(res, 'DELETE_CLASS_ERROR', error.message, 400);
    }
  }

  // ============================================
  // SUBJECTS
  // ============================================

  async listSubjects(req: Request, res: Response): Promise<void> {
    try {
      const subjects = await academicService.listSubjects();
      successResponse(res, subjects, 'Subjects retrieved successfully');
    } catch (error: any) {
      errorResponse(res, 'LIST_SUBJECTS_ERROR', error.message, 400);
    }
  }

  async getSubjectById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const subject = await academicService.getSubjectById(id);
      successResponse(res, subject, 'Subject retrieved successfully');
    } catch (error: any) {
      errorResponse(res, 'GET_SUBJECT_ERROR', error.message, 404);
    }
  }

  async createSubject(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const validatedData = createSubjectSchema.parse(req.body);
      const subject = await academicService.createSubject(validatedData, req.user.userId);
      successResponse(res, subject, 'Subject created successfully', 201);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid input', 422, error.errors);
      } else {
        errorResponse(res, 'CREATE_SUBJECT_ERROR', error.message, 400);
      }
    }
  }

  async updateSubject(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const { id } = req.params;
      const validatedData = updateSubjectSchema.parse(req.body);
      const subject = await academicService.updateSubject(id, validatedData, req.user.userId);
      successResponse(res, subject, 'Subject updated successfully');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid input', 422, error.errors);
      } else {
        errorResponse(res, 'UPDATE_SUBJECT_ERROR', error.message, 400);
      }
    }
  }

  async deleteSubject(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const { id } = req.params;
      const result = await academicService.deleteSubject(id, req.user.userId);
      successResponse(res, result, 'Subject deleted successfully');
    } catch (error: any) {
      errorResponse(res, 'DELETE_SUBJECT_ERROR', error.message, 400);
    }
  }
}