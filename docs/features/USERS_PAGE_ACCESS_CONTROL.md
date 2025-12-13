# Users Page Access Control

## Overview
The Users page is restricted to **Flex_Admin** and **IT_Support** roles only.

## Access Levels

### Flex_Admin (Full Access)
- ✅ View all users
- ✅ Add new users
- ✅ Edit user details (name, email, role)
- ✅ Activate/Deactivate users
- ✅ View login history

### IT_Support (View Only)
- ✅ View all users
- ❌ Cannot add new users (ADD USER button hidden)
- ❌ Cannot edit user details
- ❌ Cannot activate/deactivate users
- ✅ View login history
- **Actions column shows**: "No actions available"

### Finance_Manager (No Access)
- ❌ Cannot access /users page
- ❌ "Users" menu item not shown
- 🔍 Can only see their own profile at `/profile`

### Counter_Agent (No Access)
- ❌ Cannot access /users page
- ❌ "Users" menu item not shown
- 🔍 Can only see their own profile at `/profile`

## Implementation Details

### Route Protection (App.jsx)
```javascript
<Route path="users" element={
  <PrivateRoute roles={['Flex_Admin', 'IT_Support']}>
    <Users />
  </PrivateRoute>
} />
```

### Navigation Menu (Header.jsx)
Only included in:
- `navItemsByRole.Flex_Admin` (line 28-30)
- `navItemsByRole.IT_Support` (line 165-167)

Not included in:
- `navItemsByRole.Finance_Manager`
- `navItemsByRole.Counter_Agent`

### Component-Level Access Control (Users.jsx)
```javascript
const isFlexAdmin = currentUser?.role === 'Flex_Admin';
const isITSupport = currentUser?.role === 'IT_Support';

// ADD USER button only shown for Flex_Admin
{isFlexAdmin && (
  <Button onClick={() => setAddUserModalOpen(true)}>
    ADD USER
  </Button>
)}

// Actions column shows buttons for Flex_Admin only
{isFlexAdmin ? (
  <div className="flex gap-2">
    <Button>Edit</Button>
    <Button>Activate/Deactivate</Button>
  </div>
) : (
  <span className="text-slate-400 text-sm">No actions available</span>
)}
```

## Profile Access for All Users

All authenticated users can access their own profile at `/profile`:
- View their own details
- Change their password
- Update their preferences

This route is available to all roles:
```javascript
<Route path="profile" element={
  <PrivateRoute>
    <ProfileSettings />
  </PrivateRoute>
} />
```

## Testing Access Control

### Test as Flex_Admin
1. Login as `admin@greenpay.pg`
2. Navigate to `/users`
3. Should see: ADD USER button, Edit/Deactivate buttons in Actions column

### Test as IT_Support
1. Login as IT Support user
2. Navigate to `/users`
3. Should see: User list, "No actions available" in Actions column

### Test as Finance_Manager
1. Login as Finance Manager user
2. "Users" menu should NOT be visible
3. Direct access to `/users` redirects to dashboard

### Test as Counter_Agent
1. Login as Counter Agent user
2. "Users" menu should NOT be visible
3. Direct access to `/users` redirects to dashboard

## Security Notes

- Access control is enforced at multiple levels:
  1. **Router level** - PrivateRoute component checks roles
  2. **Navigation level** - Menu items filtered by role
  3. **Component level** - UI elements conditionally rendered
  4. **Backend level** - API endpoints verify JWT token and role

- Users attempting to access `/users` without proper role are automatically redirected to dashboard
- All API operations (create, update, activate/deactivate) verify role on the backend
