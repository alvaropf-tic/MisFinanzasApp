import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonCheckbox,
  IonContent,
  IonIcon,
  IonInput,
  IonInputPasswordToggle,
  IonSpinner,
  IonText,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { walletOutline } from 'ionicons/icons';

import { AuthService } from '../../core/auth.service';
import { AvisoService } from '../../core/aviso.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    IonContent,
    IonInput,
    IonInputPasswordToggle,
    IonCheckbox,
    IonButton,
    IonIcon,
    IonSpinner,
    IonText,
  ],
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly avisos = inject(AvisoService);
  private readonly router = inject(Router);

  readonly enviando = signal(false);

  readonly formulario = inject(NonNullableFormBuilder).group({
    nombreUsuario: ['', Validators.required],
    password: ['', Validators.required],
    recordar: [true],
  });

  constructor() {
    addIcons({ walletOutline });
  }

  iniciarSesion(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const { nombreUsuario, password, recordar } = this.formulario.getRawValue();
    this.enviando.set(true);
    this.auth.login({ nombreUsuario: nombreUsuario.trim(), password }, recordar).subscribe({
      next: () => {
        this.enviando.set(false);
        this.formulario.reset();
        void this.router.navigateByUrl('/inicio', { replaceUrl: true });
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        // Aquí el 401 es "usuario o contraseña incorrectos" y sí se muestra
        void this.avisos.errorHttp(error, { incluir401: true });
      },
    });
  }
}
