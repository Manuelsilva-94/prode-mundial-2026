# Teams API - Referencia Rápida

## Endpoints Disponibles

### POST /api/teams

**Crear equipo**

**Headers:**

```
Cookie: {{authSession}}
Content-Type: application/json
```

**Body:**

```json
{
  "name": "Nombre del Equipo",
  "description": "Descripción opcional"
}
```

**Respuesta exitosa (201):**

```json
{
  "message": "Equipo creado exitosamente",
  "data": {
    "id": "...",
    "name": "Nombre del Equipo",
    "description": "...",
    "inviteCode": "ABC123",
    "creator": {...}
  }
}
```

---

### GET /api/teams

**Listar todos los equipos**

**Query params:**

- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Resultados por página (default: 20, max: 50)

**Respuesta (200):**

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

### GET /api/teams/me

**Mi equipo**

**Headers:**

```
Cookie: {{authSession}}
```

**Respuesta (200):**

```json
{
  "team": {
    "id": "...",
    "name": "...",
    "inviteCode": "...",
    ...
  },
  "membership": {
    "role": "ADMIN",
    "joinedAt": "...",
    "isCreator": true
  },
  "members": [...]
}
```

**Si no estás en ningún equipo:**

```json
{
  "team": null,
  "membership": null
}
```

---

### GET /api/teams/:id

**Detalle del equipo**

**Respuesta (200):**

```json
{
  "id": "...",
  "name": "...",
  "description": "...",
  "inviteCode": "...",
  "creator": {...},
  "memberCount": 5,
  "members": [
    {
      "user": {...},
      "stats": {
        "totalPoints": 120,
        "totalPredictions": 10,
        ...
      }
    }
  ]
}
```

---

### PATCH /api/teams/:id

**Actualizar equipo (solo creador)**

**Headers:**

```
Cookie: {{authSession}}
Content-Type: application/json
```

**Body:**

```json
{
  "name": "Nuevo Nombre",
  "description": "Nueva descripción"
}
```

**Respuesta (200):**

```json
{
  "message": "Equipo actualizado exitosamente",
  "data": {...}
}
```

---

### DELETE /api/teams/:id

**Eliminar equipo (solo creador)**

**Headers:**

```
Cookie: {{authSession}}
```

**Respuesta (200):**

```json
{
  "message": "Equipo eliminado exitosamente"
}
```

---

### POST /api/teams/:id/leave

**Salir del equipo**

**Headers:**

```
Cookie: {{authSession}}
```

**Respuesta (200):**

```json
{
  "message": "Has salido del equipo exitosamente"
}
```

**Si se transfiere ownership:**

```json
{
  "message": "Has salido del equipo. El ownership fue transferido a otro miembro.",
  "ownershipTransferred": true
}
```

**Si se elimina el equipo:**

```json
{
  "message": "Has salido del equipo. El equipo fue eliminado porque eras el único miembro.",
  "teamDeleted": true
}
```

---

## Códigos de Error Comunes

| Código | Significado   | Solución                                 |
| ------ | ------------- | ---------------------------------------- |
| 400    | Bad Request   | Verifica que el body sea correcto        |
| 401    | No autorizado | Verifica tu cookie de sesión             |
| 403    | Prohibido     | No tienes permisos (ej: no eres creador) |
| 404    | No encontrado | El equipo no existe                      |
| 409    | Conflicto     | Nombre duplicado o ya estás en un equipo |

---

### GET /api/teams/search?code=XXX

**Buscar equipo por código de invitación**

**Query params:**

- `code` (requerido): Código de invitación de 6 caracteres (case-insensitive)

**Respuesta exitosa (200):**

```json
{
  "id": "...",
  "name": "Nombre del Equipo",
  "description": "...",
  "creator": {
    "id": "...",
    "name": "...",
    "avatarUrl": "..."
  },
  "memberCount": 5,
  "createdAt": "..."
}
```

**Si el código no existe (404):**

```json
{
  "error": "Equipo no encontrado",
  "details": ["El código de invitación no corresponde a ningún equipo."]
}
```

---

### POST /api/teams/join

**Unirse a un equipo**

**Headers:**

```
Cookie: {{authSession}}
Content-Type: application/json
```

**Body:**

```json
{
  "teamId": "uuid-del-equipo"
}
```

**Respuesta exitosa (200):**

```json
{
  "message": "Te has unido al equipo exitosamente",
  "team": {
    "id": "...",
    "name": "...",
    "description": "...",
    "inviteCode": "...",
    "creator": {...},
    ...
  },
  "membership": {
    "role": "MEMBER",
    "joinedAt": "..."
  },
  "members": [...]
}
```

**Si ya estás en un equipo (400):**

```json
{
  "error": "Ya estás en un equipo",
  "details": ["Solo puedes estar en un equipo a la vez..."],
  "currentTeam": {
    "id": "...",
    "name": "..."
  }
}
```

**Si ya eres miembro del equipo (400):**

```json
{
  "error": "Ya eres miembro de este equipo",
  "details": ["No puedes unirte a un equipo del que ya eres miembro."]
}
```

**Si el equipo está lleno (400):**

```json
{
  "error": "Equipo lleno",
  "details": ["Este equipo ha alcanzado el límite máximo de miembros..."],
  "memberCount": 50
}
```

---

## Ejemplo de Flujo Completo

```bash
# Flujo 1: Crear y gestionar equipo
# 1. Crear equipo
POST /api/teams
Body: {"name": "Mi Equipo"}

# 2. Ver mi equipo
GET /api/teams/me

# 3. Ver detalle
GET /api/teams/{team_id}

# 4. Actualizar
PATCH /api/teams/{team_id}
Body: {"name": "Nuevo Nombre"}

# 5. Salir
POST /api/teams/{team_id}/leave

# 6. Eliminar (solo creador)
DELETE /api/teams/{team_id}

# Flujo 2: Unirse a equipo con código
# 1. Buscar equipo por código
GET /api/teams/search?code=ABC123

# 2. Unirse al equipo
POST /api/teams/join
Body: {"teamId": "uuid-del-equipo"}

# 3. Ver mi equipo (verificar unión)
GET /api/teams/me
```
