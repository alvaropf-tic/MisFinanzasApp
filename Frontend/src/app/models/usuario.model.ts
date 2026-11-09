export interface Usuario {
  id: number;
  nombre: string;
  apellidos: string;
  nombreUsuario: string;
  correo: string;
  rol: string;
}

export interface UsuarioRegistro {
  nombre: string;
  apellidos: string;
  nombreUsuario: string;
  correo: string;
  password: string;
  /** Obligatorio: términos de uso y política de privacidad (incluye el aviso de la IA de los tickets). */
  aceptaTerminos: boolean;
}

/** Datos que se pueden cambiar del perfil (el nombre de usuario no: va dentro del token). */
export interface UsuarioActualizar {
  nombre: string;
  apellidos: string;
  correo: string;
}

export interface CambioPassword {
  passwordActual: string;
  passwordNueva: string;
}

export interface Login {
  nombreUsuario: string;
  password: string;
}

export interface LoginRespuesta {
  token: string;
  id: number;
  nombreUsuario: string;
  rol: string;
}
