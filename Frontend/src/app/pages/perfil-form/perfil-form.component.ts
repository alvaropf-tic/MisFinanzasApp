import { Component, Input, type OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonButton, IonContent, IonFooter, IonIcon, IonInput, IonSpinner, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmarkOutline, closeOutline, mailOutline, personOutline } from 'ionicons/icons';

import { AvisoService } from '../../core/aviso.service';
import type { Usuario } from '../../models/usuario.model';
import { UsuarioService } from '../../services/usuario.service';
import { iniciales } from '../../shared/iniciales';

/** Abre la hoja de edición del perfil; devuelve `true` si se guardó. */
export async function abrirFormularioPerfil(modalController: ModalController, usuario: Usuario): Promise<boolean> {
  const modal = await modalController.create({
    component: PerfilFormComponent,
    componentProps: { usuario },
    breakpoints: [0, 1],
    initialBreakpoint: 1,
    handle: true,
  });
  await modal.present();
  const { role } = await modal.onWillDismiss();
  return role === 'guardado';
}

/** Hoja para cambiar nombre, apellidos y correo. El nombre de usuario se muestra, pero no se puede cambiar. */
@Component({
  selector: 'app-perfil-form',
  templateUrl: 'perfil-form.component.html',
  styleUrls: ['perfil-form.component.scss'],
  imports: [ReactiveFormsModule, IonContent, IonFooter, IonButton, IonInput, IonIcon, IonSpinner],
})
export class PerfilFormComponent implements OnInit {
  private readonly usuarios = inject(UsuarioService);
  private readonly avisos = inject(AvisoService);
  private readonly modalController = inject(ModalController);

  // `componentProps` del modal asigna la propiedad directamente: con un input() de señal la sustituiría
  @Input() usuario: Usuario | null = null;

  readonly enviando = signal(false);

  // Mismas validaciones que el backend (UsuarioActualizarDTO)
  readonly formulario = inject(NonNullableFormBuilder).group({
    nombre: ['', [Validators.required, Validators.maxLength(50)]],
    apellidos: ['', [Validators.required, Validators.maxLength(100)]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
  });

  /** Iniciales del avatar mientras se escribe. */
  private readonly valores = toSignal(this.formulario.valueChanges);
  readonly iniciales = computed(() => {
    const v = this.valores();
    return iniciales({ nombre: v?.nombre ?? '', apellidos: v?.apellidos ?? '' }, this.usuario?.nombreUsuario);
  });

  constructor() {
    addIcons({ checkmarkOutline, closeOutline, mailOutline, personOutline });
  }

  ngOnInit(): void {
    const u = this.usuario;
    if (u) {
      this.formulario.setValue({ nombre: u.nombre, apellidos: u.apellidos, correo: u.correo });
    }
  }

  invalido(control: 'nombre' | 'apellidos' | 'correo'): boolean {
    const c = this.formulario.controls[control];
    return c.invalid && c.touched;
  }

  cancelar(): void {
    void this.modalController.dismiss(null, 'cancelar');
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const v = this.formulario.getRawValue();
    this.enviando.set(true);
    this.usuarios
      .actualizar({ nombre: v.nombre.trim(), apellidos: v.apellidos.trim(), correo: v.correo.trim() })
      .subscribe({
        next: () => {
          this.enviando.set(false);
          void this.modalController.dismiss(null, 'guardado');
        },
        error: (error: unknown) => {
          this.enviando.set(false);
          // 409 "El correo ya está registrado": lo explica el mensaje del backend
          void this.avisos.errorHttp(error);
        },
      });
  }
}
