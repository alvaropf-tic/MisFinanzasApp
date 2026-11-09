import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

/**
 * Pide la foto del ticket. Devuelve `null` si se cancela.
 * - En la app Android: menú nativo para hacer la foto con la cámara o elegirla de la galería.
 * - En el navegador: el selector de fotos del sistema (en el móvil también ofrece la cámara). Hay que llamarla
 *   directamente desde el clic (el navegador solo lo permite así).
 */
export function elegirFoto(): Promise<File | null> {
  return Capacitor.isNativePlatform() ? fotoNativa() : fotoNavegador();
}

async function fotoNativa(): Promise<File | null> {
  try {
    const foto = await Camera.getPhoto({
      source: CameraSource.Prompt,
      resultType: CameraResultType.Uri,
      quality: 85,
      width: 1600,
      correctOrientation: true,
      promptLabelHeader: 'Foto del ticket',
      promptLabelPhoto: 'Elegir de la galería',
      promptLabelPicture: 'Hacer una foto',
      promptLabelCancel: 'Cancelar',
    });
    if (!foto.webPath) {
      return null;
    }
    const datos = await (await fetch(foto.webPath)).blob();
    return new File([datos], `ticket.${foto.format || 'jpeg'}`, { type: datos.type || 'image/jpeg' });
  } catch {
    // Cancelado o sin permiso: como si no se hubiera elegido nada
    return null;
  }
}

function fotoNavegador(): Promise<File | null> {
  return new Promise((resolver) => {
    const entrada = document.createElement('input');
    entrada.type = 'file';
    entrada.accept = 'image/jpeg,image/png,image/webp';
    entrada.addEventListener('change', () => resolver(entrada.files?.[0] ?? null), { once: true });
    entrada.addEventListener('cancel', () => resolver(null), { once: true });
    entrada.click();
  });
}
