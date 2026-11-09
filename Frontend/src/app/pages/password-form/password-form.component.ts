import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonFooter,
  IonIcon,
  IonInput,
  IonInputPasswordToggle,
  IonSpinner,
  ModalController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  checkmarkCircle,
  checkmarkOutline,
  closeOutline,
  ellipseOutline,
  keyOutline,
  lockClosedOutline,
} from 'ionicons/icons';

import { AvisoService } from '../../core/aviso.service';
import { UsuarioService } from '../../services/usuario.service';

const MINIMO_CARACTERES = 8;

/** Abre la hoja de cambio de contraseña; devuelve `true` si se cambió. */
export async function abrirFormularioPassword(modalController: ModalController): Promise<boolean> {
  const modal = await modalController.create({
    component: PasswordFormComponent,
    breakpoints: [0, 1],
    initialBreakpoint: 1,
    handle: true,
  });
  await modal.present();
  const { role } = await modal.onWillDismiss();
  return role === 'cambiada';
}

/**
 * Hoja para cambiar la contraseña: la actual, la nueva y repetirla. Las tres comprobaciones del backend
 * (8 caracteres, distinta de la actual) y que coincidan se ven en vivo mientras se escribe.
 */
@Component({
  selector: 'app-password-form',
  templateUrl: 'password-form.component.html',
  styleUrls: ['password-form.component.scss'],
  imports: [
    ReactiveFormsModule,
    IonContent,
    IonFooter,
    IonButton,
    IonInput,
    IonInputPasswordToggle,
    IonIcon,
    IonSpinner,
  ],
})
export class PasswordFormComponent {
  private readonly usuarios = inject(UsuarioService);
  private readonly avisos = inject(AvisoService);
  private readonly modalController = inject(ModalController);

  readonly enviando = signal(false);
  readonly minimo = MINIMO_CARACTERES;

  readonly formulario = inject(NonNullableFormBuilder).group({
    passwordActual: ['', Validators.required],
    passwordNueva: ['', [Validators.required, Validators.minLength(MINIMO_CARACTERES)]],
    repetir: ['', Validators.required],
  });

  private readonly valores = toSignal(this.formulario.valueChanges, { initialValue: this.formulario.getRawValue() });

  /** Comprobaciones que se marcan en verde según se cumplen. */
  readonly requisitos = computed(() => {
    const { passwordActual = '', passwordNueva = '', repetir = '' } = this.valores();
    return [
      { texto: `Al menos ${MINIMO_CARACTERES} caracteres`, cumple: passwordNueva.length >= MINIMO_CARACTERES },
      { texto: 'Distinta de la actual', cumple: passwordNueva.length > 0 && passwordNueva !== passwordActual },
      { texto: 'Las dos nuevas coinciden', cumple: repetir.length > 0 && repetir === passwordNueva },
    ];
  });
  readonly puedeGuardar = computed(() => !!this.valores().passwordActual && this.requisitos().every((r) => r.cumple));

  constructor() {
    addIcons({ checkmarkCircle, checkmarkOutline, closeOutline, ellipseOutline, keyOutline, lockClosedOutline });
  }

  cancelar(): void {
    void this.modalController.dismiss(null, 'cancelar');
  }

  guardar(): void {
    if (!this.puedeGuardar()) {
      this.formulario.markAllAsTouched();
      return;
    }
    const { passwordActual, passwordNueva } = this.formulario.getRawValue();
    this.enviando.set(true);
    this.usuarios.cambiarPassword({ passwordActual, passwordNueva }).subscribe({
      next: () => {
        this.enviando.set(false);
        void this.modalController.dismiss(null, 'cambiada');
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        // 400 "La contraseña actual no es correcta": no cierra la sesión, se muestra el mensaje
        void this.avisos.errorHttp(error);
        this.formulario.controls.passwordActual.setValue('');
      },
    });
  }
}
