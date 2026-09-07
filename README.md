# Manga Studio

Prototipo web de un editor de manga con composición 2D y estudio de poses 3D.

**Estado actual: Prototipo v0.7.5.** El editor ya permite construir, respaldar y exportar proyectos multipágina desde una interfaz adaptable, accesible por teclado y configurable; el camino hasta la versión 1.0 está definido en [ROADMAP.md](ROADMAP.md).

## Funciones principales

- Editor de viñetas, fondos, personajes, globos y efectos.
- Viñetas seleccionables e independientes, con fondo, efecto y ajustes visuales propios.
- Personajes y globos con recorte configurable para permanecer dentro de la viñeta o atravesar sus bordes.
- Texto editable directamente sobre el lienzo, tipografía, alineación, tracking, interlineado y colas de globo.
- Biblioteca local con búsqueda e importación validada de PNG, JPEG, WebP y SVG seguro.
- Importación local de avatares VRM con consentimiento, validación de tamaño y sustitución del modelo de muestra.
- Exportación PNG, JPEG y WebP por página o lote, con perfiles web/A4/B5, escala, DPI, sangrado y marcas.
- PDF multipágina y respaldo portable `.mangastudio` con recursos, manifiesto y checksums SHA-256.
- Importación validada con vista previa, límites contra ZIP bombs y rechazo de contenido inesperado.
- Proyectos multipágina con IndexedDB, autosave, miniaturas y migración desde v0.3.
- Paneles plegables en escritorio y navegación por áreas en tablet/móvil.
- Tema claro/oscuro/sistema, densidad, movimiento reducido, unidades, calidad 3D y frecuencia de autoguardado persistentes.
- Onboarding, ayuda de atajos, foco visible, anuncios de estado y movimiento del lienzo por teclado.
- Riel de páginas virtualizado, imágenes optimizadas y carga diferida del estudio 3D y el avatar VRM.
- Capas visibles/bloqueables, grupos, orden, selección múltiple, guías y alineación.
- Avatar VRM 1.0 con esqueleto humanoide.
- Doce poses versionadas con torso diferenciado, transición e IK de dos huesos limitado.
- Polos editables de codos/rodillas, bloqueo de pies, espejo y copia lateral.
- Controles de cadera, columna, pecho y cabeza; modo esqueleto y calidad adaptativa.
- Materiales MToon, contorno manga y variaciones de vestuario.
- Cámara orbital con vistas frontal, tres cuartos y perfil, más giro del avatar sobre su propio eje.

## Ejecutar localmente

Necesitas Node.js 20 o una versión más reciente.

```bash
npm install
npm run build
npx serve dist
```

Abre la dirección que muestre `serve`. No abras `dist/index.html` directamente,
porque el navegador debe cargar el archivo VRM desde un servidor local.

## Publicación

Cada cambio enviado a la rama `main` compila y publica automáticamente el contenido de `dist/` mediante GitHub Pages.

## Estructura

- `dist/`: aplicación lista para publicar.
- `src/poser3d-vrm.js`: código fuente del estudio VRM e IK.
- `scripts/strip-vrm-thumbnail.mjs`: preparación reproducible del avatar de muestra.
- `package.json`: versiones y órdenes de construcción.

## Construcción

Después de modificar la interfaz o el estudio 3D:

```bash
npm run build
```

El resultado se escribe en `dist/poser3d.js`.

## Licencias

Consulta `dist/THIRD_PARTY_NOTICES.txt` y `dist/models/NOTICE.txt`.

## Estado del producto

La versión 0.7.5 estabiliza la edición por viñeta: cada panel conserva su fondo y efecto, puede seleccionarse directamente y permite decidir el recorte de cada personaje o globo. También incorpora el giro propio del avatar 3D y sustituye los selectores inestables de preferencias. Todavía es un prototipo: la sincronización es local al dispositivo y la validación manual con lectores de pantalla, Safari y hardware físico continúa antes de la beta.
