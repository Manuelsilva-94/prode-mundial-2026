# 🧪 Pasos para Testear Teams API

## 📦 Archivos Creados

1. **Colección Postman:** `Teams.postman_collection.json` (en la raíz del proyecto)
2. **Guía detallada:** `docs/teams-postman-setup.md`
3. **Referencia rápida:** `docs/teams-quick-reference.md`

---

## 🚀 Pasos Rápidos (5 minutos)

### Paso 1: Importar Colección en Postman

1. Abre Postman
2. Click en **Import** (arriba a la izquierda)
3. Selecciona el archivo `Teams.postman_collection.json` (está en la raíz del proyecto)
4. La colección se importará con 15 requests listos

### Paso 2: Obtener Cookie de Sesión

#### Opción A: Desde el Navegador (Más Fácil)

1. Inicia tu servidor:

   ```bash
   npm run dev
   ```

2. Abre `http://localhost:3000` en tu navegador

3. Inicia sesión con tu usuario

4. Abre las **Developer Tools** (F12)

5. Ve a la pestaña **Application** (Chrome) o **Storage** (Firefox)

6. En el menú izquierdo, expande **Cookies** → `http://localhost:3000`

7. Busca la cookie `next-auth.session-token`

8. **Copia el nombre completo y el valor**, por ejemplo:

   ```
   next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0...
   ```

9. En Postman, ve a la colección **Teams - CRUD Completo**

10. Click en **Variables** (pestaña al lado de "Authorization")

11. Pega el valor completo en la variable `authSession`

#### Opción B: Desde Postman (Si tienes endpoint de login)

1. Ejecuta tu request de login en Postman
2. Ve a la pestaña **Cookies** de la respuesta
3. Copia la cookie `next-auth.session-token`
4. Agrégala a las variables de la colección

### Paso 3: Configurar Variables

En Postman, colección **Teams - CRUD Completo** → **Variables**:

- ✅ `base_url`: `http://localhost:3000` (ya está configurado)
- ✅ `authSession`: Pega tu cookie completa aquí
- ⏳ `team_id`: Se llenará automáticamente al crear un equipo
- ⏳ `invite_code`: Se llenará automáticamente al crear un equipo

### Paso 4: Ejecutar Tests

Ejecuta los requests en este orden:

1. **`6. Ver Mi Equipo`** → Verifica que no estés en ningún equipo (debe retornar `team: null`)

2. **`1. Crear Equipo`** → Crea tu primer equipo
   - ✅ Debe retornar status `201`
   - ✅ Automáticamente guarda `team_id` y `invite_code` en las variables

3. **`6. Ver Mi Equipo`** → Ahora debe mostrar tu equipo

4. **`7. Ver Detalle de Equipo`** → Debe mostrar el equipo con miembros

5. **`5. Listar Todos los Equipos`** → Debe listar todos los equipos

6. **`8. Actualizar Equipo`** → Cambia el nombre

7. **`10. Salir del Equipo`** → Sale del equipo

8. **`6. Ver Mi Equipo`** → Debe retornar `team: null` de nuevo

9. **`1. Crear Equipo`** → Puedes crear un nuevo equipo

---

## 🔍 Casos de Prueba Incluidos

La colección incluye **15 requests** que cubren:

### ✅ Casos Exitosos

- Crear equipo
- Crear equipo sin descripción
- Listar todos los equipos
- Ver mi equipo
- Ver detalle de equipo
- Actualizar equipo
- Salir del equipo
- Eliminar equipo
- Listar con paginación

### ❌ Casos de Error

- Crear equipo duplicado (409)
- Crear cuando ya estás en uno (400)
- Actualizar sin ser creador (403)
- Eliminar sin ser creador (403)
- Salir sin ser miembro (400)
- Ver mi equipo sin equipo (null)

---

## 📝 Scripts Automáticos

El request **`1. Crear Equipo`** tiene un script automático que:

- ✅ Guarda el `team_id` en la variable `team_id`
- ✅ Guarda el `invite_code` en la variable `invite_code`

Estos valores se usan automáticamente en los demás requests.

---

## 🎯 Flujo Recomendado para Testing Completo

### Test 1: Crear y Gestionar Equipo

```bash
1. Ver Mi Equipo → null
2. Crear Equipo → ✅ 201
3. Ver Mi Equipo → ✅ Muestra el equipo
4. Ver Detalle → ✅ Muestra miembros y stats
5. Actualizar → ✅ Cambia nombre
6. Listar Todos → ✅ Aparece en la lista
```

### Test 2: Restricciones

```bash
1. Crear Equipo (ya estás en uno) → ❌ 400
2. Crear Equipo Duplicado → ❌ 409
3. Actualizar Sin Ser Creador → ❌ 403 (con otro usuario)
```

### Test 3: Salir y Recrear

```bash
1. Salir del Equipo → ✅ 200
2. Ver Mi Equipo → ✅ null
3. Crear Nuevo Equipo → ✅ 201
4. Eliminar Equipo → ✅ 200
```

---

## 🛠️ Testing desde Código (Opcional)

Si prefieres testear desde código, puedes crear un script:

```typescript
// tests/api/teams/flow.test.ts
import { describe, it, expect } from 'vitest'
import { prisma } from '@/lib/db'
import {
  createTestUser,
  createTestTeam,
  // ... helpers que necesites
} from '../../helpers/test-utils'

describe('Teams CRUD Flow', () => {
  it('debe crear un equipo exitosamente', async () => {
    const user = await createTestUser()
    // ... implementar test
  })
})
```

---

## 📚 Documentación Adicional

- **Guía completa:** `docs/teams-postman-setup.md`
- **Referencia rápida:** `docs/teams-quick-reference.md`
- **Colección Postman:** `Teams.postman_collection.json`

---

## ⚠️ Troubleshooting

### Error 401 (No autorizado)

- ✅ Verifica que `authSession` tenga el valor completo de la cookie
- ✅ Asegúrate de que la cookie no haya expirado
- ✅ Vuelve a iniciar sesión y copia la nueva cookie

### Variables no se guardan automáticamente

- ✅ Verifica que el request "1. Crear Equipo" tenga el script de test activo
- ✅ Revisa la consola de Postman (View → Show Postman Console)
- ✅ Puedes copiar manualmente el `team_id` de la respuesta

### No puedo crear equipo

- ✅ Verifica que no estés ya en un equipo (usa "6. Ver Mi Equipo")
- ✅ Si estás en uno, primero usa "10. Salir del Equipo"

---

## ✅ Checklist Final

- [ ] Colección importada en Postman
- [ ] Cookie de sesión configurada en variables
- [ ] Servidor corriendo (`npm run dev`)
- [ ] Request "Ver Mi Equipo" funciona
- [ ] Puedo crear un equipo
- [ ] Puedo ver el detalle del equipo
- [ ] Puedo actualizar el equipo
- [ ] Puedo salir del equipo
- [ ] Puedo crear un nuevo equipo después de salir

¡Listo para testear! 🎉
