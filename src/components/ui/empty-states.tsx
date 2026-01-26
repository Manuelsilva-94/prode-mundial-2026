/**
 * Empty States pre-configurados para diferentes situaciones
 */

import { Calendar, Trophy, Users, Search, Inbox, FileText } from 'lucide-react'
import { EmptyState } from './empty-state'

// Home sin partidos próximos
export function NoMatchesEmptyState() {
  return (
    <EmptyState
      icon={Calendar}
      title="No hay partidos próximos"
      description="No hay partidos programados en este momento. Los partidos aparecerán aquí cuando estén disponibles."
      size="lg"
    />
  )
}

// Leaderboard sin usuarios
export function NoLeaderboardEmptyState() {
  return (
    <EmptyState
      icon={Trophy}
      title="Aún no hay clasificación"
      description="El leaderboard aparecerá cuando los usuarios comiencen a hacer predicciones y se calculen los primeros puntos."
      size="lg"
    />
  )
}

// Teams sin miembros
export function NoTeamMembersEmptyState({ teamName }: { teamName?: string }) {
  return (
    <EmptyState
      icon={Users}
      title={teamName ? `${teamName} está vacío` : 'Equipo vacío'}
      description="Este equipo aún no tiene miembros. Invita a tus amigos a unirse."
      action={{
        label: 'Invitar miembros',
        onClick: () => {
          // TODO: Implementar invitación
          console.log('Invitar miembros')
        },
      }}
      size="md"
    />
  )
}

// Profile sin predicciones
export function NoPredictionsEmptyState({ isOwnProfile = false }: { isOwnProfile?: boolean }) {
  return (
    <EmptyState
      icon={Inbox}
      title={isOwnProfile ? 'Aún no has hecho predicciones' : 'Sin predicciones'}
      description={
        isOwnProfile
          ? 'Comienza a hacer tus predicciones para los partidos y compite con otros usuarios.'
          : 'Este usuario aún no ha realizado ninguna predicción.'
      }
      action={
        isOwnProfile
          ? {
              label: 'Ver partidos',
              href: '/home',
            }
          : undefined
      }
      size="md"
    />
  )
}

// Búsqueda sin resultados
export function NoSearchResultsEmptyState({ searchTerm }: { searchTerm?: string }) {
  return (
    <EmptyState
      icon={Search}
      title="No se encontraron resultados"
      description={
        searchTerm
          ? `No hay resultados para "${searchTerm}". Intenta con otros términos de búsqueda.`
          : 'No se encontraron resultados para tu búsqueda. Intenta con otros términos.'
      }
      size="md"
    />
  )
}

// Admin sin datos
export function NoDataEmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
}) {
  return (
    <EmptyState
      icon={FileText}
      title={title}
      description={description}
      action={action}
      size="md"
    />
  )
}

// Sin predicciones en un partido específico
export function NoMatchPredictionsEmptyState() {
  return (
    <EmptyState
      icon={Inbox}
      title="Sin predicciones"
      description="Aún no hay predicciones para este partido. Los usuarios pueden hacer sus predicciones hasta que se bloquee el partido."
      size="sm"
    />
  )
}
