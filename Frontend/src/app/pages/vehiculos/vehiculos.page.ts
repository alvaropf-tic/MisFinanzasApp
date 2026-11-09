import { CurrencyPipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { Component, type OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonModal,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  ModalController,
  type RefresherCustomEvent,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  add,
  carSportOutline,
  chevronForwardOutline,
  cloudOfflineOutline,
  speedometerOutline,
  waterOutline,
} from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';

import { AvisoService } from '../../core/aviso.service';
import { esNoAutorizado } from '../../core/mensaje-error';
import { RESULTADOS_ITV, type ResumenVehiculo, type Vehiculo } from '../../models/vehiculo.model';
import { VehiculoService } from '../../services/vehiculo.service';
import { CabeceraComponent } from '../../shared/cabecera/cabecera.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { abrirFormularioRepostaje } from '../repostaje-form/repostaje-form.component';
import { MENSAJES_VEHICULO, abrirFormularioVehiculo } from '../vehiculo-form/vehiculo-form.component';

const MAXIMO_VEHICULOS = 5;

/** Un vehículo con sus cifras (null si no se pudieron cargar). */
interface FichaVehiculo {
  vehiculo: Vehiculo;
  resumen: ResumenVehiculo | null;
}

/** Pestaña Vehículos: tarjeta por vehículo (km, consumo, gasto del año, ITV) y alta de vehículos. */
@Component({
  selector: 'app-vehiculos',
  templateUrl: 'vehiculos.page.html',
  styleUrls: ['vehiculos.page.scss'],
  imports: [
    CurrencyPipe,
    DecimalPipe,
    NgTemplateOutlet,
    RouterLink,
    CabeceraComponent,
    EmptyStateComponent,
    IonContent,
    IonFab,
    IonFabButton,
    IonModal,
    IonRefresher,
    IonRefresherContent,
    IonButton,
    IonIcon,
    IonSpinner,
  ],
})
export class VehiculosPage implements OnInit {
  private readonly vehiculoService = inject(VehiculoService);
  private readonly avisos = inject(AvisoService);
  private readonly modalController = inject(ModalController);

  readonly fichas = signal<FichaVehiculo[]>([]);
  readonly cargandoInicial = signal(true);
  readonly errorCarga = signal(false);

  readonly activos = computed(() => this.fichas().filter((f) => f.vehiculo.activo));
  readonly inactivos = computed(() => this.fichas().filter((f) => !f.vehiculo.activo));
  /** Modal para elegir vehículo antes de repostar (solo con varios activos). */
  readonly eligiendoVehiculo = signal(false);

  constructor() {
    addIcons({ add, carSportOutline, chevronForwardOutline, cloudOfflineOutline, speedometerOutline, waterOutline });

    // Cambios en vehículos o registros (aquí, en el detalle o en sus hojas) recargan las tarjetas
    let primeraVez = true;
    effect(() => {
      this.vehiculoService.cambios();
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
      const vehiculos = await firstValueFrom(this.vehiculoService.listar());
      // Como mucho 5 vehículos: un resumen por cada uno, en paralelo. Si uno falla, su tarjeta sale sin cifras.
      const resumenes = await Promise.all(
        vehiculos.map((v) => firstValueFrom(this.vehiculoService.resumen(v.id)).catch(() => null)),
      );
      this.fichas.set(vehiculos.map((vehiculo, i) => ({ vehiculo, resumen: resumenes[i] })));
    } catch (error) {
      this.errorCarga.set(!esNoAutorizado(error) && this.fichas().length === 0);
      void this.avisos.errorHttp(error);
    } finally {
      this.cargandoInicial.set(false);
    }
  }

  async refrescar(evento: RefresherCustomEvent): Promise<void> {
    await this.cargar();
    await evento.target.complete();
  }

  async nuevoVehiculo(): Promise<void> {
    if (this.fichas().length >= MAXIMO_VEHICULOS) {
      void this.avisos.advertencia(`Puedes tener como mucho ${MAXIMO_VEHICULOS} vehículos. Elimina o reutiliza uno.`);
      return;
    }
    const resultado = await abrirFormularioVehiculo(this.modalController);
    if (resultado) {
      void this.avisos.exito(MENSAJES_VEHICULO[resultado]);
    }
  }

  /** "+" de repostar: con un solo vehículo activo va directo; con varios, primero se elige cuál. */
  async repostar(): Promise<void> {
    const activos = this.activos();
    if (activos.length === 0) {
      void this.avisos.advertencia('Añade o activa un vehículo para apuntar repostajes.');
    } else if (activos.length === 1) {
      await this.abrirRepostaje(activos[0]);
    } else {
      this.eligiendoVehiculo.set(true);
    }
  }

  async elegirVehiculo(ficha: FichaVehiculo): Promise<void> {
    this.eligiendoVehiculo.set(false);
    await this.abrirRepostaje(ficha);
  }

  private async abrirRepostaje(ficha: FichaVehiculo): Promise<void> {
    const resultado = await abrirFormularioRepostaje(
      this.modalController,
      ficha.vehiculo.id,
      ficha.resumen?.kilometrosActuales ?? null,
    );
    if (resultado) {
      void this.avisos.exito(`Repostaje de ${ficha.vehiculo.nombre} guardado`);
    }
  }

  /** "Seat Ibiza · 1234ABC · 2018", con lo que haya. */
  subtitulo(v: Vehiculo): string {
    return [[v.marca, v.modelo].filter(Boolean).join(' '), v.matricula, v.anio].filter(Boolean).join(' · ');
  }

  /** Resultado de la última ITV ("Favorable") o una raya si no hay ninguna. */
  itv(resumen: ResumenVehiculo): string {
    return resumen.ultimaItvResultado ? RESULTADOS_ITV[resumen.ultimaItvResultado] : '—';
  }

  /** Fecha sin hora ("2026-03-12") a texto corto, leída como local para no cambiar de día. */
  fechaCorta(fecha: string): string {
    const [anio, mes, dia] = fecha.split('-').map(Number);
    return new Date(anio, mes - 1, dia).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}
