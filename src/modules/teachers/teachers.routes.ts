import { Router } from 'express';
import { TeachersController } from './teachers.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';

const router = Router();
const teachersController = new TeachersController();

// All routes require authentication
router.use(authenticate);

// List teachers - Admin and Accountant can view
router.get(
  '/',
  authorize('ADMIN', 'ACCOUNTANT'),
  (req, res) => teachersController.listTeachers(req, res)
);

// Get teacher by ID
router.get(
  '/:id',
  authorize('ADMIN', 'ACCOUNTANT', 'TEACHER'),
  (req, res) => teachersController.getTeacherById(req, res)
);

// Create teacher - Only Admin
router.post(
  '/',
  authorize('ADMIN'),
  (req, res) => teachersController.createTeacher(req, res)
);

// Update teacher - Only Admin
router.put(
  '/:id',
  authorize('ADMIN'),
  (req, res) => teachersController.updateTeacher(req, res)
);

// Delete teacher - Only Admin
router.delete(
  '/:id',
  authorize('ADMIN'),
  (req, res) => teachersController.deleteTeacher(req, res)
);

// Assign subject to teacher - Only Admin
router.post(
  '/:id/subjects',
  authorize('ADMIN'),
  (req, res) => teachersController.assignSubject(req, res)
);

// Get teacher's subjects
router.get(
  '/:id/subjects',
  authorize('ADMIN', 'ACCOUNTANT', 'TEACHER'),
  (req, res) => teachersController.getTeacherSubjects(req, res)
);

// Remove subject assignment - Only Admin
router.delete(
  '/assignments/:assignmentId',
  authorize('ADMIN'),
  (req, res) => teachersController.removeSubjectAssignment(req, res)
);

export default router;