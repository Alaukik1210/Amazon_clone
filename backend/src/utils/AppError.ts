// Centralized error class so any layer can throw: throw new AppError("Not found", 404)
// The global error middleware reads statusCode to send correct HTTP response
export class AppError extends Error {
  constructor(
    public override message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "AppError";
  }
}
