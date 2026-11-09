/** Lado mayor con el que se guardan las fotos: de sobra para leer un ticket y muy por debajo del límite de 5 MB. */
const LADO_MAXIMO = 1600;

/** Formatos que acepta el backend. */
export const FORMATOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];

/** Dibuja la imagen; algunos navegadores no la abren con createImageBitmap pero sí con <img>. */
async function abrirImagen(archivo: Blob): Promise<ImageBitmap | HTMLImageElement | null> {
  try {
    return await createImageBitmap(archivo);
  } catch {
    const url = URL.createObjectURL(archivo);
    try {
      const imagen = new Image();
      imagen.src = url;
      await imagen.decode();
      return imagen;
    } catch {
      return null;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

/**
 * Reduce una foto (las del móvil suelen pasar de 5 MB) a JPEG de como mucho 1600 px de lado.
 * Si el navegador no puede abrirla (p. ej. HEIC de iPhone en un ordenador) se devuelve tal cual:
 * quien la usa comprueba el tipo con `FORMATOS_IMAGEN`.
 */
export async function reducirImagen(archivo: Blob, calidad = 0.82): Promise<Blob> {
  const mapa = await abrirImagen(archivo);
  if (!mapa) {
    return archivo;
  }
  const escala = Math.min(1, LADO_MAXIMO / Math.max(mapa.width, mapa.height));
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(mapa.width * escala);
  lienzo.height = Math.round(mapa.height * escala);
  const contexto = lienzo.getContext('2d');
  if (!contexto) {
    cerrar(mapa);
    return archivo;
  }
  // Fondo blanco por si llega un PNG con transparencia (JPEG no la tiene)
  contexto.fillStyle = '#fff';
  contexto.fillRect(0, 0, lienzo.width, lienzo.height);
  contexto.drawImage(mapa, 0, 0, lienzo.width, lienzo.height);
  cerrar(mapa);
  const resultado = await new Promise<Blob | null>((resolver) => lienzo.toBlob(resolver, 'image/jpeg', calidad));
  return resultado ?? archivo;
}

function cerrar(mapa: ImageBitmap | HTMLImageElement): void {
  if ('close' in mapa) {
    mapa.close();
  }
}
