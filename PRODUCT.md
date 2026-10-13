# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users today are IST developers and QA validating authentication and the empty admin shell in a Docker sandbox. The product is also a path toward a future real admin surface for IST operational staff, but that future role does not expand the current product job.

## Product Purpose

PROTOTIPO exists to prove RUT-based login, password reset, logout, and an empty post-login administrative shell. Success means those flows work end-to-end in the sandbox with Spanish UX copy. It is intentionally a sandbox only — not a broader IST admin product narrative.

## Positioning

A focused IST authentication and admin-shell sandbox: RUT credentials, password recovery, and a navigable empty shell under Django + Docker, without inventing module menus or operational workflows beyond what ships.

## Operating Context

Developers run `docker compose -f docker/docker-compose-dev.yml up --build` from the project root and use http://localhost:5091. Seed user behavior, console email for reset links, and the empty index after login are part of normal use. Spanish is the UI language.

## Capabilities and Constraints

- Login with RUT (with hyphen, no dots) and password; remember-me; logout
- Password reset flow (request → email/console link → confirm → complete)
- Post-login app shell (`base_app_admin` + sidebar + navigation) with empty index (`/`)
- Stack and runtime: Django + Docker; host URL port **5091**; seed user UI `70015580-3` / `password`
- Do not expand product scope into a full IST admin product; preserve auth and shell function

## Brand Commitments

- Names: **PROTOTIPO** and **Instituto de Seguridad del Trabajo (IST)**
- Assets: existing IST logos (`IST_tu-mutualidad.png`, `logo.png`) remain binding
- Voice: Spanish UX copy intent must be preserved
- Visual chrome of the incumbent Datta/admin_datta theme is not a brand commitment (anti-reference for redesign)

## Evidence on Hand

- README documents access, seed user, password-reset console flow, ports, and empty shell
- Templates and static assets for login, reset pages, shell, and IST logos under `src/`
- No fabricated testimonials, customers, or operational module claims

## Product Principles

1. Prove auth and shell — do not invent operational product breadth.
2. Keep Spanish copy intent and RUT-centered credential patterns.
3. Preserve Docker, ports, and seed-user behavior as the trusted sandbox contract.
4. IST naming and logos stay; discarded theme chrome is not product identity.
5. Future-admin path may inform clarity and seriousness, without claiming that product yet.
