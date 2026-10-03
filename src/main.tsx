import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './app/App'
import { seedIfEmpty } from './shared/lib/seed'
import { refreshRates } from './shared/lib/fx'
import { postDueAutomatic } from './shared/lib/recurring'

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found')

// A first run needs categories and an account before any screen makes sense.
await seedIfEmpty()

// Rates refresh in the background; a failure leaves the cached ones in place.
void refreshRates()

// Recurring rules that post by themselves catch up on anything they missed.
await postDueAutomatic()

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
