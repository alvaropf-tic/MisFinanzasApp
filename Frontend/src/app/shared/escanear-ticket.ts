/**
 * Abre el selector de fotos del sistema: en el móvil ofrece hacer la foto con la cámara o elegirla de la
 * galería. Hay que llamarla directamente desde el clic (el navegador solo lo permite así).
 * Devuelve `null` si se cancela.
 */
export function elegirFoto(): Promise<File | null> {
  return new Promise((resolver) => {
    const entrada = document.createElement('input');
    entrada.type = 'file';
    entrada.accept = 'image/jpeg,image/png,image/webp';
    entrada.addEventListener('change', () => resolver(entrada.files?.[0] ?? null), { once: true });
    entrada.addEventListener('cancel', () => resolver(null), { once: true });
    entrada.click();
  });
}
