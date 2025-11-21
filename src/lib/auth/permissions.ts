import { getSession } from './session'

/**
 * Lista de permisos disponibles en el sistema
 */
export enum Permission {
  // Predicciones
  CREATE_PREDICTION = 'predictions:create',
  VIEW_OWN_PREDICTIONS = 'predictions:view:own',
  VIEW_ALL_PREDICTIONS = 'predictions:view:all',
  EDIT_OWN_PREDICTION = 'predictions:edit:own',
  DELETE_OWN_PREDICTION = 'predictions:delete:own',

  // Usuarios
  VIEW_OWN_PROFILE = 'users:view:own',
  VIEW_ALL_PROFILES = 'users:view:all',
  EDIT_OWN_PROFILE = 'users:edit:own',
  EDIT_ALL_PROFILES = 'users:edit:all',
  DELETE_USERS = 'users:delete',

  // Equipos
  CREATE_TEAM = 'teams:create',
  EDIT_OWN_TEAM = 'teams:edit:own',
  DELETE_OWN_TEAM = 'teams:delete:own',
  MANAGE_ALL_TEAMS = 'teams:manage:all',

  // Partidos (Admin only)
  CREATE_MATCH = 'matches:create',
  EDIT_MATCH = 'matches:edit',
  DELETE_MATCH = 'matches:delete',

  // Sistema (Admin only)
  VIEW_AUDIT_LOGS = 'system:audit:view',
  MANAGE_SCORING_RULES = 'system:scoring:manage',
}

/**
 * Permisos por rol
 */
const ROLE_PERMISSIONS: Record<'USER' | 'ADMIN', Permission[]> = {
  USER: [
    Permission.CREATE_PREDICTION,
    Permission.VIEW_OWN_PREDICTIONS,
    Permission.EDIT_OWN_PREDICTION,
    Permission.DELETE_OWN_PREDICTION,
    Permission.VIEW_OWN_PROFILE,
    Permission.VIEW_ALL_PROFILES,
    Permission.EDIT_OWN_PROFILE,
    Permission.CREATE_TEAM,
    Permission.EDIT_OWN_TEAM,
    Permission.DELETE_OWN_TEAM,
  ],
  ADMIN: [
    // Admin tiene todos los permisos
    ...Object.values(Permission),
  ],
}

/**
 * Verifica si un rol tiene un permiso específico
 */
export function roleHasPermission(
  role: 'USER' | 'ADMIN',
  permission: Permission
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

/**
 * Verifica si el usuario actual tiene un permiso específico
 * @param permission - Permiso a verificar
 * @returns true si el usuario tiene el permiso
 */
export async function hasPermission(permission: Permission): Promise<boolean> {
  const session = await getSession()

  if (!session?.user?.role) {
    return false
  }

  return roleHasPermission(session.user.role, permission)
}

/**
 * Requiere que el usuario tenga un permiso específico
 * @param permission - Permiso requerido
 * @throws Error si no tiene el permiso
 */
export async function requirePermission(permission: Permission) {
  const hasPerms = await hasPermission(permission)

  if (!hasPerms) {
    const error = new Error(
      `No autorizado - Se requiere el permiso: ${permission}`
    ) as Error & { status: number }
    error.status = 403
    throw error
  }
}

/**
 * Verifica si el usuario tiene TODOS los permisos especificados
 */
export async function hasAllPermissions(
  ...permissions: Permission[]
): Promise<boolean> {
  const results = await Promise.all(permissions.map((p) => hasPermission(p)))
  return results.every((r) => r === true)
}

/**
 * Verifica si el usuario tiene AL MENOS UNO de los permisos especificados
 */
export async function hasAnyPermission(
  ...permissions: Permission[]
): Promise<boolean> {
  const results = await Promise.all(permissions.map((p) => hasPermission(p)))
  return results.some((r) => r === true)
}
