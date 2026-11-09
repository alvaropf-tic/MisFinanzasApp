import { Injectable, inject } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

import type { LecturaTicket, TicketEscaneado, TipoTicket } from '../models/ticket.model';
import type { TipoRegistro, Vehiculo } from '../models/vehiculo.model';
import { abrirGastoDesdeTicket, mensajeMovimiento } from '../pages/movimiento-form/movimiento-form.component';
import {
  TIPOS_REGISTRO,
  abrirFormularioRegistro,
} from '../pages/registro-vehiculo-form/registro-vehiculo-form.component';
import { abrirFormularioRepostaje } from '../pages/repostaje-form/repostaje-form.component';
import { elegirFoto } from '../shared/escanear-ticket';
import { VehiculoService } from './vehiculo.service';

/** Tipo de ticket de vehículo → hoja de registro que le corresponde. */
const REGISTRO_DE: Partial<Record<TipoTicket, TipoRegistro>> = {
  ITV: 'itv',
  ACEITE: 'aceite',
  NEUMATICOS: 'neumatico',
  MANTENIMIENTO: 'mantenimiento',
};

/**
 * Escanear un ticket: foto → la IA lo lee → hoja de gasto rellena. Si es de un vehículo (ITV, repostaje…),
 * abre en su lugar la hoja del registro del vehículo, rellena y con la foto, que se guarda con su gasto.
 */
@Injectable({ providedIn: 'root' })
export class EscanerTicketService {
  private readonly modalController = inject(ModalController);
  private readonly alertController = inject(AlertController);
  private readonly vehiculoService = inject(VehiculoService);

  /**
   * Llamar directamente desde el clic (el selector de fotos solo se abre así). Devuelve el mensaje de
   * confirmación, o `null` si se canceló.
   */
  async escanear(): Promise<string | null> {
    const foto = await elegirFoto();
    if (!foto) {
      return null;
    }
    let paso = await abrirGastoDesdeTicket(this.modalController, 'gasto', null, null, foto);
    while (paso.vehiculo) {
      const { foto: reducida, lectura } = paso.vehiculo;
      const enVehiculo = await this.registrarEnVehiculo(reducida, lectura);
      if (enVehiculo !== 'gasto-normal') {
        return enVehiculo;
      }
      // Prefiere un gasto normal: misma foto y misma lectura, sin volver a llamar a la IA
      paso = await abrirGastoDesdeTicket(this.modalController, 'gasto', null, null, reducida, lectura);
    }
    return paso.resultado ? mensajeMovimiento('gasto', paso.resultado) : null;
  }

  private async registrarEnVehiculo(foto: Blob, lectura: LecturaTicket): Promise<string | 'gasto-normal' | null> {
    const activos = (await firstValueFrom(this.vehiculoService.listar())).filter((v) => v.activo);
    const vehiculo =
      activos.find((v) => v.id === lectura.vehiculoId) ??
      (activos.length === 1 ? activos[0] : await this.elegirVehiculo(activos, lectura.tipo));
    if (!vehiculo) {
      return activos.length === 0 ? 'gasto-normal' : null;
    }
    let kilometros: number | null = null;
    try {
      kilometros = (await firstValueFrom(this.vehiculoService.resumen(vehiculo.id))).kilometrosActuales;
    } catch {
      // Sin resumen se proponen sin km: el usuario los escribe
    }
    const nombreTipo = lectura.tipo === 'REPOSTAJE' ? 'un repostaje' : `${this.articulo(lectura.tipo)}`;
    const ticket: TicketEscaneado = {
      foto,
      lectura,
      mensaje: `Parece ${nombreTipo} de tu ${vehiculo.nombre}. Revisa los datos antes de guardar.`,
    };
    const registro = REGISTRO_DE[lectura.tipo];
    const resultado = registro
      ? await abrirFormularioRegistro(this.modalController, registro, vehiculo.id, kilometros, null, ticket)
      : await abrirFormularioRepostaje(this.modalController, vehiculo.id, kilometros, null, ticket);
    if (resultado === 'gasto-normal') {
      return 'gasto-normal';
    }
    if (resultado !== 'guardado') {
      return null;
    }
    return registro ? `${TIPOS_REGISTRO[registro].nombre} guardado con su ticket` : 'Repostaje guardado con su ticket';
  }

  /** "una ITV", "un cambio de aceite"… para el aviso de la hoja. */
  private articulo(tipo: TipoTicket): string {
    const registro = REGISTRO_DE[tipo];
    if (!registro) {
      return 'un gasto';
    }
    const nombre = TIPOS_REGISTRO[registro].nombre;
    const femenino = tipo === 'ITV';
    return `${femenino ? 'una' : 'un'} ${tipo === 'ITV' ? 'ITV' : nombre.charAt(0).toLowerCase() + nombre.slice(1)}`;
  }

  /** Con varios vehículos y sin matrícula reconocida: se pregunta cuál. */
  private async elegirVehiculo(activos: Vehiculo[], tipo: TipoTicket): Promise<Vehiculo | null> {
    if (activos.length === 0) {
      return null;
    }
    const alerta = await this.alertController.create({
      header: tipo === 'REPOSTAJE' ? '¿Qué vehículo has repostado?' : '¿De qué vehículo es el ticket?',
      inputs: activos.map((v, i) => ({
        type: 'radio' as const,
        label: v.matricula ? `${v.nombre} · ${v.matricula}` : v.nombre,
        value: v.id,
        checked: i === 0,
      })),
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Aceptar', role: 'confirm' },
      ],
    });
    await alerta.present();
    const { data, role } = await alerta.onDidDismiss<{ values: number }>();
    return role === 'confirm' ? (activos.find((v) => v.id === data?.values) ?? null) : null;
  }
}
