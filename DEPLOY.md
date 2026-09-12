# 🌸 Baby Shower Eloise — Guía de Deploy

## Arquitectura

```
Invitados (browser)
    │
    ▼
Vercel (hosting estático — Vite + React)
    │
    ▼
Supabase (PostgreSQL + Realtime)
    tabla: gifts
    └─ claimed_by se actualiza en tiempo real
```

---

## Paso 1 — Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) e iniciar sesión.
2. Crear un nuevo proyecto (región: South America si está disponible, o US East).
3. Esperar a que el proyecto se inicialice (~2 min).
4. Ir a **SQL Editor** y pegar el contenido completo de `supabase-setup.sql`.
5. Ejecutar. Esto crea la tabla `gifts`, habilita RLS, Realtime, e inserta los 18 regalos.

### Obtener credenciales

Ir a **Settings > API** y copiar:
- **Project URL** → `https://xxxx.supabase.co`
- **anon public key** → `eyJhbGciOi...`

---

## Paso 2 — Subir el código a GitHub

```bash
cd baby-shower-eloise
git init
git add .
git commit -m "Baby Shower Eloise v1"
git remote add origin https://github.com/TU_USUARIO/baby-shower-eloise.git
git push -u origin main
```

---

## Paso 3 — Deploy en Vercel

1. Ir a [vercel.com](https://vercel.com) e importar el repositorio de GitHub.
2. Framework Preset: **Vite** (se detecta automáticamente).
3. En **Environment Variables**, agregar:

| Variable                  | Valor                              |
|---------------------------|------------------------------------|
| `VITE_SUPABASE_URL`      | `https://xxxx.supabase.co`         |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...tu-anon-key`        |

4. Click en **Deploy**.

---

## Paso 4 — Verificar

1. Abrir la URL que Vercel asigna (ej: `baby-shower-eloise.vercel.app`).
2. Ingresar un nombre, reservar un regalo.
3. Abrir en otra pestaña o celular, ingresar otro nombre → verificar que el regalo aparece reservado en tiempo real.

---

## Dominio personalizado (opcional)

En Vercel > Settings > Domains puedes agregar un dominio propio si quieres algo como `eloise.tudominio.cl`.

---

## Notas técnicas

- **Realtime**: la app usa Supabase Realtime (WebSockets). Cuando alguien reserva un regalo, todos los demás lo ven al instante sin refrescar.
- **Optimistic locking**: el UPDATE a `claimed_by` incluye `.is("claimed_by", null)`, lo que evita que dos personas reserven el mismo regalo a la vez.
- **localStorage**: se guarda el nombre del invitado en el browser para que no tenga que re-ingresarlo si cierra y vuelve a abrir.
- **RLS**: la tabla tiene Row Level Security activado. SELECT y UPDATE están abiertos (es una app pública sin autenticación).
