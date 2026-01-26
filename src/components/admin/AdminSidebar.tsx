'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Trophy,
  Users,
  UsersRound,
  Settings,
  FileText,
  Home,
  FileEdit,
} from 'lucide-react'

const navItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Partidos',
    href: '/admin/matches',
    icon: Trophy,
  },
  {
    title: 'Resultados',
    href: '/admin/results',
    icon: FileEdit,
  },
  {
    title: 'Usuarios',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Equipos',
    href: '/admin/teams',
    icon: UsersRound,
  },
  {
    title: 'Reportes',
    href: '/admin/reports',
    icon: FileText,
  },
  {
    title: 'Configuración',
    href: '/admin/settings',
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="bg-card hidden w-64 shrink-0 border-r md:block">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b p-4">
          <Link href="/admin" className="flex items-center space-x-2">
            <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold">
              A
            </div>
            <span className="text-lg font-semibold">Admin Panel</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            // Para el Dashboard, solo activo si es exactamente /admin
            // Para otros items, activo si coincide exactamente o es una subruta
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t p-4">
          <Link
            href="/home"
            className="text-muted-foreground hover:text-foreground flex items-center space-x-2 text-sm"
          >
            <Home className="h-4 w-4" />
            <span>Volver al sitio</span>
          </Link>
        </div>
      </div>
    </aside>
  )
}

