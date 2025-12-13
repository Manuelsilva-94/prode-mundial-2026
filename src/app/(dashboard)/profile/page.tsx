'use client'

import { PersonalInfo } from '@/components/profile/PersonalInfo'
import { StatsCards } from '@/components/profile/StatsCards'
import { PredictionsHistory } from '@/components/profile/PredictionsHistory'

export default function ProfilePage() {
  return (
    <div className="container mx-auto space-y-8 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona tu información personal y revisa tus estadísticas
        </p>
      </div>

      <PersonalInfo />

      <div>
        <h2 className="mb-4 text-2xl font-semibold">Estadísticas</h2>
        <StatsCards />
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-semibold">Historial</h2>
        <PredictionsHistory />
      </div>
    </div>
  )
}
