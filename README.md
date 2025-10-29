# Laravel Connector React

> React hooks and context providers for Laravel Connector with Sanctum support

[![npm version](https://img.shields.io/npm/v/laravel-connector-react.svg)](https://www.npmjs.com/package/laravel-connector-react)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18%2B-blue.svg)](https://reactjs.org/)

A powerful and type-safe React integration for [Laravel Connector](https://github.com/baconfy/laravel-connector), providing hooks and utilities to seamlessly connect your React applications with Laravel backends using Laravel Sanctum authentication.

## ✨ Features

- 🎣 **React Hooks** - `useQuery`, `useMutation`, and `useApi` for intuitive API interactions
- 🔐 **Sanctum Support** - Built-in authentication with Laravel Sanctum (CSRF tokens, cookies)
- ⚡ **Smart Caching** - Automatic request caching with configurable stale times
- 🔄 **Auto Refetch** - Configurable refetch on mount, window focus, and intervals
- 🔁 **Retry Logic** - Automatic retry on failure with exponential backoff
- 📡 **Real-time Updates** - Easy cache invalidation and manual refetching
- 🎯 **TypeScript First** - Full type safety with generics support
- 🧪 **Well Tested** - Comprehensive test suite with 100% coverage
- 📦 **Lightweight** - Minimal dependencies, tree-shakeable
- 🎨 **Flexible** - Works with any Laravel API structure

## 📦 Installation

```bash
npm install laravel-connector-react
```

or with yarn:

```bash
yarn add laravel-connector-react
```

or with pnpm:

```bash
pnpm add laravel-connector-react
```

## 🚀 Quick Start

### 1. Wrap your app with ApiProvider

```tsx
import {ApiProvider} from 'laravel-connector-react'

function App() {
  return (
    <ApiProvider
      url="https://api.example.com"
      useSanctum={true}
      withCredentials={true}
    >
      <YourApp/>
    </ApiProvider>
  )
}
```

### 2. Fetch data with useQuery

```tsx
import {useQuery} from 'laravel-connector-react'

function UserList() {
  const {data, isLoading, error, refetch} = useQuery('/users')

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h1>Users</h1>
      {data?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
      <button onClick={refetch}>Refresh</button>
    </div>
  )
}
```

### 3. Create/Update data with useMutation

```tsx
import {useMutation} from 'laravel-connector-react'

function CreateUser() {
  const {mutate, isLoading, error} = useMutation('/users', 'POST', {
    onSuccess: (user) => {
      console.log('User created:', user)
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    mutate({name: 'John Doe', email: 'john@example.com'})
  }

  return (
    <form onSubmit={handleSubmit}>
      <button disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create User'}
      </button>
      {error && <div>Error: {error.message}</div>}
    </form>
  )
}
```

## 📚 API Reference

### `<ApiProvider>`

The provider component that makes the API client available throughout your app.

#### Props

| Prop              | Type                     | Default                  | Description                           |
|-------------------|--------------------------|--------------------------|---------------------------------------|
| `url`             | `string`                 | **required**             | Base URL of your Laravel API          |
| `useSanctum`      | `boolean`                | `false`                  | Enable Laravel Sanctum authentication |
| `headers`         | `Record<string, string>` | `{}`                     | Default headers for all requests      |
| `timeout`         | `number`                 | `undefined`              | Request timeout in milliseconds       |
| `retries`         | `number`                 | `0`                      | Number of retry attempts on failure   |
| `retryDelay`      | `number`                 | `1000`                   | Delay between retries in milliseconds |
| `withCredentials` | `boolean`                | `false`                  | Include credentials in requests       |
| `useCsrfToken`    | `boolean`                | `true`                   | Use CSRF token with Sanctum           |
| `csrfCookiePath`  | `string`                 | `'/sanctum/csrf-cookie'` | Path to get CSRF cookie               |

#### Example

```tsx
<ApiProvider
  url="https://api.example.com"
  useSanctum={true}
  withCredentials={true}
  timeout={5000}
  retries={3}
  headers={{
    'X-Custom-Header': 'value'
  }}
>
  <App/>
</ApiProvider>
```

---

### `useQuery()`

Hook for fetching data with automatic caching and refetching.

#### Signature

```typescript
function useQuery<T>(
  endpoint: string,
  options?: QueryOptions<T>
): QueryState<T>
```

#### Options

| Option                 | Type                   | Default     | Description                              |
|------------------------|------------------------|-------------|------------------------------------------|
| `enabled`              | `boolean`              | `true`      | Enable/disable automatic fetching        |
| `refetchOnMount`       | `boolean`              | `true`      | Refetch when component mounts            |
| `refetchOnWindowFocus` | `boolean`              | `false`     | Refetch when window regains focus        |
| `refetchInterval`      | `number \| false`      | `false`     | Polling interval in milliseconds         |
| `staleTime`            | `number`               | `0`         | Time until data is considered stale (ms) |
| `retry`                | `number`               | `0`         | Number of retry attempts                 |
| `retryDelay`           | `number`               | `1000`      | Delay between retries (ms)               |
| `onSuccess`            | `(data: T) => void`    | `undefined` | Callback on successful fetch             |
| `onError`              | `(error: any) => void` | `undefined` | Callback on error                        |
| `select`               | `(data: any) => T`     | `undefined` | Transform the response data              |
| `initialData`          | `T`                    | `undefined` | Initial data before fetch                |

#### Return Value

| Property     | Type                  | Description                                  |
|--------------|-----------------------|----------------------------------------------|
| `data`       | `T \| undefined`      | The fetched data                             |
| `error`      | `any`                 | Error object if request failed               |
| `isLoading`  | `boolean`             | True on initial load                         |
| `isError`    | `boolean`             | True if request failed                       |
| `isSuccess`  | `boolean`             | True if request succeeded                    |
| `isFetching` | `boolean`             | True during any fetch (including background) |
| `refetch`    | `() => Promise<void>` | Manual refetch function                      |
| `invalidate` | `() => void`          | Invalidate cache and refetch                 |

#### Examples

**Basic usage:**

```tsx
const {data, isLoading, error} = useQuery('/users')
```

**With options:**

```tsx
const {data, isLoading} = useQuery('/users', {
  staleTime: 5000, // Cache for 5 seconds
  refetchInterval: 10000, // Poll every 10 seconds
  onSuccess: (users) => {
    console.log('Fetched', users.length, 'users')
  }
})
```

**With data transformation:**

```tsx
const {data} = useQuery('/users', {
  select: (users) => users.map(u => u.name)
})
// data is now string[] instead of User[]
```

**Conditional fetching:**

```tsx
const [userId, setUserId] = useState(null)
const {data} = useQuery(`/users/${userId}`, {
  enabled: !!userId // Only fetch when userId is set
})
```

**With TypeScript:**

```tsx
interface User {
  id: number
  name: string
  email: string
}

const {data} = useQuery<User[]>('/users')
// data is typed as User[] | undefined
```

---

### `useMutation()`

Hook for creating, updating, or deleting data.

#### Signature

```typescript
function useMutation<TData, TVariables>(
  endpoint: string,
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  options?: MutationOptions<TData, TVariables>
): MutationState<TData, TVariables>
```

#### Options

| Option       | Type                                                                    | Default     | Description                    |
|--------------|-------------------------------------------------------------------------|-------------|--------------------------------|
| `onSuccess`  | `(data: TData, variables: TVariables) => void`                          | `undefined` | Callback on success            |
| `onError`    | `(error: any, variables: TVariables) => void`                           | `undefined` | Callback on error              |
| `onSettled`  | `(data: TData \| undefined, error: any, variables: TVariables) => void` | `undefined` | Callback when mutation settles |
| `retry`      | `number`                                                                | `0`         | Number of retry attempts       |
| `retryDelay` | `number`                                                                | `1000`      | Delay between retries (ms)     |

#### Return Value

| Property      | Type                                                  | Description                        |
|---------------|-------------------------------------------------------|------------------------------------|
| `data`        | `TData \| undefined`                                  | The mutation response data         |
| `error`       | `any`                                                 | Error object if mutation failed    |
| `isLoading`   | `boolean`                                             | True while mutation is in progress |
| `isError`     | `boolean`                                             | True if mutation failed            |
| `isSuccess`   | `boolean`                                             | True if mutation succeeded         |
| `mutate`      | `(variables: TVariables) => Promise<Response<TData>>` | Execute the mutation               |
| `mutateAsync` | `(variables: TVariables) => Promise<Response<TData>>` | Async version of mutate            |
| `reset`       | `() => void`                                          | Reset mutation state               |

#### Examples

**Create a resource (POST):**

```tsx
const {mutate, isLoading} = useMutation('/users', 'POST', {
  onSuccess: (user) => {
    console.log('Created user:', user)
  }
})

const handleCreate = () => {
  mutate({name: 'John', email: 'john@example.com'})
}
```

**Update a resource (PUT/PATCH):**

```tsx
const {mutate} = useMutation(`/users/${userId}`, 'PUT')

const handleUpdate = () => {
  mutate({name: 'John Updated'})
}
```

**Delete a resource:**

```tsx
const {mutate, isLoading} = useMutation(`/users/${userId}`, 'DELETE', {
  onSuccess: () => {
    console.log('User deleted')
  }
})

const handleDelete = () => {
  mutate({}) // DELETE doesn't need a body
}
```

**With error handling:**

```tsx
const {mutate, error, isError} = useMutation('/users', 'POST', {
  onError: (error) => {
    toast.error(error.message)
  }
})
```

**With retry:**

```tsx
const {mutate} = useMutation('/users', 'POST', {
  retry: 3,
  retryDelay: 2000
})
```

**Using mutateAsync:**

```tsx
const {mutateAsync} = useMutation('/users', 'POST')

const handleSubmit = async (data) => {
  try {
    const response = await mutateAsync(data)
    if (response.success) {
      navigate('/users')
    }
  } catch (error) {
    console.error(error)
  }
}
```

**With TypeScript:**

```tsx
interface User {
  id: number
  name: string
  email: string
}

interface CreateUserInput {
  name: string
  email: string
}

const {mutate} = useMutation<User, CreateUserInput>('/users', 'POST')

mutate({name: 'John', email: 'john@example.com'})
// Fully typed!
```

---

### `useApi()`

Hook to access the underlying API client directly.

#### Signature

```typescript
function useApi(): Api | SanctumApi
```

#### Return Value

Returns the configured API client instance from `laravel-connector`.

#### Example

```tsx
import {useApi} from 'laravel-connector-react'

function CustomComponent() {
  const api = useApi()

  const handleCustomRequest = async () => {
    const response = await api.post('/custom-endpoint', {
      custom: 'data'
    })

    if (response.success) {
      console.log(response.data)
    }
  }

  return <button onClick={handleCustomRequest}>Custom Request</button>
}
```

**Use cases:**

- Custom request logic not covered by hooks
- Direct access to interceptors
- Special authentication flows
- File uploads with progress tracking

---

## 🎯 Common Patterns

### Cache Invalidation

Invalidate specific queries when data changes:

```tsx
function UserManagement() {
  const {data: users, invalidate} = useQuery('/users')

  const {mutate: createUser} = useMutation('/users', 'POST', {
    onSuccess: () => {
      invalidate() // Refetch users list after creating
    }
  })

  const {mutate: deleteUser} = useMutation(`/users/${id}`, 'DELETE', {
    onSuccess: () => {
      invalidate() // Refetch users list after deleting
    }
  })

  // ...
}
```

### Optimistic Updates

Update UI immediately before server confirmation:

```tsx
function TodoList() {
  const {data: todos, invalidate} = useQuery('/todos')
  const [optimisticTodos, setOptimisticTodos] = useState([])

  const {mutate} = useMutation('/todos', 'POST', {
    onMutate: (newTodo) => {
      // Add todo optimistically
      setOptimisticTodos(prev => [...prev, newTodo])
    },
    onSuccess: () => {
      // Clear optimistic state and refetch
      setOptimisticTodos([])
      invalidate()
    },
    onError: () => {
      // Revert optimistic update
      setOptimisticTodos([])
    }
  })

  const displayTodos = [...(todos || []), ...optimisticTodos]

  // ...
}
```

### Pagination

```tsx
function PaginatedUsers() {
  const [page, setPage] = useState(1)

  const {data, isLoading} = useQuery(`/users?page=${page}`, {
    staleTime: 5000
  })

  return (
    <div>
      {data?.data.map(user => <UserCard key={user.id} user={user}/>)}

      <Pagination
        current={data?.current_page}
        total={data?.last_page}
        onChange={setPage}
      />
    </div>
  )
}
```

### Dependent Queries

```tsx
function UserPosts() {
  const {data: user} = useQuery('/auth/user')

  const {data: posts, isLoading} = useQuery(`/users/${user?.id}/posts`, {
    enabled: !!user?.id // Only fetch when user is loaded
  })

  if (!user) return <div>Loading user...</div>
  if (isLoading) return <div>Loading posts...</div>

  return <PostList posts={posts}/>
}
```

### Infinite Scroll / Load More

```tsx
function InfiniteUserList() {
  const [page, setPage] = useState(1)
  const [allUsers, setAllUsers] = useState([])

  const {data, isLoading} = useQuery(`/users?page=${page}`, {
    onSuccess: (newData) => {
      setAllUsers(prev => [...prev, ...newData.data])
    }
  })

  const loadMore = () => {
    if (data?.current_page < data?.last_page) {
      setPage(prev => prev + 1)
    }
  }

  return (
    <div>
      {allUsers.map(user => <UserCard key={user.id} user={user}/>)}
      <button onClick={loadMore} disabled={isLoading}>
        Load More
      </button>
    </div>
  )
}
```

---

## 🔐 Laravel Sanctum Authentication

### Setup

**Laravel side (routes/api.php):**

```php
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
});
```

**React side:**

```tsx
import {ApiProvider, useMutation, useQuery} from 'laravel-connector-react'

function App() {
  return (
    <ApiProvider
      url="https://api.example.com"
      useSanctum={true}
      withCredentials={true}
      csrfCookiePath="/sanctum/csrf-cookie"
    >
      <AuthApp/>
    </ApiProvider>
  )
}

function Login() {
  const {mutate, isLoading, error} = useMutation('/login', 'POST', {
    onSuccess: () => {
      window.location.href = '/dashboard'
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    mutate({
      email: 'user@example.com',
      password: 'password'
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={isLoading}>Login</button>
      {error && <div>{error.message}</div>}
    </form>
  )
}

function Dashboard() {
  const {data: user} = useQuery('/user')

  return <div>Welcome, {user?.name}!</div>
}
```

---

## 🧪 Testing

The package comes with a comprehensive test suite. All hooks are tested with React Testing Library.

**Run tests:**

```bash
npm test
```

**Run tests with coverage:**

```bash
npm run test:coverage
```

**Run tests in UI mode:**

```bash
npm run test:ui
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT © Baconfy

---

## 🔗 Links

- [Laravel Connector](https://github.com/baconfy/laravel-connector) - The underlying HTTP client
- [Laravel Sanctum Documentation](https://laravel.com/docs/sanctum)
- [React Documentation](https://react.dev/)

---

## 💬 Support

- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/laravel-connector-react/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/laravel-connector-react/discussions)

---

**Made with ❤️ for the Laravel and React communities**
