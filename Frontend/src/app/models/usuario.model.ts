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
