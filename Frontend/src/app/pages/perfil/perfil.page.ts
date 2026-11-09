import { Component, type OnInit, computed, inject, signal } from '@angular/core';
import { AlertController, IonButton, IonContent, IonIcon, IonSpinner, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  atOutline,
  chevronForwardOutline,
  cloudOfflineOutline,
  createOutline,
  lockClosedOutline,
  mailOutline,
  personOutline,
  trashOutline,
} from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../core/auth.service';
import { AvisoService } from '../../core/aviso.service';
import { esNoAutorizado } from '../../core/mensaje-error';
import type { Usuario } from '../../models/usuario.model';
import { UsuarioService } from '../../services/usuario.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { iniciales } from '../../shared/iniciales';
import { abrirFormularioPassword } from '../password-form/password-form.component';
import { abrirFormularioPerfil } from '../perfil-form/perfil-form.component';
import { CabeceraPantallaComponent } from '../../shared/cabecera-pantalla/cabecera-pantalla.component';

/** Datos de la cuenta (`GET /usuarios/me`), con edición del perfil y cambio de contraseña en hojas. */
@Component({
  selector: 'app-perfil',
  templateUrl: 'perfil.page.html',
  styleUrls: ['perfil.page.scss'],
  imports: [CabeceraPantallaComponent, EmptyStateComponent, IonButton, IonContent, IonIcon, IonSpinner],
})
export class PerfilPage implements OnInit {
  private readonly usuarios = inject(UsuarioService);
  private readonly auth = inject(AuthService);
  private readonly avisos = inject(AvisoService);
  private readonly modalController = inject(ModalController);
  private readonly alertController = inject(AlertController);

  readonly usuario = signal<Usuario | null>(null);
  readonly cargando = signal(true);
  readonly errorCarga = signal(false);

  readonly iniciales = computed(() => iniciales(this.usuario(), this.auth.nombreUsuario()));

  constructor() {
    addIcons({
      atOutline,
      chevronForwardOutline,
      cloudOfflineOutline,
      createOutline,
      lockClosedOutline,
      mailOutline,
      personOutline,
      trashOutline,
    });
  }

  ngOnInit(): void {
    void this.cargar();
  }

  async editar(): Promise<void> {
    const usuario = this.usuario();
    if (usuario && (await abrirFormularioPerfil(this.modalController, usuario))) {
      void this.avisos.exito('Perfil actualizado');
      await this.cargar();
    }
  }

  async cambiarPassword(): Promise<void> {
    if (await abrirFormularioPassword(this.modalController)) {
      void this.avisos.exito('Contraseña cambiada');
    }
  }

  /** Pide la contraseña y borra la cuenta con todos sus datos; después vuelve al inicio de sesión. */
  async eliminarCuenta(): Promise<void> {
    const alerta = await this.alertController.create({
      header: '¿Eliminar tu cuenta?',
      message:
        'Se borrarán para siempre todos tus datos: gastos, ingresos, vehículos, objetivos, recordatorios y fotos de tickets. ' +
        'No se puede deshacer. Escribe tu contraseña para confirmar.',
      inputs: [
        {
          name: 'password',
          type: 'password',
          placeholder: 'Contraseña',
          attributes: { autocomplete: 'current-password' },
        },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar cuenta', role: 'destructive', cssClass: 'alerta__peligro' },
      ],
    });
    await alerta.present();
    const { data, role } = await alerta.onDidDismiss<{ values: { password: string } }>();
    const password = data?.values.password ?? '';
    if (role !== 'destructive') {
      return;
    }
    if (!password) {
      void this.avisos.error('Escribe tu contraseña para eliminar la cuenta');
      return;
    }
    try {
      await firstValueFrom(this.usuarios.eliminarCuenta(password), { defaultValue: undefined });
      void this.avisos.exito('Tu cuenta y todos tus datos se han eliminado');
      await this.auth.cerrarSesion();
    } catch (error) {
      void this.avisos.errorHttp(error);
    }
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.errorCarga.set(false);
    try {
      this.usuario.set(await firstValueFrom(this.usuarios.obtenerActual()));
    } catch (error) {
      this.errorCarga.set(!esNoAutorizado(error));
      void this.avisos.errorHttp(error);
    } finally {
      this.cargando.set(false);
    }
  }
}
