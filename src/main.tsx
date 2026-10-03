import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './app/App'
import { seedIfEmpty } from './shared/lib/seed'
import { refreshRates } from './shared/lib/fx'

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found')

// A first run needs categories and an account before any screen makes sense.
await seedIfEmpty()

// Rates refresh in the background; a failure leaves the cached ones in place.
void refreshRates()

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
