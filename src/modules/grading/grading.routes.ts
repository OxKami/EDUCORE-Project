import { Router } from 'express';
import { GradingController } from './grading.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';

const router = Router();
const gradingController = new GradingController();

// All routes require authentication
router.use(authenticate);

// List scores with filters
router.get(
  '/scores',
  authorize('ADMIN', 'TEACHER'),
  (req, res) => gradingController.listScores(req, res)
);

// Get score by ID
router.get(
  '/scores/:id',
  authorize('ADMIN', 'TEACHER'),
  (req, res) => gradingController.getScoreById(req, res)
);

// Create single score - Admin and Teacher
router.post(
  '/scores',
  authorize('ADMIN', 'TEACHER'),
  (req, res) => gradingController.createScore(req, res)
);

// Bulk create scores - Admin and Teacher
router.post(
  '/scores/bulk',
  authorize('ADMIN', 'TEACHER'),
  (req, res) => gradingController.bulkCreateScores(req, res)
);

// Update score - Admin and Teacher
router.put(
  '/scores/:id',
  authorize('ADMIN', 'TEACHER'),
  (req, res) => gradingController.updateScore(req, res)
);

// Delete score - Admin and Teacher
router.delete(
  '/scores/:id',
  authorize('ADMIN', 'TEACHER'),
  (req, res) => gradingController.deleteScore(req, res)
);

// Get student grades/report card
router.get(
  '/students/:studentId/grades',
  authorize('ADMIN', 'TEACHER', 'STUDENT', 'PARENT'),
  (req, res) => gradingController.getStudentGrades(req, res)
);

// Get all scores for a class-subject (teacher's grade book)
router.get(
  '/class-subjects/:classSubjectId/scores',
  authorize('ADMIN', 'TEACHER'),
  (req, res) => gradingController.getClassSubjectScores(req, res)
);

export default router;