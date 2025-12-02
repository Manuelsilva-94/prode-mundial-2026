# Documentación de Casos de Testing

## Resumen

Esta suite de tests cubre todas las funcionalidades críticas del sistema de predicciones y leaderboard del Prode Mundial 2026.

**Cobertura objetivo:** >80% en lógica crítica

---

## 1. Tests Unitarios de Cálculo de Puntos

**Archivo:** `src/lib/scoring/__tests__/calculator.test.ts`

### Casos Testeados (25+ casos)

#### Resultado Exacto (12 puntos)

- ✅ Predicción 1-0, Resultado 1-0 → 12 puntos
- ✅ Predicción 3-1, Resultado 3-1 → 12 puntos
- ✅ Empate exacto 1-1 → 12 puntos
- ✅ Empate 0-0 → 12 puntos
- ✅ Goleada exacta 5-0 → 12 puntos

#### Ganador + Goles de 1 Equipo (7 puntos)

- ✅ Predicción 1-0, Resultado 2-0 → 7 puntos
- ✅ Predicción 3-1, Resultado 3-2 → 7 puntos
- ✅ Predicción 2-1, Resultado 3-1 → 7 puntos
- ✅ Predicción 0-1, Resultado 0-1 → 12 puntos (exacto)
- ✅ Predicción 1-2, Resultado 0-2 → 7 puntos
- ✅ Predicción 0-3, Resultado 2-3 → 7 puntos
- ✅ Predicción 4-0, Resultado 4-3 → 7 puntos
- ✅ Predicción 1-3, Resultado 0-3 → 7 puntos
- ✅ Predicción 2-4, Resultado 1-4 → 7 puntos

#### Solo Ganador o Empate (5 puntos)

- ✅ Predicción 1-0, Resultado 2-1 → 5 puntos
- ✅ Predicción 2-1, Resultado 3-0 → 5 puntos
- ✅ Predicción 1-1, Resultado 3-3 → 5 puntos
- ✅ Predicción 0-2, Resultado 1-3 → 5 puntos
- ✅ Predicción 2-1, Resultado 3-0 → 5 puntos
- ✅ Predicción 2-3, Resultado 1-4 → 5 puntos
- ✅ Predicción 0-0, Resultado 1-1 → 5 puntos
- ✅ Predicción 2-2, Resultado 4-4 → 5 puntos

#### Solo Goles de 1 Equipo (2 puntos)

- ✅ Predicción 1-0, Resultado 0-0 → 2 puntos
- ✅ Predicción 2-1, Resultado 2-2 → 2 puntos
- ✅ Predicción 1-1, Resultado 0-0 → 2 puntos

#### Todo Incorrecto (0 puntos)

- ✅ Predicción 1-0, Resultado 2-2 → 0 puntos
- ✅ Predicción 2-1, Resultado 1-3 → 0 puntos
- ✅ Predicción 3-0, Resultado 0-3 → 0 puntos
- ✅ Predicción 0-2, Resultado 3-1 → 0 puntos

#### Casos Especiales

- ✅ Goleadas con diferente marcador
- ✅ Empates con diferentes goles
- ✅ Verificación de contexto en breakdown
- ✅ Multiplicadores de fase (todos 1.0)

---

## 2. Tests de Integración de Predicciones

**Archivo:** `tests/api/predictions/integration.test.ts`

### Casos Testeados

#### Crear Predicción

- ✅ Crear predicción válida para partido no bloqueado
- ✅ Solo una predicción por usuario y partido (UPSERT)
- ✅ Validación de partido bloqueado

#### Actualizar Predicción

- ✅ Actualizar predicción existente

#### Obtener Predicciones

- ✅ Obtener todas las predicciones de un usuario
- ✅ Obtener predicción específica por matchId y userId

#### Eliminar Predicción

- ✅ Eliminar una predicción

#### Validaciones de Datos

- ✅ Rechazar scores negativos
- ✅ Aceptar solo números enteros

---

## 3. Tests de Validación de lockTime

**Archivo:** `tests/api/predictions/locktime.test.ts`

### Casos Testeados

#### Predicción ANTES de lockTime (debe permitir)

- ✅ Crear predicción cuando lockTime está en el futuro
- ✅ Actualizar predicción cuando lockTime está en el futuro

#### Predicción DESPUÉS de lockTime (debe rechazar)

- ✅ Detectar partido bloqueado cuando lockTime pasó
- ✅ Verificar lockTime considerando tiempo actual

#### Cálculo de lockTime

- ✅ Calcular lockTime correctamente (15 min antes por defecto)
- ✅ Calcular lockTime con minutos personalizados

#### Partidos con diferentes estados

- ✅ Rechazar predicción para partido LIVE
- ✅ Rechazar predicción para partido FINISHED

#### Edge Cases

- ✅ lockTime exactamente en momento actual
- ✅ lockTime muy cercano al presente
- ✅ lockTime en diferentes zonas horarias (UTC)

---

## 4. Tests de Leaderboard

**Archivo:** `tests/api/leaderboard/leaderboard.test.ts`

### Casos Testeados

#### Cálculo de Estadísticas

- ✅ correctPredictions: todas las predicciones con puntos > 0
- ✅ exactScores: solo predicciones exactas
- ✅ totalPoints: suma correcta de puntos
- ✅ accuracyRate: cálculo correcto (correctPredictions / totalPredictions \* 100)

#### Ranking y Ordenamiento

- ✅ Ordenar usuarios por totalPoints descendente
- ✅ Asignar rankings correctos (1, 2, 3, ...)
- ✅ Usuario con más puntos en primer lugar

#### Evolución de Ranking

- ✅ Guardar previousRanking al actualizar
- ✅ Calcular rankingChange correctamente
- ✅ Manejar usuarios nuevos (previousRanking = null)

#### Múltiples Partidos

- ✅ Acumular puntos de múltiples partidos

---

## 5. Tests del Flujo Crítico Completo

**Archivo:** `tests/api/critical-flow.test.ts`

### Flujo Completo Testeado

1. **Usuario crea predicción**
   - ✅ Predicción válida antes de lockTime

2. **Partido cambia a FINISHED y se guarda resultado**
   - ✅ Actualizar estado a FINISHED
   - ✅ Guardar homeScore y awayScore
   - ✅ Marcar como isLocked

3. **Se calculan puntos automáticamente**
   - ✅ Procesar todas las predicciones del partido
   - ✅ Asignar puntos según resultado
   - ✅ Guardar pointsEarned y pointsBreakdown

4. **Se actualiza leaderboard**
   - ✅ Recalcular estadísticas de todos los usuarios
   - ✅ Actualizar rankings
   - ✅ Guardar previousRanking y rankingChange

5. **Traer posiciones del leaderboard**
   - ✅ Obtener leaderboard ordenado
   - ✅ Verificar posiciones correctas
   - ✅ Incluir información de usuario

### Casos Adicionales

- ✅ Múltiples usuarios en el flujo completo
- ✅ Actualizar ranking con múltiples partidos

---

## 6. Tests de Timezone

**Archivo:** `tests/lib/scoring/timezone.test.ts`

### Casos Testeados

#### Cálculo de lockTime en UTC

- ✅ Calcular lockTime correctamente en UTC
- ✅ Manejar fechas con timezone offset

#### Validación con diferentes zonas horarias

- ✅ Comparar lockTime correctamente independiente del timezone del usuario
- ✅ Verificar isLocked usando UTC

#### Conversión para Display (futura implementación UI)

- ✅ Convertir UTC a timezone local para display
- ✅ Mantener consistencia entre UTC almacenado y display local

#### Edge Cases

- ✅ Manejar cambio de horario de verano (DST)
- ✅ Manejar diferentes formatos de fecha
- ✅ Preservar precisión en cálculos de tiempo
- ✅ Validación para usuarios en diferentes zonas

---

## Helpers de Testing

**Archivo:** `tests/helpers/test-utils.ts`

### Funciones Disponibles

- ✅ `createTestUser()` - Crear usuario de prueba
- ✅ `createTestAdmin()` - Crear admin de prueba
- ✅ `generateUniqueEmail()` - Generar email único
- ✅ `createTestFootballTeam()` - Crear equipo de fútbol
- ✅ `createTestPhase()` - Crear fase de torneo
- ✅ `calculateLockTime()` - Calcular lockTime
- ✅ `createTestMatch()` - Crear partido de prueba
- ✅ `createTestPrediction()` - Crear predicción de prueba
- ✅ `getOrCreateGruposPhase()` - Obtener o crear fase grupos

---

## Comandos para Ejecutar Tests

```bash
# Modo watch (desarrollo)
npm run test

# Una sola vez
npm run test:run

# Con interfaz gráfica
npm run test:ui

# Ver cobertura
npm run test:coverage
```

---

## Cobertura Objetivo

- ✅ **Cálculo de puntos:** 100% (25+ casos)
- ✅ **Validaciones:** 90%+
- ✅ **Integración predicciones:** 85%+
- ✅ **lockTime:** 95%+
- ✅ **Leaderboard:** 90%+
- ✅ **Flujo crítico:** 100%

**Total estimado:** >80% en lógica crítica

---

## Notas Importantes

1. **Base de datos de testing:** Los tests usan una base de datos separada (`prode_test`)
2. **No limpian datos:** Por seguridad, los tests NO limpian la DB automáticamente
3. **Timezone:** Todos los cálculos se hacen en UTC para consistencia
4. **Performance:** Los tests están optimizados para ejecución rápida

---

## Próximos Pasos

- [ ] Tests E2E con Playwright o Cypress
- [ ] Tests de performance para leaderboard con muchos usuarios
- [ ] Tests de carga para múltiples predicciones simultáneas
- [ ] Tests de integración con servicios externos (emails)
