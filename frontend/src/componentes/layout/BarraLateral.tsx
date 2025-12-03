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
  type Theme,
} from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  menusPorContexto,
  obterContextoPainel,
  type ItemMenuConfig,
} from '../../config/menu'
import { useAuth } from '../../contextos/AuthContext'

// --- CONSTANTES DE ESTILO ---
const COR_LARANJA = '#F7941D'

// Função auxiliar para gerar estilos consistentes
const getStyles = (theme: Theme, ativo: boolean, isDashboard: boolean) => {
  // Cor do hover (laranja translúcido)
  const hoverBgColor = theme.palette.mode === 'light'
    ? `${COR_LARANJA}14` // ~8% opacidade
    : `${COR_LARANJA}24` // ~14% opacidade

  // Cor de fundo ativo (gradiente laranja)
  const activeBgColor = `linear-gradient(90deg, ${COR_LARANJA}24 0%, ${COR_LARANJA}08 100%)`

  return {
    listItemButton: {
      minHeight: 44,
      my: 0.5,
      mx: 1,
      borderRadius: 2,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
      // Estilo específico se for o Dashboard
      ...(isDashboard && {
         mb: 1, // Margem extra abaixo do dashboard
         fontWeight: 'bold'
      }),
      // Estilos baseados no estado (Ativo vs Inativo)
      ...(ativo
        ? {
            background: activeBgColor,
            color: COR_LARANJA,
             boxShadow: `0 2px 8px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(247, 148, 29, 0.1)'}`,
            '&:hover': {
              background: `linear-gradient(90deg, ${COR_LARANJA}33 0%, ${COR_LARANJA}12 100%)`,
            },
            // Barra vertical lateral para item ativo
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: '10%',
              bottom: '10%',
              width: '4px',
              borderRadius: '0 4px 4px 0',
              backgroundColor: COR_LARANJA,
            },
          }
        : {
            color: theme.palette.text.secondary,
            // HOVER LARANJA BONITO
            '&:hover': {
              backgroundColor: hoverBgColor,
              color: COR_LARANJA, // Texto e ícone ficam laranja no hover
              transform: 'translateX(4px)', // Pequeno movimento
            },
          }),
    },
    listItemIcon: {
        minWidth: 32,
        mr: 2,
        justifyContent: 'center',
        color: 'inherit', // Herda a cor do botão (laranja se ativo/hover, cinza se não)
        transition: 'transform 0.2s ease',
        ...(ativo && { transform: 'scale(1.1)' }), // Ícone aumenta ligeiramente se ativo
    },
    listItemText: {
        fontSize: isDashboard ? 15 : 14,
        fontWeight: ativo || isDashboard ? 600 : 400,
        letterSpacing: '0.01em',
    }
  }
}

// --- SUBCOMPONENTE PARA RENDERIZAR UM ITEM ---
interface ItemProps {
  item: ItemMenuConfig
  aberta: boolean
  isDashboard?: boolean
}

const ItemBarraLateral: React.FC<ItemProps> = ({ item, aberta, isDashboard = false }) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const rotaAtiva = (caminho: string) => {
    if (caminho === '/') return location.pathname === '/'
    // Verifica se é a rota exata ou uma sub-rota
    return location.pathname === caminho || location.pathname.startsWith(`${caminho}/`)
  }

  const ativo = rotaAtiva(item.caminho)
  const styles = getStyles(theme, ativo, isDashboard)

  const conteudoBotao = (
    <ListItemButton
      selected={ativo}
      onClick={() => navigate(item.caminho)}
      sx={styles.listItemButton}
    >
      <ListItemIcon sx={styles.listItemIcon}>
        {item.icone}
      </ListItemIcon>

      {aberta && (
        <ListItemText
          primary={item.rotulo}
          primaryTypographyProps={styles.listItemText}
          sx={{ opacity: aberta ? 1 : 0, transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}
        />
      )}
    </ListItemButton>
  )

  if (aberta) return conteudoBotao

  // Tooltip quando fechado
  return (
    <Tooltip
      title={item.rotulo}
      placement="right"
      arrow
      componentsProps={{
        tooltip: { sx: { bgcolor: theme.palette.grey[800], fontSize: '0.85rem' } }
      }}
    >
      <Box sx={{ mx: 0.5 }}>{conteudoBotao}</Box>
    </Tooltip>
  )
}

// --- COMPONENTE PRINCIPAL DA BARRA LATERAL ---
interface BarraLateralProps {
  aberta: boolean
}

const BarraLateral: React.FC<BarraLateralProps> = ({ aberta }) => {
  const theme = useTheme()
  const location = useLocation()
  const { usuario } = useAuth()

  const painelAtual = obterContextoPainel(usuario?.papel, location.pathname)
  const todosItens = menusPorContexto[painelAtual] || []

  // Assume que o primeiro item é sempre o Dashboard principal
  const dashboardItem = todosItens.length > 0 ? todosItens[0] : null
  // O restante dos itens
  const outrosItens = todosItens.length > 1 ? todosItens.slice(1) : []

  return (
    <List
      component="nav"
      sx={{
        py: 2,
        px: 0,
        height: '100%',
        overflowY: 'auto',
        '&::-webkit-scrollbar': { width: '4px' },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: theme.palette.divider,
          borderRadius: '4px',
        },
      }}
    >
      {/* --- SEÇÃO DO DASHBOARD PRINCIPAL --- */}
      {dashboardItem && (
        <>
          <ItemBarraLateral item={dashboardItem} aberta={aberta} isDashboard />
          {outrosItens.length > 0 && (
            <Divider sx={{ my: 1.5, mx: 2, borderColor: theme.palette.divider, opacity: 0.6 }} />
          )}
        </>
      )}

      {/* --- RESTANTE DOS ITENS COM GRUPOS --- */}
      {outrosItens.map((item, index) => {
        // Lógica para mostrar cabeçalho de grupo
        const grupoAtual = item.grupo
        // Compara com o item anterior na lista filtrada 'outrosItens'
        const grupoAnterior = index > 0 ? outrosItens[index - 1].grupo : null
        const mostrarHeader = aberta && grupoAtual && grupoAtual !== grupoAnterior

        // Lógica para mostrar divisor quando fechado (separação visual de grupos)
        const mostrarDivisorFechado = !aberta && grupoAtual !== grupoAnterior && index > 0

        return (
          <React.Fragment key={item.id}>
            {mostrarHeader && (
              <ListSubheader
                disableSticky
                sx={{
                  bgcolor: 'transparent',
                  lineHeight: '20px',
                  pt: 2.5,
                  pb: 1,
                  px: 3,
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '1.2px',
                  color: theme.palette.text.disabled,
                }}
              >
                {grupoAtual}
              </ListSubheader>
            )}

             {mostrarDivisorFechado && (
                 <Divider sx={{ my: 1, mx: 'auto', width: '50%', borderColor: theme.palette.divider, opacity: 0.4 }} />
            )}

            <ItemBarraLateral item={item} aberta={aberta} />
          </React.Fragment>
        )
      })}
    </List>
  )
}

export default BarraLateral