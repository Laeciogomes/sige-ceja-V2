// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import App from './App'
import { SupabaseProvider } from './contextos/SupabaseContext'
import { AuthProvider } from './contextos/AuthContext'
import { TemaProvider } from './contextos/TemaContext'
import { NotificacaoProvider } from './contextos/NotificacaoContext'

import './index.css'

// Configuração global do React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
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
    </BrowserRouter>
  </React.StrictMode>,
)
