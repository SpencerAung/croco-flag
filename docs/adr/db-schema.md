# Database Design

Entities:

- Project
- Feature Flag
- Targeting Rule
- User
- Evaluation

```sql
-- Users: Admin user to the dashboard
users
  - id (uuid, pk)
  - email (string)
  - name (string)
  - password_hash (string)
  - created_at, updated_at

-- Projects
projects
  - id (uuid, pk)
  - name (string)
  - publishable_key (string, unique, indexed)
  - secret_key (string, unique, indexed)
  - created_at, updated_at
  - created_by (fk)
  - updated_by (fk)


-- Feature flags
flags
  - id (uuid, pk)
  - project_id (fk)
  - key (string, unique per project)
  - name (string)
  - description (text)
  - enabled (boolean)
  - is_client_side (boolean) -- to distinguish between client-side and server-side flags
  - default_value (boolean) -- the default value for the flag
  - is_archived (boolean, default false)
  - created_at, updated_at, archived_at
  - created_by (fk)
  - updated_by (fk)
  - archived_by (fk)

-- Targeting Rules
targeting_rules
  - id (uuid, pk)
  - flag_id (uuid, fk)
  - attribute (string) -- e.g., "userId", "email"
  - operator (enum) -- "equals", "contains", "in"
  - value (jsonb) -- the value to compare against. Need to validate the structure against the operator.
  - rollout_percentage (integer 0-100)
  - priority (integer)
  - created_at, updated_at
  - created_by (fk)
  - updated_by (fk)

-- Flag Evaluations (Analytics)
flag_evaluations
  - id (bigserial, pk)
  - flag_id (uuid, fk, indexed)
  - user_id (string, indexed)
  - result (boolean)
  - evaluated_at (timestamp, indexed)
  - reason (string) -- the reason for the evaluation : "Matched Rule 1", "Flag disabled", "Fallthrough"

```