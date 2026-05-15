# Eventify

Aplicación de gestión de eventos desarrollada para el ejercicio P10. Permite crear eventos, gestionar asistentes y organizar tareas internas de cada evento.

## Tecnologías

- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT, Bcrypt, Cloudinary, Socket.io
- **Frontend**: Vanilla JS, Vite, CSS

## Estructura

```
├── backend/    Express API REST
└── frontend/   SPA con Vite
```

## Arrancar en local

```bash
# Backend
cd backend
npm install
cp .env.example .env   # rellenar variables
npm run seed           # datos de prueba opcionales
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## Variables de entorno (backend)

```
MONGO_URI=
JWT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Usuarios de prueba (password: 123456)

juan@test.com, maria@test.com, carlos@test.com, ana@test.com, pedro@test.com
