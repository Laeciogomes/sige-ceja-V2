// src/componentes/layout/BarraLateral.tsx
import React from 'react'
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  useTheme,
} from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import { itensMenu, type ItemMenuConfig } from '../../config/menu'
import { useAuth } from '../../contextos/AuthContext'

interface BarraLateralProps {
  aberta: boolean
}

const BarraLateral: React.FC<BarraLateralProps> = ({ aberta }) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const { usuario } = useAuth()

  const rotaAtiva = (caminho: string) => {
    if (caminho === '/') return location.pathname === '/'
    return location.pathname.startsWith(caminho)
  }

  const laranja = '#F7941D'
  const ativoBg =
    theme.palette.mode === 'light'
      ? 'rgba(247, 148, 29, 0.12)'
      : 'rgba(247, 148, 29, 0.22)'
  const hoverBg =
    theme.palette.mode === 'light'
      ? 'rgba(247, 148, 29, 0.08)'
      : 'rgba(247, 148, 29, 0.16)'

  const itensVisiveis: ItemMenuConfig[] = React.useMemo(() => {
    // Enquanto não houver papel carregado, mostra só Dashboard
    if (!usuario?.papel) {
      return itensMenu.filter(item => item.caminho === '/')
    }

    const papelAtual = usuario.papel

    return itensMenu.filter(item => {
      // Dashboard sempre visível
      if (item.caminho === '/') return true

      // Se o item não exige papel específico, libera
      if (!item.papeisPermitidos) return true

      // Aqui TypeScript já sabe que papelAtual é definido
      return item.papeisPermitidos.includes(papelAtual)
    })
  }, [usuario])

  return (
    <List
      sx={{
        py: 1,
        px: aberta ? 1 : 0.5,
      }}
    >
      {itensVisiveis.map((item: ItemMenuConfig) => {
        const ativo = rotaAtiva(item.caminho)

        const conteudo = (
          <ListItemButton
            key={item.caminho}
            selected={ativo}
            onClick={() => navigate(item.caminho)}
            sx={{
              my: 0.2,
              borderRadius: 2,
              transition: theme.transitions.create(
                ['background-color', 'transform'],
                {
                  duration: theme.transitions.duration.shortest,
                },
              ),
              bgcolor: ativo ? ativoBg : 'transparent',
              '&:hover': {
                bgcolor: hoverBg,
                transform: 'translateX(2px)',
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: aberta ? 36 : 'auto',
                mr: aberta ? 1.5 : 0,
                justifyContent: 'center',
                color: ativo ? laranja : theme.palette.text.secondary,
              }}
            >
              {item.icone}
            </ListItemIcon>

            {aberta && (
              <ListItemText
                primary={item.rotulo}
                primaryTypographyProps={{
                  fontSize: 14,
                  fontWeight: ativo ? 700 : 500,
                  whiteSpace: 'nowrap',
                  color: ativo ? laranja : theme.palette.text.primary,
                }}
              />
            )}
          </ListItemButton>
        )

        if (aberta) {
          return conteudo
        }

        return (
          <Tooltip key={item.caminho} title={item.rotulo} placement="right">
            {conteudo}
          </Tooltip>
        )
      })}
    </List>
  )
}

export default BarraLateral
