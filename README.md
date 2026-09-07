# Manga Studio

Prototipo web de un editor de manga con composición 2D y estudio de poses 3D.

**Estado actual: Prototipo v0.6.0.** El editor ya permite construir, respaldar y exportar proyectos multipágina para web o impresión; el camino hasta la versión 1.0 está definido en [ROADMAP.md](ROADMAP.md).

## Funciones principales

- Editor de viñetas, fondos, personajes, globos y efectos.
- Viñetas ajustables, plantillas, sangrado, tramas configurables y fondos transformables.
- Texto editable directamente sobre el lienzo, tipografía, alineación, tracking, interlineado y colas de globo.
- Biblioteca local con búsqueda e importación validada de PNG, JPEG, WebP y SVG seguro.
- Importación local de avatares VRM con consentimiento, validación de tamaño y sustitución del modelo de muestra.
- Exportación PNG, JPEG y WebP por página o lote, con perfiles web/A4/B5, escala, DPI, sangrado y marcas.
- PDF multipágina y respaldo portable `.mangastudio` con recursos, manifiesto y checksums SHA-256.
- Importación validada con vista previa, límites contra ZIP bombs y rechazo de contenido inesperado.
- Proyectos multipágina con IndexedDB, autosave, miniaturas y migración desde v0.3.
- Capas visibles/bloqueables, grupos, orden, selección múltiple, guías y alineación.
- Exportación de páginas a PNG.
- Avatar VRM 1.0 con esqueleto humanoide.
- Doce poses versionadas con torso diferenciado, transición e IK de dos huesos limitado.
- Polos editables de codos/rodillas, bloqueo de pies, espejo y copia lateral.
- Controles de cadera, columna, pecho y cabeza; modo esqueleto y calidad adaptativa.
- Materiales MToon, contorno manga y variaciones de vestuario.
- Cámara orbital con vistas frontal, tres cuartos y perfil.

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

La versión 0.6.0 completa la salida e interoperabilidad: exporta imágenes y PDF multipágina, incorpora perfiles de impresión y permite mover un proyecto íntegro entre navegadores mediante `.mangastudio`. Todavía es un prototipo: la sincronización es local al dispositivo y faltan las rondas amplias de accesibilidad, rendimiento y compatibilidad multinavegador.
