import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon, IonItem, IonLabel, IonList, IonSelect, IonSelectOption } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  cashOutline,
  checkmark,
  contrastOutline,
  documentTextOutline,
  moonOutline,
  shieldCheckmarkOutline,
  sunnyOutline,
} from 'ionicons/icons';

import { ACENTOS, AparienciaService, type Tema } from '../../core/apariencia.service';
import { MONEDAS, cambiarMoneda, monedaActual, simboloMoneda } from '../../core/moneda';
import { CabeceraPantallaComponent } from '../../shared/cabecera-pantalla/cabecera-pantalla.component';

/** Configuración: apariencia (tema y color), moneda y textos legales. Se guarda en el dispositivo. */
@Component({
  selector: 'app-configuracion',
  templateUrl: 'configuracion.page.html',
  styleUrls: ['configuracion.page.scss'],
  imports: [
    CabeceraPantallaComponent,
    RouterLink,
    IonContent,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
  ],
})
export class ConfiguracionPage {
  readonly apariencia = inject(AparienciaService);
  readonly acentos = ACENTOS;
  readonly temas: { valor: Tema; nombre: string; icono: string }[] = [
    { valor: 'claro', nombre: 'Claro', icono: 'sunny-outline' },
    { valor: 'oscuro', nombre: 'Oscuro', icono: 'moon-outline' },
    { valor: 'sistema', nombre: 'Automático', icono: 'contrast-outline' },
  ];

  readonly monedas = MONEDAS.map((m) => ({ ...m, simbolo: simboloMoneda(m.codigo) }));
  readonly moneda = monedaActual();

  constructor() {
    addIcons({
      cashOutline,
      checkmark,
      contrastOutline,
      documentTextOutline,
      moonOutline,
      shieldCheckmarkOutline,
      sunnyOutline,
    });
  }

  /** Recarga la app para que todos los importes pasen a la nueva moneda. */
  elegirMoneda(codigo: string): void {
    if (codigo && codigo !== this.moneda) {
      cambiarMoneda(codigo);
    }
  }
}
