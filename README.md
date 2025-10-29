# Laravel Connector React

React hooks for Laravel Connector with Sanctum support.

## Installation
```bash
npm install laravel-connector-react laravel-connector
```

## Usage
```tsx
import {ApiProvider} from 'laravel-connector-react'

function App() {
  return (
    <ApiProvider url="https://api.example.com" useSanctum={true}>
      <YourApp />
    </ApiProvider>
  )
}
```