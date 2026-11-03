import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonInputPasswordToggle,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { switchMap } from 'rxjs';

import { AuthService } from '../../core/auth.service';
import { AvisoService } from '../../core/aviso.service';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-registro',
  templateUrl: 'registro.page.html',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonInput,
    IonInputPasswordToggle,
    IonButton,
    IonSpinner,
  ],
})
export class RegistroPage {
  private readonly usuarios = inject(UsuarioService);
  private readonly auth = inject(AuthService);
  private readonly avisos = inject(AvisoService);
  private readonly router = inject(Router);

  readonly enviando = signal(false);

  // Mismas validaciones que el backend (UsuarioRegistroDTO)
  readonly formulario = inject(NonNullableFormBuilder).group({
    nombre: ['', [Validators.required, Validators.maxLength(50)]],
    apellidos: ['', [Validators.required, Validators.maxLength(100)]],
    nombreUsuario: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  registrar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const valores = this.formulario.getRawValue();
    const datos = {
      nombre: valores.nombre.trim(),
      apellidos: valores.apellidos.trim(),
      nombreUsuario: valores.nombreUsuario.trim(),
      correo: valores.correo.trim(),
      password: valores.password,
    };
    this.enviando.set(true);
    // Tras crear la cuenta se inicia sesión directamente (y se recuerda en el dispositivo)
    this.usuarios
      .registrar(datos)
      .pipe(switchMap(() => this.auth.login({ nombreUsuario: datos.nombreUsuario, password: datos.password }, true)))
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.formulario.reset();
          void this.avisos.exito('Cuenta creada. ¡Te damos la bienvenida!');
          void this.router.navigateByUrl('/inicio', { replaceUrl: true });
        },
        error: (error: unknown) => {
          this.enviando.set(false);
          void this.avisos.errorHttp(error, { incluir401: true });
        },
      });
  }
}
