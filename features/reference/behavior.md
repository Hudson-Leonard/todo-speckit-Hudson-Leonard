# Behavior & Rules Reference

**Living snapshot** of product rules currently in force (Features 1–3).

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
| Auth screens have **no MenuBar**; signed-in chrome is `MenuBar` with the user's name and **Sign out** | `App.vue` + `MenuBar.vue` | Feature 2 |
| `GET /todo/lists` returns **only the caller's lists**, sorted **A–Z by name** | `authenticate` + `List.findAll` | Features 1–2 |
| List `userId` always from `req.user.id`; ignore body `userId` | List create controller | Feature 2 |
| Cross-user list access → **`404`**, never `403` | `getAccessibleListOrNull` | Feature 2; ADR-0002 |
| Empty/whitespace list name rejected (**"List name is required."**); max **100** characters | Client rules + `400` | Feature 2 |
| Dashboard heading **My Lists**; empty copy **"No lists yet. Create your first list."** | `Dashboard.vue` | Feature 2 |
| Todos belong to one list and one user; create uses server `listId` + `req.user.id` | Todo controller | Feature 3 |
| Cross-user todo or parent list → **`404`** | `getAccessibleListOrNull` / `getAccessibleTodoOrNull` | Feature 3; ADR-0002 |
| New todos `completed: false`; empty title **"Todo title is required."**; max **255** | Create/update + client rules | Feature 3 |
| Todo order: **incomplete first**, then `createdAt` ascending | `findAll` order | Feature 3 |
| Deleting a list deletes its todos | `Todo.destroy` then list destroy | Feature 3 |
| List rows have **Items**; todos managed in dialogs; empty **"No todos in this list yet."** | `Dashboard.vue` | Feature 3 |
| Completed todos are struck-through / muted | List-items dialog | Feature 3 |

These files answer: *"What rules does the app enforce right now?"*  
They do **not** authorize new scope — implement only from `features/feature-*.md`.
