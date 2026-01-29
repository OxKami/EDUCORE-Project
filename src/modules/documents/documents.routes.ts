import { Router } from 'express';
import { DocumentsController } from './documents.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { upload } from '../../middleware/upload.middleware';

const router = Router();
const documentsController = new DocumentsController();

// All routes require authentication
router.use(authenticate);

// List documents
router.get(
  '/',
  authorize('ADMIN', 'ACCOUNTANT', 'TEACHER'),
  (req, res) => documentsController.listDocuments(req, res)
);

// Search documents
router.get(
  '/search',
  authorize('ADMIN', 'ACCOUNTANT', 'TEACHER'),
  (req, res) => documentsController.searchDocuments(req, res)
);

// Get document types
router.get(
  '/types',
  authorize('ADMIN', 'ACCOUNTANT', 'TEACHER'),
  (req, res) => documentsController.getDocumentTypes(req, res)
);

// Get document tags
router.get(
  '/tags',
  authorize('ADMIN', 'ACCOUNTANT', 'TEACHER'),
  (req, res) => documentsController.getDocumentTags(req, res)
);

// Get recent documents
router.get(
  '/recent',
  authorize('ADMIN', 'ACCOUNTANT', 'TEACHER'),
  (req, res) => documentsController.getRecentDocuments(req, res)
);

// Get document by ID
router.get(
  '/:id',
  authorize('ADMIN', 'ACCOUNTANT', 'TEACHER'),
  (req, res) => documentsController.getDocumentById(req, res)
);

// Upload document
router.post(
  '/',
  authorize('ADMIN', 'ACCOUNTANT', 'TEACHER'),
  upload.single('file'),
  (req, res) => documentsController.uploadDocument(req, res)
);

// Update document metadata
router.put(
  '/:id',
  authorize('ADMIN', 'ACCOUNTANT', 'TEACHER'),
  (req, res) => documentsController.updateDocument(req, res)
);

// Delete document
router.delete(
  '/:id',
  authorize('ADMIN', 'ACCOUNTANT'),
  (req, res) => documentsController.deleteDocument(req, res)
);

// Download document
router.get(
  '/:id/download',
  authorize('ADMIN', 'ACCOUNTANT', 'TEACHER', 'STUDENT', 'PARENT'),
  (req, res) => documentsController.downloadDocument(req, res)
);

export default router;