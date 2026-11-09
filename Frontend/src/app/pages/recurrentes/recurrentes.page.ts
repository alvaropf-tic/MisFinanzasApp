import { CurrencyPipe } from '@angular/common';
import { Component, type OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
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
import { add, cloudOfflineOutline, repeatOutline } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';

import { AvisoService } from '../../core/aviso.service';
import { esNoAutorizado } from '../../core/mensaje-error';
import { COBROS_AL_MES, type Recurrente, type TipoRecurrente } from '../../models/recurrente.model';
import { RecurrenteService } from '../../services/recurrente.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { PagoRecurrenteComponent } from '../../shared/pago-recurrente/pago-recurrente.component';
import { abrirFormularioRecurrente, mensajeRecurrente } from '../recurrente-form/recurrente-form.component';
import { CabeceraPantallaComponent } from '../../shared/cabecera-pantalla/cabecera-pantalla.component';

const porFecha = (a: Recurrente, b: Recurrente): number => a.proximaFecha.localeCompare(b.proximaFecha);

/** Administrar pagos y cobros recurrentes: activos y pausados, importe aproximado al mes; al tocar uno se edita. */
@Component({
  selector: 'app-recurrentes',
  templateUrl: 'recurrentes.page.html',
  styleUrls: ['recurrentes.page.scss'],
  imports: [
    CabeceraPantallaComponent,
    CurrencyPipe,
    EmptyStateComponent,
    PagoRecurrenteComponent,
    IonButton,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonIcon,
    IonSpinner,
  ],
})
export class RecurrentesPage implements OnInit {
  private readonly recurrenteService = inject(RecurrenteService);
  private readonly avisos = inject(AvisoService);
  private readonly modalController = inject(ModalController);

  readonly recurrentes = signal<Recurrente[]>([]);
  readonly cargandoInicial = signal(true);
  readonly errorCarga = signal(false);

  readonly activos = computed(() =>
    this.recurrentes()
      .filter((r) => r.activo)
      .sort(porFecha),
  );
  readonly pausados = computed(() =>
    this.recurrentes()
      .filter((r) => !r.activo)
      .sort(porFecha),
  );
  /** Lo que suponen al mes los pagos y los cobros activos (un semanal cuenta 52/12 veces, un anual 1/12…). */
  readonly alMes = computed(() => {
    const suma = (tipo: TipoRecurrente) =>
      this.activos()
        .filter((r) => r.tipo === tipo)
        .reduce((total, r) => total + r.importe * COBROS_AL_MES[r.periodicidad], 0);
    return { pagos: suma('gasto'), cobros: suma('ingreso') };
  });
  /** "3 activos · 1 pausado" */
  readonly resumenEstados = computed(() => {
    const plural = (n: number, palabra: string) => `${n} ${palabra}${n === 1 ? '' : 's'}`;
    const partes = [plural(this.activos().length, 'activo')];
    if (this.pausados().length > 0) {
      partes.push(plural(this.pausados().length, 'pausado'));
    }
    return partes.join(' · ');
  });

  constructor() {
    addIcons({ add, cloudOfflineOutline, repeatOutline });

    // Los cambios hechos desde la hoja (aquí, en Finanzas o en el Calendario) recargan la lista
    let primeraVez = true;
    effect(() => {
      this.recurrenteService.cambios();
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
      this.recurrentes.set(await firstValueFrom(this.recurrenteService.listar()));
    } catch (error) {
      this.errorCarga.set(!esNoAutorizado(error) && this.recurrentes().length === 0);
      void this.avisos.errorHttp(error);
    } finally {
      this.cargandoInicial.set(false);
    }
  }

  async refrescar(evento: RefresherCustomEvent): Promise<void> {
    await this.cargar();
    await evento.target.complete();
  }

  async abrir(recurrente: Recurrente | null = null): Promise<void> {
    const cierre = await abrirFormularioRecurrente(this.modalController, 'gasto', recurrente);
    if (cierre) {
      void this.avisos.exito(mensajeRecurrente(cierre));
    }
  }
}
