import React from 'react'
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Tooltip,
  useTheme,
  Divider,
  Box,
} from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  menusPorContexto,
  obterContextoPainel,
  type ItemMenuConfig,
} from '../../config/menu'
import { useAuth } from '../../contextos/AuthContext'

interface BarraLateralProps {
  aberta: boolean
}

const BarraLateral: React.FC<BarraLateralProps> = ({ aberta }) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const { usuario } = useAuth()

  const painelAtual = obterContextoPainel(usuario?.papel, location.pathname)
  const itensMenu: ItemMenuConfig[] = menusPorContexto[painelAtual]

  // Cores personalizadas
  const COR_DESTAQUE = '#F7941D' // Laranja Principal

  const rotaAtiva = (caminho: string) => {
    if (caminho === '/') return location.pathname === '/'
    return (
      location.pathname === caminho ||
      location.pathname.startsWith(`${caminho}/`)
    )
  }

  return (
    <List
      component="nav"
      sx={{
        py: 2,
        px: aberta ? 1.5 : 1,
        height: '100%',
        // Scrollbar estilizada fina
        overflowY: 'auto',
        '&::-webkit-scrollbar': { width: '4px' },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: theme.palette.divider,
          borderRadius: '4px',
        },
      }}
    >
      {itensMenu.map((item: ItemMenuConfig, index) => {
        const ativo = rotaAtiva(item.caminho)
        
        // Verifica se precisa renderizar o cabeçalho do grupo
        const grupoAtual = item.grupo
        const grupoAnterior = index > 0 ? itensMenu[index - 1].grupo : null
        const mostrarHeader = aberta && grupoAtual && grupoAtual !== grupoAnterior

        const conteudoBotao = (
          <ListItemButton
            key={item.id}
            selected={ativo}
            onClick={() => navigate(item.caminho)}
            sx={{
              minHeight: 48,
              my: 0.5,
              borderRadius: 2,
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
              
              // Efeitos de Fundo
              ...(ativo
                ? {
                    background: `linear-gradient(90deg, ${COR_DESTAQUE}22 0%, ${COR_DESTAQUE}05 100%)`, // 22 = hex alpha ~13%
                    color: COR_DESTAQUE,
                    '&:hover': {
                      background: `linear-gradient(90deg, ${COR_DESTAQUE}33 0%, ${COR_DESTAQUE}10 100%)`,
                    },
                  }
                : {
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      transform: 'translateX(4px)', // Efeito sutil de slide
                      color: theme.palette.text.primary,
                    },
                  }),
              
              // Barra vertical indicadora (apenas quando ativo)
              '&::before': ativo
                ? {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '15%',
                    bottom: '15%',
                    width: '4px',
                    borderRadius: '0 4px 4px 0',
                    backgroundColor: COR_DESTAQUE,
                    boxShadow: `0 0 8px ${COR_DESTAQUE}80`, // Glow effect
                  }
                : {},
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: aberta ? 32 : 'auto',
                mr: aberta ? 2 : 'auto',
                justifyContent: 'center',
                color: 'inherit',
                transition: 'transform 0.2s ease',
                
                // Ícone "Pop" quando ativo
                ...(ativo && {
                   transform: 'scale(1.1)',
                   filter: `drop-shadow(0 0 2px ${COR_DESTAQUE}66)`
                })
              }}
            >
              {item.icone}
            </ListItemIcon>

            {aberta && (
              <ListItemText
                primary={item.rotulo}
                primaryTypographyProps={{
                  fontSize: 14,
                  fontWeight: ativo ? 600 : 500,
                  letterSpacing: '0.01em',
                }}
                sx={{ opacity: aberta ? 1 : 0, transition: 'opacity 0.2s' }}
              />
            )}
          </ListItemButton>
        )

        return (
          <React.Fragment key={item.id}>
            {/* Renderiza o Cabeçalho do Grupo se necessário */}
            {mostrarHeader && (
              <ListSubheader
                disableSticky
                sx={{
                  bgcolor: 'transparent',
                  lineHeight: '20px',
                  pt: 2.5,
                  pb: 1,
                  px: 2,
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  color: theme.palette.text.disabled,
                  opacity: 0.8,
                }}
              >
                {grupoAtual}
              </ListSubheader>
            )}

            {/* Separador sutil no modo fechado quando muda de grupo */}
            {!aberta && grupoAtual !== grupoAnterior && index > 0 && (
               <Divider sx={{ my: 1, width: '60%', mx: 'auto' }} />
            )}

            {aberta ? (
              conteudoBotao
            ) : (
              <Tooltip 
                title={item.rotulo} 
                placement="right" 
                arrow
                componentsProps={{
                  tooltip: {
                    sx: {
                      bgcolor: theme.palette.grey[800],
                      fontSize: '0.85rem'
                    }
                  }
                }}
              >
                {/* Envolvemos em Box para evitar problemas de ref no Tooltip com componente customizado */}
                <Box>{conteudoBotao}</Box>
              </Tooltip>
            )}
          </React.Fragment>
        )
      })}
    </List>
  )
}

export default BarraLateral