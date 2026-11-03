import { Component, type OnInit, computed, inject, signal } from '@angular/core';
import {
  type InfiniteScrollCustomEvent,
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  ModalController,
  type RefresherCustomEvent,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, cloudOfflineOutline, logOutOutline, walletOutline } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';

import { MovementCardComponent } from '../../components/movement-card/movement-card.component';
import { AuthService } from '../../core/auth.service';
import { AvisoService } from '../../core/aviso.service';
import { esNoAutorizado } from '../../core/mensaje-error';
import type { Gasto } from '../../models/gasto.model';
import { GastoService } from '../../services/gasto.service';
import { GastoFormComponent } from '../gasto-form/gasto-form.component';

const TAMANIO_PAGINA = 20;

@Component({
  selector: 'app-gastos',
  templateUrl: 'gastos.page.html',
  styleUrls: ['gastos.page.scss'],
  imports: [
    MovementCardComponent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonList,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonFab,
    IonFabButton,
    IonSpinner,
    IonText,
  ],
})
export class GastosPage implements OnInit {
  private readonly gastoService = inject(GastoService);
  private readonly auth = inject(AuthService);
  private readonly avisos = inject(AvisoService);
  private readonly modalController = inject(ModalController);

  readonly nombreUsuario = this.auth.nombreUsuario;
  readonly gastos = signal<Gasto[]>([]);
  readonly totalElementos = signal(0);
  readonly cargandoInicial = signal(true);
  readonly errorCarga = signal(false);

  private readonly paginaActual = signal(-1);
  private readonly totalPaginas = signal(0);
  readonly hayMas = computed(() => this.paginaActual() + 1 < this.totalPaginas());

  constructor() {
    addIcons({ add, logOutOutline, walletOutline, cloudOfflineOutline });
  }

  ngOnInit(): void {
    void this.recargar();
  }

  /** Vuelve a cargar desde la primera página (al entrar, al refrescar y tras crear un gasto). */
  async recargar(): Promise<void> {
    this.errorCarga.set(false);
    try {
      const pagina = await this.cargarPagina(0);
      this.gastos.set(pagina.contenido);
    } catch (error) {
      // Con un 401 el interceptor ya está volviendo al login: no se muestra el estado de error
      this.errorCarga.set(!esNoAutorizado(error) && this.gastos().length === 0);
      void this.avisos.errorHttp(error);
    } finally {
      this.cargandoInicial.set(false);
    }
  }

  async cargarMas(evento: InfiniteScrollCustomEvent): Promise<void> {
    try {
      const pagina = await this.cargarPagina(this.paginaActual() + 1);
      // Si se ha creado un gasto entretanto, la página siguiente puede repetir alguno
      const ids = new Set(this.gastos().map((g) => g.id));
      this.gastos.update((actuales) => [...actuales, ...pagina.contenido.filter((g) => !ids.has(g.id))]);
    } catch (error) {
      void this.avisos.errorHttp(error);
    } finally {
      await evento.target.complete();
    }
  }

  async refrescar(evento: RefresherCustomEvent): Promise<void> {
    await this.recargar();
    await evento.target.complete();
  }

  async nuevoGasto(): Promise<void> {
    const modal = await this.modalController.create({ component: GastoFormComponent });
    await modal.present();
    const { role } = await modal.onWillDismiss();
    if (role === 'creado') {
      void this.avisos.exito('Gasto guardado');
      await this.recargar();
    }
  }

  cerrarSesion(): void {
    void this.auth.cerrarSesion();
  }

  private async cargarPagina(numero: number) {
    const pagina = await firstValueFrom(this.gastoService.listar({ page: numero, size: TAMANIO_PAGINA }));
    this.paginaActual.set(pagina.pagina);
    this.totalPaginas.set(pagina.totalPaginas);
    this.totalElementos.set(pagina.totalElementos);
    return pagina;
  }
}
