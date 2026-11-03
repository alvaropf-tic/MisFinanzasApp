import { Component, input } from '@angular/core';
import { IonIcon, IonText } from '@ionic/angular';

/**
 * Pantalla sin datos, con error o cargando: icono, título y mensaje opcionales.
 * Lo que se proyecte (un botón, un spinner…) aparece debajo.
 */
@Component({
  selector: 'app-empty-state',
  templateUrl: 'empty-state.component.html',
  styleUrls: ['empty-state.component.scss'],
  imports: [IonIcon, IonText],
})
export class EmptyStateComponent {
  /** Nombre de un icono de ionicons ya registrado con `addIcons`. */
  readonly icono = input<string>();
  readonly titulo = input<string>();
  readonly mensaje = input<string>();
}
