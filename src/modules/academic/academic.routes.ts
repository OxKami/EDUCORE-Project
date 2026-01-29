import { Router } from 'express';
import { AcademicController } from './academic.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';

const router = Router();
const academicController = new AcademicController();

// All routes require authentication
router.use(authenticate);

// ============================================
// ACADEMIC YEARS
// ============================================

router.get(
  '/academic-years',
  authorize('ADMIN', 'ACCOUNTANT', 'TEACHER'),
  (req, res) => academicController.listAcademicYears(req, res)
);

router.get(
  '/academic-years/:id',
  authorize('ADMIN', 'ACCOUNTANT', 'TEACHER'),
  (req, res) => academicController.getAcademicYearById(req, res)
);

router.post(
  '/academic-years',
  authorize('ADMIN'),
  (req, res) => academicController.createAcademicYear(req, res)
);

router.put(
  '/academic-years/:id',
  authorize('ADMIN'),
  (req, res) => academicController.updateAcademicYear(req, res)
);

router.delete(
  '/academic-years/:id',
  authorize('ADMIN'),
  (req, res) => academicController.deleteAcademicYear(req, res)
);

// ============================================
// SEMESTERS
// ============================================

router.get(
  '/semesters',
  authorize('ADMIN', 'ACCOUNTANT', 'TEACHER'),
  (req, res) => academicController.listSemesters(req, res)
);

router.get(
  '/semesters/:id',
  authorize('ADMIN', 'ACCOUNTANT', 'TEACHER'),
  (req, res) => academicController.getSemesterById(req, res)
);

router.post(
  '/semesters',
  authorize('ADMIN'),
  (req, res) => academicController.createSemester(req, res)
);

router.put(
  '/semesters/:id',
  authorize('ADMIN'),
  (req, res) => academicController.updateSemester(req, res)
);

router.delete(
  '/semesters/:id',
  authorize('ADMIN'),
  (req, res) => academicController.deleteSemester(req, res)
);

// ============================================
// GRADES
// ============================================

router.get(
  '/grades',
  authorize('ADMIN', 'ACCOUNTANT', 'TEACHER'),
  (req, res) => academicController.listGrades(req, res)
);

router.get(
  '/grades/:id',
  authorize('ADMIN', 'ACCOUNTANT', 'TEACHER'),
  (req, res) => academicController.getGradeById(req, res)
);

router.post(
  '/grades',
  authorize('ADMIN'),
  (req, res) => academicController.createGrade(req, res)
);

router.put(
  '/grades/:id',
  authorize('ADMIN'),
  (req, res) => academicController.updateGrade(req, res)
);

router.delete(
  '/grades/:id',
  authorize('ADMIN'),
  (req, res) => academicController.deleteGrade(req, res)
);

// ============================================
// CLASSES
// ============================================

router.get(
  '/classes',
  authorize('ADMIN', 'ACCOUNTANT', 'TEACHER'),
  (req, res) => academicController.listClasses(req, res)
);

router.get(
  '/classes/:id',
  authorize('ADMIN', 'ACCOUNTANT', 'TEACHER', 'STUDENT', 'PARENT'),
  (req, res) => academicController.getClassById(req, res)
);

router.post(
  '/classes',
  authorize('ADMIN'),
  (req, res) => academicController.createClass(req, res)
);

router.put(
  '/classes/:id',
  authorize('ADMIN'),
  (req, res) => academicController.updateClass(req, res)
);

router.delete(
  '/classes/:id',
  authorize('ADMIN'),
  (req, res) => academicController.deleteClass(req, res)
);

// ============================================
// SUBJECTS
// ============================================

router.get(
  '/subjects',
  authorize('ADMIN', 'ACCOUNTANT', 'TEACHER'),
  (req, res) => academicController.listSubjects(req, res)
);

router.get(
  '/subjects/:id',
  authorize('ADMIN', 'ACCOUNTANT', 'TEACHER'),
  (req, res) => academicController.getSubjectById(req, res)
);

router.post(
  '/subjects',
  authorize('ADMIN'),
  (req, res) => academicController.createSubject(req, res)
);

router.put(
  '/subjects/:id',
  authorize('ADMIN'),
  (req, res) => academicController.updateSubject(req, res)
);

router.delete(
  '/subjects/:id',
  authorize('ADMIN'),
  (req, res) => academicController.deleteSubject(req, res)
);

export default router;