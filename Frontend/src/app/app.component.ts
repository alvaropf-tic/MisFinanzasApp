import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { filter, map } from 'rxjs';

import { AuthService } from './core/auth.service';
import { MenuLateralComponent } from './shared/menu-lateral/menu-lateral.component';

/** Pantallas sin sesión, que nunca llevan el menú lateral de escritorio. */
const SIN_MENU = ['/login', '/registro'];

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, MenuLateralComponent],
})
export class AppComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  /** Con sesión y fuera del login: el menú lateral (solo se ve en escritorio, lo decide su CSS). */
  readonly conLateral = computed(() => !!this.auth.token() && !SIN_MENU.some((r) => this.url().startsWith(r)));
}
