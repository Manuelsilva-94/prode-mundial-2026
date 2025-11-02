# Prode Mundial 2026 ⚽

Aplicación de pronósticos deportivos para el Mundial de Fútbol 2026.

## 🚀 Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Base de Datos**: PostgreSQL
- **ORM**: Prisma
- **Autenticación**: NextAuth.js
- **Emails**: Resend
- **Deploy**: Vercel

## 📋 Requisitos Previos

- Node.js 20+
- PostgreSQL 14+
- npm o yarn

## 🛠️ Setup Local

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/prode-mundial-2026.git
cd prode-mundial-2026
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia `.env.example` a `.env.local` y completa los valores:

```bash
cp .env.example .env.local
```

### 4. Configurar base de datos

```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

### 5. Iniciar servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
src/
├── app/                 # App Router de Next.js
│   ├── (auth)/         # Rutas de autenticación
│   ├── (dashboard)/    # Rutas protegidas
│   ├── admin/          # Panel de administración
│   └── api/            # API Routes
├── components/         # Componentes de React
│   ├── ui/            # Componentes base (botones, inputs)
│   ├── forms/         # Componentes de formularios
│   ├── layout/        # Componentes de layout (header, footer)
│   └── features/      # Componentes específicos de features
├── lib/               # Utilidades y helpers
├── types/             # Definiciones de TypeScript
└── styles/            # Estilos globales
```

## 🧪 Testing

```bash
npm run test
npm run test:e2e
```

## 🎨 Linting y Formato

```bash
npm run lint
npm run format
```

## 🚀 Deploy

El proyecto está configurado para deployar en Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tu-usuario/prode-mundial-2026)

## 📝 Scripts Disponibles

- `npm run dev` - Inicia servidor de desarrollo
- `npm run build` - Genera build de producción
- `npm run start` - Inicia servidor de producción
- `npm run lint` - Ejecuta ESLint
- `npm run format` - Formatea código con Prettier
- `npm run type-check` - Verifica tipos de TypeScript

## 🤝 Contribuir

Este es un proyecto interno de la empresa. Para contribuir:

1. Crea una rama desde `develop`
2. Haz tus cambios
3. Crea un Pull Request

## 📄 Licencia

Uso interno - Todos los derechos reservados

## 👥 Equipo

Desarrollado por Manuel Silva Montes de Oca
