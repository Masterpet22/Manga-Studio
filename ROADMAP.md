# Roadmap de Manga Studio hacia 1.0

Última actualización: 7 de septiembre de 2026  
Estado actual: **Prototipo v0.7.6**

## Visión de 1.0

Manga Studio 1.0 será un editor web estable para crear páginas de manga a partir de viñetas, personajes 2D/3D, globos, fondos y efectos; permitirá guardar proyectos, recuperar el trabajo, posar personajes sin deformaciones, organizar páginas y exportar resultados listos para compartir o imprimir.

La promesa central es: **pasar de una página en blanco a una página de manga terminada sin salir del navegador y sin perder el trabajo**.

## Diagnóstico del prototipo actual

### Lo que ya funciona

- Lienzo de 600 × 800 px con tres distribuciones de viñetas.
- Elementos movibles y escalables: personaje, diálogo, grito, pensamiento, narración y efecto.
- Fondos procedurales, selección, inspector, deshacer/rehacer en memoria y exportación PNG.
- Persistencia básica de una página en `localStorage`.
- Avatar VRM 1.0, cámara orbital, captura transparente, materiales y contorno.
- Seis accesos de pose y cuatro objetivos IK.

### Brechas críticas encontradas

1. **Rig 3D:** las coordenadas izquierda/derecha estaban codificadas desde la pantalla y no desde el esqueleto. El solver CCD no tenía polo de flexión, límites ni alcance, de modo que extremidades podían cruzarse o doblarse al revés.
2. **Poses:** los presets sólo desplazaban manos y pies y aplicaban una rotación mínima de columna. No construían una línea de acción con cadera, pecho y cabeza.
3. **Modelo de documento:** existe una sola página, un solo estado global y una única clave de guardado. No hay proyectos, miniaturas, duplicado, renombrado ni recuperación.
4. **Edición 2D:** la selección usa cajas sin rotación, no hay orden de capas, bloqueo, alineación, recorte por viñeta ni edición directa de texto.
5. **Calidad:** no existen pruebas automáticas, telemetría de errores, presupuesto de rendimiento ni matriz de navegadores/dispositivos.
6. **Distribución:** `dist/` contiene tanto artefactos como fuentes de la interfaz; falta separar fuente, compilación reproducible y publicación.
7. **Contenido y legal:** sólo hay un avatar de muestra. Falta un flujo de importación y validación de licencias/consentimiento VRM.
8. **Accesibilidad y móvil:** la interfaz responde a tamaños pequeños, pero el flujo no está validado con teclado, lector de pantalla, tacto ni ampliación de texto.

## Principios de ejecución

- Una fase termina sólo al cumplir sus criterios de salida y pruebas, no por calendario.
- Los formatos de proyecto y pose se versionan desde el inicio y siempre incluyen migraciones.
- El editor nunca debe perder cambios confirmados; las operaciones destructivas deben poder deshacerse.
- El rig prioriza anatomía estable y previsibilidad antes que libertad total.
- Cada versión conserva un proyecto de prueba reproducible y una checklist de regresión.
- Las funciones que no mejoren crear, posar, guardar u obtener una página terminada quedan fuera de 1.0.

## Fase 0 — Estabilización (v0.2.0) — completada en esta entrega

**Objetivo:** nombrar el estado real y eliminar el fallo 3D más visible.

Entregables:

- Etiqueta visible `PROTOTIPO v0.2.0` y versión sincronizada en `package.json`.
- Objetivos IK posicionados según el lado real del esqueleto, no según un signo fijo de pantalla.
- Solver analítico de dos huesos con alcance limitado y polos de flexión para codos/rodillas.
- Presets con transformaciones diferenciadas de cadera, columna, pecho y cabeza.
- Build reproducible del módulo 3D y publicación continua en GitHub Pages.
- Este roadmap y diagnóstico incluidos en el repositorio.

Criterios de salida:

- Las seis poses no cruzan brazos o piernas por un error izquierda/derecha.
- Codos y rodillas conservan un sentido de flexión estable al mover los objetivos.
- La compilación de producción termina sin errores.

## Fase 1 — Rig anatómico y estudio de pose usable (v0.3.0) — completada

**Objetivo:** convertir el visor 3D en una herramienta confiable de referencia artística.

Trabajo:

- Añadir límites por articulación para hombro, codo, muñeca, cadera, rodilla, tobillo, cuello y columna.
- Incorporar polos editables de codo y rodilla, con controles visuales y restablecimiento por extremidad.
- Crear manipuladores para cadera, pecho, cabeza, mirada y centro de masa.
- Mantener pies sobre el suelo y ofrecer bloqueo de pie/mano.
- Sustituir sliders incrementales por controles absolutos para evitar deriva.
- Definir poses como datos versionados: objetivos, polos, torso, cámara y expresión.
- Diseñar 12 poses: neutral, heroica, acción, carrera, defensa, saludo, caminar, salto, caída, sentado, agachado y conversación.
- Añadir espejo de pose, copiar/pegar lado y transición visual entre presets.
- Validar VRM 0.x/1.0 y mostrar mensajes concretos ante huesos o extensiones faltantes.
- Añadir modo esqueleto, nombres de articulaciones al enfocar y visibilidad de nodos.
- Medir FPS, carga, memoria y captura; degradar sombras/pixel ratio en equipos modestos.

Pruebas:

- Tests unitarios para alcance, simetría, polos y límites del solver.
- Fixtures de al menos tres avatares con proporciones distintas.
- Prueba de cada pose en vista frontal, ¾ y perfil.
- Cero `NaN`, inversiones espontáneas o saltos mayores al cambiar un control.

Criterio de salida: una persona obtiene una silueta distinta y anatómicamente coherente en menos de un minuto, aplica la captura y repite el flujo sin recargar.

Implementado en v0.3.0: solver determinista con límites angulares, polos editables, pies fijables y suelo protegido, controles de cadera/columna/pecho/cabeza, 12 poses versionadas, espejo y copia lateral, transición entre presets, validación de huesos requeridos, modo esqueleto, calidad adaptativa, lectura FPS y pruebas unitarias. La ampliación a una matriz de avatares importados queda vinculada al flujo de importación seguro de la fase 3.

## Fase 2 — Núcleo del editor y documentos (v0.4.0) — completada

**Objetivo:** que editar una página sea preciso, reversible y recuperable.

Trabajo:

- Migrar la interfaz fuente fuera de `dist/` y crear un pipeline único para HTML, CSS, editor y 3D.
- Definir esquema `MangaProject` versionado: metadatos, páginas, paneles, capas, assets y preferencias.
- Implementar autosave transaccional con IndexedDB, indicador y recuperación tras cierre inesperado.
- Crear gestor de proyectos: nuevo, abrir, renombrar, duplicar y eliminar con recuperación.
- Añadir varias páginas con miniaturas, reordenamiento y duplicado.
- Sustituir snapshots JSON por comandos reversibles; unificar deshacer/rehacer.
- Mejorar selección con cajas rotadas, tiradores, rotación directa y multiselección.
- Añadir capas: orden, visibilidad, bloqueo, renombrado y grupos.
- Recortar contenido por viñeta y mover elementos entre viñetas.
- Añadir guías, ajuste a bordes/centros, alineación y navegación de zoom/pan consistente.
- Permitir Escape para cancelar gestos y confirmar sólo acciones destructivas.

Pruebas:

- Migración desde v0.2 y recuperación de datos corruptos parciales.
- Secuencias de 100 acciones con undo/redo exacto.
- Persistencia tras recarga, cierre forzado y actualización de versión.
- Interacciones de puntero, tacto y teclado.

Criterio de salida: un proyecto de diez páginas sobrevive recargas y sesiones, y toda edición principal se puede deshacer sin inconsistencias.

Implementado en v0.4.0: esquema `MangaProject` v2 con migración del documento legado, IndexedDB y autosave con miniaturas; gestor para crear, renombrar, duplicar y eliminar proyectos; páginas añadibles, duplicables, eliminables y reordenables; historial de comandos por página; selección múltiple, movimiento, escala y rotación directa; guías y alineación; capas con orden, nombre, visibilidad, bloqueo y grupos; asignación y recorte por viñeta; cancelación con Escape y pipeline reproducible desde `src/` hacia `dist/`.

## Fase 3 — Herramientas manga y biblioteca (v0.5.0) — completada

**Objetivo:** producir páginas ricas sin depender de software externo.

Trabajo:

- Editor de viñetas: dividir, fusionar, márgenes, sangrado, bordes y formas inclinadas.
- Texto directo en lienzo, tipografías seguras, alineación, tracking, interlineado y estilos.
- Globos con cola editable, orientación, padding y variantes.
- Tramas con densidad, escala, ángulo y máscara; velocidad e impacto configurables.
- Fondos importados con transformación, opacidad, desenfoque y ajustes monocromos.
- Importar PNG/JPEG/WebP/SVG seguro con validación de tamaño, tipo y errores.
- Biblioteca local con miniaturas, etiquetas, búsqueda y recientes.
- Importación VRM con consentimiento/licencia visible, límites y fallback.
- Plantillas iniciales de página opcionales.

Pruebas: texto largo y CJK/latino; fuentes ausentes; archivos válidos, dañados y enormes; comparación visual de tramas y globos.

Criterio de salida: se puede crear una página original completa usando assets propios, texto y efectos configurables.

Implementado en v0.5.0: esquema documental v3 con migración automática; división y unión de viñetas, canal, borde, inclinación y guía de sangrado; edición directa de texto en el lienzo, familias seguras, alineación, tracking, interlineado y padding; globos de diálogo y pensamiento con cola orientable; tramas de puntos, velocidad e impacto con densidad, escala y ángulo; fondos importados con escala, posición, opacidad, desenfoque y monocromo; biblioteca local buscable y ordenada por uso reciente; validación de tipo/tamaño y filtrado conservador de SVG; importación VRM local con consentimiento, comprobación GLB y recarga del estudio 3D; plantillas de diálogo, acción y 4-koma. La comparación visual CJK/multinavegador y la matriz amplia de VRM siguen como validación transversal antes de beta.

## Fase 4 — Exportación e interoperabilidad (v0.6.0) — completada

**Objetivo:** obtener archivos confiables para web, impresión y respaldo.

Trabajo:

- Exportar una página o lote en PNG/JPEG/WebP a 1×, 2× y resolución personalizada.
- Perfiles web, A4/B5 y tamaños manga, con DPI, sangrado y marcas opcionales.
- Exportar proyecto portable `.mangastudio` con manifiesto, assets, versión y checksums.
- Importar el formato portable con validación, vista previa y migración.
- Exportar PDF multipágina con orden, dimensiones y metadatos correctos.
- Avisar sobre baja resolución, elementos fuera del sangrado y fuentes no disponibles.
- Mover render pesado a worker/offscreen con fallback.

Pruebas: dimensiones, transparencia, orden y color; round-trip sin pérdida; proyecto de estrés de 40 páginas.

Criterio de salida: los resultados coinciden con el editor y un respaldo abre en otro navegador compatible.

Implementado en v0.6.0: exportación de página actual o lote en PNG/JPEG/WebP, escalas 1×–3× y dimensiones personalizadas; perfiles web, A4 y B5 con DPI real, sangrado de 3 mm y marcas de corte; PDF multipágina con orden y dimensiones físicas; formato `.mangastudio` basado en ZIP con manifiesto, recursos separados y checksums SHA-256; importación con verificación de integridad, límites de tamaño/descompresión, rutas seguras, rechazo de entradas inesperadas, vista previa y migración; avisos de recursos de baja resolución, elementos fuera de página y fuentes ausentes; render fuera de pantalla con fallback de canvas y límites de memoria para lotes. El proyecto de estrés de 40 páginas queda como prueba transversal de rendimiento para la fase 5.

## Fase 5 — UX, accesibilidad y rendimiento (v0.7.0) — completada

**Objetivo:** que el flujo sea comprensible y rápido en escritorio y tablet.

Trabajo:

- Paneles acoplables en escritorio y hojas/pestañas en tablet/móvil.
- Atajos documentados, navegación por foco, nombres accesibles y estados anunciados.
- Contraste, foco visible, objetivos táctiles, reducción de movimiento y texto al 200%.
- Onboarding contextual y proyecto de ejemplo descartable.
- Estados vacíos, carga, error, recuperación y progreso.
- Virtualización, miniaturas y carga diferida de 3D/assets.
- Presupuestos: interacción común <100 ms; proyecto típico <2 s en equipo objetivo.
- Preferencias de tema, calidad 3D, unidades, autosave y espacio de trabajo.

Pruebas: auditoría WCAG 2.2 AA; Chrome, Edge, Firefox y Safari; escritorio/tablet; CPU/GPU limitadas y almacenamiento interrumpido.

Criterio de salida: todos los flujos esenciales funcionan con teclado y tacto dentro de los presupuestos acordados.

Implementado en v0.7.0: paneles plegables en escritorio y navegación inferior por áreas en tablet/móvil; preferencias persistentes de tema, densidad, movimiento, calidad 3D, unidades, autoguardado y espacio de trabajo; onboarding y guía de atajos; enlace para saltar al editor, foco visible, nombres asociados a controles, regiones de estado y manipulación por teclado; tamaño táctil reforzado y soporte de movimiento reducido; estados vacíos y rendimiento visible; selector y virtualización del riel para proyectos extensos; miniaturas con carga diferida; personaje 2D reducido de 1,7 MB a 314 KB; estudio 3D de 755 KB y avatar VRM de 9,5 MB fuera de la ruta inicial. La suite sube a 29 pruebas y el smoke audit comprueba nombres, desbordamiento y recursos en 390 × 844 y 1440 × 1000. La validación manual con lectores de pantalla, Safari y hardware físico permanece como control transversal antes de la beta, por lo que esta entrega no se presenta como certificación formal WCAG.

## Corrección de estabilización — v0.7.5 — completada

Antes de iniciar la fase 6 se corrigió el modelo de interacción de las viñetas. Cada panel se selecciona directamente y conserva de forma independiente fondo, efecto, opacidad, desenfoque, monocromo y transformación. Cada personaje, imagen o globo decide si se recorta al borde o puede atravesarlo. El avatar 3D dispone de giro propio sobre el eje vertical, manteniendo objetivos IK y lados anatómicos coherentes. Los selectores de preferencias se sustituyeron por controles segmentados para evitar menús que desaparecían en el navegador integrado. El esquema documental v4 migra automáticamente los proyectos anteriores y la suite alcanza 33 pruebas.

## Corrección creativa y de controles — v0.7.6 — completada

Los 12 selectores nativos fueron sustituidos por un componente propio con menú persistente, interacción por clic, flechas, Inicio/Fin y estados accesibles. Se añadieron cuatro diseños respecto a la oferta inicial, cinco fondos integrados y cinco efectos manga. La rotación 2D ahora tiene botones visibles de ±15°, restablecimiento y un tirador identificado sobre la selección, con rango completo de ±180°. La matriz automatizada alcanza 36 pruebas.

## Fase 6 — Privacidad y confiabilidad (v0.8.0)

**Objetivo:** preparar la operación real sin comprometer las obras.

Trabajo:

- Decidir local-first versus cuenta/sincronización; mantener uso sin cuenta si es viable.
- Si hay nube: autenticación, cifrado, autorización por proyecto, cuotas, borrado y exportación.
- Compartir sólo por acción explícita, con permisos y revocación visibles.
- Política de privacidad, términos, licencias y trazabilidad de assets de muestra.
- CSP, sanitización SVG, validación de uploads y revisión de dependencias.
- Telemetría opt-in o mínima sobre fallos/rendimiento; nunca contenido creativo.
- Reporte de errores redactado sin páginas ni avatares.
- Backups, restauración y manejo de almacenamiento lleno.

Criterio de salida: revisión de seguridad/privacidad sin hallazgos críticos; perder red o llenar cuota no destruye el documento.

## Fase 7 — Beta cerrada (v0.9.0–v0.9.x)

**Objetivo:** validar con proyectos reales y cerrar regresiones.

Trabajo:

- Reclutar dibujantes diversos con consentimiento y soporte definido.
- Medir: primera página, pose personalizada, multipágina, exportación y recuperación.
- Métricas respetuosas de éxito, tiempo, abandono y fallos.
- Triage P0–P3 semanal y congelación de alcance tras v0.9.0.
- Suite end-to-end de los diez recorridos críticos.
- Pruebas de actualización desde cada versión pública soportada.
- Documentación, FAQ, privacidad, licencias y solución de problemas.
- Iconos, metadatos, página pública, changelog, soporte y rollback.
- Ensayo de lanzamiento y restauración.

Criterios de salida:

- Cero P0/P1 abiertos y todo P2 con mitigación explícita.
- Tasa de éxito acordada en cinco flujos durante dos ciclos beta.
- Sesiones sin fallos y rendimiento objetivo en la matriz soportada.
- Checklist legal, accesibilidad, seguridad, soporte y rollback aprobada.

## Fase 8 — Versión 1.0 y operación

Entrega:

- Etiqueta `1.0.0`, changelog y formato de proyecto congelado con compatibilidad documentada.
- Sitio de producción, documentación, estado y canal de incidencias.
- Publicación gradual con monitoreo de errores, rendimiento y exportación.
- Backup verificado y rollback listo.
- Navegadores soportados, límites y propiedad de datos/obras comunicados.

Primeros 30 días:

- Revisar métricas y soporte a diario la primera semana y luego semanalmente.
- Publicar 1.0.x sólo para fallos, seguridad y compatibilidad.
- Separar nuevas funciones del mantenimiento y priorizar 1.1 con evidencia.
- Retrospectiva de arquitectura, 3D, accesibilidad y operación.

## Prioridad transversal

- **P0:** pérdida/corrupción, exportación incorrecta, pose con `NaN` o inversión, captura vacía, exposición de obras o credenciales.
- **P1:** undo inconsistente, incompatibilidad sin migración, bloqueo, importación insegura, flujo esencial inaccesible o rendimiento grave.
- **P2:** fricción, controles ambiguos, poses poco expresivas, responsive o documentación incompletos.

Fuera de 1.0: colaboración simultánea, marketplace, generación automática con obras del usuario, animación/timeline/video y apps móviles nativas.

## Métricas de salida de 1.0

| Área | Objetivo |
|---|---|
| Confiabilidad | 0 P0/P1 conocidos; recuperación validada |
| Guardado | 100% de autosave/migraciones de la suite |
| 3D | 12 poses × 3 avatares × 3 cámaras verificadas |
| Exportación | Visual, dimensiones y perfiles correctos |
| Accesibilidad | Flujos esenciales AA, teclado y tacto |
| Rendimiento | Presupuestos aprobados en equipo objetivo |
| Compatibilidad | Suite crítica verde en navegadores soportados |
| Producto | Beta completa los cinco flujos con la tasa acordada |

## Próxima iteración recomendada

Iniciar la fase 6 (v0.8.0) con una revisión de amenazas, política local-first, recuperación frente a almacenamiento lleno y endurecimiento de la importación. Mantener como matriz de regresión los selectores propios, diseños expandidos, viñetas independientes, recorte opcional y controles de rotación consolidados en v0.7.6.
