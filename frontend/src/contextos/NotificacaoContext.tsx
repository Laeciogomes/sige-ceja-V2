// src/contextos/NotificacaoContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Snackbar, Alert, type AlertColor, Stack, Slide } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ErrorIcon from '@mui/icons-material/Error'
import InfoIcon from '@mui/icons-material/Info'

export type TipoNotificacao = 'sucesso' | 'aviso' | 'erro' | 'info'

export interface Notificacao {
  id: number
  tipo: TipoNotificacao
  titulo?: string
  mensagem: string
  duracaoMs?: number
}

type NotificacaoContextTipo = {
  notificar: (dados: Omit<Notificacao, 'id'>) => void
  sucesso: (mensagem: string, titulo?: string, duracaoMs?: number) => void
  aviso: (mensagem: string, titulo?: string, duracaoMs?: number) => void
  erro: (mensagem: string, titulo?: string, duracaoMs?: number) => void
  info: (mensagem: string, titulo?: string, duracaoMs?: number) => void
}

const NotificacaoContext = createContext<NotificacaoContextTipo | undefined>(
  undefined,
)

type NotificacaoProviderProps = {
  children: ReactNode
}

const TOAST_PADRAO_MS = 4000
const TOAST_SOUND_STORAGE_KEY = 'sigeceja-toast-som-ativo' // 'on' | 'off'

// Áudios
const somSucesso =
  typeof Audio !== 'undefined' ? new Audio('/sons/sucesso.mp3') : undefined
const somAviso =
  typeof Audio !== 'undefined' ? new Audio('/sons/aviso.mp3') : undefined
const somErro =
  typeof Audio !== 'undefined' ? new Audio('/sons/erro.mp3') : undefined

// ----------------- Helpers de mapeamento -----------------

const mapearTipoParaSeveridade = (tipo: TipoNotificacao): AlertColor => {
  switch (tipo) {
    case 'sucesso':
      return 'success'
    case 'aviso':
      return 'warning'
    case 'erro':
      return 'error'
    case 'info':
    default:
      return 'info'
  }
}

const mapearTipoParaIcone = (tipo: TipoNotificacao) => {
  switch (tipo) {
    case 'sucesso':
      return <CheckCircleIcon />
    case 'aviso':
      return <WarningAmberIcon />
    case 'erro':
      return <ErrorIcon />
    case 'info':
    default:
      return <InfoIcon />
  }
}

// ----------------- Áudio / Som -----------------

const playSafe = (audio?: HTMLAudioElement) => {
  if (!audio) return
  try {
    const p = audio.play()
    if (p && typeof p.then === 'function') {
      p.catch(() => {})
    }
  } catch {
    // ignora erro de reprodução
  }
}

// Lê preferência salva em localStorage.
// Padrão: som ATIVADO (retorna true se não houver nada salvo).
const deveTocarSom = (): boolean => {
  if (typeof window === 'undefined') return true
  try {
    const valor = window.localStorage.getItem(TOAST_SOUND_STORAGE_KEY)
    return valor !== 'off'
  } catch {
    return true
  }
}

const tocarSom = (tipo: TipoNotificacao) => {
  if (!deveTocarSom()) return

  switch (tipo) {
    case 'sucesso':
      playSafe(somSucesso)
      break
    case 'aviso':
      playSafe(somAviso)
      break
    case 'erro':
      playSafe(somErro)
      break
    case 'info':
    default:
      break
  }
}

// ----------------- Provider -----------------

export const NotificacaoProvider: React.FC<NotificacaoProviderProps> = ({
  children,
}) => {
  const [fila, setFila] = useState<Notificacao[]>([])
  const [atual, setAtual] = useState<Notificacao | null>(null)
  const [aberto, setAberto] = useState(false)

  const idRef = useRef(1)

  // Sempre que não houver notificação atual, puxa da fila
  useEffect(() => {
    if (!atual && fila.length > 0) {
      const [proximo, ...resto] = fila
      setAtual(proximo)
      setFila(resto)
      setAberto(true)
      tocarSom(proximo.tipo)
    }
  }, [atual, fila])

  const fecharAtual = useCallback(() => {
    setAberto(false)
  }, [])

  const handleClose = useCallback(
    (_event?: React.SyntheticEvent | Event, reason?: string) => {
      if (reason === 'clickaway') return
      fecharAtual()
    },
    [fecharAtual],
  )

  const handleExited = useCallback(() => {
    setAtual(null)
  }, [])

  const notificar = useCallback((dados: Omit<Notificacao, 'id'>) => {
    const id = idRef.current++
    setFila(filaAtual => [
      ...filaAtual,
      {
        id,
        duracaoMs: dados.duracaoMs ?? TOAST_PADRAO_MS,
        ...dados,
      },
    ])
  }, [])

  const sucesso = useCallback(
    (mensagem: string, titulo?: string, duracaoMs?: number) => {
      notificar({ tipo: 'sucesso', mensagem, titulo, duracaoMs })
    },
    [notificar],
  )

  const aviso = useCallback(
    (mensagem: string, titulo?: string, duracaoMs?: number) => {
      notificar({ tipo: 'aviso', mensagem, titulo, duracaoMs })
    },
    [notificar],
  )

  const erro = useCallback(
    (mensagem: string, titulo?: string, duracaoMs?: number) => {
      notificar({ tipo: 'erro', mensagem, titulo, duracaoMs })
    },
    [notificar],
  )

  const info = useCallback(
    (mensagem: string, titulo?: string, duracaoMs?: number) => {
      notificar({ tipo: 'info', mensagem, titulo, duracaoMs })
    },
    [notificar],
  )

  const valorContexto = useMemo(
    () => ({
      notificar,
      sucesso,
      aviso,
      erro,
      info,
    }),
    [notificar, sucesso, aviso, erro, info],
  )

  const autoHideDuration =
    atual?.duracaoMs === 0 ? null : atual?.duracaoMs ?? TOAST_PADRAO_MS

  return (
    <NotificacaoContext.Provider value={valorContexto}>
      {children}

      {atual && (
        <Snackbar
          open={aberto}
          autoHideDuration={autoHideDuration ?? undefined}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{
            // não bloquear clique na página mesmo que o Snackbar fique montado
            pointerEvents: 'none',
            '& .MuiPaper-root': {
              pointerEvents: 'auto',
            },
            mt: 8, // abaixo da AppBar
            mr: 2,
          }}
          TransitionComponent={props => <Slide {...props} direction="left" />}
          TransitionProps={{ onExited: handleExited }}
        >
          <Alert
            elevation={6}
            variant="filled"
            severity={mapearTipoParaSeveridade(atual.tipo)}
            icon={mapearTipoParaIcone(atual.tipo)}
            onClose={handleClose}
            sx={{
              minWidth: 320,
              borderRadius: 2,
              alignItems: 'flex-start',
            }}
          >
            <Stack spacing={0.5}>
              {atual.titulo && (
                <strong style={{ fontWeight: 700 }}>{atual.titulo}</strong>
              )}
              <span>{atual.mensagem}</span>
            </Stack>
          </Alert>
        </Snackbar>
      )}
    </NotificacaoContext.Provider>
  )
}

// ----------------- Hook -----------------

export const useNotificacaoContext = (): NotificacaoContextTipo => {
  const ctx = useContext(NotificacaoContext)
  if (!ctx) {
    throw new Error(
      'useNotificacaoContext deve ser usado dentro de <NotificacaoProvider>',
    )
  }
  return ctx
}
