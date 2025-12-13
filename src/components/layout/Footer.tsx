import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold">
                ⚽
              </div>
              <span className="text-lg font-bold tracking-tight">
                Prode Mundial 2026
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              Pronósticos deportivos para el Mundial de Fútbol 2026. Competí
              con tus amigos y demuestra quién es el mejor predictor.
            </p>
          </div>

          {/* Links Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Enlaces Útiles</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/home"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Inicio
                </Link>
              </li>
              <li>
                <Link
                  href="/leaderboard"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clasificación
                </Link>
              </li>
              <li>
                <Link
                  href="/teams"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Equipos
                </Link>
              </li>
              <li>
                <Link
                  href="/profile"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Mi Perfil
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact/Info Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Sobre Nosotros</h3>
            <p className="text-muted-foreground text-sm">
              Una plataforma dedicada a los amantes del fútbol para hacer
              pronósticos y competir en el Mundial 2026.
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t pt-6">
          <p className="text-muted-foreground text-center text-sm">
            © {currentYear} Prode Mundial 2026. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}

