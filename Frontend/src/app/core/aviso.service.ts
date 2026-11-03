import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { alertCircleOutline, checkmarkCircleOutline, warningOutline } from 'ionicons/icons';

import { esNoAutorizado, mensajeDeError } from './mensaje-error';

/** Mensajes breves (toasts) con los colores del tema: verde éxito, rojo error, naranja aviso. */
@Injectable({ providedIn: 'root' })
export class AvisoService {
  private readonly toastController = inject(ToastController);

  constructor() {
    addIcons({ checkmarkCircleOutline, alertCircleOutline, warningOutline });
  }

  exito(mensaje: string): Promise<void> {
    return this.mostrar(mensaje, 'success', 'checkmark-circle-outline');
  }

  error(mensaje: string): Promise<void> {
    return this.mostrar(mensaje, 'danger', 'alert-circle-outline');
  }

  advertencia(mensaje: string): Promise<void> {
    return this.mostrar(mensaje, 'warning', 'warning-outline');
  }

  /**
   * Muestra el `mensaje` de un error HTTP. Los 401 los gestiona el interceptor
   * (cierra la sesión), así que por defecto no se muestran aquí.
   */
  async errorHttp(error: unknown, { incluir401 = false } = {}): Promise<void> {
    if (esNoAutorizado(error) && !incluir401) {
      return;
    }
    await this.error(mensajeDeError(error));
  }

  private async mostrar(mensaje: string, color: string, icono: string): Promise<void> {
    const toast = await this.toastController.create({
      message: mensaje,
      color,
      icon: icono,
      duration: 3000,
      position: 'top',
    });
    await toast.present();
  }
}
