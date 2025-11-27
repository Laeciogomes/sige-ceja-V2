// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
// ⬇️ troque BrowserRouter por HashRouter
import { HashRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import App from './App'
import { SupabaseProvider } from './contextos/SupabaseContext'
import { AuthProvider } from './contextos/AuthContext'
import { TemaProvider } from './contextos/TemaContext'
import { NotificacaoProvider } from './contextos/NotificacaoContext'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HashRouter>
      <QueryClientProvider client={queryClient}>
        <SupabaseProvider>
          <AuthProvider>
            <TemaProvider>
              <NotificacaoProvider>
                <App />
              </NotificacaoProvider>
            </TemaProvider>
          </AuthProvider>
        </SupabaseProvider>
      </QueryClientProvider>
    </HashRouter>
  </React.StrictMode>,
)

// Registro do Service Worker para PWA (instalável em PC/celular/tablet)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => {
        console.error('Falha ao registrar o service worker:', err)
      })
  })
}
