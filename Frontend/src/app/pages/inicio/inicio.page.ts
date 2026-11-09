import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, type OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  ModalController,
  type RefresherCustomEvent,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addOutline,
  arrowDownOutline,
  cameraOutline,
  scanOutline,
  arrowUpOutline,
  chevronForwardOutline,
  cloudOfflineOutline,
  createOutline,
  pieChartOutline,
  repeatOutline,
  statsChartOutline,
  trophyOutline,
} from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';

import { MovementCardComponent } from '../../components/movement-card/movement-card.component';
import { AvisoService } from '../../core/aviso.service';
import { esNoAutorizado } from '../../core/mensaje-error';
import { type Movimiento, esGasto } from '../../models/movimiento.model';
import type { Presupuesto } from '../../models/presupuesto.model';
import type { ResumenMensual } from '../../models/resumen.model';
import { GastoService } from '../../services/gasto.service';
import { IngresoService } from '../../services/ingreso.service';
import { PresupuestoService } from '../../services/presupuesto.service';
import { ResumenService } from '../../services/resumen.service';
import { VehiculoService } from '../../services/vehiculo.service';
import { CabeceraComponent } from '../../shared/cabecera/cabecera.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { PagoRecurrenteComponent } from '../../shared/pago-recurrente/pago-recurrente.component';
import { FilaObjetivoComponent } from '../../shared/fila-objetivo/fila-objetivo.component';
import type { Objetivo } from '../../models/objetivo.model';
import { ObjetivoService } from '../../services/objetivo.service';
import type { Recurrente } from '../../models/recurrente.model';
import { RecurrenteService } from '../../services/recurrente.service';
import { TicketService } from '../../services/ticket.service';
import { EscanerTicketService } from '../../services/escaner-ticket.service';
import { PresupuestoFormComponent } from '../presupuesto-form/presupuesto-form.component';
import { monedaActual } from '../../core/moneda';

const ULTIMOS_MOVIMIENTOS = 5;
const FORMATO_EUROS = new Intl.NumberFormat('es-ES', { style: 'currency', currency: monedaActual() });
const PROXIMOS_PAGOS = 3;

/** Estado del presupuesto para el color de la barra y el mensaje. */
type EstadoPresupuesto = 'bien' | 'atencion' | 'superado';

/**
 * Pestaña Inicio: lo importante del mes actual. Saldo, presupuesto con la barra de lo gastado
 * y lo previsto, próximos pagos y cobros recurrentes y últimos movimientos.
 */
@Component({
  selector: 'app-inicio',
  templateUrl: 'inicio.page.html',
  styleUrls: ['inicio.page.scss'],
  imports: [
    CurrencyPipe,
    DecimalPipe,
    RouterLink,
    CabeceraComponent,
    EmptyStateComponent,
    MovementCardComponent,
    PagoRecurrenteComponent,
    FilaObjetivoComponent,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonButton,
    IonIcon,
    IonList,
    IonSpinner,
  ],
})
export class InicioPage implements OnInit {
  private readonly resumenService = inject(ResumenService);
  private readonly presupuestoService = inject(PresupuestoService);
  private readonly recurrenteService = inject(RecurrenteService);
  private readonly objetivoService = inject(ObjetivoService);
  private readonly ticketService = inject(TicketService);
  private readonly vehiculoService = inject(VehiculoService);
  private readonly gastoService = inject(GastoService);
  private readonly ingresoService = inject(IngresoService);
  private readonly avisos = inject(AvisoService);
  private readonly modalController = inject(ModalController);
  private readonly escaner = inject(EscanerTicketService);

  readonly cargandoInicial = signal(true);
  readonly errorCarga = signal(false);

  readonly resumen = signal<ResumenMensual | null>(null);
  readonly presupuesto = signal<Presupuesto | null>(null);
  readonly proximosPagos = signal<Recurrente[]>([]);
  /** Objetivos en curso (los dos más avanzados). */
  readonly objetivos = signal<Objetivo[]>([]);
  readonly ultimos = signal<Movimiento[]>([]);

  /** Mes mostrado (el actual), p. ej. "Noviembre 2026". */
  readonly fecha = signal(new Date());
  readonly nombreMes = computed(() => {
    const texto = this.fecha().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).replace(' de ', ' ');
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  });

  /** Anchos de la barra (0-100): lo gastado en sólido y lo previsto detrás, más claro. */
  readonly barra = computed(() => {
    const p = this.presupuesto();
    return {
      gastado: Math.min(p?.porcentajeGastado ?? 0, 100),
      previsto: Math.min(p?.porcentajePrevision ?? 0, 100),
    };
  });

  readonly estado = computed<EstadoPresupuesto>(() => {
    const p = this.presupuesto();
    if (!p || p.gastado > p.importe) {
      return 'superado';
    }
    return p.prevision > p.importe || p.porcentajeGastado >= 80 ? 'atencion' : 'bien';
  });

  /** Frase bajo la barra según cómo va el mes. */
  readonly mensajePresupuesto = computed(() => {
    const p = this.presupuesto();
    if (!p) {
      return '';
    }
    const euros = (importe: number) => FORMATO_EUROS.format(importe);
    switch (this.estado()) {
      case 'superado':
        return `Te has pasado ${euros(p.gastado - p.importe)} del presupuesto.`;
      case 'atencion':
        return p.prevision > p.importe
          ? `Con los pagos previstos te pasarás ${euros(p.prevision - p.importe)}.`
          : `Te quedan ${euros(p.restante)}. Ve con cuidado.`;
      default:
        return `Te quedan ${euros(p.restante)} · previsto a fin de mes ${euros(p.prevision)}.`;
    }
  });

  constructor() {
    addIcons({
      addOutline,
      arrowDownOutline,
      cameraOutline,
      scanOutline,
      arrowUpOutline,
      chevronForwardOutline,
      cloudOfflineOutline,
      createOutline,
      pieChartOutline,
      repeatOutline,
      statsChartOutline,
      trophyOutline,
    });

    // Al crear, cambiar o borrar un recurrente cambian los próximos pagos, la previsión y quizá los gastos
    let primeraVez = true;
    effect(() => {
      // Los registros de vehículos también crean y cambian gastos
      this.recurrenteService.cambios();
      this.vehiculoService.cambios();
      // Y los tickets que se pasan a gastos desde la pestaña IA
      this.ticketService.cambios();
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

  /**
   * Las pestañas se quedan en memoria: al volver (p. ej. tras apuntar algo en Finanzas) se recarga.
   * La primera carga va en ngOnInit porque Ionic no siempre lanza este evento al entrar por URL.
   */
  ionViewWillEnter(): void {
    if (!this.cargandoInicial()) {
      void this.cargar();
    }
  }

  /** Mismo flujo que en la pestaña IA: foto, lectura y la hoja del gasto (o del vehículo) rellenada. */
  async escanearTicket(): Promise<void> {
    const mensaje = await this.escaner.escanear();
    if (mensaje) {
      void this.avisos.exito(mensaje);
    }
  }

  async refrescar(evento: RefresherCustomEvent): Promise<void> {
    await this.cargar();
    await evento.target.complete();
  }

  async cargar(): Promise<void> {
    const hoy = new Date();
    this.fecha.set(hoy);
    const anio = hoy.getFullYear();
    const mes = hoy.getMonth() + 1;
    this.errorCarga.set(false);
    try {
      // Los objetivos son secundarios: si fallan, la tarjeta sale vacía y el resto de Inicio sigue
      void firstValueFrom(this.objetivoService.listar())
        .then((lista) =>
          this.objetivos.set(
            lista
              .filter((o) => !o.completado)
              .sort((a, b) => b.porcentaje - a.porcentaje)
              .slice(0, 2),
          ),
        )
        .catch(() => this.objetivos.set([]));
      const [resumen, presupuesto, recurrentes, gastos, ingresos] = await Promise.all([
        firstValueFrom(this.resumenService.obtener(anio, mes)),
        firstValueFrom(this.presupuestoService.obtener(anio, mes)),
        firstValueFrom(this.recurrenteService.listar()),
        firstValueFrom(this.gastoService.listar({ page: 0, size: ULTIMOS_MOVIMIENTOS })),
        firstValueFrom(this.ingresoService.listar({ page: 0, size: ULTIMOS_MOVIMIENTOS })),
      ]);
      this.resumen.set(resumen);
      this.presupuesto.set(presupuesto);
      this.proximosPagos.set(
        recurrentes
          .filter((r) => r.activo)
          .sort((a, b) => a.proximaFecha.localeCompare(b.proximaFecha))
          .slice(0, PROXIMOS_PAGOS),
      );
      // Los N más recientes de todos están entre los N primeros de cada lista
      this.ultimos.set(
        [...gastos.contenido, ...ingresos.contenido]
          .sort((a, b) => b.fecha.localeCompare(a.fecha))
          .slice(0, ULTIMOS_MOVIMIENTOS),
      );
    } catch (error) {
      // Con un 401 el interceptor ya está volviendo al login: no se muestra el estado de error
      this.errorCarga.set(!esNoAutorizado(error) && this.resumen() === null);
      void this.avisos.errorHttp(error);
    } finally {
      this.cargandoInicial.set(false);
    }
  }

  async editarPresupuesto(): Promise<void> {
    const fecha = this.fecha();
    const modal = await this.modalController.create({
      component: PresupuestoFormComponent,
      componentProps: { presupuesto: this.presupuesto(), anio: fecha.getFullYear(), mes: fecha.getMonth() + 1 },
      // Tiene poco contenido: hoja a media altura en vez de pantalla completa
      breakpoints: [0, 0.65],
      initialBreakpoint: 0.65,
      handle: true,
      // Mantiene el botón de guardar (ion-footer) visible aunque la hoja no esté a pantalla completa
      expandToScroll: false,
    });
    await modal.present();
    const { role } = await modal.onWillDismiss();
    if (role === 'guardado' || role === 'eliminado') {
      void this.avisos.exito(role === 'guardado' ? 'Presupuesto guardado' : 'Presupuesto eliminado');
      await this.cargar();
    }
  }

  /** Los ids se repiten entre gastos e ingresos: la clave incluye el tipo. */
  clave(movimiento: Movimiento): string {
    return `${esGasto(movimiento) ? 'gasto' : 'ingreso'}:${movimiento.id}`;
  }
}
