import { Router } from 'express';
import { StudentsController } from './students.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';

const router = Router();
const studentsController = new StudentsController();

// All routes require authentication
router.use(authenticate);

// List students
router.get(
  '/',
  authorize('ADMIN', 'ACCOUNTANT', 'TEACHER'),
  (req, res) => studentsController.listStudents(req, res)
);

// Get student by ID
router.get(
  '/:id',
  authorize('ADMIN', 'ACCOUNTANT', 'TEACHER', 'STUDENT', 'PARENT'),
  (req, res) => studentsController.getStudentById(req, res)
);

// Create student - Only Admin
router.post(
  '/',
  authorize('ADMIN'),
  (req, res) => studentsController.createStudent(req, res)
);

// Update student - Only Admin
router.put(
  '/:id',
  authorize('ADMIN'),
  (req, res) => studentsController.updateStudent(req, res)
);

// Delete student - Only Admin
router.delete(
  '/:id',
  authorize('ADMIN'),
  (req, res) => studentsController.deleteStudent(req, res)
);

// Enroll student in class - Only Admin
router.post(
  '/:id/enrollments',
  authorize('ADMIN'),
  (req, res) => studentsController.enrollStudent(req, res)
);

// Get student enrollments
router.get(
  '/:id/enrollments',
  authorize('ADMIN', 'ACCOUNTANT', 'TEACHER', 'STUDENT', 'PARENT'),
  (req, res) => studentsController.getStudentEnrollments(req, res)
);

// Update enrollment status - Only Admin
router.patch(
  '/enrollments/:enrollmentId/status',
  authorize('ADMIN'),
  (req, res) => studentsController.updateEnrollmentStatus(req, res)
);

// Get student scores
router.get(
  '/:id/scores',
  authorize('ADMIN', 'TEACHER', 'STUDENT', 'PARENT'),
  (req, res) => studentsController.getStudentScores(req, res)
);

// Get student transactions
router.get(
  '/:id/transactions',
  authorize('ADMIN', 'ACCOUNTANT', 'STUDENT', 'PARENT'),
  (req, res) => studentsController.getStudentTransactions(req, res)
);

export default router;