# Cron Job: Bloqueo Automático de Partidos

## Descripción

Este cron job se ejecuta automáticamente cada 5 minutos para bloquear partidos donde el `lockTime` ya ha pasado y aún no están bloqueados. Esto asegura que los usuarios no puedan crear o editar predicciones después del tiempo límite.

## Endpoint

- **POST** `/api/cron/lock-matches`
- **GET** `/api/cron/lock-matches` (para verificar estado)

## Configuración

### 1. Variables de Entorno

Agrega la siguiente variable de entorno en Vercel:

```bash
CRON_SECRET=tu-secret-unico-y-seguro-aqui
```

**⚠️ IMPORTANTE**: Genera un secret único y seguro. Puedes usar:

```bash
# En Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# O usar un generador online de UUIDs/secrets
```

### 2. vercel.json

El archivo `vercel.json` ya está configurado con:

```json
{
  "crons": [
    {
      "path": "/api/cron/lock-matches",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Esto significa que el cron job se ejecutará cada 5 minutos automáticamente.

## Seguridad

El endpoint está protegido con autenticación mediante `CRON_SECRET`:

- **Header requerido**: `Authorization: Bearer <CRON_SECRET>`
- **Sin header o secret inválido**: Retorna `401 Unauthorized`
- Solo Vercel puede ejecutar este endpoint con el secret correcto

## Lógica del Job

El cron job:

1. **Busca partidos** donde:
   - `lockTime <= now()` (el tiempo límite ya pasó)
   - `isLocked = false` (aún no están bloqueados)
   - `status = 'SCHEDULED'` (solo partidos programados)

2. **Bloquea** cada partido encontrado:
   - Actualiza `isLocked = true`

3. **Logging**:
   - Registra cada ejecución
   - Logs detallados de cada partido bloqueado
   - Incluye duración y estadísticas

## Respuesta del Endpoint

### POST (Ejecución del Job)

```json
{
  "success": true,
  "message": "Cron job ejecutado exitosamente",
  "lockedCount": 3,
  "errorCount": 0,
  "duration": "245ms",
  "timestamp": "2025-12-06T20:00:00.000Z"
}
```

### GET (Verificar Estado)

Sin autorización:
```json
{
  "endpoint": "/api/cron/lock-matches",
  "method": "POST",
  "schedule": "*/5 * * * * (cada 5 minutos)",
  "status": "configured",
  "message": "Usa POST con authorization header para ejecutar"
}
```

Con autorización:
```json
{
  "endpoint": "/api/cron/lock-matches",
  "method": "POST",
  "schedule": "*/5 * * * * (cada 5 minutos)",
  "status": "active",
  "stats": {
    "pendingToLock": 2,
    "totalScheduled": 10,
    "totalLocked": 45
  },
  "timestamp": "2025-12-06T20:00:00.000Z"
}
```

## Testing Manual

### 1. Ejecutar Manualmente (Testing Local)

```bash
curl -X POST http://localhost:3000/api/cron/lock-matches \
  -H "Authorization: Bearer tu-cron-secret" \
  -H "Content-Type: application/json"
```

### 2. Verificar Estado

```bash
curl http://localhost:3000/api/cron/lock-matches
```

### 3. Con Autorización (Ver Estadísticas)

```bash
curl http://localhost:3000/api/cron/lock-matches \
  -H "Authorization: Bearer tu-cron-secret"
```

## Monitoring

### Vercel Dashboard

1. Ve a tu proyecto en Vercel
2. Navega a **Settings** → **Cron Jobs**
3. Verifica que el cron job está configurado:
   - Path: `/api/cron/lock-matches`
   - Schedule: `*/5 * * * *`

### Logs

Cada ejecución genera logs en la consola de Vercel:

```
🔄 Iniciando cron job: lock-matches
📊 Encontrados 3 partido(s) para bloquear
🔒 Partido bloqueado: { id: "...", match: "Team A vs Team B", ... }
✅ Cron job completado exitosamente: { lockedCount: 3, duration: "245ms" }
```

### Verificar en Base de Datos

Puedes verificar que los partidos están siendo bloqueados:

```sql
-- Ver partidos bloqueados recientemente
SELECT id, "lockTime", "isLocked", status, "updatedAt"
FROM matches
WHERE "isLocked" = true
ORDER BY "updatedAt" DESC
LIMIT 10;

-- Ver partidos pendientes de bloqueo
SELECT id, "lockTime", "isLocked", status
FROM matches
WHERE "lockTime" <= NOW()
  AND "isLocked" = false
  AND status = 'SCHEDULED';
```

## Troubleshooting

### El cron job no se ejecuta

1. Verifica que `vercel.json` está en la raíz del proyecto
2. Verifica que el cron job está configurado en Vercel Dashboard
3. Revisa los logs de Vercel para errores

### Error 401 Unauthorized

1. Verifica que `CRON_SECRET` está configurado en Vercel
2. Verifica que el secret en el header coincide con la variable de entorno
3. Revisa los logs para ver si hay intentos de acceso no autorizados

### Los partidos no se están bloqueando

1. Verifica que hay partidos con `lockTime <= now()` y `isLocked = false`
2. Verifica que los partidos tienen `status = 'SCHEDULED'`
3. Revisa los logs para ver si hay errores en la ejecución

### Ejecución lenta

1. Revisa cuántos partidos hay para bloquear
2. Verifica el índice en `isLocked` y `lockTime` en la base de datos
3. Considera optimizar la query si hay muchos partidos

## Variables de Entorno Requeridas

- `CRON_SECRET`: Secret único para autenticación del cron job
- `DATABASE_URL`: URL de conexión a PostgreSQL (ya configurada)

## Ejecución en Producción

Una vez deployado a Vercel:

1. El cron job se ejecutará automáticamente cada 5 minutos
2. Los logs estarán disponibles en Vercel Dashboard
3. Puedes verificar el estado usando el endpoint GET
4. Los partidos se bloquearán automáticamente cuando su `lockTime` pase

## Notas Importantes

- ⚠️ **No ejecutes el cron job manualmente en producción** a menos que sea necesario
- ⚠️ **Mantén el CRON_SECRET seguro** y no lo compartas
- ✅ El cron job es **idempotente**: puede ejecutarse múltiples veces sin efectos secundarios
- ✅ Solo bloquea partidos con `status = 'SCHEDULED'` (ignora partidos finalizados)

