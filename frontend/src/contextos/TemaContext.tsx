import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import type { PaletteMode } from '@mui/material'
import { criarTema } from '../temas/temaPadrao'

type TemaContextTipo = {
  modo: PaletteMode
  alternarModo: () => void
}

const TemaContext = createContext<TemaContextTipo | undefined>(undefined)

const STORAGE_KEY = 'sigeceja-tema-modo' // 'light' | 'dark'

type TemaProviderProps = {
  children: ReactNode
}

export const TemaProvider: React.FC<TemaProviderProps> = ({ children }) => {
  const [modo, setModo] = useState<PaletteMode>('light')

  // Descobre o tema inicial:
  // 1) Se o usuário já escolheu (localStorage)
  // 2) Caso contrário, usa prefers-color-scheme
  useEffect(() => {
    try {
      const armazenado = localStorage.getItem(STORAGE_KEY) as PaletteMode | null
      if (armazenado === 'light' || armazenado === 'dark') {
        setModo(armazenado)
        return
      }
    } catch {
      // Se der erro em localStorage (ex: modo privado), ignora
    }

    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      setModo(mq.matches ? 'dark' : 'light')

      const listener = (event: MediaQueryListEvent) => {
        // Só respeita mudança automática se o usuário ainda não fixou uma escolha manual
        let stored: PaletteMode | null = null
        try {
          stored = localStorage.getItem(STORAGE_KEY) as PaletteMode | null
        } catch {
          // ignora
        }
        if (!stored) {
          setModo(event.matches ? 'dark' : 'light')
        }
      }

      mq.addEventListener('change', listener)
      return () => mq.removeEventListener('change', listener)
    }
  }, [])

  const alternarModo = () => {
    setModo(prev => {
      const novo: PaletteMode = prev === 'light' ? 'dark' : 'light'
      try {
        localStorage.setItem(STORAGE_KEY, novo)
      } catch {
        // Se não conseguir salvar, segue só em memória
      }
      return novo
    })
  }

  const tema = useMemo(() => criarTema(modo), [modo])

  const valorContexto = useMemo(
    () => ({
      modo,
      alternarModo,
    }),
    [modo],
  )

  return (
    <TemaContext.Provider value={valorContexto}>
      <ThemeProvider theme={tema}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </TemaContext.Provider>
  )
}

export const useTema = (): TemaContextTipo => {
  const ctx = useContext(TemaContext)
  if (!ctx) {
    throw new Error('useTema deve ser usado dentro de <TemaProvider>')
  }
  return ctx
}
