'use client'

import * as React from 'react'
import { Edit2, Check, X, Mail, Users } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUserProfile, useUpdateProfile } from '@/hooks/use-user-profile'
import { updateProfileSchema } from '@/lib/validations/user'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function PersonalInfo() {
  const { data, isLoading } = useUserProfile()
  const updateProfile = useUpdateProfile()
  const [isEditing, setIsEditing] = React.useState(false)
  const [name, setName] = React.useState('')
  const [error, setError] = React.useState<string>('')

  React.useEffect(() => {
    if (data?.user.name) {
      setName(data.user.name)
    }
  }, [data?.user.name])

  const handleEdit = () => {
    setIsEditing(true)
    setError('')
  }

  const handleCancel = () => {
    setIsEditing(false)
    setName(data?.user.name || '')
    setError('')
  }

  const handleSave = async () => {
    setError('')

    try {
      const trimmedName = name.trim()

      if (!trimmedName) {
        setError('El nombre no puede estar vacío')
        return
      }

      if (trimmedName === data?.user.name) {
        setIsEditing(false)
        return
      }

      // Validar
      const validated = updateProfileSchema.parse({ name: trimmedName })

      await updateProfile.mutateAsync({ name: validated.name })
      setIsEditing(false)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else if (typeof err === 'object' && err !== null && 'issues' in err) {
        // Zod validation error
        const zodError = err as { issues: Array<{ message: string }> }
        setError(zodError.issues[0]?.message || 'Error de validación')
      } else {
        setError('Error al actualizar el nombre')
      }
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="bg-muted h-20 w-20 animate-pulse rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="bg-muted h-6 w-48 animate-pulse rounded" />
              <div className="bg-muted h-4 w-64 animate-pulse rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  const user = data.user
  const userInitials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información Personal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar y Nombre */}
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
            <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave()
                    if (e.key === 'Escape') handleCancel()
                  }}
                  disabled={updateProfile.isPending}
                  className="max-w-xs"
                  autoFocus
                />
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updateProfile.isPending}
                  >
                    {updateProfile.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancel}
                    disabled={updateProfile.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleEdit}
                  className="h-8 w-8"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="text-muted-foreground flex items-center space-x-3">
          <Mail className="h-5 w-5" />
          <span>{user.email}</span>
        </div>

        {/* Equipo actual */}
        {data.teams.length > 0 && (
          <div className="flex items-center space-x-3">
            <Users className="text-muted-foreground h-5 w-5" />
            <div>
              <p className="text-muted-foreground text-sm">Equipo actual</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {data.teams.map((team) => (
                  <span
                    key={team.id}
                    className="bg-primary/10 text-primary inline-flex items-center rounded-md px-2 py-1 text-sm font-medium"
                  >
                    {team.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
