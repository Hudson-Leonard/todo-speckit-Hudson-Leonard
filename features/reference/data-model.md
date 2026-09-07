# Data Model Reference

**Status:** Features 1–4 — users (profile-editable), sessions, lists, and todos.

## Tables

### `users`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `fName` | STRING | Required; editable via profile `PUT` |
| `lName` | STRING | Required; editable via profile `PUT` |
| `email` | STRING | Required, unique; editable via profile `PUT` |
| `username` | STRING(100) | Required, unique; stored lowercase; editable via profile `PUT` |
| `password` | STRING(255) | Required; bcrypt hash; optional on profile `PUT` |
| `role` | STRING(20) | Default `worker`; read-only on profile |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

### `sessions`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `token` | STRING | Required; cleared (`""`) on logout |
| `email` | STRING | Required |
| `expirationDate` | DATE | Required; 24 hours from creation |
| `userId` | INTEGER FK | Required, references `users.id` |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

### `lists`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING | Required; trimmed; max 100 characters |
| `userId` | INTEGER FK | Required; references `users.id`; set from `req.user.id` on create |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

### `todos`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `listId` | INTEGER FK | Required; references `lists.id`; cascade delete with parent list |
| `title` | STRING | Required; trimmed; max 255 characters |
| `completed` | BOOLEAN | Default `false` |
| `userId` | INTEGER FK | Required; references `users.id`; set from `req.user.id` on create |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

## Associations

*   `User hasMany Session` (`foreignKey: userId`)
*   `Session belongsTo User`
*   `User hasMany List` (`foreignKey: userId`)
*   `List belongsTo User`
*   `User hasMany Todo`
*   `Todo belongsTo User`
*   `List hasMany Todo` (`onDelete: CASCADE`)
*   `Todo belongsTo List`

## Feature provenance

| Area | Introduced |
|------|------------|
| `users`, `sessions` | Feature 1 |
| `lists` | Feature 2 |
| `todos` | Feature 3 |
| Profile field updates (no new tables) | Feature 4 |
