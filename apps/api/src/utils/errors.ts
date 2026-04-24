export class AppError extends Error {
  public statusCode: number;
  public code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    if (code) {
      this.code = code;
    }
    Error.captureStackTrace(this, this.constructor);
  }
}
