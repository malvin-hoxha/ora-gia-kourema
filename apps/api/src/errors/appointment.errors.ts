export class AppointmentConflictError extends Error {
  constructor(message = "The selected appointment slot is no longer available") {
    super(message);
    this.name = "AppointmentConflictError";
  }
}

export class AppointmentValidationError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "AppointmentValidationError";
    this.statusCode = statusCode;
  }
}