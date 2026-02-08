# Oferto – Boilerplate

Monorepo z aplikacją **backend** (NestJS) i **frontend** (Next.js).

## Wymagania

- Node.js 18+
- npm

## Struktura

```
Oferto/
├── backend/   # NestJS API (port 3001)
├── frontend/  # Next.js app (port 3000)
└── README.md
```

## Uruchomienie

### Backend (NestJS)

```bash
cd backend
npm install   # jeśli jeszcze nie
npm run start:dev
```

API: **http://localhost:3001**

- `GET /` – Hello World
- `GET /api/health` – health check

### Frontend (Next.js)

```bash
cd frontend
npm install   # jeśli jeszcze nie
npm run dev
```

Aplikacja: **http://localhost:3000**

### Jednoczesne uruchomienie

W dwóch terminalach:

1. `cd backend && npm run start:dev`
2. `cd frontend && npm run dev`

## Zmienne środowiskowe

### Backend (`backend/.env`)

| Zmienna       | Opis                          | Domyślnie           |
|---------------|--------------------------------|---------------------|
| `PORT`        | Port serwera API              | `3001`              |
| `FRONTEND_URL`| Dozwolone origin CORS         | `http://localhost:3000` |

### Frontend (`frontend/.env.local`)

| Zmienna              | Opis                    | Domyślnie           |
|----------------------|-------------------------|---------------------|
| `NEXT_PUBLIC_API_URL`| URL API (backend)       | `http://localhost:3001` |

## Skrypty

### Backend

- `npm run start` – start
- `npm run start:dev` – start z hot-reload
- `npm run build` – build produkcyjny
- `npm run start:prod` – uruchomienie buildu
- `npm run test` – testy
- `npm run lint` – ESLint

### Frontend

- `npm run dev` – dev server
- `npm run build` – build produkcyjny
- `npm run start` – uruchomienie buildu
- `npm run lint` – ESLint
