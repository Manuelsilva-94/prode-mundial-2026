# Ejemplos de Implementación

Ejemplos prácticos de uso de los componentes base.

## LoadingSpinner

### Uso básico

```tsx
import { LoadingSpinner } from '@/components/ui/loading-spinner'

// En un botón
<Button disabled>
  <LoadingSpinner size="sm" className="mr-2" />
  Cargando...
</Button>

// En una página completa
<div className="min-h-screen">
  <LoadingSpinner size="lg" centered />
</div>
```

## EmptyState

### Con acción

```tsx
import { EmptyState } from '@/components/ui/empty-state'
import { Inbox } from 'lucide-react'

function PredictionsList() {
  const { data, isLoading } = usePredictions()

  if (isLoading) return <LoadingSpinner centered />

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No hay predicciones"
        description="Aún no has realizado ninguna predicción. ¡Empieza ahora!"
        action={{
          label: 'Crear predicción',
          onClick: () => router.push('/predictions/new')
        }}
      />
    )
  }

  return <PredictionsList data={data} />
}
```

## ErrorMessage

### Con retry

```tsx
import { ErrorMessage } from '@/components/ui/error-message'

function UserProfile() {
  const { data, error, refetch } = useUserProfile()

  if (error) {
    return (
      <ErrorMessage
        title="Error al cargar perfil"
        message="No se pudo cargar la información del perfil. Por favor, intenta de nuevo."
        onRetry={() => refetch()}
      />
    )
  }

  return <ProfileContent data={data} />
}
```

## ConfirmDialog

### Eliminación con confirmación

```tsx
'use client'

import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

function DeletePredictionButton({ predictionId }: { predictionId: string }) {
  const [open, setOpen] = useState(false)
  const deleteMutation = useDeletePrediction()

  const handleConfirm = async () => {
    await deleteMutation.mutateAsync(predictionId)
    setOpen(false)
  }

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Eliminar
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Eliminar predicción"
        description="¿Estás seguro de que quieres eliminar esta predicción? Esta acción no se puede deshacer."
        variant="destructive"
        confirmLabel="Eliminar"
        onConfirm={handleConfirm}
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}
```

## PageHeader

### Con breadcrumbs y acciones

```tsx
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function MatchesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Partidos"
        description="Visualiza y gestiona los partidos del torneo"
        breadcrumbs={[
          { label: 'Home', href: '/home' },
          { label: 'Partidos' }
        ]}
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Partido
          </Button>
        }
      />
      {/* Contenido */}
    </div>
  )
}
```

## StatCard

### Con tendencia

```tsx
import { StatCard } from '@/components/ui/stat-card'
import { Trophy, TrendingUp } from 'lucide-react'

function DashboardStats() {
  const { data } = useStats()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total de Puntos"
        value={data.totalPoints}
        icon={Trophy}
        trend={{
          value: 12.5,
          label: 'vs semana pasada',
          isPositive: true
        }}
      />
      <StatCard
        title="Ranking"
        value={`#${data.ranking}`}
        icon={TrendingUp}
        trend={{
          value: -2,
          label: 'vs semana pasada',
          isPositive: false
        }}
      />
    </div>
  )
}
```

## Skeletons

### En una lista

```tsx
import { MatchCardSkeleton } from '@/components/ui/skeletons'

function MatchesList() {
  const { data, isLoading } = useMatches()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <MatchCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return <MatchesListContent data={data} />
}
```

### En una tabla

```tsx
import { TableSkeleton } from '@/components/ui/skeletons'

function LeaderboardTable() {
  const { data, isLoading } = useLeaderboard()

  if (isLoading) {
    return <TableSkeleton rows={10} columns={5} />
  }

  return <LeaderboardTableContent data={data} />
}
```

### En un perfil

```tsx
import { ProfileSkeleton } from '@/components/ui/skeletons'

function ProfilePage() {
  const { data, isLoading } = useUserProfile()

  if (isLoading) {
    return <ProfileSkeleton />
  }

  return <ProfileContent data={data} />
}
```

## Combinación de componentes

### Lista con loading, error y empty states

```tsx
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorMessage } from '@/components/ui/error-message'
import { EmptyState } from '@/components/ui/empty-state'
import { Inbox } from 'lucide-react'

function PredictionsList() {
  const { data, isLoading, error, refetch } = usePredictions()

  if (isLoading) {
    return <LoadingSpinner size="lg" centered />
  }

  if (error) {
    return (
      <ErrorMessage
        message="Error al cargar las predicciones"
        onRetry={() => refetch()}
      />
    )
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No hay predicciones"
        description="Aún no has realizado ninguna predicción."
        action={{
          label: 'Crear predicción',
          onClick: () => router.push('/predictions/new')
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      {data.map((prediction) => (
        <PredictionCard key={prediction.id} prediction={prediction} />
      ))}
    </div>
  )
}
```

