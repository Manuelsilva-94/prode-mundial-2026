import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreateMatchInput, UpdateMatchInput } from '@/lib/validations/match'

export interface AdminMatch {
  id: string
  matchDate: string
  stadium: string
  city: string
  country: string
  groupLetter: string | null
  homeScore: number | null
  awayScore: number | null
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED'
  lockTime: string
  isLocked: boolean
  homeTeam: {
    id: string
    name: string
    code: string
    flagUrl: string
  }
  awayTeam: {
    id: string
    name: string
    code: string
    flagUrl: string
  }
  phase: {
    id: string
    name: string
    slug: string
  }
  _count: {
    predictions: number
  }
}

interface AdminMatchesResponse {
  data: AdminMatch[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface AdminMatchesParams {
  page?: number
  limit?: number
  phaseId?: string
  status?: string
  search?: string
  orderBy?: 'date' | 'status' | 'phase'
  order?: 'asc' | 'desc'
}

async function fetchAdminMatches(params: AdminMatchesParams): Promise<AdminMatchesResponse> {
  const searchParams = new URLSearchParams()
  
  if (params.page) searchParams.set('page', params.page.toString())
  if (params.limit) searchParams.set('limit', params.limit.toString())
  if (params.phaseId) searchParams.set('phaseId', params.phaseId)
  if (params.status) searchParams.set('status', params.status)
  if (params.search) searchParams.set('search', params.search)
  if (params.orderBy) searchParams.set('orderBy', params.orderBy)
  if (params.order) searchParams.set('order', params.order)

  const res = await fetch(`/api/admin/matches?${searchParams.toString()}`)
  
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Error al obtener partidos')
  }
  
  return res.json()
}

export function useAdminMatches(params: AdminMatchesParams = {}) {
  return useQuery({
    queryKey: ['adminMatches', params],
    queryFn: () => fetchAdminMatches(params),
  })
}

// Obtener un partido específico
async function fetchAdminMatch(id: string): Promise<{ data: AdminMatch }> {
  const res = await fetch(`/api/admin/matches/${id}`)
  
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Error al obtener partido')
  }
  
  return res.json()
}

export function useAdminMatch(id: string | null) {
  return useQuery({
    queryKey: ['adminMatch', id],
    queryFn: () => fetchAdminMatch(id!),
    enabled: !!id,
  })
}

// Crear partido
async function createMatch(data: CreateMatchInput): Promise<{ data: AdminMatch }> {
  const res = await fetch('/api/admin/matches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || error.details?.[0] || 'Error al crear partido')
  }
  
  return res.json()
}

export function useCreateMatch() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createMatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMatches'] })
      queryClient.invalidateQueries({ queryKey: ['matches'] })
    },
  })
}

// Actualizar partido
async function updateMatch({ id, data }: { id: string; data: UpdateMatchInput }): Promise<{ data: AdminMatch; message: string }> {
  const res = await fetch(`/api/admin/matches/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || error.details?.[0] || 'Error al actualizar partido')
  }
  
  return res.json()
}

export function useUpdateMatch() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateMatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMatches'] })
      queryClient.invalidateQueries({ queryKey: ['adminMatch'] })
      queryClient.invalidateQueries({ queryKey: ['matches'] })
    },
  })
}

// Eliminar partido
interface DeleteMatchResponse {
  message: string
  deletedPredictions?: number
}

interface DeleteMatchError {
  error: string
  predictionsCount?: number
  requiresForce?: boolean
}

async function deleteMatch({ id, force = false }: { id: string; force?: boolean }): Promise<DeleteMatchResponse> {
  const url = force ? `/api/admin/matches/${id}?force=true` : `/api/admin/matches/${id}`
  const res = await fetch(url, { method: 'DELETE' })
  
  if (!res.ok) {
    const error: DeleteMatchError = await res.json()
    const err = new Error(error.error || 'Error al eliminar partido') as Error & { 
      predictionsCount?: number
      requiresForce?: boolean 
    }
    err.predictionsCount = error.predictionsCount
    err.requiresForce = error.requiresForce
    throw err
  }
  
  return res.json()
}

export function useDeleteMatch() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteMatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMatches'] })
      queryClient.invalidateQueries({ queryKey: ['matches'] })
    },
  })
}

// Actualizar resultado de partido
interface UpdateMatchResultInput {
  homeScore: number
  awayScore: number
}

interface UpdateMatchResultResponse {
  success: boolean
  message: string
  warning?: string
  data: {
    match: AdminMatch
    pointsCalculation?: {
      predictionsProcessed: number
      totalPointsAwarded: number
      topScorers: Array<{ name: string; points: number }>
    }
    pointsCalculationError?: string
  }
}

async function updateMatchResult({ 
  id, 
  data 
}: { 
  id: string
  data: UpdateMatchResultInput 
}): Promise<UpdateMatchResultResponse> {
  const res = await fetch(`/api/admin/matches/${id}/result`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  
  const responseData = await res.json()
  
  if (!res.ok) {
    throw new Error(responseData.error || 'Error al cargar resultado')
  }
  
  return responseData
}

export function useUpdateMatchResult() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateMatchResult,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMatches'] })
      queryClient.invalidateQueries({ queryKey: ['matches'] })
      queryClient.invalidateQueries({ queryKey: ['predictions'] })
      queryClient.invalidateQueries({ queryKey: ['userStats'] })
    },
  })
}

// Recalcular puntos de un partido
interface CalculatePointsResponse {
  message: string
  data: {
    matchId: string
    predictionsProcessed: number
    totalPointsAwarded: number
    errors: number
    topScorers: Array<{ name: string; points: number }>
  }
}

async function calculateMatchPoints(id: string): Promise<CalculatePointsResponse> {
  const res = await fetch(`/api/admin/matches/${id}/calculate-points`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
  
  const responseData = await res.json()
  
  if (!res.ok) {
    throw new Error(responseData.error || 'Error al recalcular puntos')
  }
  
  return responseData
}

export function useCalculateMatchPoints() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: calculateMatchPoints,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMatches'] })
      queryClient.invalidateQueries({ queryKey: ['matches'] })
      queryClient.invalidateQueries({ queryKey: ['predictions'] })
      queryClient.invalidateQueries({ queryKey: ['userStats'] })
    },
  })
}
