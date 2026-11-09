import { Injectable, inject, signal } from '@angular/core';
import { type Observable, map, tap } from 'rxjs';

import { ApiService } from '../core/api.service';
import type {
  RegistroBase,
  RegistroVehiculo,
  RegistroVehiculoDatos,
  Repostaje,
  RepostajeRegistro,
  ResumenVehiculo,
  TipoRegistro,
  Vehiculo,
  VehiculoRegistro,
} from '../models/vehiculo.model';

/** Vehículos y sus registros. Cada registro crea y mantiene su propio gasto en el backend. */
/** Segmento de la URL de cada tipo de registro: /vehiculos/{id}/<ruta>. */
const RUTA_REGISTRO: Record<TipoRegistro, string> = {
  aceite: 'aceites',
  neumatico: 'neumaticos',
  mantenimiento: 'mantenimientos',
  itv: 'itv',
};

@Injectable({ providedIn: 'root' })
export class VehiculoService {
  private readonly api = inject(ApiService);

  /**
   * Sube cada vez que cambia un vehículo o un registro. Lo observan la lista, el detalle
   * y Finanzas (los registros crean gastos) para recargarse.
   */
  readonly cambios = signal(0);

  listar(): Observable<Vehiculo[]> {
    return this.api.get<Vehiculo[]>('/vehiculos');
  }

  obtener(id: number): Observable<Vehiculo> {
    return this.api.get<Vehiculo>(`/vehiculos/${id}`);
  }

  resumen(id: number): Observable<ResumenVehiculo> {
    return this.api.get<ResumenVehiculo>(`/vehiculos/${id}/resumen`);
  }

  /** 409 si ya hay 5 vehículos. */
  crear(datos: VehiculoRegistro): Observable<Vehiculo> {
    return this.api.post<Vehiculo>('/vehiculos', datos).pipe(tap(() => this.avisarCambio()));
  }

  actualizar(id: number, datos: VehiculoRegistro): Observable<Vehiculo> {
    return this.api.put<Vehiculo>(`/vehiculos/${id}`, datos).pipe(tap(() => this.avisarCambio()));
  }

  /** Alterna activo / inactivo. */
  cambiarEstado(id: number): Observable<Vehiculo> {
    return this.api.patch<Vehiculo>(`/vehiculos/${id}/estado`).pipe(tap(() => this.avisarCambio()));
  }

  /** 409 si tiene registros: en ese caso hay que desactivarlo. */
  eliminar(id: number): Observable<void> {
    return this.api.delete(`/vehiculos/${id}`).pipe(tap(() => this.avisarCambio()));
  }

  /** Más reciente primero. */
  repostajes(vehiculoId: number): Observable<Repostaje[]> {
    return this.api.get<Repostaje[]>(`/vehiculos/${vehiculoId}/repostajes`);
  }

  crearRepostaje(vehiculoId: number, datos: RepostajeRegistro): Observable<Repostaje> {
    return this.api.post<Repostaje>(`/vehiculos/${vehiculoId}/repostajes`, datos).pipe(tap(() => this.avisarCambio()));
  }

  actualizarRepostaje(vehiculoId: number, id: number, datos: RepostajeRegistro): Observable<Repostaje> {
    return this.api
      .put<Repostaje>(`/vehiculos/${vehiculoId}/repostajes/${id}`, datos)
      .pipe(tap(() => this.avisarCambio()));
  }

  eliminarRepostaje(vehiculoId: number, id: number): Observable<void> {
    return this.api.delete(`/vehiculos/${vehiculoId}/repostajes/${id}`).pipe(tap(() => this.avisarCambio()));
  }

  /** Registros de un tipo, más reciente primero, marcados con su tipo para el historial. */
  registros(vehiculoId: number, tipo: TipoRegistro): Observable<RegistroVehiculo[]> {
    return this.api
      .get<Omit<RegistroVehiculo, 'tipoRegistro'>[]>(`/vehiculos/${vehiculoId}/${RUTA_REGISTRO[tipo]}`)
      .pipe(map((lista) => lista.map((r) => ({ ...r, tipoRegistro: tipo }) as RegistroVehiculo)));
  }

  crearRegistro(vehiculoId: number, tipo: TipoRegistro, datos: RegistroVehiculoDatos): Observable<RegistroBase> {
    return this.api
      .post<RegistroBase>(`/vehiculos/${vehiculoId}/${RUTA_REGISTRO[tipo]}`, datos)
      .pipe(tap(() => this.avisarCambio()));
  }

  actualizarRegistro(
    vehiculoId: number,
    tipo: TipoRegistro,
    id: number,
    datos: RegistroVehiculoDatos,
  ): Observable<unknown> {
    return this.api
      .put(`/vehiculos/${vehiculoId}/${RUTA_REGISTRO[tipo]}/${id}`, datos)
      .pipe(tap(() => this.avisarCambio()));
  }

  eliminarRegistro(vehiculoId: number, tipo: TipoRegistro, id: number): Observable<void> {
    return this.api
      .delete(`/vehiculos/${vehiculoId}/${RUTA_REGISTRO[tipo]}/${id}`)
      .pipe(tap(() => this.avisarCambio()));
  }

  private avisarCambio(): void {
    this.cambios.update((n) => n + 1);
  }
}
