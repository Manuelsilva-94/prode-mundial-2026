import Link from 'next/link'

export default function VerifySuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-purple-600 to-blue-500 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            ¡Email verificado!
          </h1>
          <p className="text-gray-600">
            Tu cuenta ha sido verificada exitosamente.
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg bg-blue-50 p-4">
            <h2 className="mb-2 font-semibold text-blue-900">
              ¿Qué sigue ahora?
            </h2>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start">
                <span className="mr-2">⚽</span>
                <span>Iniciá sesión con tu cuenta</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">📊</span>
                <span>Hacé tus predicciones</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🏆</span>
                <span>Competí con tus amigos</span>
              </li>
            </ul>
          </div>

          <Link
            href="/login"
            className="block w-full rounded-lg bg-linear-to-r from-purple-600 to-blue-500 py-3 text-center font-semibold text-white transition hover:from-purple-700 hover:to-blue-600"
          >
            Iniciar sesión
          </Link>

          <Link
            href="/"
            className="block text-center text-sm text-gray-600 hover:text-gray-900"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
