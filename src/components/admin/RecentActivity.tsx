'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserAvatar } from '@/components/leaderboard/UserAvatar'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface RecentUser {
  id: string
  name: string
  email: string
  createdAt: string
}

interface RecentPrediction {
  id: string
  userName: string
  match: string
  prediction: string
  createdAt: string
}

interface RecentActivityProps {
  users: RecentUser[]
  predictions: RecentPrediction[]
}

export function RecentActivity({ users, predictions }: RecentActivityProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Usuarios recientes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Usuarios Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay usuarios recientes</p>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center space-x-3">
                  <UserAvatar name={user.name} className="h-9 w-9" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-muted-foreground text-xs truncate">
                      {user.email}
                    </p>
                  </div>
                  <span className="text-muted-foreground text-xs whitespace-nowrap">
                    {formatDistanceToNow(new Date(user.createdAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Predicciones recientes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Predicciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {predictions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay predicciones recientes</p>
          ) : (
            <div className="space-y-4">
              {predictions.map((pred) => (
                <div key={pred.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{pred.userName}</p>
                    <p className="text-muted-foreground text-xs">
                      {pred.match}: <span className="font-mono">{pred.prediction}</span>
                    </p>
                  </div>
                  <span className="text-muted-foreground text-xs whitespace-nowrap">
                    {formatDistanceToNow(new Date(pred.createdAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

