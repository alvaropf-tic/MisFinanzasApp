// Genera las imágenes base del icono y la pantalla de inicio de la app Android a partir del logo en SVG.
// Uso (desde Frontend/):  node resources/logo.mjs && npx capacitor-assets generate --android
// Salida en assets/: icon-only.png, icon-foreground.png, icon-background.png, splash.png y splash-dark.png
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

// Degradado de la marca: azul (color principal de la app) a violeta (el de la IA)
const fondo = (tam, esquinas = 0) => `
  <defs>
    <linearGradient id="f" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3b82f6"/>
      <stop offset="1" stop-color="#7c3aed"/>
    </linearGradient>
    <radialGradient id="brillo" cx="0.3" cy="0.2" r="0.8">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.28"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${tam}" height="${tam}" rx="${esquinas}" fill="url(#f)"/>
  <rect width="${tam}" height="${tam}" rx="${esquinas}" fill="url(#brillo)"/>`;

// Cartera blanca con una moneda y estrellitas, en una caja de 1024 centrada en (512, 512)
const cartera = `
  <g transform="translate(-56 40)">
    <!-- sombra suave -->
    <rect x="262" y="352" width="520" height="380" rx="84" fill="#1e1b4b" opacity="0.22" transform="translate(0 22)"/>
    <!-- solapa trasera -->
    <path d="M300 372 L640 286 Q690 274 700 324 L712 372 Z" fill="#ffffff" opacity="0.55"/>
    <!-- cuerpo -->
    <rect x="252" y="352" width="520" height="380" rx="84" fill="#ffffff"/>
    <!-- bolsillo del cierre -->
    <rect x="604" y="478" width="200" height="128" rx="64" fill="#e0e7ff"/>
    <circle cx="668" cy="542" r="30" fill="#6366f1"/>
    <!-- estrellitas de la IA -->
    <path d="M770 196 Q782 252 838 264 Q782 276 770 332 Q758 276 702 264 Q758 252 770 196 Z" fill="#fde68a"/>
    <path d="M852 330 Q858 356 884 362 Q858 368 852 394 Q846 368 820 362 Q846 356 852 330 Z" fill="#ffffff"/>
  </g>`;

const svg = (tam, contenido) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${tam}" height="${tam}" viewBox="0 0 ${tam} ${tam}">${contenido}</svg>`);

mkdirSync('assets', { recursive: true });

// Icono completo (Android antiguo y tienda): fondo + cartera
await sharp(svg(1024, fondo(1024) + cartera)).png().toFile('assets/icon-only.png');

// Icono adaptativo (Android 8+): el sistema recorta la forma; la cartera algo más pequeña para la zona segura
await sharp(svg(1024, `<g transform="translate(512 512) scale(0.78) translate(-512 -512)">${cartera}</g>`))
  .png()
  .toFile('assets/icon-foreground.png');
await sharp(svg(1024, fondo(1024))).png().toFile('assets/icon-background.png');

// Pantalla de inicio: el logo redondeado en el centro del degradado (claro) o sobre fondo oscuro
const logoSplash = `<g transform="translate(1366 1366) scale(0.55) translate(-512 -512)">${fondo(1024, 230)}${cartera}</g>`;
await sharp(svg(2732, `<rect width="2732" height="2732" fill="#eef2ff"/>${logoSplash}`))
  .png()
  .toFile('assets/splash.png');
await sharp(svg(2732, `<rect width="2732" height="2732" fill="#121212"/>${logoSplash}`))
  .png()
  .toFile('assets/splash-dark.png');

console.log('Imágenes del logo generadas en assets/');
