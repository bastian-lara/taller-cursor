# PROTOTIPO

Sandbox Django/Docker para probar autenticación (login RUT + password reset) y cascarón admin vacío.

## Arranque

```bash
docker compose -f docker/docker-compose-dev.yml up --build
```

Al arrancar el contenedor `prototipo` espera MySQL, ejecuta `migrate`, siembra el usuario seed y `collectstatic`.

## Acceso

- URL: [http://localhost:5091/login](http://localhost:5091/login)
- Usuario (UI): `70015580-3`
- Contraseña: `password`
- Email (reset): `admin@prototipo.local`
- Username en DB: `70015580`

## Password reset

1. En login, use **¿Olvidó su contraseña?** e ingrese el RUT `70015580-3`.
2. El enlace se imprime en la consola del contenedor (EMAIL_BACKEND=console):

```bash
docker logs prototipo
```

3. Abra el enlace (apunta a `http://localhost:5091/accounts/password-reset-confirm/...`).

## Puertos y contenedores

| Servicio | Contenedor       | Puerto host |
|----------|------------------|-------------|
| App      | `prototipo`      | 5005 (interno) |
| Nginx    | `nginx-prototipo`| **5091** → 5085 |
| MySQL    | `db-prototipo`   | **3210** → 3306 |

Redes propias: `10.250.2.0/29` (db) y `10.250.2.8/29` (web). Sin redes externas.

## Variables

Copie `docker/env.sample` a `docker/.env` si necesita regenerar la configuración. Valores clave:

- `BASE_URL=http://localhost:5091`
- `DB_HOST=db-prototipo`
- `MYSQL_DATABASE=db-prototipo`

## Notas

- Solo `django.contrib.auth.User` (sin modelos Person/Module/Profile).
- Post-login: cascarón `base_app_admin` + sidebar PROTOTIPO sin menús de módulos; index vacío.
- Admin Django: `/admin/`
