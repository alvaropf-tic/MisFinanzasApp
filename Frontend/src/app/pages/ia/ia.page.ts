import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { IonButton, IonContent, IonFooter, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  alertOutline,
  arrowUp,
  cameraOutline,
  createOutline,
  flagOutline,
  lockClosedOutline,
  pieChartOutline,
  scanOutline,
  sparkles,
  trendingUpOutline,
  walletOutline,
} from 'ionicons/icons';

import { AuthService } from '../../core/auth.service';
import { AvisoService } from '../../core/aviso.service';
import { AsistenteService } from '../../services/asistente.service';
import { EscanerTicketService } from '../../services/escaner-ticket.service';
import { UsuarioService } from '../../services/usuario.service';
import { CabeceraComponent } from '../../shared/cabecera/cabecera.component';

/**
 * Pestaña IA: un chat para preguntar por tus finanzas y el escáner de tickets (la IA rellena el gasto).
 * Sin conversación se ve la bienvenida con preguntas sugeridas; al preguntar, solo el chat.
 */
@Component({
  selector: 'app-ia',
  templateUrl: 'ia.page.html',
  styleUrls: ['ia.page.scss'],
  imports: [CabeceraComponent, IonContent, IonFooter, IonButton, IonIcon],
})
export class IaPage {
  private readonly avisos = inject(AvisoService);
  private readonly escaner = inject(EscanerTicketService);
  private readonly auth = inject(AuthService);
  private readonly usuarios = inject(UsuarioService);
  readonly asistente = inject(AsistenteService);

  private readonly contenido = viewChild.required<IonContent>('contenido');

  /** Lo escrito en la caja, para activar el botón de enviar. */
  readonly texto = signal('');

  /** Nombre para el saludo (el del perfil si es del usuario actual). */
  readonly nombre = computed(() => {
    const usuario = this.usuarios.actual();
    return usuario?.nombreUsuario === this.auth.nombreUsuario() ? usuario?.nombre : null;
  });

  readonly sugerencias = [
    { icono: 'pie-chart-outline', texto: '¿En qué gasto más este mes?' },
    { icono: 'trending-up-outline', texto: '¿Cómo voy comparado con el mes pasado?' },
    { icono: 'wallet-outline', texto: '¿Cuánto puedo ahorrar al mes?' },
    { icono: 'flag-outline', texto: '¿Llego a mis objetivos de ahorro?' },
  ];

  constructor() {
    addIcons({
      alertOutline,
      arrowUp,
      cameraOutline,
      createOutline,
      flagOutline,
      lockClosedOutline,
      pieChartOutline,
      scanOutline,
      sparkles,
      trendingUpOutline,
      walletOutline,
    });

    // Baja al último mensaje cada vez que llega uno nuevo
    effect(() => {
      this.asistente.mensajes();
      this.asistente.pensando();
      setTimeout(() => void this.contenido().scrollToBottom(300));
    });
  }

  /** Trocea el **texto en negrita** que a veces manda la IA, para pintarlo sin usar innerHTML. */
  partes(texto: string): { texto: string; negrita: boolean }[] {
    return texto
      .split(/\*\*(.+?)\*\*/g)
      .map((t, i) => ({ texto: t, negrita: i % 2 === 1 }))
      .filter((p) => p.texto);
  }

  enviar(texto: string): void {
    this.texto.set('');
    void this.asistente.preguntar(texto);
  }

  async escanear(): Promise<void> {
    const mensaje = await this.escaner.escanear();
    if (mensaje) {
      void this.avisos.exito(mensaje);
    }
  }
}
