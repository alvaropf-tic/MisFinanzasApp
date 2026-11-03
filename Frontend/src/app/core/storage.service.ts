import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

/**
 * Almacenamiento clave-valor con dos niveles:
 * - persistente: Capacitor Preferences (localStorage en web, SharedPreferences en Android).
 * - de sesión: sessionStorage, se pierde al cerrar la app o la pestaña.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  async guardar(clave: string, valor: string, persistente: boolean): Promise<void> {
    // Se borra antes de guardar para que una clave no quede en los dos niveles
    await this.borrar(clave);
    if (persistente) {
      await Preferences.set({ key: clave, value: valor });
    } else {
      sessionStorage.setItem(clave, valor);
    }
  }

  async leer(clave: string): Promise<string | null> {
    const deSesion = sessionStorage.getItem(clave);
    if (deSesion !== null) {
      return deSesion;
    }
    const { value } = await Preferences.get({ key: clave });
    return value;
  }

  async borrar(clave: string): Promise<void> {
    sessionStorage.removeItem(clave);
    await Preferences.remove({ key: clave });
  }
}
