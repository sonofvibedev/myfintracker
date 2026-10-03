import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './app/App'
import { seedIfEmpty } from './shared/lib/seed'

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found')

// A first run needs categories and an account before any screen makes sense.
await seedIfEmpty()

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
