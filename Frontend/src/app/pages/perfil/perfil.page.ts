import { Component, type OnInit, computed, inject, signal } from '@angular/core';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cloudOfflineOutline } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../core/auth.service';
import { AvisoService } from '../../core/aviso.service';
import { esNoAutorizado } from '../../core/mensaje-error';
import type { Usuario } from '../../models/usuario.model';
import { UsuarioService } from '../../services/usuario.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { iniciales } from '../../shared/iniciales';

/** Datos de la cuenta (solo lectura), desde `GET /usuarios/me`. */
@Component({
  selector: 'app-perfil',
  templateUrl: 'perfil.page.html',
  styleUrls: ['perfil.page.scss'],
  imports: [
    EmptyStateComponent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonSpinner,
  ],
})
export class PerfilPage implements OnInit {
  private readonly usuarios = inject(UsuarioService);
  private readonly auth = inject(AuthService);
  private readonly avisos = inject(AvisoService);

  readonly usuario = signal<Usuario | null>(null);
  readonly cargando = signal(true);
  readonly errorCarga = signal(false);

  readonly iniciales = computed(() => iniciales(this.usuario(), this.auth.nombreUsuario()));

  constructor() {
    addIcons({ cloudOfflineOutline });
  }

  ngOnInit(): void {
    void this.cargar();
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
