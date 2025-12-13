# Componentes UI Base

Biblioteca de componentes reutilizables para la aplicación Prode Mundial 2026.

## LoadingSpinner

Spinner animado para estados de carga.

### Props

- `size?: 'sm' | 'md' | 'lg'` - Tamaño del spinner (default: 'md')
- `className?: string` - Clases CSS adicionales
- `centered?: boolean` - Si es true, centra el spinner en un contenedor (default: false)

### Ejemplo

```tsx
import { LoadingSpinner } from '@/components/ui/loading-spinner'

// Spinner simple
<LoadingSpinner size="lg" />

// Spinner centrado
<LoadingSpinner size="md" centered />
```

## EmptyState

Componente para mostrar estados vacíos.

### Props

- `icon?: LucideIcon` - Icono de lucide-react
- `title: string` - Título del estado vacío
- `description?: string` - Descripción opcional
- `action?: { label: string; onClick: () => void }` - Botón de acción opcional
- `className?: string` - Clases CSS adicionales

### Ejemplo

```tsx
import { EmptyState } from '@/components/ui/empty-state'
import { Inbox } from 'lucide-react'

<EmptyState
  icon={Inbox}
  title="No hay predicciones"
  description="Aún no has realizado ninguna predicción. ¡Empieza ahora!"
  action={{
    label: 'Crear predicción',
    onClick: () => router.push('/predictions/new')
  }}
/>
```

## ErrorMessage

Componente para mostrar mensajes de error.

### Props

- `title?: string` - Título del error (default: 'Error')
- `message: string` - Mensaje de error
- `onRetry?: () => void` - Función para reintentar (opcional)
- `className?: string` - Clases CSS adicionales

### Ejemplo

```tsx
import { ErrorMessage } from '@/components/ui/error-message'

<ErrorMessage
  title="Error al cargar datos"
  message="No se pudieron cargar las predicciones. Por favor, intenta de nuevo."
  onRetry={() => refetch()}
/>
```

## ConfirmDialog

Modal de confirmación para acciones que requieren confirmación del usuario.

### Props

- `open: boolean` - Controla si el diálogo está abierto
- `onOpenChange: (open: boolean) => void` - Callback cuando cambia el estado
- `title: string` - Título del diálogo
- `description: string` - Descripción/mensaje
- `confirmLabel?: string` - Texto del botón de confirmar (default: 'Confirmar')
- `cancelLabel?: string` - Texto del botón de cancelar (default: 'Cancelar')
- `variant?: 'default' | 'destructive'` - Variante del botón de confirmar (default: 'default')
- `onConfirm: () => void | Promise<void>` - Función a ejecutar al confirmar
- `isLoading?: boolean` - Estado de carga (default: false)

### Ejemplo

```tsx
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useState } from 'react'

function MyComponent() {
  const [open, setOpen] = useState(false)

  const handleDelete = async () => {
    await deleteItem()
    setOpen(false)
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      title="Eliminar predicción"
      description="¿Estás seguro de que quieres eliminar esta predicción? Esta acción no se puede deshacer."
      variant="destructive"
      confirmLabel="Eliminar"
      onConfirm={handleDelete}
      isLoading={isDeleting}
    />
  )
}
```

## PageHeader

Encabezado de página con breadcrumbs y acciones opcionales.

### Props

- `title: string` - Título de la página
- `description?: string` - Descripción opcional
- `breadcrumbs?: Array<{ label: string; href?: string }>` - Breadcrumbs opcionales
- `actions?: React.ReactNode` - Elementos de acción (botones, etc.)
- `className?: string` - Clases CSS adicionales

### Ejemplo

```tsx
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'

<PageHeader
  title="Mi Perfil"
  description="Gestiona tu información personal y estadísticas"
  breadcrumbs={[
    { label: 'Home', href: '/home' },
    { label: 'Perfil' }
  ]}
  actions={
    <Button>Editar</Button>
  }
/>
```

## StatCard

Card para mostrar estadísticas con icono, valor y tendencia opcional.

### Props

- `title: string` - Título de la estadística
- `value: string | number` - Valor a mostrar
- `icon?: LucideIcon` - Icono opcional
- `trend?: { value: number; label: string; isPositive?: boolean }` - Indicador de tendencia
- `description?: string` - Descripción adicional
- `className?: string` - Clases CSS adicionales

### Ejemplo

```tsx
import { StatCard } from '@/components/ui/stat-card'
import { Trophy, TrendingUp } from 'lucide-react'

<StatCard
  title="Total de Puntos"
  value={1250}
  icon={Trophy}
  trend={{
    value: 15.5,
    label: 'vs mes anterior',
    isPositive: true
  }}
  description="Desde el inicio del torneo"
/>
```

## Skeletons

Componentes skeleton para estados de carga.

### MatchCardSkeleton

Skeleton para tarjetas de partidos.

```tsx
import { MatchCardSkeleton } from '@/components/ui/skeletons'

<MatchCardSkeleton />
```

### TableSkeleton

Skeleton para tablas.

```tsx
import { TableSkeleton } from '@/components/ui/skeletons'

<TableSkeleton rows={5} columns={4} />
```

### ProfileSkeleton

Skeleton para perfiles de usuario.

```tsx
import { ProfileSkeleton } from '@/components/ui/skeletons'

<ProfileSkeleton />
```

