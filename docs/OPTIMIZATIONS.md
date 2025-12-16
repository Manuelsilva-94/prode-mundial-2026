# Optimizaciones de Rendimiento - Prode Mundial 2026

Este documento describe las optimizaciones implementadas para mejorar el rendimiento y la experiencia de usuario de la aplicación.

## 📦 Bundle Size

### Bundle Analyzer

Configurado `@next/bundle-analyzer` para analizar el tamaño del bundle:

```bash
# Analizar el bundle
npm run build:analyze
```

Esto genera un reporte visual interactivo del tamaño de cada módulo.

### Modularize Imports

Configurado en `next.config.js` para importar solo los iconos necesarios de lucide-react:

```js
modularizeImports: {
  'lucide-react': {
    transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
  },
}
```

**Impacto**: Reduce el bundle size significativamente al no importar todos los iconos.

## 🚀 Lazy Loading

### Componentes Pesados

Implementado lazy loading con `next/dynamic` para componentes que no son críticos en el primer render:

```tsx
// src/components/lazy/index.tsx
export const LazyPointsEvolutionChart = dynamic(
  () => import('@/components/predictions/PointsEvolutionChart'),
  { loading: () => <ChartSkeleton />, ssr: false }
)
```

**Componentes lazy-loaded:**

- `PointsEvolutionChart` - Recharts es pesado (~200kb)
- `PredictionsTable` - Tabla con muchas dependencias
- `PhaseBreakdown` - Tabs con estadísticas
- `TeamDetailDialog` - Modal de detalles

### Imágenes

Todas las imágenes usan `next/image` con optimización automática:

- Lazy loading nativo
- Formato WebP automático
- Responsive sizing

## 🧠 Memoización

### React.memo

Componentes puros memoizados para evitar re-renders:

```tsx
// src/components/matches/MatchCard.tsx
export const MatchCard = memo(function MatchCard({ match }) {
  // ...
})
```

**Componentes memoizados:**

- `MatchCard` - Se renderizan muchos en la home
- `LeaderboardTable` - Lista larga de usuarios

### useMemo / useCallback

```tsx
// Cálculos pesados memoizados
const matchDateLocal = useMemo(() => {
  return formatInTimeZone(new Date(match.matchDate), userTz, 'PPPp', {
    locale: es,
  })
}, [match.matchDate, userTz])

// Callbacks memoizados para evitar re-renders de hijos
const handleSave = useCallback(async () => {
  // ...
}, [homeScore, awayScore, match.id])
```

## 📊 Caché con React Query

### Configuración Global

```tsx
// src/components/providers/QueryProvider.tsx
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutos fresh
      gcTime: 10 * 60 * 1000, // 10 minutos en caché
      refetchOnWindowFocus: false, // No refetch al cambiar ventana
      refetchOnReconnect: false, // No refetch al reconectar
      retry: 2, // Máximo 2 reintentos
    },
  },
})
```

### Optimistic Updates

Las predicciones usan optimistic updates para UX instantánea:

```tsx
// src/hooks/use-create-prediction.ts
onMutate: async (newPrediction) => {
  await queryClient.cancelQueries({ queryKey: ['matches'] })
  // Actualizar UI inmediatamente
  queryClient.setQueriesData({ queryKey: ['matches'] }, (old) => {
    // Actualizar predicción optimistamente
  })
}
```

## ⏳ Loading States

### Skeletons

Preferimos skeletons sobre spinners para mejor UX:

```tsx
// src/components/ui/skeletons.tsx
export function MatchCardSkeleton() {
  /* ... */
}
export function TableSkeleton() {
  /* ... */
}
export function ProfileSkeleton() {
  /* ... */
}
export function TeamViewSkeleton() {
  /* ... */
}
```

### Suspense Boundaries

Componente reutilizable para Suspense:

```tsx
// src/components/ui/suspense-boundary.tsx
<SuspenseBoundary variant="chart">
  <LazyChart data={data} />
</SuspenseBoundary>
```

Variantes disponibles: `card`, `table`, `chart`, `profile`, `custom`

## 🔧 Configuración de Producción

### Console Logs

Eliminados automáticamente en producción:

```js
// next.config.js
compiler: {
  removeConsole: process.env.NODE_ENV === 'production',
}
```

### React Query Devtools

Solo se cargan en desarrollo:

```tsx
{
  process.env.NODE_ENV === 'development' && (
    <ReactQueryDevtools initialIsOpen={false} />
  )
}
```

## 📈 Métricas Recomendadas

Para monitorear el rendimiento, recomendamos:

1. **Lighthouse**: Correr auditorías periódicamente
2. **Web Vitals**: Monitorear LCP, FID, CLS
3. **Bundle Size**: Revisar con cada PR que agregue dependencias

### Comandos Útiles

```bash
# Analizar bundle
npm run build:analyze

# Build de producción
npm run build

# Type check
npm run type-check

# Lint
npm run lint
```

## 🎯 Próximas Optimizaciones

Posibles mejoras futuras:

1. **Service Worker**: Cache offline de datos estáticos
2. **Prefetching**: Precargar rutas probables
3. **Virtualization**: Para listas muy largas (react-window)
4. **Edge Functions**: Mover lógica a edge para menor latencia
5. **ISR**: Regeneración incremental para páginas semi-estáticas
