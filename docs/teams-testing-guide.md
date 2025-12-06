# Guía de Testing - CRUD de Equipos Corporativos

## Pasos para Testear

### 1. Preparación

1. **Iniciar el servidor de desarrollo:**

   ```bash
   npm run dev
   ```

2. **Asegurarse de tener autenticación:**
   - Debes tener un usuario autenticado
   - Obtener el token de sesión de NextAuth (cookie `next-auth.session-token`)

### 2. Flujo de Testing Completo

#### Paso 1: Autenticarse

- Primero debes estar autenticado (usar endpoint de login o sesión existente)
- Guardar la cookie de sesión para usar en los demás requests

#### Paso 2: Crear un Equipo

- **POST** `/api/teams`
- Body: `{ "name": "Mi Equipo", "description": "Descripción opcional" }`
- Debería retornar el equipo creado con `inviteCode`

#### Paso 3: Ver Mi Equipo

- **GET** `/api/teams/me`
- Debería retornar el equipo que acabas de crear

#### Paso 4: Listar Todos los Equipos

- **GET** `/api/teams?page=1&limit=10`
- Debería listar todos los equipos con paginación

#### Paso 5: Ver Detalle de un Equipo

- **GET** `/api/teams/{teamId}`
- Debería mostrar el equipo con todos sus miembros y estadísticas

#### Paso 6: Actualizar Equipo (solo creador)

- **PATCH** `/api/teams/{teamId}`
- Body: `{ "name": "Nuevo Nombre", "description": "Nueva descripción" }`

#### Paso 7: Salir del Equipo

- **POST** `/api/teams/{teamId}/leave`
- Debería permitir salir del equipo

#### Paso 8: Eliminar Equipo (solo creador)

- **DELETE** `/api/teams/{teamId}`
- Solo funciona si eres el creador

### 3. Casos de Prueba

#### Casos Exitosos

- ✅ Crear equipo con nombre único
- ✅ Listar equipos con paginación
- ✅ Ver detalle de equipo con miembros
- ✅ Actualizar nombre y descripción
- ✅ Salir de equipo
- ✅ Eliminar equipo

#### Casos de Error

- ❌ Crear equipo cuando ya estás en uno
- ❌ Crear equipo con nombre duplicado
- ❌ Actualizar equipo sin ser creador
- ❌ Eliminar equipo sin ser creador
- ❌ Salir de equipo del que no eres miembro

### 4. Variables de Entorno en Postman

Configura estas variables en Postman:

- `base_url`: `http://localhost:3000`
- `authSession`: Cookie de sesión de NextAuth
- `team_id`: Se guardará automáticamente al crear un equipo
- `invite_code`: Se guardará automáticamente al crear un equipo
