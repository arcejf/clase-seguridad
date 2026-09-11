// Error tipado para distinguir "el backend respondió con un error HTTP"
// de un error de red (sin conexión, CORS bloqueando la respuesta, etc).
// Los componentes usan `error.status` para decidir qué mostrar (401 →
// "iniciá sesión", 403 → "no tenés permiso", 429 → "esperá un poco").
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
