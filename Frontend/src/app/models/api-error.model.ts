/** Formato común de todos los errores de la API. */
export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  mensaje: string;
  path: string;
}
