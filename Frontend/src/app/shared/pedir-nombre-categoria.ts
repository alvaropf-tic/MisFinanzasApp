import type { AlertController } from '@ionic/angular';

/**
 * Diálogo "Nueva categoría": devuelve el nombre escrito o `null` si se cancela o queda vacío.
 * Las validaciones (2-50 caracteres, nombre repetido) las hace el backend al crearla.
 */
export async function pedirNombreCategoria(alertController: AlertController, ejemplo: string): Promise<string | null> {
  const alerta = await alertController.create({
    header: 'Nueva categoría',
    inputs: [{ name: 'nombre', type: 'text', placeholder: `Ej.: ${ejemplo}`, attributes: { maxlength: 50 } }],
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      { text: 'Crear', role: 'confirm' },
    ],
  });
  await alerta.present();
  const { role, data } = await alerta.onDidDismiss<{ values: { nombre: string } }>();
  const nombre = data?.values.nombre.trim() ?? '';
  return role === 'confirm' && nombre ? nombre : null;
}
