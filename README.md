# Manga Studio

Prototipo web de un editor de manga con composición 2D y estudio de poses 3D.

**Estado actual: Prototipo v0.4.0.** El editor ya maneja proyectos multipágina recuperables y ofrece un estudio de pose anatómico; el camino hasta la versión 1.0 está definido en [ROADMAP.md](ROADMAP.md).

## Funciones principales

- Editor de viñetas, fondos, personajes, globos y efectos.
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

La versión 0.4.0 completa el núcleo documental: esquema migrable, proyectos y páginas guardados en IndexedDB, historial por página y herramientas de capas/transformación. Todavía es un prototipo: hay un solo personaje de muestra, la sincronización es local al dispositivo y faltan pruebas de integración visual con varios avatares.
