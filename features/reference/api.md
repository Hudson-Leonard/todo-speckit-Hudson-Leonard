# API Reference

**Status:** Features 1–5 — authentication, lists, todos (with due dates), and profile.

API mount path: `/todo` (`backend/server.js`). Authenticated routes require `Authorization: Bearer <token>`.

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/health` | No | Process health check |
| `POST` | `/todo/register` | No | Create account and start a session |
| `POST` | `/todo/login` | No | Authenticate and return/reuse a session |
| `POST` | `/todo/logout` | Yes | Revoke the current session token |
| `GET` | `/todo/lists` | Yes | Fetch lists owned by the caller, A–Z by name |
| `POST` | `/todo/lists` | Yes | Create a list owned by the caller |
| `PUT` | `/todo/lists/:listId` | Yes | Rename an owned list |
| `DELETE` | `/todo/lists/:listId` | Yes | Delete an owned list (todos cascade) |
| `GET` | `/todo/lists/:listId/todos` | Yes | Fetch todos in an owned list |
| `POST` | `/todo/lists/:listId/todos` | Yes | Add a todo to an owned list |
| `PUT` | `/todo/todos/:id` | Yes | Update title, `completed`, and/or `dueDate` |
| `DELETE` | `/todo/todos/:id` | Yes | Delete an owned todo |
| `GET` | `/todo/users/:id` | Yes | Fetch own profile (`:id` must match session) |
| `PUT` | `/todo/users/:id` | Yes | Update own profile; password optional |

**Profile success** (`200`):

```json
{
  "id": 42,
  "fName": "Jane",
  "lName": "Doe",
  "email": "jane@example.com",
  "username": "jdoe",
  "role": "worker",
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:05:00.000Z"
}
```

`password` is optional on `PUT`. Omit it to leave the hash unchanged. Responses never include the password hash.

**Create todo request:** `{ "title": "Buy milk", "dueDate": "2026-07-15" }` (`dueDate` optional; omit or `null` for none; `userId` / `listId` in the body are ignored).

**Todo success** (`200` / `201`):

```json
{
  "id": 10,
  "listId": 1,
  "title": "Buy milk",
  "completed": false,
  "dueDate": "2026-07-15",
  "userId": 42,
  "createdAt": "2026-07-02T12:05:00.000Z",
  "updatedAt": "2026-07-02T12:05:00.000Z"
}
```

`dueDate` is `null` when not set. On `PUT`, omit `dueDate` to leave it unchanged; send `null` to clear it.

**Create list request:** `{ "name": "Groceries" }` (`userId` in the body is ignored).

**List success** (`200` / `201`):

```json
{
  "id": 1,
  "name": "Groceries",
  "userId": 42,
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:00:00.000Z"
}
```

**Login / register success** (`201` register, `200` login) — flat JSON, no envelope:

```json
{
  "userId": 1,
  "username": "jdoe",
  "email": "jdoe@example.com",
  "fName": "Jane",
  "lName": "Doe",
  "role": "worker",
  "token": "<jwt>"
}
```

Password hashes are never returned.

**Error response:** `{ "message": "Human-readable explanation." }` with HTTP `400`, `401`, or `500`.

| Status | Example message |
|--------|-----------------|
| `400` | `Username is already taken.` / `Email is already registered.` / `Email is required.` / `Password must be at least 8 characters.` |
| `401` login | `Invalid username or password.` |
| `401` protected | `Unauthorized! No token provided.` / `Unauthorized! Invalid or expired token.` |
| `400` | `List name is required.` / `List name must be 100 characters or fewer.` |
| `400` | `Todo title is required.` / `Todo title must be 255 characters or fewer.` / `Due date must be a valid date in YYYY-MM-DD format.` |
| `404` todos | `Todo with id=<id> not found.` / `List with id=<id> not found.` |
| `404` users | `User with id=<id> not found.` (not self; never `403`) |

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }`.
- Authenticated routes: `Authorization: Bearer <token>`.

## Feature provenance

| Area | Introduced |
|------|------------|
| Register, login, logout | Feature 1 |
| Protected `GET /todo/lists` | Feature 1 |
| List CRUD `POST` / `PUT` / `DELETE /todo/lists` | Feature 2 |
| Todo nested and `/todo/todos/:id` | Feature 3 |
| Profile `GET`/`PUT /todo/users/:id` | Feature 4 |
| Optional todo `dueDate` (`YYYY-MM-DD`) | Feature 5 |
