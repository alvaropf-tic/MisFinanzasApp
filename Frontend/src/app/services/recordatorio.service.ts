import { Injectable, inject, signal } from '@angular/core';
import { type Observable, tap } from 'rxjs';

import { ApiService } from '../core/api.service';
import type { Recordatorio, RecordatorioRegistro } from '../models/recordatorio.model';

/** Recordatorios del calendario (seguros, revisiones, renovar el DNI…). */
@Injectable({ providedIn: 'root' })
export class RecordatorioService {
  private readonly api = inject(ApiService);

  readonly cambios = signal(0);

  listar(): Observable<Recordatorio[]> {
    return this.api.get<Recordatorio[]>('/recordatorios');
  }

  crear(datos: RecordatorioRegistro): Observable<Recordatorio> {
    return this.api.post<Recordatorio>('/recordatorios', datos).pipe(tap(() => this.avisar()));
  }

  actualizar(id: number, datos: RecordatorioRegistro): Observable<Recordatorio> {
    return this.api.put<Recordatorio>(`/recordatorios/${id}`, datos).pipe(tap(() => this.avisar()));
  }

  eliminar(id: number): Observable<void> {
    return this.api.delete(`/recordatorios/${id}`).pipe(tap(() => this.avisar()));
  }

  private avisar(): void {
    this.cambios.update((n) => n + 1);
  }
}
