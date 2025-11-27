// src/contextos/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { useSupabase } from './SupabaseContext'

type UsuarioAutenticado = {
  id: string
  email: string | null
}

type AuthContextTipo = {
  usuario: UsuarioAutenticado | null
  carregando: boolean
  login: (email: string, senha: string, rememberMe: boolean) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextTipo | undefined>(undefined)

type AuthProviderProps = {
  children: ReactNode
}

const mapUserToUsuario = (user: User | null): UsuarioAutenticado | null => {
  if (!user) return null
  return {
    id: user.id,
    email: user.email ?? null,
  }
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { supabase } = useSupabase()
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null)
  const [carregando, setCarregando] = useState(true)

  // Carrega usuário inicial e registra listener de auth
  useEffect(() => {
    if (!supabase) {
      console.error('Supabase não inicializado no AuthProvider')
      setCarregando(false)
      return
    }

    let cancelado = false

    const carregarUsuario = async () => {
      try {
        const { data, error } = await supabase.auth.getUser()

        if (error) {
          // Ignora o caso "sem sessão" (erro esperado quando ninguém está logado)
          const nome = (error as any).name || ''
          const status = (error as any).status || (error as any).statusCode

          const ehSessaoAusente =
            nome === 'AuthSessionMissingError' ||
            status === 400 ||
            status === 401

          if (!ehSessaoAusente) {
            console.error('Erro ao obter usuário inicial:', error)
          }

          if (!cancelado) {
            setUsuario(null)
          }
          return
        }

        if (!cancelado) {
          setUsuario(mapUserToUsuario(data?.user ?? null))
        }
      } catch (e) {
        // Qualquer outra exceção real a gente loga
        console.error('Exceção ao obter usuário inicial:', e)
        if (!cancelado) {
          setUsuario(null)
        }
      } finally {
        if (!cancelado) {
          setCarregando(false)
        }
      }
    }

    carregarUsuario()

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null
      setUsuario(mapUserToUsuario(user))
    })

    return () => {
      cancelado = true
      data.subscription.unsubscribe()
    }
  }, [supabase])

  const login = async (
    email: string,
    senha: string,
    _rememberMe: boolean,
  ) => {
    if (!supabase) {
      console.error('Supabase não inicializado em login')
      throw new Error('Falha interna ao inicializar autenticação.')
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    if (error) {
      throw error
    }

    setUsuario(mapUserToUsuario(data.user ?? null))
  }

  const logout = async () => {
    if (!supabase) {
      console.error('Supabase não inicializado em logout')
      return
    }
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Erro ao fazer logout:', error)
    }
    setUsuario(null)
  }

  const valor = useMemo(
    () => ({
      usuario,
      carregando,
      login,
      logout,
    }),
    [usuario, carregando],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextTipo => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  }
  return ctx
}
