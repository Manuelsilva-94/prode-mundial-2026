import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="flex w-full max-w-md flex-col items-center space-y-6 text-center">
        {/* Icono grande */}
        <div className="text-muted-foreground">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-muted opacity-20"></div>
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-muted text-6xl">
              404
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Página no encontrada
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
          </p>
        </div>

        {/* Sugerencias */}
        <div className="w-full space-y-3 rounded-lg bg-muted/50 p-4 text-left">
          <p className="text-sm font-medium">¿Qué puedes hacer?</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>Verifica que la URL sea correcta</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>Vuelve a la página anterior</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>Visita la página de inicio</span>
            </li>
          </ul>
        </div>

        {/* Acciones */}
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="default" className="min-h-[44px] w-full sm:w-auto">
            <Link href="/home">
              <Home className="mr-2 h-4 w-4" />
              Ir al Inicio
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="min-h-[44px] w-full sm:w-auto"
            onClick={() => window.history.back()}
          >
            <Link href="#" onClick={(e) => { e.preventDefault(); window.history.back(); }}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver Atrás
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
