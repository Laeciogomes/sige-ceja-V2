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
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()

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
          setUsuario(mapUserToUsuario(data.user))
        }
      } catch (e) {
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

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const user = session?.user ?? null
        setUsuario(mapUserToUsuario(user))

        // 👇 FORÇA A NAVEGAR PARA /nova-senha NO FLUXO DE RECUPERAÇÃO
        if (event === 'PASSWORD_RECOVERY') {
          navigate('/nova-senha', { replace: true })
        }
      },
    )

    return () => {
      cancelado = true
      subscription.subscription.unsubscribe()
    }
  }, [supabase, navigate])

  const login = async (
    email: string,
    senha: string,
    _rememberMe: boolean,
  ) => {
    if (!supabase) {
      throw new Error('Supabase não inicializado no AuthProvider')
    }

    setCarregando(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      })

      if (error) {
        throw error
      }

      setUsuario(mapUserToUsuario(data.user))
    } catch (e) {
      console.error('Erro ao realizar login:', e)
      setUsuario(null)
      throw e
    } finally {
      setCarregando(false)
    }
  }

  const logout = async () => {
    if (!supabase) {
      console.error('Supabase não inicializado no AuthProvider')
      setUsuario(null)
      return
    }

    setCarregando(true)

    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
      setUsuario(null)
    } catch (e) {
      console.error('Erro ao realizar logout:', e)
    } finally {
      setCarregando(false)
    }
  }

  const valor: AuthContextTipo = useMemo(
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
