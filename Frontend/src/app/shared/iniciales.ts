import type { Usuario } from '../models/usuario.model';

/**
 * Iniciales para el avatar: nombre y primer apellido ("Ana García López" → "AG").
 * Sin perfil cargado se usa la primera letra del nombre de usuario.
 */
export function iniciales(
  usuario: Pick<Usuario, 'nombre' | 'apellidos'> | null,
  nombreUsuario?: string | null,
): string {
  const partes = [usuario?.nombre, usuario?.apellidos].map((texto) => texto?.trim().charAt(0) ?? '').join('');
  return (partes || nombreUsuario?.trim().charAt(0) || '?').toUpperCase();
}
