import { Request, Response } from 'express';
import { DocumentsService } from './documents.service';
import { successResponse, errorResponse } from '../../utils/response.util';
import { uploadDocumentSchema, updateDocumentSchema } from './documents.validation';
import path from 'path';

const documentsService = new DocumentsService();

export class DocumentsController {
  async listDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { type, accessLevel, search, tags, uploadedById, page, limit } = req.query;

      const result = await documentsService.listDocuments({
        type: type as any,
        accessLevel: accessLevel as any,
        search: search as string,
        tags: tags as string,
        uploadedById: uploadedById as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.documents,
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      errorResponse(res, 'LIST_DOCUMENTS_ERROR', error.message, 400);
    }
  }

  async getDocumentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const document = await documentsService.getDocumentById(id);

      successResponse(res, document, 'Document retrieved successfully');
    } catch (error: any) {
      errorResponse(res, 'GET_DOCUMENT_ERROR', error.message, 404);
    }
  }

  async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      if (!req.file) {
        errorResponse(res, 'UPLOAD_ERROR', 'No file uploaded', 400);
        return;
      }

      // Parse tags if sent as JSON string
      let parsedBody = { ...req.body };
      if (req.body.tags && typeof req.body.tags === 'string') {
        try {
          parsedBody.tags = JSON.parse(req.body.tags);
        } catch (e) {
          parsedBody.tags = req.body.tags.split(',').map((tag: string) => tag.trim());
        }
      }

      const validatedData = uploadDocumentSchema.parse(parsedBody);

      const document = await documentsService.uploadDocument(
        {
          ...validatedData,
          file: {
            filename: req.file.filename,
            originalname: req.file.originalname,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype,
          },
        },
        req.user.userId
      );

      successResponse(res, document, 'Document uploaded successfully', 201);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid input', 422, error.errors);
      } else {
        errorResponse(res, 'UPLOAD_DOCUMENT_ERROR', error.message, 400);
      }
    }
  }

  async updateDocument(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const { id } = req.params;

      // Parse tags if sent as JSON string
      let parsedBody = { ...req.body };
      if (req.body.tags && typeof req.body.tags === 'string') {
        try {
          parsedBody.tags = JSON.parse(req.body.tags);
        } catch (e) {
          parsedBody.tags = req.body.tags.split(',').map((tag: string) => tag.trim());
        }
      }

      const validatedData = updateDocumentSchema.parse(parsedBody);

      const document = await documentsService.updateDocument(
        id,
        validatedData,
        req.user.userId
      );

      successResponse(res, document, 'Document updated successfully');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid input', 422, error.errors);
      } else {
        errorResponse(res, 'UPDATE_DOCUMENT_ERROR', error.message, 400);
      }
    }
  }

  async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const { id } = req.params;

      const result = await documentsService.deleteDocument(id, req.user.userId);

      successResponse(res, result, 'Document deleted successfully');
    } catch (error: any) {
      errorResponse(res, 'DELETE_DOCUMENT_ERROR', error.message, 400);
    }
  }

  async downloadDocument(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const { id } = req.params;

      const document = await documentsService.downloadDocument(id, req.user.userId);

      // Send file
      res.download(document.filePath, document.fileName, (err) => {
        if (err) {
          console.error('Download error:', err);
          errorResponse(res, 'DOWNLOAD_ERROR', 'Error downloading file', 500);
        }
      });
    } catch (error: any) {
      errorResponse(res, 'DOWNLOAD_DOCUMENT_ERROR', error.message, 400);
    }
  }

  async getDocumentTypes(req: Request, res: Response): Promise<void> {
    try {
      const types = await documentsService.getDocumentTypes();

      successResponse(res, types, 'Document types retrieved successfully');
    } catch (error: any) {
      errorResponse(res, 'GET_TYPES_ERROR', error.message, 400);
    }
  }

  async getDocumentTags(req: Request, res: Response): Promise<void> {
    try {
      const tags = await documentsService.getDocumentTags();

      successResponse(res, tags, 'Document tags retrieved successfully');
    } catch (error: any) {
      errorResponse(res, 'GET_TAGS_ERROR', error.message, 400);
    }
  }

  async searchDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        errorResponse(res, 'SEARCH_ERROR', 'Search query is required', 400);
        return;
      }

      const documents = await documentsService.searchDocuments(q);

      successResponse(res, documents, 'Search results retrieved successfully');
    } catch (error: any) {
      errorResponse(res, 'SEARCH_DOCUMENTS_ERROR', error.message, 400);
    }
  }

  async getRecentDocuments(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const { limit } = req.query;

      const documents = await documentsService.getRecentDocuments(
        req.user.userId,
        limit ? parseInt(limit as string) : undefined
      );

      successResponse(res, documents, 'Recent documents retrieved successfully');
    } catch (error: any) {
      errorResponse(res, 'GET_RECENT_DOCUMENTS_ERROR', error.message, 400);
    }
  }
}