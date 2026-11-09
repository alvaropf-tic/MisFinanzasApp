import { Component, computed, input } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { CabeceraPantallaComponent } from '../../shared/cabecera-pantalla/cabecera-pantalla.component';

/** Cuándo se revisaron los textos. Al cambiarlos, subir también VERSION_TERMINOS en UsuarioService (backend). */
const ACTUALIZADO = '8 de noviembre de 2026';

/** Términos de uso o política de privacidad (según `documento`, de los datos de la ruta). Se ven sin sesión. */
@Component({
  selector: 'app-legal',
  templateUrl: 'legal.page.html',
  styleUrls: ['legal.page.scss'],
  imports: [CabeceraPantallaComponent, IonContent],
})
export class LegalPage {
  readonly documento = input.required<'privacidad' | 'terminos'>();
  readonly titulo = computed(() => (this.documento() === 'privacidad' ? 'Política de privacidad' : 'Términos de uso'));
  readonly actualizado = ACTUALIZADO;
}
