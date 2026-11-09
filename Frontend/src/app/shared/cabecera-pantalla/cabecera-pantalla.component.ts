import { Component, input } from '@angular/core';
import { IonBackButton, IonButtons, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

/**
 * Cabecera de las pantallas que se abren encima de las pestañas (Perfil, Objetivos, un vehículo…): mismo
 * estilo que la de las pestañas (barra de color y título centrado en negrita), con flecha para volver.
 * Las acciones propias van dentro con el atributo `cabeceraAccion` (a la derecha).
 */
@Component({
  selector: 'app-cabecera-pantalla',
  templateUrl: 'cabecera-pantalla.component.html',
  styleUrls: ['cabecera-pantalla.component.scss'],
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle],
})
export class CabeceraPantallaComponent {
  readonly titulo = input.required<string>();
  /** Adónde vuelve la flecha si se entró directamente por URL. */
  readonly volverA = input('/inicio');
  /** Sin sombra inferior, para fundirse con un bloque del mismo color debajo (Perfil). */
  readonly sinBorde = input(false);
}
