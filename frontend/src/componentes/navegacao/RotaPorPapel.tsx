// src/componentes/navegacao/RotaPorPapel.tsx
import React, { type ReactNode, useEffect, useRef } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useAuth, type PapelUsuario } from '../../contextos/AuthContext'
import { useNotificacaoContext } from '../../contextos/NotificacaoContext'

type RotaPorPapelProps = {
  papeisPermitidos: PapelUsuario[]
  children: ReactNode
}

/**
 * Rota protegida por papel.
 *
 * Regras:
 * - Enquanto o AuthContext estiver carregando, exibe um spinner central.
 * - Se não houver usuário, manda para /login.
 * - Se houver usuário, mas o papel ainda não foi carregado, espera (não redireciona).
 * - Se o papel não estiver entre os permitidos, notifica e manda para /.
 */
export const RotaPorPapel: React.FC<RotaPorPapelProps> = ({
  papeisPermitidos,
  children,
}) => {
  const { usuario, carregando } = useAuth()
  const { erro } = useNotificacaoContext()
  const location = useLocation()
  const jaNotificou = useRef(false)

  // Quando o papel não for permitido, dispara toast de erro uma única vez
  useEffect(() => {
    if (carregando) return
    if (!usuario) return

    const papel = usuario.papel

    // Se ainda não temos papel (perfil ainda carregando), não notifica
    if (!papel) return

    if (!papeisPermitidos.includes(papel) && !jaNotificou.current) {
      erro('Você não tem permissão para acessar esta área.', 'Acesso restrito')
      jaNotificou.current = true
    }
  }, [carregando, usuario, papeisPermitidos, erro])

  // Enquanto o AuthContext estiver descobrindo quem é o usuário / papel
  if (carregando) {
    return (
      <Box
        sx={{
          minHeight: '50vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  // Sem usuário autenticado → força login
  if (!usuario) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // Ainda sem papel carregado, mas já autenticado:
  // em vez de chutar para o Dashboard, só segura o layout.
  if (!usuario.papel) {
    return (
      <Box
        sx={{
          minHeight: '50vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  // Papel definido, mas não permitido → dashboard
  if (!papeisPermitidos.includes(usuario.papel)) {
    return <Navigate to="/" replace />
  }

  // Tudo certo
  return <>{children}</>
}
