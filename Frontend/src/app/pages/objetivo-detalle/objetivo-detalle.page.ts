import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, type OnInit, effect, inject, input, signal, untracked } from '@angular/core';
import {
  AlertController,
  IonButton,
  IonContent,
  IonIcon,
  IonSpinner,
  ModalController,
  NavController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, cloudOfflineOutline, createOutline, remove, trashOutline } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';

import { AvisoService } from '../../core/aviso.service';
import type { Aportacion, Objetivo } from '../../models/objetivo.model';
import { ObjetivoService } from '../../services/objetivo.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { FilaObjetivoComponent } from '../../shared/fila-objetivo/fila-objetivo.component';
import { type Movimiento, abrirFormularioAportacion } from '../aportacion-form/aportacion-form.component';
import { MENSAJES_OBJETIVO, abrirFormularioObjetivo } from '../objetivo-form/objetivo-form.component';
import { CabeceraPantallaComponent } from '../../shared/cabecera-pantalla/cabecera-pantalla.component';

/** Un objetivo: progreso, aportar / retirar e historial de aportaciones (se borran tocándolas). */
@Component({
  selector: 'app-objetivo-detalle',
  templateUrl: 'objetivo-detalle.page.html',
  styleUrls: ['objetivo-detalle.page.scss'],
  imports: [
    CabeceraPantallaComponent,
    CurrencyPipe,
    DatePipe,
    EmptyStateComponent,
    FilaObjetivoComponent,
    IonButton,
    IonContent,
    IonIcon,
    IonSpinner,
  ],
})
export class ObjetivoDetallePage implements OnInit {
  private readonly objetivoService = inject(ObjetivoService);
  private readonly avisos = inject(AvisoService);
  private readonly modalController = inject(ModalController);
  private readonly alertController = inject(AlertController);
  private readonly navController = inject(NavController);

  /** De la ruta /objetivos/:id. */
  readonly id = input.required<string>();

  readonly objetivo = signal<Objetivo | null>(null);
  readonly cargando = signal(true);
  readonly error = signal(false);

  constructor() {
    addIcons({ add, cloudOfflineOutline, createOutline, remove, trashOutline });
    let primeraVez = true;
    effect(() => {
      this.objetivoService.cambios();
      if (primeraVez) {
        primeraVez = false;
        return;
      }
      untracked(() => void this.cargar());
    });
  }

  ngOnInit(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    this.error.set(false);
    try {
      this.objetivo.set(await firstValueFrom(this.objetivoService.obtener(Number(this.id()))));
    } catch (error) {
      this.error.set(this.objetivo() === null);
      void this.avisos.errorHttp(error);
    } finally {
      this.cargando.set(false);
    }
  }

  async mover(movimiento: Movimiento): Promise<void> {
    const o = this.objetivo();
    if (!o) {
      return;
    }
    const mensaje = await abrirFormularioAportacion(this.modalController, o, movimiento);
    if (mensaje) {
      void this.avisos.exito(mensaje);
    }
  }

  async editar(): Promise<void> {
    const resultado = await abrirFormularioObjetivo(this.modalController, this.objetivo());
    if (resultado) {
      void this.avisos.exito(MENSAJES_OBJETIVO[resultado]);
      if (resultado === 'eliminado') {
        await this.navController.navigateBack('/objetivos');
      }
    }
  }

  async borrarAportacion(a: Aportacion): Promise<void> {
    const o = this.objetivo();
    if (!o) {
      return;
    }
    const alerta = await this.alertController.create({
      header: a.importe > 0 ? '¿Borrar esta aportación?' : '¿Borrar esta retirada?',
      message: 'El ahorrado del objetivo se recalcula.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Borrar', role: 'destructive' },
      ],
    });
    await alerta.present();
    const { role } = await alerta.onDidDismiss();
    if (role !== 'destructive') {
      return;
    }
    try {
      await firstValueFrom(this.objetivoService.eliminarAportacion(o.id, a.id), { defaultValue: null });
      void this.avisos.exito('Borrado');
    } catch (error) {
      void this.avisos.errorHttp(error);
    }
  }
}
