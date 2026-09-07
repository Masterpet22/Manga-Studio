# Changelog

## 0.7.0 — 2026-09-07

- Interfaz adaptable con paneles plegables en escritorio y navegación inferior en tablet/móvil.
- Preferencias persistentes de tema, densidad, movimiento, calidad 3D, unidades y autoguardado.
- Onboarding, ayuda de atajos, enlace de salto, foco visible y anuncios accesibles de estado.
- Movimiento de elementos por teclado y controles con nombres asociados.
- Riel de páginas virtualizado con selector directo para proyectos extensos.
- Estudio 3D y avatar VRM cargados bajo demanda; calidad eficiente/alta configurable.
- Personaje inicial optimizado de 1,7 MB a 314 KB y carga diferida de miniaturas.
- Auditoría reproducible de navegador para viewport, overflow, controles y recursos críticos.
- Veintinueve pruebas automatizadas; smoke visual aprobado en escritorio y móvil.

## 0.6.0 — 2026-09-07

- Exportación de una página o lote en PNG, JPEG y WebP a 1×, 2×, 3× o tamaño personalizado.
- Perfiles web, A4 y B5 manga con metadatos DPI, sangrado de 3 mm y marcas de corte.
- PDF multipágina con orden, tamaño físico y metadatos del proyecto.
- Respaldo `.mangastudio` con manifiesto, assets separados y checksums SHA-256.
- Importación portable validada con vista previa, migración y creación no destructiva de un proyecto nuevo.
- Defensas contra rutas ZIP inseguras, duplicados, contenido no declarado, archivos enormes y expansión excesiva.
- Advertencias de resolución, fuentes ausentes y elementos fuera de página.
- Render fuera de pantalla con fallback y presupuesto máximo por lote.
- Veintitrés pruebas automatizadas y smoke tests reales de PNG, PDF, respaldo y round-trip.

## 0.5.0 — 2026-09-07

- Esquema documental v3 con migración automática y ajustes persistentes de viñeta, trama y fondo.
- División/unión de viñetas, canal, borde, inclinación, sangrado y tres plantillas manga.
- Edición directa de texto, tipografías seguras, alineación, tracking, interlineado y padding.
- Globos con cola orientable y variantes de diálogo, pensamiento, grito, narración y efecto.
- Tramas configurables de puntos, velocidad e impacto.
- Fondos importados con escala, posición, opacidad, desenfoque y modo monocromo.
- Biblioteca local con miniaturas, etiquetas, búsqueda y orden reciente.
- Importación validada de PNG/JPEG/WebP/SVG y rechazo de contenido SVG activo.
- Importación VRM con consentimiento, límites de tamaño, validación GLB y carga en el estudio 3D.
- Catorce pruebas automatizadas para documentos, migración, historial, IK y seguridad de archivos.

## 0.4.0 — 2026-09-07

- Esquema documental v2 y migración automática de la página guardada por v0.3.
- Proyectos multipágina en IndexedDB con autosave, recuperación y miniaturas.
- Crear, renombrar, duplicar y eliminar proyectos; añadir, duplicar, borrar y reordenar páginas.
- Historial de comandos por página con deshacer/rehacer y cancelación de gestos.
- Selección múltiple, cajas rotadas, tiradores de escala/rotación, alineación y guías magnéticas.
- Capas renombrables, visibles, bloqueables, agrupables y reordenables.
- Asignación automática y recorte de elementos dentro de viñetas.
- Pipeline reproducible para HTML, CSS, editor 2D y estudio 3D.
- Pruebas de creación, migración e historial documental.

## 0.3.0 — 2026-09-07

- Solver IK determinista de dos huesos con límites angulares para brazos y piernas.
- Polos editables para ambos codos y rodillas; bloqueo de pies y protección del suelo.
- Doce poses versionadas con torso completo y transición suave.
- Controles de cadera, columna, pecho y cabeza.
- Espejo de pose, copia del lado izquierdo al derecho y restablecimiento por grupo.
- Validación de huesos VRM, modo esqueleto, calidad adaptativa y lectura de FPS.
- Pruebas unitarias de alcance, simetría, límites y ley de cosenos.

## 0.2.0 — 2026-09-07

- Primera estabilización del estudio VRM y corrección de lados del esqueleto.
- Seis presets iniciales, captura transparente y publicación con GitHub Pages.
