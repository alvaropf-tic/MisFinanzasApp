import { CurrencyPipe } from '@angular/common';
import { Component, type OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  ModalController,
  type RefresherCustomEvent,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, cloudOfflineOutline, trophyOutline } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';

import { AvisoService } from '../../core/aviso.service';
import { esNoAutorizado } from '../../core/mensaje-error';
import type { Objetivo } from '../../models/objetivo.model';
import { ObjetivoService } from '../../services/objetivo.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { FilaObjetivoComponent } from '../../shared/fila-objetivo/fila-objetivo.component';
import { MENSAJES_OBJETIVO, abrirFormularioObjetivo } from '../objetivo-form/objetivo-form.component';
import { CabeceraPantallaComponent } from '../../shared/cabecera-pantalla/cabecera-pantalla.component';

/** Objetivos de ahorro: total ahorrado, en curso y conseguidos. Al tocar uno se abre su detalle. */
@Component({
  selector: 'app-objetivos',
  templateUrl: 'objetivos.page.html',
  styleUrls: ['objetivos.page.scss'],
  imports: [
    CabeceraPantallaComponent,
    CurrencyPipe,
    RouterLink,
    EmptyStateComponent,
    FilaObjetivoComponent,
    IonButton,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonIcon,
    IonSpinner,
  ],
})
export class ObjetivosPage implements OnInit {
  private readonly objetivoService = inject(ObjetivoService);
  private readonly avisos = inject(AvisoService);
  private readonly modalController = inject(ModalController);

  readonly objetivos = signal<Objetivo[]>([]);
  readonly cargandoInicial = signal(true);
  readonly errorCarga = signal(false);

  readonly enCurso = computed(() => this.objetivos().filter((o) => !o.completado));
  readonly conseguidos = computed(() => this.objetivos().filter((o) => o.completado));
  readonly totalAhorrado = computed(() => this.objetivos().reduce((t, o) => t + o.ahorrado, 0));
  /** Suma de lo que habría que apartar este mes en los objetivos con fecha. */
  readonly alMes = computed(() => this.enCurso().reduce((t, o) => t + (o.ahorroMensualNecesario ?? 0), 0));

  constructor() {
    addIcons({ add, cloudOfflineOutline, trophyOutline });
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
    this.errorCarga.set(false);
    try {
      this.objetivos.set(await firstValueFrom(this.objetivoService.listar()));
    } catch (error) {
      this.errorCarga.set(!esNoAutorizado(error) && this.objetivos().length === 0);
      void this.avisos.errorHttp(error);
    } finally {
      this.cargandoInicial.set(false);
    }
  }

  async refrescar(evento: RefresherCustomEvent): Promise<void> {
    await this.cargar();
    await evento.target.complete();
  }

  async nuevo(): Promise<void> {
    const resultado = await abrirFormularioObjetivo(this.modalController);
    if (resultado) {
      void this.avisos.exito(MENSAJES_OBJETIVO[resultado]);
    }
  }
}
