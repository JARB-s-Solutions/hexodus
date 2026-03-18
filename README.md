# Hexodus - Sistema de Gestión de Gimnasio

Sistema moderno de gestión integral para gimnasios desarrollado con Next.js 16, React, TypeScript y Tailwind CSS.

## ✨ Características Principales

### 🔐 Sistema de Autenticación Completo
- Login seguro con validaciones
- Recuperación de contraseña
- Protección automática de rutas
- Gestión de sesiones
- UI/UX moderna y responsive

### 📊 Dashboard Interactivo
- KPIs financieros en tiempo real
- Gráficas de ventas y tendencias
- Alertas y notificaciones
- Control de visitantes
- Stock crítico

### 👥 Módulos de Gestión
- **Membresías**: Control completo de membresías
- **Socios**: Gestión de miembros del gimnasio
- **Ventas**: Sistema de punto de venta
- **Inventario**: Control de productos y stock
- **Movimientos**: Seguimiento financiero
- **Reportes**: Analíticas detalladas
- **Usuarios**: Administración de accesos

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js 18+ 
- pnpm (recomendado) o npm

### Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd hexodus
```

2. **Instalar dependencias**
```bash
pnpm install
# o
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
```

Edita `.env.local` con tus configuraciones:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_MOTOR_URL=http://localhost:4000
NEXT_PUBLIC_TOKEN_EXPIRATION=604800
HUELLA_MOTOR_CALLBACK_SECRET=
```

Para el motor de huella always-on, configura el callback del backend hacia:
- Desarrollo: `http://localhost:3000/api/asistencia/huella/callback`
- Produccion: `https://hexodus.vercel.app/api/asistencia/huella/callback`

Si desplegaras el frontend en Vercel y el kiosko seguira hablando con el motor local en
`http://localhost:4000`, recuerda permitir CORS desde `https://hexodus.vercel.app` en tu motor local.

Si decides proteger el callback, usa el mismo valor en `HUELLA_MOTOR_CALLBACK_SECRET`
y en el header `x-motor-secret` que envie tu motor local.

4. **Ejecutar en desarrollo**
```bash
pnpm dev
# o
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🧪 Modo de Prueba (Sin Backend)

Para probar el sistema sin necesidad de backend:

1. Lee las instrucciones en `lib/mock-api.ts`
2. Usuarios de prueba disponibles:
   - **Admin**: `admin@hexodus.com` / `Admin123@`
   - **Staff**: `staff@hexodus.com` / `Admin123@`
   - **Usuario**: `usuario@hexodus.com` / `Admin123@`

## 📖 Documentación

- **Autenticación**: Ver [AUTHENTICATION.md](AUTHENTICATION.md) para guía detallada
- **Componentes UI**: Basados en [shadcn/ui](https://ui.shadcn.com/)
- **Estilos**: Tailwind CSS con sistema de diseño personalizado

## 🎨 Tecnologías

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 con TypeScript
- **Estilos**: Tailwind CSS
- **Componentes**: Radix UI
- **Íconos**: Lucide React
- **Formularios**: React Hook Form
- **Validación**: Zod
- **Gráficas**: Recharts
- **Gestión de Estado**: React Hooks

## 📁 Estructura del Proyecto

```
hexodus/
├── app/                      # Aplicación Next.js (App Router)
│   ├── (root)/              # Página principal
│   ├── login/               # Autenticación
│   ├── recuperar-password/  # Recuperación de contraseña
│   ├── dashboard/           # Panel principal
│   ├── membresias/          # Gestión de membresías
│   ├── socios/              # Gestión de socios
│   ├── inventario/          # Control de inventario
│   ├── movimientos/         # Control financiero
│   ├── reportes/            # Reportes y analíticas
│   └── usuarios/            # Administración de usuarios
├── components/              # Componentes React
│   ├── ui/                  # Componentes base UI
│   ├── auth-guard.tsx       # Protección de rutas
│   ├── sidebar.tsx          # Barra lateral
│   ├── dashboard/           # Componentes del dashboard
│   ├── membresias/          # Componentes de membresías
│   └── ...                  # Otros módulos
├── lib/                     # Utilidades y lógica
│   ├── auth.ts              # Servicio de autenticación
│   ├── api.ts               # Cliente API
│   ├── mock-api.ts          # API simulada (desarrollo)
│   ├── utils.ts             # Utilidades generales
│   └── types/               # Tipos TypeScript
├── hooks/                   # React Hooks personalizados
│   ├── use-auth.ts          # Hook de autenticación
│   ├── use-toast.ts         # Hook de notificaciones
│   └── use-mobile.ts        # Detección de móviles
├── public/                  # Archivos estáticos
└── styles/                  # Estilos globales
```

## 🔒 Seguridad

- Validación de inputs en frontend
- Almacenamiento seguro con localStorage
- Tokens con expiración automática
- Protección de rutas del lado del cliente
- Validaciones de rol de usuario

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
pnpm dev

# Build para producción
pnpm build

# Iniciar en producción
pnpm start

# Linter
pnpm lint
```

## 📱 Responsive Design

El sistema está completamente optimizado para:
- 📱 Móviles (320px+)
- 📱 Tablets (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Large Desktop (1440px+)

## 🎨 Personalización

### Colores

Los colores del sistema se pueden modificar en `app/globals.css`:

```css
:root {
  --primary: #FF3B3B;      /* Rojo principal */
  --accent: #00BFFF;       /* Azul acento */
  --background: #101014;   /* Fondo oscuro */
  --success: #4BB543;      /* Verde éxito */
  /* ... más colores */
}
```

### Logo

Reemplaza el logo en `public/` y actualiza las referencias en:
- `components/sidebar.tsx`
- `app/login/page.tsx`

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y confidencial.

## 📞 Soporte

Para soporte y consultas:
- Email: soporte@hexodus.com
- Documentación: Ver archivos .md en el repositorio

---

**Desarrollado con ❤️ por el equipo de Hexodus**
