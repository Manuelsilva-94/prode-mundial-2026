# POST /api/admin/matches/:id/result

Carga el resultado de un partido y calcula puntos automáticamente.

## Autenticación

Requiere rol `ADMIN`

## Request

### URL Parameters

- `id` (UUID): ID del partido

### Body

```json
{
  "homeScore": 2,
  "awayScore": 1
}
```

## Response Success (200)

```json
{
  "success": true,
  "message": "Resultado cargado y puntos calculados exitosamente",
  "data": {
    "match": {
      "id": "...",
      "homeScore": 2,
      "awayScore": 1,
      "status": "FINISHED",
      "isLocked": true,
      "homeTeam": { ... },
      "awayTeam": { ... },
      "phase": { ... }
    },
    "pointsCalculation": {
      "predictionsProcessed": 150,
      "totalPointsAwarded": 1250,
      "topScorers": [...]
    }
  }
}
```

## Response Warning (207)

Si el resultado se cargó pero falló el cálculo de puntos:

```json
{
  "success": true,
  "warning": "Resultado cargado pero hubo un error al calcular puntos",
  "message": "El partido fue actualizado correctamente, pero el cálculo de puntos falló. Por favor, recalcula manualmente.",
  "data": {
    "match": { ... },
    "pointsCalculationError": "Error message"
  }
}
```

## Errors

### 400 Bad Request

- Scores inválidos (negativos o no enteros)
- Partido no existe
- Partido ya está finalizado (usar PATCH en su lugar)
- Partido está pospuesto

### 401 Unauthorized

- Usuario no autenticado

### 403 Forbidden

- Usuario no es admin

## Flujo Completo

1. ✅ Validar admin
2. ✅ Validar scores
3. ✅ Actualizar partido (homeScore, awayScore, status=FINISHED, isLocked=true)
4. ✅ Calcular puntos automáticamente
5. ✅ Actualizar leaderboards
6. ✅ Crear audit log

## Notas Importantes

- Si el cálculo de puntos falla, el partido **NO se revierte** (código 207)
- El admin puede recalcular puntos manualmente: `POST /api/admin/matches/:id/calculate-points`
- Para editar un resultado ya cargado, usar: `PATCH /api/admin/matches/:id`
  - El PATCH recalculará puntos automáticamente si se editan los scores

## Ejemplo de uso

```typescript
const response = await fetch('/api/admin/matches/123/result', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    homeScore: 3,
    awayScore: 1,
  }),
})

const data = await response.json()

if (data.warning) {
  console.warn('Puntos deben recalcularse manualmente')
  // Llamar a /api/admin/matches/123/calculate-points
}
```
