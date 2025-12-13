import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface UserProfile {
  user: {
    id: string
    email: string
    name: string
    avatarUrl: string | null
    role: 'USER' | 'ADMIN'
    emailVerified: boolean
    createdAt: string
  }
  stats: {
    totalPredictions: number
    totalPoints: number
  }
  teams: Array<{
    id: string
    name: string
    inviteCode: string
  }>
}

async function fetchUserProfile(): Promise<UserProfile> {
  const res = await fetch('/api/users/me')
  if (!res.ok) {
    throw new Error('Failed to fetch user profile')
  }
  return res.json()
}

async function updateUserProfile(data: {
  name?: string
  avatarUrl?: string | null
}): Promise<UserProfile> {
  const res = await fetch('/api/users/me', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to update profile')
  }
  return res.json()
}

export function useUserProfile() {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: fetchUserProfile,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['userProfile'], data)
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })
    },
  })
}
