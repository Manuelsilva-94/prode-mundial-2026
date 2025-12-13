# Guía Completa: Cron Job de Bloqueo Automático de Partidos

## 📋 ¿Qué hace este código?

Este código implementa un **cron job** (tarea programada) que se ejecuta automáticamente cada 5 minutos para **bloquear partidos** donde el tiempo límite (`lockTime`) ya pasó, pero aún no están bloqueados manualmente.

### Problema que resuelve:

Imagina que tienes un partido programado para las 20:00 horas, con `lockTime` a las 19:45 (15 minutos antes). A las 19:46, ese partido **debería estar bloqueado** para que los usuarios no puedan crear o editar predicciones. Este cron job se asegura de que esto suceda automáticamente.

## 🔧 ¿Cómo funciona? (Paso a Paso)

### 1. **Configuración del Cron Job (vercel.json)**

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

- `path`: La ruta del endpoint que se ejecutará
- `schedule`: `*/5 * * * *` significa "cada 5 minutos"
  - `*/5` = cada 5 minutos
  - `*` = cada hora
  - `*` = cada día
  - `*` = cada mes
  - `*` = cada día de la semana

**Vercel ejecutará automáticamente este endpoint cada 5 minutos** una vez que hagas el deploy.

### 2. **Flujo del Endpoint POST /api/cron/lock-matches**

Cuando Vercel ejecuta el cron job, hace un POST al endpoint. El código hace lo siguiente:

#### Paso 1: Validación de Seguridad

```typescript
const authHeader = req.headers.get('authorization')
const cronSecret = process.env.CRON_SECRET

if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
}
```

**¿Por qué?** Para que solo Vercel (con el secret correcto) pueda ejecutar este endpoint. Cualquier otro intento será rechazado.

#### Paso 2: Buscar Partidos a Bloquear

```typescript
const now = new Date()

const matchesToLock = await prisma.match.findMany({
  where: {
    lockTime: { lte: now }, // lockTime <= ahora
    isLocked: false, // Aún no bloqueado
    status: 'SCHEDULED', // Solo partidos programados
  },
})
```

**Busca partidos donde:**

- El `lockTime` ya pasó (`lockTime <= now()`)
- Aún no están bloqueados (`isLocked = false`)
- Están programados (`status = 'SCHEDULED'`)

#### Paso 3: Bloquear los Partidos Encontrados

```typescript
await prisma.match.update({
  where: { id: match.id },
  data: { isLocked: true },
})
```

**Para cada partido encontrado:**

- Actualiza `isLocked = true`
- Log detallado de qué partido fue bloqueado

#### Paso 4: Retornar Resultado

```typescript
return NextResponse.json({
  success: true,
  lockedCount: 3, // Cuántos partidos bloqueó
  errorCount: 0, // Si hubo errores
  duration: '245ms', // Tiempo que tomó
  timestamp: '2025-12-06T20:00:00.000Z',
})
```

### 3. **Endpoint GET /api/cron/lock-matches**

Este endpoint NO ejecuta el cron job, solo muestra información:

- **Sin autorización**: Info básica del endpoint
- **Con autorización**: Estadísticas detalladas (cuántos partidos pendientes, totales, etc.)

Útil para monitoreo y verificación sin ejecutar el bloqueo.

## ⚙️ ¿Qué falta configurar?

### Variable de Entorno: `CRON_SECRET`

**¿Por qué?** Es el "password" que protege tu endpoint. Solo quien tenga este secret puede ejecutar el cron job.

#### Paso 1: Generar un Secret Único

En tu terminal (o puedes usar cualquier generador):

```bash
# Opción 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Opción 2: Online
# Ve a https://www.uuidgenerator.net/ y genera un UUID v4
# O usa cualquier generador de strings aleatorios
```

**Ejemplo de output:**

```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

#### Paso 2: Agregar en Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com)
2. Navega a **Settings** → **Environment Variables**
3. Agrega:
   - **Name**: `CRON_SECRET`
   - **Value**: El secret que generaste (ej: `a1b2c3d4e5f6g7h8...`)
   - **Environments**: Selecciona todas (Production, Preview, Development)

4. Haz clic en **Save**

#### Paso 3: Agregar en tu `.env.local` (para desarrollo local)

Crea o edita `.env.local` en la raíz de tu proyecto:

```bash
CRON_SECRET=tu-secret-generado-aqui
```

**⚠️ IMPORTANTE:**

- NO commitees `.env.local` al repositorio (ya debería estar en `.gitignore`)
- Usa el MISMO secret en desarrollo y producción, o diferentes según prefieras
- Mantén el secret seguro y no lo compartas

## 🧪 ¿Cómo testear?

### Opción 1: Testing con Vitest (Tests Automatizados)

Ya tienes tests creados en `tests/api/cron/lock-matches.test.ts`. Estos tests verifican:

✅ Seguridad (401 si no hay secret, secret incorrecto)  
✅ Lógica de bloqueo (bloquea partidos correctos)  
✅ Edge cases (partidos futuros, ya bloqueados, finalizados)  
✅ Múltiples partidos

#### Ejecutar los tests:

```bash
# Solo tests del cron job
npm test -- tests/api/cron/lock-matches.test.ts

# Todos los tests
npm test
```

#### Qué hacen los tests:

1. **Tests de Seguridad:**
   - Intenta ejecutar sin secret → espera 401
   - Intenta con secret incorrecto → espera 401
   - Intenta con secret correcto → espera 200

2. **Tests de Lógica:**
   - Crea un partido con `lockTime` en el pasado
   - Ejecuta el cron job
   - Verifica que el partido ahora tiene `isLocked = true`

3. **Tests de Edge Cases:**
   - Partidos con `lockTime` en el futuro → NO se bloquean
   - Partidos ya bloqueados → NO se vuelven a bloquear
   - Partidos finalizados → NO se bloquean (solo se bloquean SCHEDULED)

### Opción 2: Testing Manual con Postman

#### Paso 1: Configurar el Secret en Postman

1. Abre Postman
2. Ve a **Environment** (esquina superior derecha)
3. Crea una nueva variable:
   - **Variable**: `cron_secret`
   - **Initial Value**: Tu `CRON_SECRET` (el que configuraste en `.env.local`)
   - **Current Value**: Mismo valor

#### Paso 2: Crear una Colección de Postman

Crea un nuevo request:

**Request 1: POST - Ejecutar Cron Job**

```
Method: POST
URL: http://localhost:3000/api/cron/lock-matches
Headers:
  Authorization: Bearer {{cron_secret}}
  Content-Type: application/json
```

**Request 2: GET - Ver Estado (sin auth)**

```
Method: GET
URL: http://localhost:3000/api/cron/lock-matches
```

**Request 3: GET - Ver Estadísticas (con auth)**

```
Method: GET
URL: http://localhost:3000/api/cron/lock-matches
Headers:
  Authorization: Bearer {{cron_secret}}
```

#### Paso 3: Preparar Datos de Prueba

Antes de ejecutar, necesitas partidos para bloquear. Puedes:

**Opción A: Crear partidos manualmente en la BD**

```sql
-- Insertar un partido con lockTime en el pasado
INSERT INTO matches (
  id, home_team_id, away_team_id, phase_id,
  match_date, lock_time, stadium, city, country,
  status, is_locked, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'id-equipo-home',
  'id-equipo-away',
  'id-fase',
  NOW() + INTERVAL '1 hour',  -- Partido en 1 hora
  NOW() - INTERVAL '30 minutes',  -- lockTime hace 30 minutos (PASADO)
  'Estadio Test',
  'Ciudad Test',
  'País Test',
  'SCHEDULED',
  false,  -- NO bloqueado aún
  NOW(),
  NOW()
);
```

**Opción B: Usar tu seed de Prisma**
Modifica temporalmente tu seed para crear partidos con `lockTime` en el pasado.

**Opción C: Usar la API de Admin**
Si tienes la API de admin, crea un partido y luego actualízalo para tener `lockTime` en el pasado.

#### Paso 4: Ejecutar los Tests

1. **Asegúrate de que tu servidor local está corriendo:**

   ```bash
   npm run dev
   ```

2. **Ejecuta el POST request en Postman:**
   - Deberías recibir un `200 OK`
   - El body debería mostrar:
     ```json
     {
       "success": true,
       "message": "Cron job ejecutado exitosamente",
       "lockedCount": 1,
       "errorCount": 0,
       "duration": "123ms",
       "timestamp": "2025-12-06T20:00:00.000Z"
     }
     ```

3. **Verifica en la base de datos:**

   ```sql
   -- Ver el partido que debería estar bloqueado
   SELECT id, "lockTime", "isLocked", status, "updatedAt"
   FROM matches
   WHERE "isLocked" = true
   ORDER BY "updatedAt" DESC
   LIMIT 5;
   ```

4. **Ejecuta el GET request:**
   - Sin auth: Info básica
   - Con auth: Estadísticas detalladas

### Opción 3: Testing Manual con cURL

Si prefieres usar la terminal:

```bash
# Ejecutar cron job
curl -X POST http://localhost:3000/api/cron/lock-matches \
  -H "Authorization: Bearer tu-cron-secret-aqui" \
  -H "Content-Type: application/json"

# Ver estado
curl http://localhost:3000/api/cron/lock-matches

# Ver estadísticas (con auth)
curl http://localhost:3000/api/cron/lock-matches \
  -H "Authorization: Bearer tu-cron-secret-aqui"
```

## 🔍 Verificación Completa

### Checklist de Verificación:

- [ ] Variable `CRON_SECRET` configurada en `.env.local`
- [ ] Variable `CRON_SECRET` configurada en Vercel
- [ ] `vercel.json` existe y tiene la configuración del cron
- [ ] Tests pasan: `npm test -- tests/api/cron/lock-matches.test.ts`
- [ ] Servidor local funciona: `npm run dev`
- [ ] Puedo ejecutar POST manualmente y recibo 200
- [ ] Los partidos se bloquean correctamente en la BD
- [ ] Puedo ver estadísticas con GET + auth

### Qué verificar después del deploy:

1. **En Vercel Dashboard:**
   - Ve a **Settings** → **Cron Jobs**
   - Verifica que aparece `/api/cron/lock-matches` con schedule `*/5 * * * *`

2. **En Vercel Logs:**
   - Ve a **Deployments** → Último deployment → **Functions**
   - Busca logs del cron job
   - Deberías ver logs cada 5 minutos

3. **En tu Base de Datos:**
   - Verifica que los partidos se están bloqueando automáticamente
   - Ejecuta el GET endpoint para ver estadísticas

## 🚨 Troubleshooting

### Error: "CRON_SECRET no está configurado"

**Solución:** Agrega `CRON_SECRET` en `.env.local` o en Vercel.

### Error: 401 Unauthorized

**Solución:** Verifica que el secret en el header coincide con el de la variable de entorno.

### Los partidos no se bloquean

**Posibles causas:**

1. No hay partidos con `lockTime <= now()` y `isLocked = false`
2. Los partidos tienen `status != 'SCHEDULED'`
3. El cron job no se está ejecutando (verifica en Vercel Dashboard)

**Solución:** Ejecuta el GET endpoint con auth para ver cuántos partidos hay pendientes.

### El cron job no aparece en Vercel

**Solución:**

1. Verifica que `vercel.json` está en la raíz del proyecto
2. Haz un nuevo deploy
3. Espera unos minutos para que Vercel detecte el cron job

## 📊 Ejemplo de Flujo Completo

1. **19:40** - Partido programado para 20:00, `lockTime` = 19:45, `isLocked` = false
2. **19:45** - `lockTime` pasa, pero el partido aún no está bloqueado
3. **19:46** - Cron job se ejecuta (cada 5 minutos), detecta el partido, lo bloquea
4. **19:46** - Usuario intenta crear predicción → ❌ Rechazado (partido bloqueado)
5. **19:50** - Próxima ejecución del cron → No hay nada que bloquear

## 📝 Resumen

- **Qué hace**: Bloquea automáticamente partidos donde el tiempo límite ya pasó
- **Cuándo se ejecuta**: Cada 5 minutos (automáticamente en Vercel)
- **Seguridad**: Protegido con `CRON_SECRET`
- **Testing**: Tests automatizados (Vitest) + pruebas manuales (Postman/cURL)
- **Configuración**: Solo necesitas agregar `CRON_SECRET` en variables de entorno

¡Listo para usar! 🚀
