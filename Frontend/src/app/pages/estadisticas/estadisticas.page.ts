import { CurrencyPipe } from '@angular/common';
import { Component, type OnInit, computed, inject, signal } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  type RefresherCustomEvent,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronBackOutline, chevronForwardOutline, cloudOfflineOutline } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';

import { AvisoService } from '../../core/aviso.service';
import { esNoAutorizado } from '../../core/mensaje-error';
import type { TotalMensual, TotalPorCategoria, TotalPorMetodoPago } from '../../models/estadistica.model';
import { METODOS_PAGO } from '../../models/gasto.model';
import type { ResumenMensual } from '../../models/resumen.model';
import { EstadisticaService } from '../../services/estadistica.service';
import { ResumenService } from '../../services/resumen.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { BarrasRankingComponent, type ParteDelTotal } from '../../shared/graficos/barras-ranking.component';
import { ColumnasMesesComponent, claveMes } from '../../shared/graficos/columnas-meses.component';
import { CabeceraPantallaComponent } from '../../shared/cabecera-pantalla/cabecera-pantalla.component';

/** Meses que muestra la evolución (ver finEvolucion). */
const MESES_EVOLUCION = 12;

interface Mes {
  anio: number;
  mes: number;
}

const mesDe = (fecha: Date): Mes => ({ anio: fecha.getFullYear(), mes: fecha.getMonth() + 1 });
const sumarMeses = ({ anio, mes }: Mes, n: number): Mes => mesDe(new Date(anio, mes - 1 + n, 1));

/**
 * Estadísticas de un mes: cuánto se gastó (con ingresos y saldo), la evolución del gasto en los últimos
 * 12 meses y el reparto de gastos e ingresos por categoría y de gastos por método de pago.
 */
@Component({
  selector: 'app-estadisticas',
  templateUrl: 'estadisticas.page.html',
  styleUrls: ['estadisticas.page.scss'],
  imports: [
    CabeceraPantallaComponent,
    CurrencyPipe,
    EmptyStateComponent,
    BarrasRankingComponent,
    ColumnasMesesComponent,
    IonButton,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonIcon,
    IonSpinner,
  ],
})
export class EstadisticasPage implements OnInit {
  private readonly estadisticaService = inject(EstadisticaService);
  private readonly resumenService = inject(ResumenService);
  private readonly avisos = inject(AvisoService);

  private readonly actual = mesDe(new Date());
  readonly mes = signal<Mes>(this.actual);
  readonly esMesActual = computed(
    () => claveMes(this.mes().anio, this.mes().mes) === claveMes(this.actual.anio, this.actual.mes),
  );
  readonly claveSeleccionada = computed(() => claveMes(this.mes().anio, this.mes().mes));
  /** "Noviembre 2026" */
  readonly nombreMes = computed(() => {
    const texto = new Date(this.mes().anio, this.mes().mes - 1, 1)
      .toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      .replace(' de ', ' ');
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  });
  /** "noviembre", para las frases. */
  readonly nombreMesCorto = computed(() =>
    new Date(this.mes().anio, this.mes().mes - 1, 1).toLocaleDateString('es-ES', { month: 'long' }),
  );

  readonly cargandoInicial = signal(true);
  readonly cargando = signal(false);
  readonly errorCarga = signal(false);

  readonly resumen = signal<ResumenMensual | null>(null);
  readonly evolucion = signal<TotalMensual[]>([]);
  private readonly porCategoria = signal<TotalPorCategoria[]>([]);
  private readonly ingresosCategoria = signal<TotalPorCategoria[]>([]);
  private readonly porMetodo = signal<TotalPorMetodoPago[]>([]);

  readonly gastosCategoria = computed<ParteDelTotal[]>(() =>
    this.porCategoria().map((c) => ({ etiqueta: c.categoriaNombre, valor: c.total })),
  );
  readonly ingresosPorCategoria = computed<ParteDelTotal[]>(() =>
    this.ingresosCategoria().map((c) => ({ etiqueta: c.categoriaNombre, valor: c.total })),
  );
  readonly gastosMetodo = computed<ParteDelTotal[]>(() =>
    this.porMetodo().map((m) => ({
      etiqueta: METODOS_PAGO.find((x) => x.valor === m.metodoPago)?.etiqueta ?? m.metodoPago,
      valor: m.total,
    })),
  );
  /** Media de gasto de los meses de la evolución que tienen algún gasto. */
  readonly mediaMensual = computed(() => {
    const conGasto = this.evolucion().filter((m) => m.total > 0);
    return conGasto.length > 0 ? conGasto.reduce((t, m) => t + m.total, 0) / conGasto.length : null;
  });

  constructor() {
    addIcons({ chevronBackOutline, chevronForwardOutline, cloudOfflineOutline });
  }

  ngOnInit(): void {
    void this.cargar();
  }

  cambiarMes(n: number): void {
    const siguiente = sumarMeses(this.mes(), n);
    // No se avanza más allá del mes actual
    if (claveMes(siguiente.anio, siguiente.mes) > claveMes(this.actual.anio, this.actual.mes)) {
      return;
    }
    this.mes.set(siguiente);
    void this.cargar();
  }

  elegirMes(total: TotalMensual): void {
    this.mes.set({ anio: total.anio, mes: total.mes });
    void this.cargar();
  }

  /**
   * Último mes de la evolución: el actual mientras el elegido esté entre los 12 últimos (así las columnas
   * no se mueven al tocar una); si se va más atrás, la ventana termina en el elegido.
   */
  private finEvolucion(): Mes {
    const elegido = this.mes();
    const desdeElegido = (this.actual.anio - elegido.anio) * 12 + (this.actual.mes - elegido.mes);
    return desdeElegido < MESES_EVOLUCION ? this.actual : elegido;
  }

  async refrescar(evento: RefresherCustomEvent): Promise<void> {
    await this.cargar();
    await evento.target.complete();
  }

  async cargar(): Promise<void> {
    const { anio, mes } = this.mes();
    this.cargando.set(true);
    this.errorCarga.set(false);
    try {
      const [resumen, porCategoria, ingresos, porMetodo, evolucion] = await Promise.all([
        firstValueFrom(this.resumenService.obtener(anio, mes)),
        firstValueFrom(this.estadisticaService.gastosPorCategoria(anio, mes)),
        firstValueFrom(this.estadisticaService.ingresosPorCategoria(anio, mes)),
        firstValueFrom(this.estadisticaService.gastosPorMetodoPago(anio, mes)),
        firstValueFrom(
          this.estadisticaService.evolucionGastos(
            sumarMeses(this.finEvolucion(), -(MESES_EVOLUCION - 1)),
            this.finEvolucion(),
          ),
        ),
      ]);
      this.resumen.set(resumen);
      this.porCategoria.set(porCategoria);
      this.ingresosCategoria.set(ingresos);
      this.porMetodo.set(porMetodo);
      this.evolucion.set(evolucion);
    } catch (error) {
      this.errorCarga.set(!esNoAutorizado(error) && this.resumen() === null);
      void this.avisos.errorHttp(error);
    } finally {
      this.cargandoInicial.set(false);
      this.cargando.set(false);
    }
  }
}
