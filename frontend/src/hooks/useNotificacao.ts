// src/hooks/useNotificacao.ts
import { useNotificacaoContext } from '../contextos/NotificacaoContext'

export const useNotificacao = () => {
  return useNotificacaoContext()
}
