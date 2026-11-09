import { Injectable, signal } from '@angular/core';

export type Tema = 'sistema' | 'claro' | 'oscuro';
export type Acento = 'azul' | 'indigo' | 'violeta' | 'turquesa' | 'naranja' | 'rosa';

/** Colores que se pueden elegir; `muestra` es el tono del tema claro para pintar el círculo. */
export const ACENTOS: { valor: Acento; nombre: string; muestra: string }[] = [
  { valor: 'azul', nombre: 'Azul', muestra: '#0054e9' },
  { valor: 'indigo', nombre: 'Índigo', muestra: '#4338ca' },
  { valor: 'violeta', nombre: 'Violeta', muestra: '#7e22ce' },
  { valor: 'turquesa', nombre: 'Turquesa', muestra: '#0f766e' },
  { valor: 'naranja', nombre: 'Naranja', muestra: '#c2410c' },
  { valor: 'rosa', nombre: 'Rosa', muestra: '#be185d' },
];

/** Misma clave que lee el script de index.html para pintar la app con el tema correcto desde el primer instante. */
const CLAVE = 'mf.apariencia';

/**
 * Tema (claro, oscuro o el del sistema) y color de acento. Se guardan en el dispositivo y se aplican
 * con clases en <html>: `ion-palette-dark` (paleta oscura de Ionic) y `acento-<color>` (theme/acentos.scss).
 */
@Injectable({ providedIn: 'root' })
export class AparienciaService {
  readonly tema = signal<Tema>('sistema');
  readonly acento = signal<Acento>('azul');

  private readonly sistemaOscuro = window.matchMedia('(prefers-color-scheme: dark)');

  /** Se llama al arrancar la app. */
  iniciar(): void {
    try {
      const guardada = JSON.parse(localStorage.getItem(CLAVE) ?? '{}') as { tema?: Tema; acento?: Acento };
      if (guardada.tema === 'claro' || guardada.tema === 'oscuro' || guardada.tema === 'sistema') {
        this.tema.set(guardada.tema);
      }
      if (ACENTOS.some((a) => a.valor === guardada.acento)) {
        this.acento.set(guardada.acento as Acento);
      }
    } catch {
      // Sin almacenamiento: valores por defecto
    }
    // Con "Sistema", si el móvil cambia de claro a oscuro, la app le sigue
    this.sistemaOscuro.addEventListener('change', () => this.aplicar());
    this.aplicar();
  }

  cambiarTema(tema: Tema): void {
    this.tema.set(tema);
    this.guardarYAplicar();
  }

  cambiarAcento(acento: Acento): void {
    this.acento.set(acento);
    this.guardarYAplicar();
  }

  private guardarYAplicar(): void {
    try {
      localStorage.setItem(CLAVE, JSON.stringify({ tema: this.tema(), acento: this.acento() }));
    } catch {
      // Se aplica igual, aunque no se recuerde
    }
    this.aplicar();
  }

  private aplicar(): void {
    const tema = this.tema();
    const oscuro = tema === 'oscuro' || (tema === 'sistema' && this.sistemaOscuro.matches);
    const raiz = document.documentElement;
    raiz.classList.toggle('ion-palette-dark', oscuro);
    for (const { valor } of ACENTOS) {
      raiz.classList.toggle(`acento-${valor}`, valor === this.acento() && valor !== 'azul');
    }
    // Barra del navegador / del sistema en el color de la cabecera
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', getComputedStyle(raiz).getPropertyValue('--ion-color-primary').trim());
    }
  }
}
