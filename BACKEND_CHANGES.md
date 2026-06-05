# Cambios en el backend: soporte de `reason` por usuario y cancelación inmediata de sanciones

Este documento resume los cambios aplicados en el backend para soportar razones de sanción por usuario y para asegurar que una votación de indulto en un caso con múltiples revisores cancele sanciones activas cuando corresponda.

## Resumen corto

- `CasoSancionado.reason` ahora es un JSON que mapea userId → { motivo, descripcion }.
- Se eliminó el campo persistente `descripcion_sancion` como fuente primaria; el serializador expone aún `descripcion_sancion` sintetizada (para compatibilidad con frontend legacy).
- Endpoints y lógica de casos actualizados para aceptar tanto el nuevo mapping como formas legacy (`string` o `descripcion_sancion`).
- Se añadió lógica para cancelar sanciones activas inmediatamente cuando un usuario emite un indulto en un caso `in_process` con múltiples asignados (se decrementa `num_sanciones`, se marca `cancelado` con metadatos y se limpia `decisiones_profes`).

## Archivos modificados

- `app/models.py` — `CasoSancionado.reason` cambiado a `db.JSON` (se eliminó `descripcion_sancion` persistent).
- `app/blueprints/casos.py` — `ActualizarEstadoCaso` y helpers: `_crear_o_reactivar_sancion`, `_cancelar_sanciones_activas` (lógica de voto/indulto y cancelación inmediata).
- `app/blueprints/casos_sancionados.py` — CRUD de sanciones: create/update/delete aceptan mapping o legacy; serializador añade `descripcion_sancion` sintetizada.

## Detalles técnicos

### Modelo
- `CasoSancionado.reason` ahora almacena un objeto JSON con la forma:

```json
{
  "<userId>": { "motivo": "string", "descripcion": "string" },
  "<otroUserId>": { ... }
}
```

- `descripcion_sancion` fue removido como columna persistente; el serializer devuelve `descripcion_sancion` tomando la primera entrada en `reason` cuando existe, para compatibilidad con clientes existentes.

### Endpoints y payloads
- Create / Update sanción: aceptan cualquiera de estas formas en el body:
  - `reason` como mapping (recomendado)
  - `reason` como string (legacy)
  - `descripcion_sancion` (legacy)

- Si se recibe `descripcion_sancion` o `reason` string, el backend los convierte internamente a un mapping mínimo al crear la sanción.
- Cuando se actualiza una sanción con un mapping, el backend fusiona/reescribe la sección `reason` correspondiente según la semántica implementada (crear o reactivar según el caso).

### Lógica de cancelación (comportamiento importante)
- Si el caso está `in_process` y un usuario que participa emite un indulto, se ejecuta `_cancelar_sanciones_activas`:
  - Decrementa `Caso.num_sanciones` por cada sanción activa cancelada.
  - Marca la sanción como `cancelado = True`, establece `fecha_cancelacion`, `cancelado_por` y otros metadatos trazables.
  - Limpia `caso.decisiones_profes` para permitir re-votaciones limpias.

Esto permite que, en escenarios multi-usuario, un indulto de uno de los revisores revierta la sanción activa de forma inmediata cuando proceda.

### Compatibilidad hacia atrás
- Serializador de `casos_sancionados` sigue exponiendo `descripcion_sancion` (sintetizada) para evitar rupturas inmediatas en el frontend existente.
- Las APIs permiten payloads legacy; migración del frontend y despliegue coordinado siguen siendo recomendados.

## Migración de base de datos (REQUIRED)

Antes de desplegar cambios en producción es obligatorio ajustar el esquema y migrar datos.

Pasos sugeridos (Alembic / SQL):

1. Añadir columna temporal `reason` tipo JSON (nullable):

```py
# alembic upgrade() pseudocódigo
op.add_column('casos_sancionados', sa.Column('reason', sa.JSON(), nullable=True))
```

2. Migrar datos existentes: por cada fila con `descripcion_sancion` no nula, rellenar `reason` con un mapping razonable. Por ejemplo usar `creator_id` o `sancionador_id` si existe, o un identificador conocido:

```py
# pseudocódigo
for row in connection.execute("SELECT sancion_id, descripcion_sancion, sancionado_por_id FROM casos_sancionados"):
    if row.descripcion_sancion:
        user_key = row.sancionado_por_id or row.creator_id or 'legacy'
        reason_obj = { str(user_key): { 'motivo': row.descripcion_sancion, 'descripcion': row.descripcion_sancion } }
        connection.execute("UPDATE casos_sancionados SET reason = :r WHERE sancion_id = :id", {'r': json.dumps(reason_obj), 'id': row.sancion_id})
```

3. Verificar integridad y pruebas locales.

4. (Opcional) Eliminar la columna `descripcion_sancion` y renombrar `reason` si se introdujo con otro nombre:

```py
op.drop_column('casos_sancionados', 'descripcion_sancion')
# si se utilizó reason_temp -> op.alter_column(...)
```

Incluye un `downgrade()` que invierta la migración (recreando `descripcion_sancion` a partir de la primera entrada de `reason`).

> Nota: ajustar las consultas que filtren o indexen por `descripcion_sancion` y considerar índices/constraints para `reason` si es necesario.

## Pruebas recomendadas

- Escenario A (multi-usuario): Crear caso con 2+ usuarios asignados, un usuario sanciona (sanción activa), otro usuario indulta mientras `in_process` → verificar que la sanción queda `cancelado=true`, `num_sanciones` decrementado y `decisiones_profes` limpiado.
- Escenario B (compatibilidad): Llamar endpoints con `descripcion_sancion` string y verificar que el recurso se crea con `reason` mapeado y que el serializador expone `descripcion_sancion` sintetizada.
- Pruebas unitarias para `_crear_o_reactivar_sancion` y `_cancelar_sanciones_activas` con casos borde (usuario no asignado, sanciones múltiples, forzar sanción por coordinador).

## Consideraciones de despliegue

- Desplegar migración antes de cambiar el backend en producción (orden: migración → backend → frontend).
- Mantener el serializador compatible por al menos una versión para permitir rollout del frontend.
- Revisar permisos: el frontend actualmente muestra botón "Cancelar sanción" solo a administradores; la lógica backend debe concordar con la política de quién puede cancelar (owner/assigned/admin).

## Próximos pasos

- Generar archivo Alembic con los pasos concretos (puedo generarlo si lo deseas).
- Hacer un barrido en el frontend para eliminar usos legacy una vez completada la migración.
- Ejecutar pruebas E2E locales y/o en staging.

---

Si quieres, genero el archivo Alembic (plantilla `upgrade()`/`downgrade()`) y un script de migración SQL para aplicar en tu entorno. También puedo añadir ejemplos concretos de comandos para ejecutar la migración en el servidor.
