import { Component, type OnInit, computed, inject, input, signal, viewChild } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPopover,
  IonTitle,
  IonToolbar,
  NavController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { logOutOutline, personCircleOutline, walletOutline } from 'ionicons/icons';

import { AuthService } from '../../core/auth.service';
import { UsuarioService } from '../../services/usuario.service';
import { iniciales } from '../iniciales';

/**
 * Cabecera de las pestañas: logo, título y avatar con el menú de usuario (Perfil y Cerrar sesión).
 * Los botones marcados con `cabeceraAccion` se colocan a la izquierda del avatar.
 */
@Component({
  selector: 'app-cabecera',
  templateUrl: 'cabecera.component.html',
  styleUrls: ['cabecera.component.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonPopover, IonList, IonItem, IonLabel],
})
export class CabeceraComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly usuarios = inject(UsuarioService);
  private readonly navController = inject(NavController);

  readonly titulo = input.required<string>();

  private readonly menu = viewChild.required(IonPopover);
  readonly menuAbierto = signal(false);
  readonly eventoMenu = signal<Event | null>(null);

  /** El perfil guardado puede ser de una sesión anterior: solo vale si es del usuario actual. */
  private readonly perfil = computed(() => {
    const usuario = this.usuarios.actual();
    return usuario?.nombreUsuario === this.auth.nombreUsuario() ? usuario : null;
  });
  readonly iniciales = computed(() => iniciales(this.perfil(), this.auth.nombreUsuario()));

  constructor() {
    addIcons({ walletOutline, personCircleOutline, logOutOutline });
  }

  ngOnInit(): void {
    if (!this.perfil()) {
      // Si falla, el avatar se queda con la inicial del nombre de usuario
      this.usuarios.obtenerActual().subscribe({ error: () => undefined });
    }
  }

  abrirMenu(evento: Event): void {
    this.eventoMenu.set(evento);
    this.menuAbierto.set(true);
  }

  async irAPerfil(): Promise<void> {
    await this.menu().dismiss();
    await this.navController.navigateForward('/perfil');
  }

  async cerrarSesion(): Promise<void> {
    await this.menu().dismiss();
    await this.auth.cerrarSesion();
  }
}
