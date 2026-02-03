import prisma from '../../config/database';
import { DocumentType, DocumentAccessLevel } from '@prisma/client';
import fs from 'fs';
import path from 'path';

interface UploadDocumentInput {
  title: string;
  description?: string;
  type: DocumentType;
  accessLevel: DocumentAccessLevel;
  tags?: string[];
  expiryDate?: string;
  file: {
    filename: string;
    originalname: string;
    path: string;
    size: number;
    mimetype: string;
  };
}

interface UpdateDocumentInput {
  title?: string;
  description?: string;
  type?: DocumentType;
  accessLevel?: DocumentAccessLevel;
  tags?: string[];
  expiryDate?: string;
}

interface ListDocumentsQuery {
  type?: DocumentType;
  accessLevel?: DocumentAccessLevel;
  search?: string;
  tags?: string;
  uploadedById?: string;
  page?: number;
  limit?: number;
}

export class DocumentsService {
  async listDocuments(query: ListDocumentsQuery) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.type) {
      where.type = query.type;
    }

    if (query.accessLevel) {
      where.accessLevel = query.accessLevel;
    }

    if (query.uploadedById) {
      where.uploadedById = query.uploadedById;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { fileName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.tags) {
      where.tags = {
        hasSome: query.tags.split(',').map(tag => tag.trim()),
      };
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take: limit,
        include: {
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { uploadedAt: 'desc' },
      }),
      prisma.document.count({ where }),
    ]);

    return {
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDocumentById(documentId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    return document;
  }

  async uploadDocument(input: UploadDocumentInput, uploadedById: string) {
    const document = await prisma.document.create({
      data: {
        title: input.title,
        description: input.description,
        type: input.type,
        accessLevel: input.accessLevel,
        fileName: input.file.originalname,
        filePath: input.file.path,
        fileSize: input.file.size,
        mimeType: input.file.mimetype,
        tags: input.tags || [],
        expiryDate: input.expiryDate ? new Date(input.expiryDate) : undefined,
        uploadedById,
      },
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: uploadedById,
        action: 'CREATE',
        entityType: 'Document',
        entityId: document.id,
        details: {
          title: input.title,
          type: input.type,
          fileName: input.file.originalname,
        },
      },
    });

    return document;
  }

  async updateDocument(documentId: string, input: UpdateDocumentInput, updatedById: string) {
    const existing = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!existing) {
      throw new Error('Document not found');
    }

    const document = await prisma.document.update({
      where: { id: documentId },
      data: {
        title: input.title,
        description: input.description,
        type: input.type,
        accessLevel: input.accessLevel,
        tags: input.tags,
        expiryDate: input.expiryDate ? new Date(input.expiryDate) : undefined,
      },
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: updatedById,
        action: 'UPDATE',
        entityType: 'Document',
        entityId: documentId,
        details: JSON.parse(JSON.stringify({ updates: input })),
      },
    });

    return document;
  }

  async deleteDocument(documentId: string, deletedById: string) {
    const existing = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!existing) {
      throw new Error('Document not found');
    }

    // Delete physical file
    try {
      if (fs.existsSync(existing.filePath)) {
        fs.unlinkSync(existing.filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    // Delete from database
    await prisma.document.delete({
      where: { id: documentId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: deletedById,
        action: 'DELETE',
        entityType: 'Document',
        entityId: documentId,
        details: { fileName: existing.fileName },
      },
    });

    return { message: 'Document deleted successfully' };
  }

  async downloadDocument(documentId: string, userId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Check if file exists
    if (!fs.existsSync(document.filePath)) {
      throw new Error('File not found on server');
    }

    // Create audit log for download
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'READ',
        entityType: 'Document',
        entityId: documentId,
        details: { action: 'download', fileName: document.fileName },
      },
    });

    return document;
  }

  async getDocumentTypes() {
    const types = await prisma.document.groupBy({
      by: ['type'],
      _count: true,
    });

    return types;
  }

  async getDocumentTags() {
    const documents = await prisma.document.findMany({
      select: { tags: true },
    });

    const allTags = documents.flatMap(doc => doc.tags);
    const uniqueTags = [...new Set(allTags)];

    return uniqueTags;
  }

  async searchDocuments(query: string) {
    const documents = await prisma.document.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { fileName: { contains: query, mode: 'insensitive' } },
          { tags: { hasSome: [query] } },
        ],
      },
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      take: 50,
      orderBy: { uploadedAt: 'desc' },
    });

    return documents;
  }

  async getRecentDocuments(userId: string, limit: number = 10) {
    const documents = await prisma.document.findMany({
      where: { uploadedById: userId },
      take: limit,
      orderBy: { uploadedAt: 'desc' },
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return documents;
  }
}