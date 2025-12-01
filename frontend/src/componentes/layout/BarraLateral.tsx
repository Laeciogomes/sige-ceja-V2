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
import { itensMenu } from '../../config/menu'

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

  return (
    <List sx={{ py: 1 }}>
      {itensMenu.map((item) => {
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
                  }
                ),
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                  transform: 'translateX(2px)',
                  boxShadow: 1,
                },
                '&.Mui-selected': {
                  bgcolor: theme.palette.action.selected,
                  '&:hover': {
                    bgcolor: theme.palette.action.selected,
                  },
                  borderLeft: `3px solid ${theme.palette.primary.main}`,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: aberta ? 36 : 'auto',
                  mr: aberta ? 1.5 : 0,
                  justifyContent: 'center',
                  color: ativo
                    ? theme.palette.primary.main
                    : theme.palette.text.secondary,
                }}
              >
                {item.icone}
              </ListItemIcon>
              <ListItemText
                primary={item.rotulo}
                primaryTypographyProps={{ variant: 'body2' }}
                sx={{
                  opacity: aberta ? 1 : 0,
                  transition: theme.transitions.create('opacity', {
                    duration: theme.transitions.duration.shortest,
                  }),
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
