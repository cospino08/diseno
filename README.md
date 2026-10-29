# Sistema web de reserva de citas médicas

Proyecto integrador de **Análisis y Diseño de Software**: sistema web para reservar, consultar,
cancelar y administrar citas médicas en una clínica ambulatoria ficticia.

> **Estado:** en desarrollo (ronda 1). Este README lo completa P4 al final del proyecto, como
> pide la sección 11.1 del enunciado.

## Tecnologías

HTML5, CSS3, JavaScript vanilla, GitHub Pages y Supabase (Auth, PostgreSQL y Row Level Security).

## Supabase y configuración

- Project URL: `https://oziwvgyddccfjxrcexnd.supabase.co`
- `assets/js/config.js` exporta `SUPABASE_URL` y `SUPABASE_ANON_KEY`. **Se sube al
  repositorio a propósito**: un sitio estático en GitHub Pages no tiene servidor ni archivo
  `.env`, así que todo lo que usa el navegador es visible para cualquiera. La clave anon (o
  publishable) **es pública por diseño**; por sí sola solo permite lo que dejan las políticas
  **RLS** y las funciones RPC de PostgreSQL. La seguridad está en la base de datos, no en
  esconder la clave.
- `assets/js/config.example.js` es la plantilla para conectar otro proyecto de Supabase.
- `assets/js/datos/cliente.js` crea el único cliente de Supabase y lo exporta como `supabase`.
  Todas las páginas lo importan desde ahí.
- **Nunca** se sube la `service_role`, la secret key ni la contraseña de la base de datos: esas
  claves saltan las RLS. Si alguna se filtra, se rota de inmediato en Supabase.

## Estructura del repositorio

```
/
├── index.html, registro.html  (P3) acceso
├── paciente/                  (P3) vistas del paciente
├── profesional/               (P4) agenda y detalle de cita
├── admin/                     (P4) resumen, catálogos, horarios, citas e indicadores
├── assets/
│   ├── css/                   (P3) estilos
│   └── js/
│       ├── config.js          URL + clave anon (pública por diseño)
│       ├── config.example.js  (P4) plantilla de config.js
│       ├── auth.js            (P3) sesión y guardas por rol
│       ├── validacion.js      (P3)
│       ├── datos/             (P4) cliente.js y un módulo por recurso
│       └── ui/                (P3) mensajes y estados de interfaz
├── sql/                       (P2) esquema.sql, politicas_rls.sql, datos_prueba.sql
└── docs/                      documentación, diagramas y pruebas
```

Las carpetas vacías llevan un `.gitkeep` para que Git las conserve hasta que tengan archivos.

## Documentación

- [Enunciado del taller](docs/enunciado.md)
- [Plan de trabajo del equipo](docs/plan_trabajo.md)
- [Instrucciones de los agentes](docs/prompts_agentes.md)
- [Estado del proyecto](docs/ESTADO.md)
- [Bitácora de fuentes e IA](docs/bitacora_ia.md)

## Integrantes

_Por completar._
