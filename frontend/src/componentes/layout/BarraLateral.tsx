// frontend/src/componentes/layout/BarraLateral.tsx
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

interface BarraLateralProps {
  aberta: boolean
}

const BarraLateral: React.FC<BarraLateralProps> = ({ aberta }) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const rotaAtiva = (caminho: string) => {
    if (caminho === '/') return location.pathname === '/'
    return location.pathname.startsWith(caminho)
  }

  const laranja = '#F7941D'

  const hoverBg =
    theme.palette.mode === 'dark'
      ? 'rgba(247, 148, 29, 0.25)'
      : 'rgba(247, 148, 29, 0.12)'

  const ativoBg =
    theme.palette.mode === 'dark'
      ? 'rgba(247, 148, 29, 0.35)'
      : 'rgba(247, 148, 29, 0.18)'

  return (
    <List sx={{ py: 1 }}>
      {itensMenu.map((item: ItemMenuConfig) => {
        const ativo = rotaAtiva(item.caminho)

        return (
          <Tooltip
            key={item.caminho}
            title={!aberta ? item.rotulo : ''}
            placement="right"
            arrow
          >
            <ListItemButton
              selected={ativo}
              onClick={() => navigate(item.caminho)}
              sx={{
                px: aberta ? 2.5 : 1,
                justifyContent: aberta ? 'flex-start' : 'center',
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
                  boxShadow: 1,
                },
              }}
            >
              {/* Ícone: sempre aparece, mesmo com menu recolhido */}
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

              {/* Texto: some só quando o menu está recolhido */}
              <ListItemText
                primary={item.rotulo}
                primaryTypographyProps={{
                  variant: 'body2',
                  sx: { fontWeight: ativo ? 600 : 400 },
                }}
                sx={{
                  opacity: aberta ? 1 : 0,
                  transition: theme.transitions.create('opacity', {
                    duration: theme.transitions.duration.shortest,
                  }),
                  '& .MuiListItemText-primary': {
                    color: ativo
                      ? laranja
                      : theme.palette.text.primary,
                  },
                }}
              />
            </ListItemButton>
          </Tooltip>
        )
      })}
    </List>
  )
}

export default BarraLateral
