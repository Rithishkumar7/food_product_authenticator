-- Ensure the admin user has the 'admin' role in user_roles.
-- This runs idempotently: if the row already exists it does nothing.
-- The admin must have signed in at least once before this migration
-- runs so their record exists in auth.users.

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = '21054cs051@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
