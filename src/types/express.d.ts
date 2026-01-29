
i// Extend Express Request type to include user info
declare namespace Express {
  export interface Request {
    user?: {
      userId: string;
      email: string;
      role: string;
    };
  }
}