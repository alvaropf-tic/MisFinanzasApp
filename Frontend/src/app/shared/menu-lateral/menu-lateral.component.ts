import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { IonIcon, NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  carOutline,
  flagOutline,
  homeOutline,
  logOutOutline,
  personCircleOutline,
  repeatOutline,
  settingsOutline,
  sparklesOutline,
  statsChartOutline,
  walletOutline,
} from 'ionicons/icons';
import { filter, map } from 'rxjs';

import { AuthService } from '../../core/auth.service';
import { PESTANIAS } from '../../pages/tabs/tabs.page';

interface Enlace {
  ruta: string;
  etiqueta: string;
  icono: string;
}

/**
 * Menú lateral de la versión de escritorio (pantallas de 992 px o más): sustituye a la barra de pestañas de abajo
 * y da acceso directo a las pantallas que en el móvil están en el menú del avatar. En el móvil no se muestra.
 */
@Component({
  selector: 'app-menu-lateral',
  templateUrl: 'menu-lateral.component.html',
  styleUrls: ['menu-lateral.component.scss'],
  imports: [IonIcon],
})
export class MenuLateralComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly navController = inject(NavController);

  readonly principales: Enlace[] = PESTANIAS.map((p) => ({ ...p, ruta: '/' + p.ruta }));
  readonly secundarios: Enlace[] = [
    { ruta: '/objetivos', etiqueta: 'Objetivos', icono: 'flag-outline' },
    { ruta: '/recurrentes', etiqueta: 'Recurrentes', icono: 'repeat-outline' },
    { ruta: '/estadisticas', etiqueta: 'Estadísticas', icono: 'stats-chart-outline' },
  ];
  readonly cuenta: Enlace[] = [
    { ruta: '/perfil', etiqueta: 'Perfil', icono: 'person-circle-outline' },
    { ruta: '/configuracion', etiqueta: 'Configuración', icono: 'settings-outline' },
  ];

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly nombreUsuario = computed(() => this.auth.nombreUsuario());

  constructor() {
    addIcons({
      calendarOutline,
      carOutline,
      flagOutline,
      homeOutline,
      logOutOutline,
      personCircleOutline,
      repeatOutline,
      settingsOutline,
      sparklesOutline,
      statsChartOutline,
      walletOutline,
    });
  }

  activo(ruta: string): boolean {
    const url = this.url().split('?')[0];
    return url === ruta || url.startsWith(ruta + '/');
  }

  ir(ruta: string): void {
    if (this.url() !== ruta) {
      void this.navController.navigateRoot(ruta, { animated: false });
    }
  }

  cerrarSesion(): void {
    void this.auth.cerrarSesion();
  }
}
