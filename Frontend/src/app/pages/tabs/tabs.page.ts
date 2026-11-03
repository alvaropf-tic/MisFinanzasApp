import { Component } from '@angular/core';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { calendarOutline, carOutline, homeOutline, sparklesOutline, walletOutline } from 'ionicons/icons';

/** Una entrada de la barra inferior; `ruta` es también el `tab` de Ionic y la URL (/inicio, /finanzas…). */
interface Pestania {
  ruta: string;
  etiqueta: string;
  icono: string;
}

export const PESTANIAS: Pestania[] = [
  { ruta: 'inicio', etiqueta: 'Inicio', icono: 'home-outline' },
  { ruta: 'finanzas', etiqueta: 'Finanzas', icono: 'wallet-outline' },
  { ruta: 'calendario', etiqueta: 'Calendario', icono: 'calendar-outline' },
  { ruta: 'vehiculos', etiqueta: 'Vehículos', icono: 'car-outline' },
  { ruta: 'ia', etiqueta: 'IA', icono: 'sparkles-outline' },
];

/** Contenedor de la app con sesión iniciada: cada pestaña tiene su propia pila de pantallas. */
@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage {
  readonly pestanias = PESTANIAS;

  constructor() {
    addIcons({ homeOutline, walletOutline, calendarOutline, carOutline, sparklesOutline });
  }
}
