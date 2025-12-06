# Testing - Sistema de Unión a Equipos (Tarea 2)

## Nuevos Endpoints Implementados

### 1. GET /api/teams/search?code=XXX

Busca un equipo por su código de invitación (público, no requiere autenticación).

### 2. POST /api/teams/join

Permite a un usuario unirse a un equipo usando el teamId.

---

## Flujo de Testing Recomendado

### Paso 1: Preparar Dos Usuarios

Para testear completamente el sistema de unión, necesitas dos usuarios:

**Usuario A (Creador):**

1. Autentícate con el Usuario A
2. Crea un equipo usando `1. Crear Equipo`
3. Guarda el `invite_code` que se generó automáticamente

**Usuario B (Se va a unir):**

1. Autentícate con el Usuario B (en otra sesión de Postman o cambia la cookie)
2. Verifica que no esté en ningún equipo: `6. Ver Mi Equipo` → debe retornar `null`

### Paso 2: Buscar Equipo por Código

**Request:** `16. Buscar Equipo por Código`

- Actualiza la variable `invite_code` en Postman con el código del equipo creado
- O usa el código directamente en el query: `?code=ABC123`
- El código es **case-insensitive** (puedes usar `abc123` o `ABC123`)

**Resultado esperado:**

- Status: `200 OK`
- Retorna información del equipo (sin el código por seguridad)
- Muestra: nombre, descripción, creador, cantidad de miembros

### Paso 3: Probar Casos de Error en Búsqueda

**Request:** `17. ERROR - Buscar Equipo con Código Inválido`

- Usa un código que no existe: `?code=INVALID`
- Resultado esperado: `404 Not Found`

**Request:** `18. ERROR - Buscar Equipo sin Código`

- No incluyas el parámetro `code`
- Resultado esperado: `400 Bad Request`

### Paso 4: Unirse al Equipo

**Request:** `19. Unirse a Equipo`

**Body:**

```json
{
  "teamId": "{{team_id}}"
}
```

**Nota:** El `team_id` se obtiene de:

- El response de "16. Buscar Equipo por Código" (campo `id`)
- O de la variable `team_id` si ya la tienes guardada

**Resultado esperado:**

- Status: `200 OK`
- Retorna información completa del equipo
- Retorna información de tu membresía
- Lista todos los miembros con estadísticas
- Automáticamente guarda el `team_id` en las variables

### Paso 5: Verificar Unión

**Request:** `6. Ver Mi Equipo`

- Debe mostrar el equipo al que te uniste
- Debe mostrar tu rol como `MEMBER`
- Debe mostrar todos los miembros incluyendo al creador

### Paso 6: Probar Casos de Error en Unión

**Request:** `20. ERROR - Unirse Cuando Ya Estás en un Equipo`

- Si ya estás en un equipo e intentas unirte a otro
- Resultado esperado: `400 Bad Request` con mensaje "Ya estás en un equipo"

**Request:** `21. ERROR - Unirse al Mismo Equipo Dos Veces`

- Intenta unirte al mismo equipo otra vez
- Resultado esperado: `400 Bad Request` con mensaje "Ya eres miembro de este equipo"

**Request:** `22. ERROR - Unirse a Equipo Inexistente`

- Usa un UUID inválido o de un equipo que no existe
- Resultado esperado: `404 Not Found`

---

## Casos de Prueba Completos

### ✅ Casos Exitosos

1. **Buscar equipo con código válido**
   - Código mayúsculas: `ABC123`
   - Código minúsculas: `abc123`
   - Código mixto: `AbC123`
   - Todos deben funcionar (case-insensitive)

2. **Unirse a equipo**
   - Usuario no está en ningún equipo
   - Equipo existe
   - Equipo no está lleno
   - Usuario no es miembro del equipo

### ❌ Casos de Error

1. **Búsqueda:**
   - Código no existe → `404`
   - Código faltante → `400`
   - Código con formato inválido → `400` (validación Zod)

2. **Unión:**
   - Usuario ya en otro equipo → `400`
   - Usuario ya es miembro → `400`
   - Equipo no existe → `404`
   - Equipo lleno → `400` (si hay límite configurado)
   - Sin autenticación → `401`
   - teamId inválido → `400` (validación UUID)

---

## Flujo Completo de Ejemplo

### Escenario: Usuario se une a equipo existente

```
1. Usuario A crea equipo
   POST /api/teams
   → Código generado: ABC123
   → team_id guardado automáticamente

2. Usuario B busca el equipo
   GET /api/teams/search?code=ABC123
   → Ve información del equipo
   → Obtiene team_id

3. Usuario B se une al equipo
   POST /api/teams/join
   Body: {"teamId": "..."}
   → Se une exitosamente como MEMBER

4. Usuario B verifica su equipo
   GET /api/teams/me
   → Ve el equipo al que se unió
   → Ve su rol como MEMBER
   → Ve todos los miembros incluyendo al creador

5. Usuario A verifica miembros
   GET /api/teams/{team_id}
   → Ve que Usuario B está en la lista de miembros
```

---

## Validaciones Implementadas

### Código de Invitación

- ✅ **Case-insensitive**: `ABC123` = `abc123` = `AbC123`
- ✅ **Sin caracteres confusos**: Excluye 0/O, 1/I/l en generación
- ✅ **Formato**: Exactamente 6 caracteres alfanuméricos
- ✅ **Único**: Cada código es único en la base de datos

### Unión a Equipo

- ✅ **Un equipo a la vez**: Usuario solo puede estar en un equipo
- ✅ **No duplicados**: No puede unirse dos veces al mismo equipo
- ✅ **Equipo existe**: Valida que el equipo existe
- ✅ **Límite de miembros**: Configurable (actualmente 50 miembros máximo)
- ✅ **Autenticación**: Requiere usuario autenticado

---

## Variables de Postman Actualizadas

La colección ahora usa estas variables:

- `base_url`: URL base de la API
- `authSession`: Cookie de sesión
- `team_id`: ID del equipo (se guarda automáticamente)
- `invite_code`: Código de invitación (se guarda automáticamente)

**Nota:** Los requests `1. Crear Equipo` y `19. Unirse a Equipo` guardan automáticamente las variables necesarias.

---

## Límite de Miembros

El límite máximo de miembros por equipo está configurado en:

`src/lib/utils/team.ts`

```typescript
const MAX_TEAM_MEMBERS = 50 // Configurable
```

Si un equipo alcanza este límite, no se pueden agregar más miembros hasta que alguno salga.

---

## Seguridad

- ✅ **Códigos case-insensitive**: Más fácil de usar para usuarios
- ✅ **Códigos no se exponen en búsqueda**: Por seguridad, el código no se retorna en la respuesta de búsqueda
- ✅ **Validación de UUID**: teamId debe ser un UUID válido
- ✅ **Autenticación requerida**: Solo usuarios autenticados pueden unirse
- ✅ **Validación de estado**: Verifica múltiples condiciones antes de permitir unión

---

## Troubleshooting

### No puedo buscar equipo

- ✅ Verifica que el código tenga exactamente 6 caracteres
- ✅ El código puede estar en mayúsculas o minúsculas
- ✅ Asegúrate de que el equipo existe (verifica en "Listar Todos los Equipos")

### No puedo unirme al equipo

- ✅ Verifica que no estés ya en otro equipo
- ✅ Verifica que no seas ya miembro de este equipo
- ✅ Verifica que el teamId sea correcto (UUID válido)
- ✅ Verifica que el equipo no esté lleno (límite: 50 miembros)

### Variables no se guardan

- ✅ El request `19. Unirse a Equipo` guarda automáticamente `team_id` e `invite_code`
- ✅ Verifica la consola de Postman para ver mensajes de guardado
- ✅ Puedes copiar manualmente el `team_id` de la respuesta
