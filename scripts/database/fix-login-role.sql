-- This is the SQL query that should be used in the login endpoint
-- to fetch the user with their role name

SELECT u.id, u.name, u.email, u."roleId", u."isActive", r.name as role_name
FROM "User" u
LEFT JOIN "Role" r ON u."roleId" = r.id
WHERE u.email = $1;
