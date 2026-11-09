import { CurrencyPipe } from '@angular/common';
import { Component, type OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonList,
  IonModal,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  ModalController,
  NavController,
  type RefresherCustomEvent,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  add,
  calendarClearOutline,
  carSportOutline,
  chevronBackOutline,
  chevronForwardOutline,
  cloudOfflineOutline,
  notificationsOutline,
  repeatOutline,
  todayOutline,
  trendingDownOutline,
  trendingUpOutline,
} from 'ionicons/icons';
import { type Observable, firstValueFrom } from 'rxjs';

import { MovementCardComponent } from '../../components/movement-card/movement-card.component';
import { AvisoService } from '../../core/aviso.service';
import { esNoAutorizado } from '../../core/mensaje-error';
import { type Movimiento, esGasto } from '../../models/movimiento.model';
import type { Pagina } from '../../models/pagina.model';
import { GastoService } from '../../services/gasto.service';
import { IngresoService } from '../../services/ingreso.service';
import { VehiculoService } from '../../services/vehiculo.service';
import { CabeceraComponent } from '../../shared/cabecera/cabecera.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { cobrosEnMes, diasDelMes, recordatorioEnMes, textoFecha } from '../../shared/proyeccion-recurrentes';
import type { Recordatorio } from '../../models/recordatorio.model';
import { RecordatorioService } from '../../services/recordatorio.service';
import { MENSAJES_RECORDATORIO, abrirFormularioRecordatorio } from '../recordatorio-form/recordatorio-form.component';
import type { Recurrente } from '../../models/recurrente.model';
import { RecurrenteService } from '../../services/recurrente.service';
import { RegistroGastoService } from '../../services/registro-gasto.service';
import { TicketService } from '../../services/ticket.service';
import {
  ORIGENES_VEHICULO,
  abrirFormularioMovimiento,
  mensajeMovimiento,
} from '../movimiento-form/movimiento-form.component';
import { abrirFormularioRecurrente, mensajeRecurrente } from '../recurrente-form/recurrente-form.component';

/** Página máxima que admite el backend: se piden las que hagan falta para tener el mes completo. */
const TAMANIO_PAGINA = 100;
const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

interface Mes {
  anio: number;
  mes: number;
}

/** Cobro previsto de un recurrente en un día. */
interface Previsto {
  clave: string;
  fecha: string;
  recurrente: Recurrente;
}

/** Recordatorio o ITV que toca un día. */
interface Aviso {
  clave: string;
  fecha: string;
  titulo: string;
  subtitulo: string;
  recordatorio: Recordatorio | null;
  /** En las ITV: el vehículo, para ir a él al tocarlo. */
  vehiculoId: number | null;
}

/** Celda de la rejilla: un día con lo que tiene. Los de otros meses rellenan la primera y la última semana. */
interface Dia {
  fecha: string;
  numero: number;
  delMes: boolean;
  gastos: number;
  ingresos: number;
  previstos: number;
  avisos: number;
}

const hoyTexto = (): string => {
  const hoy = new Date();
  return textoFecha(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate());
};

/**
 * Pestaña Calendario: el mes en una rejilla con puntos por día (gastos, ingresos y cobros previstos de los
 * pagos recurrentes) y, debajo, lo que hay el día elegido. Los registros de vehículos aparecen como sus gastos.
 */
@Component({
  selector: 'app-calendario',
  templateUrl: 'calendario.page.html',
  styleUrls: ['calendario.page.scss'],
  imports: [
    CurrencyPipe,
    CabeceraComponent,
    EmptyStateComponent,
    MovementCardComponent,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonButton,
    IonIcon,
    IonList,
    IonModal,
    IonSpinner,
  ],
})
export class CalendarioPage implements OnInit {
  private readonly gastoService = inject(GastoService);
  private readonly ingresoService = inject(IngresoService);
  private readonly recurrenteService = inject(RecurrenteService);
  private readonly ticketService = inject(TicketService);
  private readonly registroGasto = inject(RegistroGastoService);
  private readonly vehiculoService = inject(VehiculoService);
  private readonly recordatorioService = inject(RecordatorioService);
  private readonly avisos = inject(AvisoService);
  private readonly modalController = inject(ModalController);
  private readonly navController = inject(NavController);

  readonly diasSemana = DIAS_SEMANA;
  readonly hoy = signal(hoyTexto());
  readonly mes = signal<Mes>({ anio: new Date().getFullYear(), mes: new Date().getMonth() + 1 });
  readonly seleccionado = signal(hoyTexto());
  /** Modal de "Añadir" del día elegido. */
  readonly eligiendoTipo = signal(false);

  readonly cargandoInicial = signal(true);
  readonly cargando = signal(false);
  readonly errorCarga = signal(false);

  private readonly movimientos = signal<Movimiento[]>([]);
  private readonly recurrentes = signal<Recurrente[]>([]);
  private readonly recordatorios = signal<Recordatorio[]>([]);
  /** Próxima ITV de cada vehículo activo. */
  private readonly itvs = signal<{ vehiculoId: number; nombre: string; fecha: string }[]>([]);

  /** "Noviembre 2026" */
  readonly nombreMes = computed(() => {
    const texto = new Date(this.mes().anio, this.mes().mes - 1, 1)
      .toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      .replace(' de ', ' ');
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  });

  /** Cobros previstos del mes, de todos los recurrentes activos. */
  private readonly previstos = computed<Previsto[]>(() => {
    const { anio, mes } = this.mes();
    return this.recurrentes().flatMap((r) =>
      cobrosEnMes(r, anio, mes).map((fecha) => ({ clave: `${r.tipo}:${r.id}:${fecha}`, fecha, recurrente: r })),
    );
  });

  /** Recordatorios y próximas ITV que caen en el mes. */
  private readonly avisosDelMes = computed<Aviso[]>(() => {
    const { anio, mes } = this.mes();
    const lista: Aviso[] = [];
    for (const r of this.recordatorios()) {
      const fecha = recordatorioEnMes(r, anio, mes);
      if (fecha) {
        const repite = r.repeticion === 'MENSUAL' ? 'Cada mes' : r.repeticion === 'ANUAL' ? 'Cada año' : 'Recordatorio';
        lista.push({
          clave: `r:${r.id}:${fecha}`,
          fecha,
          titulo: r.titulo,
          subtitulo: r.nota ? `${repite} · ${r.nota}` : repite,
          recordatorio: r,
          vehiculoId: null,
        });
      }
    }
    for (const itv of this.itvs()) {
      if (itv.fecha.startsWith(textoFecha(anio, mes, 1).substring(0, 7))) {
        lista.push({
          clave: `itv:${itv.vehiculoId}`,
          fecha: itv.fecha,
          titulo: `ITV · ${itv.nombre}`,
          subtitulo: 'Fecha aproximada: compruébala en tu tarjeta ITV',
          recordatorio: null,
          vehiculoId: itv.vehiculoId,
        });
      }
    }
    return lista;
  });

  /** Movimientos y previstos agrupados por día ("2026-11-04"). */
  private readonly porDia = computed(() => {
    const mapa = new Map<string, { movimientos: Movimiento[]; previstos: Previsto[]; avisos: Aviso[] }>();
    const de = (fecha: string) => {
      let grupo = mapa.get(fecha);
      if (!grupo) {
        grupo = { movimientos: [], previstos: [], avisos: [] };
        mapa.set(fecha, grupo);
      }
      return grupo;
    };
    for (const m of this.movimientos()) {
      de(m.fecha.substring(0, 10)).movimientos.push(m);
    }
    for (const p of this.previstos()) {
      de(p.fecha).previstos.push(p);
    }
    for (const a of this.avisosDelMes()) {
      de(a.fecha).avisos.push(a);
    }
    return mapa;
  });

  /** Semanas de lunes a domingo que cubren el mes. */
  readonly semanas = computed<Dia[][]>(() => {
    const { anio, mes } = this.mes();
    const desfase = (new Date(anio, mes - 1, 1).getDay() + 6) % 7; // 0 = lunes
    const total = Math.ceil((desfase + diasDelMes(anio, mes)) / 7) * 7;
    const porDia = this.porDia();
    const dias: Dia[] = [];
    for (let i = 0; i < total; i++) {
      const fecha = new Date(anio, mes - 1, 1 - desfase + i);
      const texto = textoFecha(fecha.getFullYear(), fecha.getMonth() + 1, fecha.getDate());
      const contenido = porDia.get(texto);
      const movimientos = contenido?.movimientos ?? [];
      dias.push({
        fecha: texto,
        numero: fecha.getDate(),
        delMes: fecha.getMonth() + 1 === mes,
        gastos: movimientos.filter((m) => esGasto(m)).length,
        ingresos: movimientos.filter((m) => !esGasto(m)).length,
        previstos: contenido?.previstos.length ?? 0,
        avisos: contenido?.avisos.length ?? 0,
      });
    }
    return Array.from({ length: total / 7 }, (_, s) => dias.slice(s * 7, s * 7 + 7));
  });

  /**
   * Totales del mes: lo gastado, lo ingresado y el neto que falta de los recurrentes (cobros previstos menos
   * pagos previstos).
   */
  readonly totales = computed(() => {
    const movimientos = this.movimientos();
    const suma = (lista: { importe: number }[]) => lista.reduce((t, x) => t + x.importe, 0);
    return {
      gastos: suma(movimientos.filter((m) => esGasto(m))),
      ingresos: suma(movimientos.filter((m) => !esGasto(m))),
      previsto: this.previstos().reduce(
        (t, p) => t + (p.recurrente.tipo === 'ingreso' ? p.recurrente.importe : -p.recurrente.importe),
        0,
      ),
    };
  });

  /** Lo del día elegido: movimientos (más reciente primero) y cobros previstos. */
  readonly delDia = computed(() => {
    const contenido = this.porDia().get(this.seleccionado());
    return {
      movimientos: [...(contenido?.movimientos ?? [])].sort((a, b) => b.fecha.localeCompare(a.fecha)),
      previstos: contenido?.previstos ?? [],
      avisos: contenido?.avisos ?? [],
    };
  });

  /** "4 de noviembre", para el título del modal de añadir. */
  readonly nombreDiaCorto = computed(() => {
    const [anio, mes, dia] = this.seleccionado().split('-').map(Number);
    return new Date(anio, mes - 1, dia).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  });

  /** "Martes, 4 de noviembre" */
  readonly nombreDia = computed(() => {
    const [anio, mes, dia] = this.seleccionado().split('-').map(Number);
    const texto = new Date(anio, mes - 1, dia).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  });

  constructor() {
    addIcons({
      add,
      calendarClearOutline,
      chevronBackOutline,
      chevronForwardOutline,
      carSportOutline,
      cloudOfflineOutline,
      notificationsOutline,
      repeatOutline,
      todayOutline,
      trendingDownOutline,
      trendingUpOutline,
    });

    // Cambios en recurrentes o en registros de vehículos (que crean gastos) recargan el mes
    let primeraVez = true;
    effect(() => {
      this.recurrenteService.cambios();
      this.vehiculoService.cambios();
      // Y los tickets que se pasan a gastos desde la pestaña IA
      this.ticketService.cambios();
      this.recordatorioService.cambios();
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

  /** Al volver a la pestaña (p. ej. tras apuntar algo en Finanzas) se recarga; la primera carga va en ngOnInit. */
  ionViewWillEnter(): void {
    if (!this.cargandoInicial()) {
      this.hoy.set(hoyTexto());
      void this.cargar();
    }
  }

  cambiarMes(n: number): void {
    const { anio, mes } = this.mes();
    const destino = new Date(anio, mes - 1 + n, 1);
    this.irAMes({ anio: destino.getFullYear(), mes: destino.getMonth() + 1 });
  }

  irAHoy(): void {
    const hoy = hoyTexto();
    this.hoy.set(hoy);
    const [anio, mes] = hoy.split('-').map(Number);
    this.irAMes({ anio, mes }, hoy);
  }

  /** Un día de otro mes (los de relleno) lleva a ese mes. */
  elegir(dia: Dia): void {
    if (dia.delMes) {
      this.seleccionado.set(dia.fecha);
      return;
    }
    const [anio, mes] = dia.fecha.split('-').map(Number);
    this.irAMes({ anio, mes }, dia.fecha);
  }

  async refrescar(evento: RefresherCustomEvent): Promise<void> {
    await this.cargar();
    await evento.target.complete();
  }

  async abrirMovimiento(movimiento: Movimiento): Promise<void> {
    // Los gastos de vehículos se editan en su registro: se abre su hoja aquí mismo
    if (esGasto(movimiento) && ORIGENES_VEHICULO.includes(movimiento.origen)) {
      const mensaje = await this.registroGasto.abrir(movimiento);
      if (mensaje) {
        void this.avisos.exito(mensaje);
        await this.cargar();
      }
      return;
    }
    const tipo = esGasto(movimiento) ? 'gasto' : 'ingreso';
    const resultado = await abrirFormularioMovimiento(this.modalController, tipo, movimiento);
    if (resultado) {
      void this.avisos.exito(mensajeMovimiento(tipo, resultado));
      await this.cargar();
    }
  }

  /** "Añadir" del día elegido: la hoja se abre con ese día ya puesto. */
  async anadir(tipo: 'gasto' | 'ingreso' | 'recurrente' | 'recordatorio'): Promise<void> {
    this.eligiendoTipo.set(false);
    const fecha = this.seleccionado();
    if (tipo === 'recordatorio') {
      const resultado = await abrirFormularioRecordatorio(this.modalController, null, fecha);
      if (resultado) {
        void this.avisos.exito(MENSAJES_RECORDATORIO[resultado]);
      }
      return;
    }
    if (tipo === 'recurrente') {
      const cierre = await abrirFormularioRecurrente(this.modalController, 'gasto', null, fecha);
      if (cierre) {
        void this.avisos.exito(mensajeRecurrente(cierre));
      }
      return;
    }
    const resultado = await abrirFormularioMovimiento(this.modalController, tipo, null, fecha);
    if (resultado) {
      void this.avisos.exito(mensajeMovimiento(tipo, resultado));
      await this.cargar();
    }
  }

  async abrirPrevisto(previsto: Previsto): Promise<void> {
    const cierre = await abrirFormularioRecurrente(this.modalController, previsto.recurrente.tipo, previsto.recurrente);
    if (cierre) {
      void this.avisos.exito(mensajeRecurrente(cierre));
    }
  }

  /** Texto del día para lectores de pantalla: "3, 1 gasto, 1 ingreso". */
  etiquetaDia(dia: Dia): string {
    const contar = (n: number, singular: string, plural: string) => (n ? `, ${n} ${n === 1 ? singular : plural}` : '');
    return (
      `${dia.numero}` +
      contar(dia.gastos, 'gasto', 'gastos') +
      contar(dia.ingresos, 'ingreso', 'ingresos') +
      contar(dia.previstos, 'cobro previsto', 'cobros previstos') +
      contar(dia.avisos, 'recordatorio', 'recordatorios')
    );
  }

  /** Los ids se repiten entre gastos e ingresos: la clave incluye el tipo. */
  clave(movimiento: Movimiento): string {
    return `${esGasto(movimiento) ? 'gasto' : 'ingreso'}:${movimiento.id}`;
  }

  async cargar(): Promise<void> {
    const { anio, mes } = this.mes();
    const filtro = { desde: textoFecha(anio, mes, 1), hasta: textoFecha(anio, mes, diasDelMes(anio, mes)) };
    this.cargando.set(true);
    this.errorCarga.set(false);
    try {
      // Recordatorios e ITV son secundarios: si fallan, el calendario sigue con lo demás
      void this.cargarAvisos();
      const [gastos, ingresos, recurrentes] = await Promise.all([
        this.todasLasPaginas((page) => this.gastoService.listar({ ...filtro, page, size: TAMANIO_PAGINA })),
        this.todasLasPaginas((page) => this.ingresoService.listar({ ...filtro, page, size: TAMANIO_PAGINA })),
        firstValueFrom(this.recurrenteService.listar()),
      ]);
      // Si mientras tanto se cambió de mes, esta respuesta ya no vale
      if (anio !== this.mes().anio || mes !== this.mes().mes) {
        return;
      }
      this.movimientos.set([...gastos, ...ingresos]);
      this.recurrentes.set(recurrentes);
    } catch (error) {
      this.errorCarga.set(!esNoAutorizado(error) && this.cargandoInicial());
      void this.avisos.errorHttp(error);
    } finally {
      this.cargandoInicial.set(false);
      this.cargando.set(false);
    }
  }

  /** Toca un aviso: un recordatorio se edita; una ITV lleva a su vehículo. */
  async abrirAviso(aviso: Aviso): Promise<void> {
    if (aviso.vehiculoId !== null) {
      await this.navController.navigateForward(['/vehiculos', aviso.vehiculoId]);
      return;
    }
    const resultado = await abrirFormularioRecordatorio(this.modalController, aviso.recordatorio);
    if (resultado) {
      void this.avisos.exito(MENSAJES_RECORDATORIO[resultado]);
    }
  }

  private async cargarAvisos(): Promise<void> {
    try {
      const [recordatorios, vehiculos] = await Promise.all([
        firstValueFrom(this.recordatorioService.listar()),
        firstValueFrom(this.vehiculoService.listar()),
      ]);
      this.recordatorios.set(recordatorios);
      const activos = vehiculos.filter((v) => v.activo);
      const resumenes = await Promise.all(
        activos.map((v) => firstValueFrom(this.vehiculoService.resumen(v.id)).catch(() => null)),
      );
      this.itvs.set(
        activos.flatMap((v, i) => {
          const fecha = resumenes[i]?.proximaItvFecha;
          return fecha ? [{ vehiculoId: v.id, nombre: v.nombre, fecha }] : [];
        }),
      );
    } catch {
      // Sin avisos: el resto del calendario funciona igual
    }
  }

  private irAMes(mes: Mes, dia?: string): void {
    this.mes.set(mes);
    // En el mes actual se elige hoy; en otro, el día indicado o el 1
    const hoy = this.hoy();
    const esActual = hoy.startsWith(textoFecha(mes.anio, mes.mes, 1).substring(0, 7));
    this.seleccionado.set(dia ?? (esActual ? hoy : textoFecha(mes.anio, mes.mes, 1)));
    void this.cargar();
  }

  private async todasLasPaginas<T>(pedir: (pagina: number) => Observable<Pagina<T>>): Promise<T[]> {
    const elementos: T[] = [];
    let pagina = 0;
    let totalPaginas = 1;
    while (pagina < totalPaginas) {
      const respuesta = await firstValueFrom(pedir(pagina));
      elementos.push(...respuesta.contenido);
      totalPaginas = respuesta.totalPaginas;
      pagina++;
    }
    return elementos;
  }
}
