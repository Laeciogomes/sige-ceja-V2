// frontend/src/componentes/navegacao/RotaPorPapel.tsx
import React, { type ReactNode, useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useAuth, type PapelUsuario } from '../../contextos/AuthContext'
import { useNotificacaoContext } from '../../contextos/NotificacaoContext'

type RotaPorPapelProps = {
  papeisPermitidos: PapelUsuario[]
  children: ReactNode
}

export const RotaPorPapel: React.FC<RotaPorPapelProps> = ({
  papeisPermitidos,
  children,
}) => {
  const { usuario, carregando } = useAuth()
  const { erro } = useNotificacaoContext()
  const jaNotificou = useRef(false)

  useEffect(() => {
    if (carregando) return
    if (!usuario?.papel) return

    if (!papeisPermitidos.includes(usuario.papel) && !jaNotificou.current) {
      erro('Você não tem permissão para acessar esta área.', 'Acesso restrito')
      jaNotificou.current = true
    }
  }, [carregando, usuario, papeisPermitidos, erro])

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

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  if (!usuario.papel || !papeisPermitidos.includes(usuario.papel)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
