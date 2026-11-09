import { Injectable, inject } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

import type { Gasto, OrigenGasto } from '../models/gasto.model';
import type { TipoRegistro } from '../models/vehiculo.model';
import {
  TIPOS_REGISTRO,
  abrirFormularioRegistro,
} from '../pages/registro-vehiculo-form/registro-vehiculo-form.component';
import { abrirFormularioRepostaje } from '../pages/repostaje-form/repostaje-form.component';
import { VehiculoService } from './vehiculo.service';

const REGISTRO_DE: Partial<Record<OrigenGasto, TipoRegistro>> = {
  ACEITE: 'aceite',
  NEUMATICO: 'neumatico',
  MANTENIMIENTO: 'mantenimiento',
  ITV: 'itv',
};

/** Al tocar un gasto de vehículo (en Finanzas o el Calendario) se abre su registro para editarlo. */
@Injectable({ providedIn: 'root' })
export class RegistroGastoService {
  private readonly modalController = inject(ModalController);
  private readonly vehiculoService = inject(VehiculoService);

  /** Devuelve el mensaje de confirmación, o `null` si se cerró sin cambios o no se encontró el registro. */
  async abrir(gasto: Gasto): Promise<string | null> {
    const { vehiculoId, registroId, origen } = gasto;
    if (vehiculoId === null || registroId === null) {
      return null;
    }
    const kilometros = await firstValueFrom(this.vehiculoService.resumen(vehiculoId))
      .then((r) => r.kilometrosActuales)
      .catch(() => null);
    const tipo = REGISTRO_DE[origen];
    if (tipo) {
      const registro = (await firstValueFrom(this.vehiculoService.registros(vehiculoId, tipo))).find(
        (r) => r.id === registroId,
      );
      if (!registro) {
        return null;
      }
      const resultado = await abrirFormularioRegistro(this.modalController, tipo, vehiculoId, kilometros, registro);
      return resultado === 'guardado' || resultado === 'eliminado'
        ? `${TIPOS_REGISTRO[tipo].nombre} ${resultado === 'guardado' ? 'actualizado' : 'eliminado'}`
        : null;
    }
    const repostaje = (await firstValueFrom(this.vehiculoService.repostajes(vehiculoId))).find(
      (r) => r.id === registroId,
    );
    if (!repostaje) {
      return null;
    }
    const resultado = await abrirFormularioRepostaje(this.modalController, vehiculoId, kilometros, repostaje);
    return resultado === 'guardado'
      ? 'Repostaje actualizado'
      : resultado === 'eliminado'
        ? 'Repostaje eliminado'
        : null;
  }
}
