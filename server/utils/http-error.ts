export class HttpError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export function getErrorStatus(error: unknown, fallbackStatus = 400) {
  if (error instanceof HttpError) {
    return error.status;
  }

  return fallbackStatus;
}

export function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}
