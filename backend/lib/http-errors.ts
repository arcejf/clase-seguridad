// Error de aplicación con un statusCode HTTP asociado; el error-handler
// central lo traduce a una respuesta JSON sin que cada controller arme el status a mano.
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Solicitud inválida') {
    super(400, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autenticado') {
    super(401, message);
  }
}

// 403 = autenticado pero no dueño del recurso (distinto de 401); es lo que
// devuelve el chequeo de ownership contra IDOR (ver post.service.ts).
export class ForbiddenError extends AppError {
  constructor(message = 'No tenés permiso para hacer esto') {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'No encontrado') {
    super(404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'El recurso ya existe') {
    super(409, message);
  }
}
