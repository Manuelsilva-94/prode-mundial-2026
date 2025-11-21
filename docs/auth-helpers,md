# Helpers de Autenticación y Autorización

## Helpers Disponibles

### `getSession()`

Obtiene la sesión actual de NextAuth.

```typescript
const session = await getSession()
```

### `getCurrentUser(includeStats?)`

Obtiene el usuario actual completo desde la DB.

```typescript
const user = await getCurrentUser()
const userWithStats = await getCurrentUser(true)
```

### `requireAuth()`

Verifica que haya un usuario autenticado. Lanza error 401 si no.

```typescript
const session = await requireAuth()
```

### `requireAuthUser()`

Verifica autenticación y retorna el usuario completo.

```typescript
const user = await requireAuthUser()
```

### `requireAdmin()`

Verifica que el usuario sea ADMIN. Lanza error 403 si no.

```typescript
const session = await requireAdmin()
```

### `requireAdminUser()`

Verifica rol admin y retorna el usuario completo.

```typescript
const admin = await requireAdminUser()
```

### `isResourceOwner(resourceOwnerId)`

Verifica si el usuario actual es dueño del recurso.

```typescript
const isOwner = await isResourceOwner(resourceId)
```

### `requireOwnerOrAdmin(resourceOwnerId)`

Verifica que sea dueño O admin. Lanza error 403 si no.

```typescript
await requireOwnerOrAdmin(resourceId)
```

## Sistema de Permisos

### `hasPermission(permission)`

Verifica si el usuario tiene un permiso específico.

```typescript
const canEdit = await hasPermission(Permission.EDIT_OWN_PROFILE)
```

### `requirePermission(permission)`

Requiere un permiso específico. Lanza error 403 si no.

```typescript
await requirePermission(Permission.CREATE_MATCH)
```

## Ejemplo de Uso en Endpoint

```typescript
import { requireAuthUser } from '@/lib/auth/session'
import { handleApiError } from '@/lib/api/error-handler'

export async function GET() {
  try {
    const user = await requireAuthUser()
    // ... tu lógica
    return NextResponse.json({ data })
  } catch (error) {
    return handleApiError(error)
  }
}
```

## Testing

Ver `tests/auth-helpers.http` para ejemplos de testing.
