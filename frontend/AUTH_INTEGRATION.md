# Auth Integration Guide — Frontend

## Overview

The backend provides JWT-based auth with access tokens (15 min) and refresh tokens (7 days). All protected routes require a bearer token.

### Existing Stack (package.json)
- React 18, React Router DOM v6, Axios 1.7, Vite 5, Tailwind CSS 3
- Current `App.jsx` uses `NotificationProvider` and a `Layout` wrapper with four unprotected routes
- `Navbar.jsx` (sidebar) navigates: Dashboard, Products, Customers, Orders — no auth state yet

---

## Base URL

```
/api/v1
```

All endpoints below are relative to this base.

---

## Auth Endpoints

### POST /api/v1/auth/signup

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secret123",
  "full_name": "John Doe"
}
```

**Response (201):**
```json
{
  "status": "ok",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "agent",
    "is_active": true,
    "permissions": {},
    "created_at": "2026-06-04T10:00:00"
  }
}
```

> New users always get role `agent`. An admin must set roles after creation.

---

### POST /api/v1/auth/login

**Request:**
```json
{
  "email": "admin@admin.in",
  "password": "admin"
}
```

**Response (200):**
```json
{
  "status": "ok",
  "data": {
    "access_token": "<jwt>",
    "refresh_token": "<opaque>",
    "token_type": "bearer",
    "expires_in": 900
  }
}
```

> Store `access_token` in memory (NOT localStorage). Store `refresh_token` in an httpOnly cookie or localStorage.

---

### POST /api/v1/auth/refresh

**Request:**
```json
{ "refresh_token": "<stored_refresh_token>" }
```

**Response (200):** Same shape as the login response.

> Always replace BOTH tokens — rotation means the old refresh token is immediately invalidated.

---

### POST /api/v1/auth/logout

**Request:**
```json
{ "refresh_token": "<stored_refresh_token>" }
```

**Response:**
```json
{ "status": "ok", "data": { "message": "Logged out successfully" } }
```

---

### POST /api/v1/auth/forgot-password

**Request:**
```json
{ "email": "user@example.com" }
```

**Response (200):** Always 200 regardless of whether the email exists (prevents enumeration).
```json
{
  "status": "ok",
  "data": {
    "message": "If that email exists, a reset link has been sent",
    "reset_token": "<token>"
  }
}
```

> `reset_token` is returned in the response body in **development only** — it is removed in production.

---

### POST /api/v1/auth/reset-password

**Request:**
```json
{
  "token": "<reset_token>",
  "new_password": "newpassword1"
}
```

---

### GET /api/v1/auth/me

**Headers:** `Authorization: Bearer <access_token>`

**Response:** Current user profile (same shape as signup response data).

---

## Protected Routes

All routes below require the header:

```
Authorization: Bearer <access_token>
```

| Route prefix | Description |
|---|---|
| `/api/v1/products` | Product management |
| `/api/v1/customers` | Customer management |
| `/api/v1/orders` | Order management |
| `/api/v1/dashboard` | Dashboard metrics |

---

## Role-Based Access

| Role | Products | Customers | Orders | Users | Dashboard |
|---|---|---|---|---|---|
| admin | Full CRUD | Full CRUD | Full CRUD | Full CRUD | Yes |
| manager | Full CRUD | Full CRUD | Full CRUD | Self only | Yes |
| agent | Read only | Read only | Read + Create | Self only | Yes |

---

## Token Storage Recommendation

```
access_token  → React state / in-memory store (most secure; lost on page refresh)
refresh_token → localStorage (simpler) OR httpOnly cookie (most secure, requires backend cookie support)
```

For production: use httpOnly cookies for the refresh token.

---

## Token Refresh Flow

```
1. API call fails with 401
2. Check if refresh_token exists
3. POST /api/v1/auth/refresh with refresh_token
4. On success: store new access_token + refresh_token, retry original request
5. On failure (401): clear all tokens, redirect to /login
```

---

## Suggested React Implementation

### Project layout additions

```
frontend/src/
  context/
    AuthContext.jsx          ← new
    NotificationContext.jsx  ← already exists
  services/
    api.js                   ← new (replaces direct axios calls)
  components/common/
    ProtectedRoute.jsx       ← new
    Navbar.jsx               ← update to show user info + logout
  pages/
    Login.jsx                ← new
    Signup.jsx               ← new
    ForgotPassword.jsx       ← new
    ResetPassword.jsx        ← new
    Unauthorized.jsx         ← new
  App.jsx                    ← update routes + wrap with AuthProvider
```

---

### 1. Auth Context (src/context/AuthContext.jsx)

```jsx
import { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { access_token, refresh_token } = res.data.data;
    setAccessToken(access_token);
    window.__accessToken = access_token;
    localStorage.setItem('refresh_token', refresh_token);
    const meRes = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    setUser(meRes.data.data);
    return meRes.data.data;
  }, []);

  const logout = useCallback(async () => {
    const rt = localStorage.getItem('refresh_token');
    if (rt) {
      await api.post('/auth/logout', { refresh_token: rt }).catch(() => {});
    }
    setAccessToken(null);
    window.__accessToken = null;
    setUser(null);
    localStorage.removeItem('refresh_token');
  }, []);

  const refreshAccessToken = useCallback(async () => {
    const rt = localStorage.getItem('refresh_token');
    if (!rt) throw new Error('No refresh token');
    const res = await api.post('/auth/refresh', { refresh_token: rt });
    const { access_token, refresh_token: new_rt } = res.data.data;
    setAccessToken(access_token);
    window.__accessToken = access_token;
    localStorage.setItem('refresh_token', new_rt);
    return access_token;
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, accessToken, login, logout, refreshAccessToken, setUser, setAccessToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

---

### 2. Axios Instance with Auto-Refresh (src/services/api.js)

```js
import axios from 'axios';

const api = axios.create({ baseURL: '/api/v1' });

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  failedQueue = [];
};

// Attach the current access token from in-memory store on every request
api.interceptors.request.use((config) => {
  const token = window.__accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Intercept 401 responses and attempt a silent token refresh
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      // If a refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const rt = localStorage.getItem('refresh_token');
        const res = await axios.post('/api/v1/auth/refresh', { refresh_token: rt });
        const { access_token, refresh_token } = res.data.data;
        window.__accessToken = access_token;
        localStorage.setItem('refresh_token', refresh_token);
        processQueue(null, access_token);
        original.headers.Authorization = `Bearer ${access_token}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('refresh_token');
        window.__accessToken = null;
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

### 3. Protected Route Component (src/components/common/ProtectedRoute.jsx)

```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
}
```

---

### 4. Updated App.jsx

```jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';
import api from './services/api';

// Pages — existing
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Orders from './pages/Orders';

// Pages — new auth pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Unauthorized from './pages/Unauthorized';

function AppRoutes() {
  const { refreshAccessToken, setUser } = useAuth();

  // Restore session on page refresh using stored refresh token
  useEffect(() => {
    const rt = localStorage.getItem('refresh_token');
    if (rt) {
      refreshAccessToken()
        .then((token) => {
          window.__accessToken = token;
          return api.get('/auth/me');
        })
        .then((res) => setUser(res.data.data))
        .catch(() => localStorage.removeItem('refresh_token'));
    }
  }, []);

  return (
    <Routes>
      {/* Public routes — no auth required */}
      <Route path="/login"            element={<Login />} />
      <Route path="/signup"           element={<Signup />} />
      <Route path="/forgot-password"  element={<ForgotPassword />} />
      <Route path="/reset-password"   element={<ResetPassword />} />
      <Route path="/unauthorized"     element={<Unauthorized />} />

      {/* Protected routes — wrapped in Layout (sidebar + topbar) */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route index element={<Dashboard />} />
              <Route path="products"  element={<Products />} />
              <Route path="customers" element={<Customers />} />
              <Route path="orders"    element={<Orders />} />
              <Route path="*"         element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppRoutes />
      </NotificationProvider>
    </AuthProvider>
  );
}
```

> Note: The current `App.jsx` wraps everything in `<Layout>` unconditionally. After integrating auth, the `<Layout>` (which contains the Navbar/sidebar) should only render for authenticated users so that the login page does not show the sidebar.

---

### 5. Navbar Updates (src/components/common/Navbar.jsx)

The existing sidebar (`Navbar.jsx`) does not display user info or a logout button. Add the following to the Footer section of the sidebar:

```jsx
import { useAuth } from '../../context/AuthContext';

// Inside the Sidebar component, replace the footer div:
const { user, logout } = useAuth();

<div className="px-6 py-5 border-t border-slate-900 shrink-0">
  <div className="flex items-center gap-3 mb-3">
    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
      <span className="text-indigo-400 text-xs font-bold uppercase">
        {user?.full_name?.[0] ?? '?'}
      </span>
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-slate-200 text-xs font-semibold truncate">{user?.full_name}</p>
      <p className="text-slate-500 text-[10px] capitalize">{user?.role}</p>
    </div>
    <button
      onClick={logout}
      className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-900 transition-all"
      aria-label="Logout"
    >
      {/* Logout icon */}
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
      </svg>
    </button>
  </div>
  <div className="flex items-center justify-between">
    <p className="text-slate-500 text-[10px] font-semibold">Ethara Suite v1.2</p>
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/25">
      Online
    </span>
  </div>
</div>
```

---

### 6. Role-Gated UI Example

Use `user.role` from `useAuth()` to conditionally render UI elements or gate entire routes:

```jsx
// Gate an admin-only route
<Route path="/users" element={
  <ProtectedRoute roles={['admin']}>
    <UserManagement />
  </ProtectedRoute>
} />

// Hide a delete button from agents
const { user } = useAuth();
{(user.role === 'admin' || user.role === 'manager') && (
  <button onClick={handleDelete}>Delete</button>
)}

// Check a per-user permission override
{user.permissions?.can_delete_products && (
  <button onClick={handleDelete}>Delete Product</button>
)}
```

---

## Error Handling

All API errors return this shape:

```json
{ "status": "fail", "msg": "Human readable message", "error_code": "MACHINE_CODE" }
```

### Key Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `NOT_AUTHENTICATED` | 401 | No token provided |
| `INVALID_TOKEN` | 401 | Token expired or invalid |
| `INVALID_CREDENTIALS` | 401 | Wrong email / password |
| `FORBIDDEN` | 403 | Insufficient role |
| `EMAIL_TAKEN` | 409 | Email already registered |
| `USER_NOT_FOUND` | 404 | User does not exist |
| `INVALID_RESET_TOKEN` | 400 | Reset token expired or already used |
| `SELF_DELETE` | 400 | Admin tried to delete own account |
| `INVALID_REFRESH_TOKEN` | 401 | Refresh token invalid or revoked |

### Recommended error handler for forms

```js
import api from '../services/api';

async function handleLogin(email, password) {
  try {
    await login(email, password);
    navigate('/');
  } catch (err) {
    const code = err.response?.data?.error_code;
    const msg  = err.response?.data?.msg ?? 'An unexpected error occurred';
    if (code === 'INVALID_CREDENTIALS') {
      setError('Invalid email or password.');
    } else {
      setError(msg);
    }
  }
}
```

---

## Password Rules

- Minimum 8 characters
- At least 1 digit
- Validated by the backend (returns HTTP 422 with `VALIDATION_ERROR` if invalid)
- Enforce the same rules in the frontend form to reduce round-trips

---

## Rate Limits

| Endpoint | Limit |
|---|---|
| `POST /auth/login` | 10 requests / minute per IP |
| `POST /auth/forgot-password` | 5 requests / minute per IP |

Exceeding the limit returns HTTP **429**. Show a "Too many attempts, please wait" message to the user.

---

## User Management (Admin only)

```
GET    /api/v1/users                        — list all users
GET    /api/v1/users/{id}                   — get user (admin or self)
PUT    /api/v1/users/{id}                   — update profile (admin or self)
PATCH  /api/v1/users/{id}/role              — change role (admin only)
PATCH  /api/v1/users/{id}/permissions       — set per-user permission overrides (admin only)
DELETE /api/v1/users/{id}                   — delete user (admin only, cannot delete self)
```

### Permission override example

Grant an agent the ability to delete products:

```json
PATCH /api/v1/users/5/permissions
{ "permissions": { "can_delete_products": true } }
```

---

## Development Credentials (Superuser)

| Field | Value |
|---|---|
| Email | `admin@admin.in` |
| Password | `admin` |
| Role | `admin` (full access) |

---

## Implementation Checklist

- [ ] Create `src/services/api.js` with axios instance and refresh interceptor
- [ ] Create `src/context/AuthContext.jsx` with `AuthProvider` and `useAuth` hook
- [ ] Wrap `App.jsx` root with `<AuthProvider>`
- [ ] Move `<Layout>` inside `ProtectedRoute` so public pages (login etc.) render without the sidebar
- [ ] Add `useEffect` in `AppRoutes` to restore session from stored refresh token on page load
- [ ] Create `src/components/common/ProtectedRoute.jsx`
- [ ] Create `src/pages/Login.jsx`, `Signup.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`, `Unauthorized.jsx`
- [ ] Update `Navbar.jsx` sidebar footer to show logged-in user name, role, and a logout button
- [ ] Add `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/unauthorized` routes in `App.jsx`
- [ ] Gate the `/users` route to `admin` role only
- [ ] Conditionally render destructive actions (delete buttons) based on `user.role`
- [ ] Handle HTTP 429 with a user-friendly "too many requests" message
