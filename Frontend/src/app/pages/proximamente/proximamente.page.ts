import { Component, input } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { constructOutline } from 'ionicons/icons';

import { CabeceraComponent } from '../../shared/cabecera/cabecera.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';

/** Pestañas todavía sin implementar. El título llega desde `data` de la ruta. */
@Component({
  selector: 'app-proximamente',
  template: `
    <app-cabecera [titulo]="titulo()"></app-cabecera>
    <ion-content>
      <app-empty-state
        icono="construct-outline"
        titulo="Próximamente"
        mensaje="Esta sección estará disponible muy pronto."
      ></app-empty-state>
    </ion-content>
  `,
  imports: [CabeceraComponent, EmptyStateComponent, IonContent],
})
export class ProximamentePage {
  readonly titulo = input.required<string>();

  constructor() {
    addIcons({ constructOutline });
  }
}
