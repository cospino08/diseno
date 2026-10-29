# Wireframes: acceso (A-01 a A-04)

Ancho de referencia: 360 px. `[ Botón ]` es un botón, `[____]` un campo, `(•)` una opción
y `▸` un enlace. Lo que va entre `{ }` es dinámico.

---

## A-01 Inicio de sesión (`index.html`)

```
┌──────────────────────────────────────┐
│ ▸ Saltar al contenido   (solo foco)  │
│ ✚ Clínica San Rafael                 │  header
├──────────────────────────────────────┤
│ ┌ aviso informativo ───────────────┐ │  solo si viene ?motivo=
│ │ Tu sesión expiró. Inicia sesión  │ │  (sesion-expirada, sin-sesion,
│ │ de nuevo.                        │ │   cerrada, registro)
│ └──────────────────────────────────┘ │
│                                      │
│ Iniciar sesión                  (h1) │
│ Reserva y gestiona tus citas         │
│ médicas en línea.                    │
│                                      │
│ Correo electrónico                   │
│ [______________________________]     │
│                                      │
│ Contraseña                           │
│ [______________________] [Mostrar]   │
│                                      │
│ [        Iniciar sesión         ]    │  primario, ancho completo
│                                      │
│ ▸ ¿Olvidaste tu contraseña?          │
│ ¿No tienes cuenta? ▸ Regístrate      │
├──────────────────────────────────────┤
│ Proyecto académico. Datos ficticios. │  footer
└──────────────────────────────────────┘
```

**Comportamiento**

- Si ya hay sesión, redirige al inicio de su rol sin mostrar el formulario.
- Mientras se envía: el botón se deshabilita y dice "Ingresando…" (estado cargando).
- Credenciales malas: alerta de error arriba del formulario, "Correo o contraseña
  incorrectos". No se dice cuál de los dos falló, para no revelar qué correos existen.
- Correo sin confirmar: "Confirma tu correo con el enlace que te enviamos antes de iniciar
  sesión".
- "Mostrar" alterna el tipo del campo y cambia su texto a "Ocultar". Usa `aria-pressed`.

---

## A-02 Registro (`registro.html`)

```
┌──────────────────────────────────────┐
│ ✚ Clínica San Rafael                 │
├──────────────────────────────────────┤
│ Crear cuenta de paciente        (h1) │
│ Solo pedimos los datos necesarios    │
│ para agendar. No escribas            │
│ información clínica.                 │
│                                      │
│ Nombres y apellidos                  │
│ [______________________________]     │
│ Correo electrónico                   │
│ [______________________________]     │
│ Contraseña                           │
│ [______________________] [Mostrar]   │
│ Mínimo 8 caracteres, con letras y    │  ayuda (aria-describedby)
│ números.                             │
│ Repite la contraseña                 │
│ [______________________________]     │
│                                      │
│ [        Crear cuenta           ]    │
│                                      │
│ ¿Ya tienes cuenta? ▸ Inicia sesión   │
└──────────────────────────────────────┘
```

**Comportamiento**

- Se validan en el cliente: nombres (2 a 100 caracteres), formato del correo, contraseña
  (8 o más caracteres, con letras y números) y que las dos contraseñas coincidan. Los
  errores aparecen bajo cada campo.
- El documento, el teléfono y la fecha de nacimiento **no** se piden aquí: se piden en
  P-05 después del primer inicio de sesión (plan, P4: esas columnas son nullables para que
  el trigger no falle).
- **No hay selector de rol.** Todo registro crea un paciente.
- Éxito: si el proyecto exige confirmar el correo, se muestra el estado de éxito "Revisa tu
  correo para activar la cuenta". Si no lo exige, se redirige a P-05 para completar el
  perfil.
- Correo ya registrado: "Ya existe una cuenta con ese correo. ▸ Inicia sesión".

---

## A-03 Recuperación de contraseña (`index.html#recuperar`)

Paso 1, pedir el enlace:

```
┌──────────────────────────────────────┐
│ Recuperar contraseña            (h1) │
│ Escribe el correo de tu cuenta. Si   │
│ existe, te enviaremos un enlace para │
│ crear una contraseña nueva.          │
│                                      │
│ Correo electrónico                   │
│ [______________________________]     │
│ [     Enviar instrucciones      ]    │
│ ▸ Volver a iniciar sesión            │
└──────────────────────────────────────┘
```

Paso 2, al volver desde el enlace del correo (evento `PASSWORD_RECOVERY`):

```
┌──────────────────────────────────────┐
│ Crea una contraseña nueva       (h1) │
│ Contraseña nueva                     │
│ [______________________] [Mostrar]   │
│ Repite la contraseña                 │
│ [______________________________]     │
│ [      Guardar contraseña       ]    │
└──────────────────────────────────────┘
```

**Comportamiento**

- Paso 1: el mensaje de éxito es el mismo exista o no el correo: "Si el correo está
  registrado, recibirás un enlace en unos minutos. Revisa también la carpeta de spam". Así
  no se revela qué correos tienen cuenta (OWASP, enumeración de usuarios).
- Paso 2: al guardar, la persona entra al inicio de su rol con el aviso "Contraseña
  actualizada".

---

## A-04 Cierre de sesión (encabezado de las pantallas privadas)

```
┌──────────────────────────────────────┐
│ ✚ San Rafael              [ Menú ▾ ] │  < 768 px: menú plegable
├──────────────────────────────────────┤
│  Inicio                              │  (abierto)
│  Reservar cita                       │
│  Mis citas                           │
│  Mi perfil                           │
│  ───────────                         │
│  {Ana Pérez} · Paciente              │
│  [ Cerrar sesión ]                   │
└──────────────────────────────────────┘
```

- "Cerrar sesión" llama a `signOut` y redirige a `index.html?motivo=cerrada`.
- El botón "Menú" usa `aria-expanded` y `aria-controls`, y se maneja con Enter, Espacio y
  Esc.
