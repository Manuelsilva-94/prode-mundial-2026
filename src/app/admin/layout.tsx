import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin - Prode Mundial 2026',
  description: 'Panel de administración',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

