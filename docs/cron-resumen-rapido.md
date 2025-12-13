# 🔒 Cron Job: Resumen Rápido

## 🎯 ¿Qué hace?

Bloquea automáticamente partidos donde el tiempo límite (`lockTime`) ya pasó.

**Ejemplo:**

- Partido a las 20:00, `lockTime` = 19:45
- A las 19:46, el cron job detecta que el `lockTime` pasó
- Actualiza `isLocked = true` automáticamente
- Los usuarios ya NO pueden crear/editar predicciones

## ⚡ ¿Cuándo se ejecuta?

**Automáticamente cada 5 minutos** cuando está deployado en Vercel.

```
19:45 → Cron ejecuta → No hay nada que bloquear
19:50 → Cron ejecuta → Bloquea partidos con lockTime <= 19:50
19:55 → Cron ejecuta → Bloquea más partidos si hay
20:00 → Cron ejecuta → Continúa...
```

## 🔐 Configuración Necesaria

### 1. Generar Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Agregar en `.env.local`

```bash
CRON_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### 3. Agregar en Vercel

1. Ve a Vercel Dashboard → Tu Proyecto → Settings → Environment Variables
2. Agrega: `CRON_SECRET` = tu-secret-generado
3. Selecciona todos los ambientes (Production, Preview, Development)
4. Guarda

## 🧪 Testing

### ✅ Opción 1: Tests Automatizados (Recomendado primero)

```bash
npm test -- tests/api/cron/lock-matches.test.ts
```

Verifica:

- ✅ Seguridad (401 sin secret)
- ✅ Bloqueo correcto
- ✅ Edge cases

### 🔧 Opción 2: Postman (Testing Manual)

**Request 1: Ejecutar Cron**

```
POST http://localhost:3000/api/cron/lock-matches
Headers:
  Authorization: Bearer tu-cron-secret
```

**Request 2: Ver Estado**

```
GET http://localhost:3000/api/cron/lock-matches
Headers:
  Authorization: Bearer tu-cron-secret
```

### 📋 Pasos para Testing Manual:

1. **Inicia el servidor:**

   ```bash
   npm run dev
   ```

2. **Crea un partido de prueba:**
   - Usa la API de admin para crear un partido
   - O inserta directamente en la BD un partido con `lockTime` en el pasado

3. **Ejecuta el POST en Postman:**
   - Deberías recibir `200 OK` con `lockedCount: 1`

4. **Verifica en la BD:**
   ```sql
   SELECT id, "lockTime", "isLocked", "updatedAt"
   FROM matches
   WHERE "isLocked" = true
   ORDER BY "updatedAt" DESC;
   ```

## 📊 Flujo Visual

```
┌─────────────────────────────────────────────────┐
│  Vercel ejecuta POST cada 5 minutos            │
│  → /api/cron/lock-matches                       │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  1. Verifica CRON_SECRET                        │
│     ❌ Secret incorrecto? → 401 Unauthorized    │
│     ✅ Secret correcto? → Continúa              │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  2. Busca partidos con:                         │
│     - lockTime <= ahora                         │
│     - isLocked = false                          │
│     - status = 'SCHEDULED'                      │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  3. Para cada partido encontrado:               │
│     UPDATE matches SET isLocked = true          │
│     WHERE id = match.id                         │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  4. Retorna resultado:                          │
│     {                                            │
│       success: true,                            │
│       lockedCount: 3,                           │
│       duration: "245ms"                         │
│     }                                            │
└─────────────────────────────────────────────────┘
```

## ✅ Checklist de Verificación

- [ ] `CRON_SECRET` en `.env.local`
- [ ] `CRON_SECRET` en Vercel (después del deploy)
- [ ] Tests pasan: `npm test -- tests/api/cron/lock-matches.test.ts`
- [ ] POST manual funciona (200 OK)
- [ ] GET muestra estadísticas correctas
- [ ] Partidos se bloquean en la BD
- [ ] `vercel.json` configurado (ya está ✅)

## 🚨 Problemas Comunes

| Problema            | Solución                                          |
| ------------------- | ------------------------------------------------- |
| 401 Unauthorized    | Verifica que `CRON_SECRET` coincide               |
| No bloquea partidos | Verifica que hay partidos con `lockTime <= now()` |
| Error 500           | Verifica que `CRON_SECRET` está configurado       |

## 📝 Archivos Importantes

- **Endpoint**: `src/app/api/cron/lock-matches/route.ts`
- **Config**: `vercel.json`
- **Tests**: `tests/api/cron/lock-matches.test.ts`
- **Docs**: `docs/cron-lock-matches-guia-completa.md`

¡Eso es todo! 🎉
