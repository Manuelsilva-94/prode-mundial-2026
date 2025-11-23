# API de Partidos

## Endpoints

### GET /api/matches

Lista todos los partidos con filtros y paginación.

**Query Parameters:**

- `phase` (opcional): ID de la fase
- `team` (opcional): ID del equipo
- `status` (opcional): SCHEDULED | LIVE | FINISHED | POSTPONED
- `dateFrom` (opcional): ISO 8601 date
- `dateTo` (opcional): ISO 8601 date
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Partidos por página (default: 20, max: 50)

**Response:**

```json
{
  "matches": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 48,
    "totalPages": 3,
    "hasMore": true
  }
}
```

### GET /api/matches/:id

Detalle completo de un partido.

**Response:**

```json
{
  "match": {
    "id": "...",
    "homeTeam": {...},
    "awayTeam": {...},
    "matchDate": "2026-06-11T18:00:00Z",
    "stadium": "MetLife Stadium",
    "phase": {...},
    "status": "SCHEDULED",
    "userPrediction": null
  }
}
```

### GET /api/matches/upcoming

Próximos partidos no finalizados.

**Query Parameters:**

- `limit` (opcional): Cantidad de partidos (default: 20)

### GET /api/matches/today

Partidos del día actual.

## Notas

- Todos los endpoints son públicos
- Si el usuario está autenticado, incluye su predicción
- Las fechas están en UTC
- La paginación está limitada a 50 partidos por página
