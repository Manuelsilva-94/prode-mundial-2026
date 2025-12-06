# Setup y Testing de Teams API - Guía Completa

## 📋 Pasos Preliminares

### 1. Obtener Cookie de Sesión (NextAuth)

Para testear los endpoints de teams necesitas estar autenticado. Tienes dos opciones:

#### Opción A: Desde el navegador (Recomendado)

1. Inicia tu servidor:

   ```bash
   npm run dev
   ```

2. Abre tu navegador y ve a `http://localhost:3000`

3. Inicia sesión con tu usuario

4. Abre las Developer Tools (F12) → pestaña **Application** o **Storage**

5. Ve a **Cookies** → `http://localhost:3000`

6. Busca la cookie `next-auth.session-token`

7. Copia su valor completo (incluye el nombre de la cookie)

8. En Postman, ve a la colección → **Variables**

9. Pega el valor en la variable `authSession` en este formato:
   ```
   next-auth.session-token=EL_VALOR_COM Sarah_residencia...
   ```

#### Opción B: Desde Postman (Request de Login)

1. Si tienes un endpoint de login, úsalo para obtener la cookie
2. En la pestaña **Cookies** del response, copia la cookie de sesión
3. Agrégala a las variables de la colección

### 2. Configurar Variables en Postman

Ve a la colección **Teams - CRUD Completo** → **Variables** y configura:

- `base_url`: `http://localhost:3000`
- `authSession`: Tu cookie de sesión completa
- `team_id`: Se llenará automáticamente al crear un equipo
- `invite_code`: Se llenará automáticamente al crear un equipo

---

## 🧪 Flujo de Testing Completo

### Paso 1: Verificar Autenticación

**Request:** `6. Ver Mi Equipo`

- Debe retornar `team: null` si no estás en ningún equipo
- Si falla con 401, verifica tu cookie de sesión

### Paso 2: Crear un Equipo

**Request:** `1. Crear Equipo`

**Body:**

```json
{
  "name": "Equipo de Prueba",
  "description": "Este es un equipo de prueba"
}
```

**Resultado esperado:**

- Status: `201 Created`
- Respuesta incluye:
  - `data.id` → Se guarda automáticamente en `team_id`
  - `data.inviteCode` → Se guarda automáticamente en `invite_code`
  - `data.name`
  - `data.creator`

### Paso 3: Verificar que no Puedes Crear Otro Equipo

**Request:** `4. ERROR - Crear Equipo Cuando Ya Estás en Uno`

**Resultado esperado:**

- Status: `400 Bad Request`
- Error: "Ya estás en un equipo"

### Paso 4: Ver Mi Equipo

**Request:** `6. Ver Mi Equipo`

**Resultado esperado:**

- Status: `200 OK`
- Incluye:
  - `team`: Información del equipo
  - `membership`: Tu rol y fecha de unión
  - `members`: Lista de miembros con estadísticas

### Paso 5: Ver Detalle del Equipo

**Request:** `7. Ver Detalle de Equipo`

**Resultado esperado:**

- Status: `200 OK`
- Incluye:
  - Información completa del equipo
  - Lista de miembros con estadísticas
  - Creador del equipo

### Paso 6: Actualizar Equipo (Solo Creador)

**Request:** `8. Actualizar Equipo`

**Body:**

```json
{
  "name": "Equipo Actualizado",
  "description": "Nueva descripción"
}
```

**Resultado esperado:**

- Status: `200 OK`
- El equipo se actualiza correctamente

### Paso 7: Intentar Actualizar Sin Ser Creador

Si tienes otro usuario autenticado:

- Cambia la cookie de sesión en Postman
- Intenta actualizar el equipo
- Debe fallar con `403 Forbidden`

### Paso 8: Listar Todos los Equipos

**Request:** `5. Listar Todos los Equipos`

**Resultado esperado:**

- Status: `200 OK`
- Incluye paginación
- Lista de equipos con información básica

### Paso 9: Salir del Equipo

**Request:** `10. Salir del Equipo`

**Resultado esperado:**

- Status: `200 OK`
- Mensaje de confirmación
- Ya no estás en el equipo

### Paso 10: Crear Nuevo Equipo Después de Salir

**Request:** `1. Crear Equipo`

Ahora debería funcionar porque ya no estás en un equipo.

### Paso 11: Eliminar Equipo

**Request:** `12. Eliminar Equipo`

**Resultado esperado:**

- Status: `200 OK`
- El equipo se elimina completamente
- Todos los miembros son removidos (cascada)

---

## 🔍 Casos de Prueba Adicionales

### Casos de Validación

1. **Nombre muy corto:**

   ```json
   { "name": "A" }
   ```

   - Debe fallar: "El nombre del equipo debe tener al menos 2 caracteres"

2. **Nombre muy largo:**

   ```json
   { "name": "A".repeat(101) }
   ```

   - Debe fallar: "El nombre del equipo no puede exceder 100 caracteres"

3. **Descripción muy larga:**
   ```json
   {
     "name": "Equipo",
     "description": "A".repeat(501)
   }
   ```

   - Debe fallar: "La descripción no puede exceder 500 caracteres"

### Casos de Seguridad

1. **Actualizar sin autenticación:**
   - Remover cookie de sesión
   - Intentar actualizar equipo
   - Debe fallar con `401 Unauthorized`

2. **Ver equipo inexistente:**
   - Usar un `team_id` inválido
   - Debe fallar con `404 Not Found`

---

## 📝 Notas Importantes

1. **Variables automáticas:**
   - El script de test en "1. Crear Equipo" guarda automáticamente:
     - `team_id` del equipo creado
     - `invite_code` del equipo creado
   - Estos se usan en los requests siguientes

2. **Restricción de un equipo:**
   - Un usuario solo puede estar en un equipo a la vez
   - Debes salir del equipo actual para crear uno nuevo

3. **Permisos:**
   - Solo el creador puede editar/eliminar el equipo
   - Cualquier miembro puede salir

4. **Transferencia de ownership:**
   - Si el creador sale y hay otros miembros, el ownership se transfiere al miembro más antiguo
   - Si el creador sale y es el único miembro, el equipo se elimina

---

## 🐛 Troubleshooting

### Error 401 (No autorizado)

- Verifica que la cookie de sesión esté actualizada
- Asegúrate de haber iniciado sesión recientemente
- Las cookies de NextAuth pueden expirar

### Error 404 (Equipo no encontrado)

- Verifica que el `team_id` sea válido
- Asegúrate de que el equipo no haya sido eliminado

### Variables no se guardan

- Verifica que el script de test esté activado
- Revisa la consola de Postman para ver si hay errores
- Puedes copiar manualmente el `team_id` de la respuesta

### No puedo crear equipo

- Verifica que no estés ya en un equipo (usa "Ver Mi Equipo")
- Si estás en uno, primero debes salir

---

## ✅ Checklist de Testing

- [ ] Crear equipo exitosamente
- [ ] No puedo crear segundo equipo
- [ ] Ver mi equipo
- [ ] Ver detalle del equipo
- [ ] Actualizar equipo (como creador)
- [ ] No puedo actualizar sin ser creador
- [ ] Listar todos los equipos
- [ ] Salir del equipo
- [ ] Crear nuevo equipo después de salir
- [ ] Eliminar equipo (como creador)
- [ ] No puedo eliminar sin ser creador
- [ ] Validaciones de nombre/descripción
- [ ] Código de invitación único generado
- [ ] Verificar miembros con estadísticas
