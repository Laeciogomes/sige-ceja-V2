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

export type PapelUsuario =
  | 'ADMIN'
  | 'DIRETOR'
  | 'COORDENACAO'
  | 'SECRETARIA'
  | 'PROFESSOR'
  | 'ALUNO'

type UsuarioAutenticado = {
  id: string
  email: string | null
  papel?: PapelUsuario
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

/**
 * Mapeia o id_tipo_usuario (inteiro) vindo da tabela public.usuarios
 * para o enum interno PapelUsuario.
 *
 * Tabela antiga:
 * 1 = Diretor
 * 2 = Professor
 * 3 = Coordenador
 * 4 = Secretario
 * 5 = Aluno
 * 6 = Administrador
 */
const normalizarPapelPorId = (
  idTipoUsuario: number | null | undefined,
): PapelUsuario | undefined => {
  if (idTipoUsuario == null) return undefined

  switch (idTipoUsuario) {
    case 6:
      return 'ADMIN'
    case 1:
      return 'DIRETOR'
    case 3:
      return 'COORDENACAO'
    case 4:
      return 'SECRETARIA'
    case 2:
      return 'PROFESSOR'
    case 5:
      return 'ALUNO'
    default:
      return undefined
  }
}

type PerfilUsuarioRow = {
  id_tipo_usuario: number | null
}

/**
 * Lê o perfil em public.usuarios para descobrir o id_tipo_usuario
 */
const carregarPerfilUsuario = async (
  supabase: ReturnType<typeof useSupabase>['supabase'],
  userId: string,
): Promise<number | null> => {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('usuarios')
    .select('id_tipo_usuario')
    .eq('id', userId)
    .maybeSingle<PerfilUsuarioRow>()

  if (error) {
    console.error('Erro ao carregar perfil em public.usuarios:', error)
    return null
  }

  return data?.id_tipo_usuario ?? null
}

const construirUsuario = (
  user: User | null,
  idTipoUsuario: number | null,
): UsuarioAutenticado | null => {
  if (!user) return null

  const papel = normalizarPapelPorId(idTipoUsuario)

  return {
    id: user.id,
    email: user.email ?? null,
    papel,
  }
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { supabase } = useSupabase()
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null)
  const [carregando, setCarregando] = useState(true)
  const navigate = useNavigate()

  // Carrega usuário inicial + perfil
  useEffect(() => {
    if (!supabase) {
      console.error('Supabase não inicializado no AuthProvider')
      setCarregando(false)
      return
    }

    let cancelado = false

    const carregarUsuarioInicial = async () => {
      try {
        const { data, error } = await supabase.auth.getUser()

        if (error) {
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

        const user = data.user
        if (!user) {
          if (!cancelado) setUsuario(null)
          return
        }

        const idTipoUsuario = await carregarPerfilUsuario(supabase, user.id)

        if (!cancelado) {
          setUsuario(construirUsuario(user, idTipoUsuario))
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

    carregarUsuarioInicial()

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null

        if (!user) {
          setUsuario(null)
        } else {
          const idTipoUsuario = await carregarPerfilUsuario(supabase, user.id)
          setUsuario(construirUsuario(user, idTipoUsuario))
        }

        // Fluxo de recuperação de senha: força ir para /nova-senha
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

      const user = data.user
      if (!user) {
        setUsuario(null)
        return
      }

      const idTipoUsuario = await carregarPerfilUsuario(supabase, user.id)
      setUsuario(construirUsuario(user, idTipoUsuario))
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
