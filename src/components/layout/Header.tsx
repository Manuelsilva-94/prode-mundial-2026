'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Menu, User, LogOut, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'

interface NavLink {
  href: string
  label: string
}

const navigation: NavLink[] = [
  { href: '/home', label: 'Inicio' },
  { href: '/my-predictions', label: 'Mis Predicciones' },
  { href: '/leaderboard', label: 'Clasificación' },
  { href: '/teams', label: 'Equipos' },
]

export function Header() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  // Don't show header on auth pages
  if (
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/register') ||
    pathname?.startsWith('/forgot-password') ||
    pathname?.startsWith('/reset-password') ||
    pathname?.startsWith('/verify') ||
    pathname?.startsWith('/resend-verification')
  ) {
    return null
  }

  const userInitials = session?.user?.name
    ? session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login', redirect: true })
  }

  const handleMobileLinkClick = () => {
    setMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/home" className="flex items-center space-x-2">
          <div className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold">
            ⚽
          </div>
          <span className="text-xl font-bold tracking-tight">
            Prode Mundial 2026
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navigation.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {link.label}
              </Link>
            )
          })}
          {session?.user?.role === 'ADMIN' && (
            <Link
              href="/admin"
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname?.startsWith('/admin')
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              Admin
            </Link>
          )}
        </nav>

        {/* User Menu - Desktop */}
        {session?.user ? (
          <div className="hidden md:flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={session.user.image || undefined}
                      alt={session.user.name || 'User'}
                    />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session.user.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Mi Perfil
                  </Link>
                </DropdownMenuItem>
                {session.user.role === 'ADMIN' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center">
                      <Shield className="mr-2 h-4 w-4" />
                      Administración
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="hidden md:flex items-center space-x-4">
            <Button asChild variant="ghost">
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Registrarse</Link>
            </Button>
          </div>
        )}

        {/* Mobile Menu Button */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>Menú</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col space-y-4 mt-8">
              {navigation.map((link) => {
                const isActive = pathname === link.href || pathname?.startsWith(link.href + '/')
                return (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      onClick={handleMobileLinkClick}
                      className={cn(
                        'text-lg font-medium transition-colors hover:text-primary',
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                )
              })}
              {session?.user?.role === 'ADMIN' && (
                <SheetClose asChild>
                  <Link
                    href="/admin"
                    onClick={handleMobileLinkClick}
                    className={cn(
                      'text-lg font-medium transition-colors hover:text-primary',
                      pathname?.startsWith('/admin')
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    Admin
                  </Link>
                </SheetClose>
              )}
              <div className="border-t pt-4 mt-4">
                {session?.user ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3 px-2 py-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={session.user.image || undefined}
                          alt={session.user.name || 'User'}
                        />
                        <AvatarFallback>{userInitials}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium">
                          {session.user.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.user.email}
                        </p>
                      </div>
                    </div>
                    <SheetClose asChild>
                      <Link
                        href="/profile"
                        onClick={handleMobileLinkClick}
                        className="flex items-center px-2 py-2 text-lg font-medium transition-colors hover:text-primary"
                      >
                        <User className="mr-2 h-4 w-4" />
                        Mi Perfil
                      </Link>
                    </SheetClose>
                    {session.user.role === 'ADMIN' && (
                      <SheetClose asChild>
                        <Link
                          href="/admin"
                          onClick={handleMobileLinkClick}
                          className="flex items-center px-2 py-2 text-lg font-medium transition-colors hover:text-primary"
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Administración
                        </Link>
                      </SheetClose>
                    )}
                    <button
                      onClick={() => {
                        handleMobileLinkClick()
                        handleLogout()
                      }}
                      className="flex w-full items-center px-2 py-2 text-lg font-medium text-destructive transition-colors hover:text-destructive/80"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar Sesión
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <SheetClose asChild>
                      <Button asChild variant="outline" className="w-full">
                        <Link href="/login" onClick={handleMobileLinkClick}>
                          Iniciar Sesión
                        </Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild className="w-full">
                        <Link href="/register" onClick={handleMobileLinkClick}>
                          Registrarse
                        </Link>
                      </Button>
                    </SheetClose>
                  </div>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}

