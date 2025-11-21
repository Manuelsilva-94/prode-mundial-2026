# Testing

## Setup

1. Crear base de datos de testing:

```bash
createdb prode_test
```

2. Configurar `.env.test` con credenciales de la DB de testing

3. Instalar dependencias:

```bash
npm install
```

## Ejecutar Tests

```bash
# Modo watch (desarrollo)
npm run test

# Una sola vez
npm run test:run

# Con interfaz gráfica
npm run test:ui

# Ver cobertura
npm run test:coverage
```

## Estructura

```
tests/
├── setup.ts                    # Configuración global
├── helpers/
│   └── test-utils.ts          # Helpers reutilizables
├── lib/
│   ├── validations/
│   │   └── auth.test.ts       # Tests de validaciones
│   └── auth/
│       └── session.test.ts    # Tests de helpers
└── api/
    └── auth/
        ├── register.test.ts   # Tests de registro
        ├── verify.test.ts     # Tests de verificación
        └── reset-password.test.ts  # Tests de reset
```

## Cobertura Objetivo

- ✅ Validaciones: 90%+
- ✅ Helpers: 70%+
- ⏳ Cálculo de puntos: 100% (próximo sprint)
