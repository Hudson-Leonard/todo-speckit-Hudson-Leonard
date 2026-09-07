# API Reference

**Status:** Features 1–2 — authentication and list CRUD.

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
| `DELETE` | `/todo/lists/:listId` | Yes | Delete an owned list |

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
| `404` lists | `List with id=<id> not found.` (unowned or missing; never `403`) |

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
