import React, { createContext, useContext, useMemo } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

type SupabaseContextType = {
  supabase: SupabaseClient | null
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

// Lidos do .env (Vite)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

let supabase: SupabaseClient | null = null

if (!supabaseUrl || !supabaseAnonKey) {
  // Ainda não configurado: não quebra a aplicação, só avisa no console.
  console.warn(
    'Supabase não está configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no seu arquivo .env.local.',
  )
} else {
  // Cliente único, criado uma vez só para toda a aplicação
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useMemo<SupabaseContextType>(
    () => ({ supabase }),
    [],
  )

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  )
}

/**
 * Hook para acessar o cliente Supabase.
 * Uso típico:
 *   const { supabase } = useSupabase()
 */
export function useSupabase() {
  const ctx = useContext(SupabaseContext)

  if (!ctx) {
    throw new Error('useSupabase deve ser usado dentro de SupabaseProvider')
  }

  if (!ctx.supabase) {
    throw new Error(
      'Supabase não está configurado. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.local.',
    )
  }

  return ctx
}
