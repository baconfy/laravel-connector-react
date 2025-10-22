### 1. Setup the Provider

Wrap your app with `ApiProvider` using `SanctumApi`:
```tsx
// app/layout.tsx (Next.js) or main.tsx (Vite)
import { createSanctumApi } from 'laravel-connector'
import { ApiProvider } from 'laravel-connector-react'

const api = createSanctumApi({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  storagePath: '/sanctum/csrf-cookie', // Optional: customize CSRF endpoint
})

export default function RootLayout({ children }) {
  return (
    <ApiProvider api={api}>
      {children}
    </ApiProvider>
  )
}
```

### Authentication Example
```tsx
import { useApiContext } from 'laravel-connector-react'

function LoginForm() {
  const api = useApiContext()

  const handleLogin = async (email: string, password: string) => {
    // SanctumApi automatically handles CSRF cookies
    const { data, errors } = await api.post('/login', { email, password })
    
    if (data) {
      console.log('Logged in successfully!')
      // No need to manually set tokens - Sanctum uses HTTP-only cookies
    }
  }

  return (
    // ... form JSX
  )
}
```