# Behavior & Rules Reference

**Living snapshot** of product rules currently in force (Feature 1).

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Sign-in uses **username + password** (not email-only) | `POST /todo/login` | Feature 1 |
| Username stored and matched as **lowercase** (`trim().toLowerCase()`) | Register/login controller | Feature 1; ADR-0002 |
| Passwords hashed with **bcrypt**, `SALT_ROUNDS = 10`; hashes never in API JSON | User `defaultScope` + register | Feature 1 |
| New users get role **`worker`** | `User.create` | Feature 1 |
| Sessions last **24 hours**; login **reuses** a non-expired session for the same user | JWT `expiresIn: 86400` + `sessions` row | Feature 1 |
| Protected APIs require `Authorization: Bearer <token>` and a non-expired session row | `authenticate` middleware | Feature 1 |
| Logout revokes the server session (token cleared) | `POST /todo/logout` | Feature 1 |
| Registration email: required + `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`; invalid format **"Enter a valid email address."** | Shared `emailRules` + register controller | Feature 1 |
| Password at register: at least **8 characters** | Client rules + `400` | Feature 1 |
| Duplicate username **"Username is already taken."**; duplicate email **"Email is already registered."** | `400` on register | Feature 1 |
| Failed login (wrong user or password): **`401`** `"Invalid username or password."` | Login controller | Feature 1 |
| Browser session stored under `localStorage` key **`user`** | `Utils.setStore` | Feature 1 |
| Guest routes `login` / `register`; signed-in users hitting them go **home**; no session on home → **login** | `router.beforeEach` | Feature 1 |
| Auth screens have **no MenuBar**; home is a welcome placeholder with **Sign out** | `App.vue` + `Home.vue` | Feature 1 |
| `GET /todo/lists` is authenticated and returns **only the caller's lists** (currently `[]` until Feature 2) | `authenticate` + list controller | Feature 1 |

These files answer: *"What rules does the app enforce right now?"*  
They do **not** authorize new scope — implement only from `features/feature-*.md`.
