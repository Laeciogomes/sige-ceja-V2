// src/contextos/SupabaseContext.tsx
import React, { createContext, useContext, type ReactNode, useMemo } from 'react'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type SupabaseContextTipo = {
  supabase: SupabaseClient | null
}

const SupabaseContext = createContext<SupabaseContextTipo | undefined>(undefined)

type SupabaseProviderProps = {
  children: ReactNode
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabaseClient: SupabaseClient | null = null

if (!supabaseUrl || !supabaseAnonKey) {
  
  supabaseClient = null
} else {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })

  
}

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  const valor = useMemo<SupabaseContextTipo>(
    () => ({
      supabase: supabaseClient,
    }),
    []
  )

  return <SupabaseContext.Provider value={valor}>{children}</SupabaseContext.Provider>
}

export const useSupabase = (): SupabaseContextTipo => {
  const ctx = useContext(SupabaseContext)
  if (!ctx) {
    throw new Error('useSupabase deve ser usado dentro de <SupabaseProvider>')
  }
  return ctx
}
