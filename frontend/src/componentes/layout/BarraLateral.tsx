// src/componentes/layout/BarraLateral.tsx
import React, { useMemo } from 'react'
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
  alpha,
} from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  menusPorContexto,
  obterContextoPainel,
  type ItemMenuConfig,
} from '../../config/menu'
import { useAuth } from '../../contextos/AuthContext'

// --- TIPOS ESTENDIDOS ---
interface ItemProps {
  item: ItemMenuConfig
  aberta: boolean
  isDashboard?: boolean
  index?: number
  forceActive?: boolean
}

type SidebarMode = 'light' | 'dark'

// --- HOOK DE ESTILOS (Performance otimizada) ---
const useSidebarStyles = (theme: Theme, mode: SidebarMode) => {
  const COR_LARANJA = '#F7941D'
  const isLight = mode === 'light'

  const hoverBgColor = alpha(COR_LARANJA, isLight ? 0.08 : 0.14)
  const activeBgColor = `linear-gradient(90deg, ${alpha(
    COR_LARANJA,
    0.14,
  )} 0%, ${alpha(COR_LARANJA, 0.03)} 100%)`

  return useMemo(
    () => ({
      listItemButton: {
        minHeight: 44,
        my: 0.5,
        mx: 1,
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        '&:focus-visible': {
          outline: `2px solid ${COR_LARANJA}`,
          outlineOffset: 2,
        },
      },
      active: {
        background: activeBgColor,
        color: COR_LARANJA,
        fontWeight: 600,
        boxShadow: `0 2px 8px ${alpha(COR_LARANJA, isLight ? 0.1 : 0.2)}`,
        '&:hover': {
          background: `linear-gradient(90deg, ${alpha(
            COR_LARANJA,
            0.2,
          )} 0%, ${alpha(COR_LARANJA, 0.07)} 100%)`,
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: '10%',
          bottom: '10%',
          width: '4px',
          borderRadius: '0 4px 4px 0',
          backgroundColor: COR_LARANJA,
          boxShadow: `0 0 6px ${alpha(COR_LARANJA, 0.3)}`,
        },
        '&.Mui-selected': { backgroundColor: activeBgColor },
      },
      inactive: {
        color: theme.palette.text.secondary,
        '&:hover': {
          backgroundColor: hoverBgColor,
          color: COR_LARANJA,
          transform: 'translateX(4px)',
          '& .MuiListItemIcon-root': { color: COR_LARANJA },
        },
      },
      listItemIcon: {
        minWidth: 32,
        mr: 2,
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        color: 'inherit',
      },
      activeIcon: {
        transform: 'scale(1.1)',
        filter: `drop-shadow(0 0 2px ${alpha(COR_LARANJA, 0.26)})`,
      },
      listItemText: (ativo: boolean, isDashboard: boolean) => ({
        fontSize: isDashboard ? 15 : 14,
        fontWeight: ativo || isDashboard ? 600 : 400,
        letterSpacing: '0.01em',
        opacity: 1,
        whiteSpace: 'nowrap',
      }),
      subheader: {
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
        opacity: 0,
        transition: 'opacity 0.3s ease',
        '&:hover': { opacity: 0.8 },
      },
      divider: {
        my: 1,
        mx: 2,
        opacity: 0.6,
      },
      dividerClosed: {
        my: 1,
        mx: 'auto',
        width: '50%',
        opacity: 0.4,
      },
      list: {
        py: 2,
        px: 0,
        height: '100%',
        overflowY: 'auto',
        '&::-webkit-scrollbar': { width: '4px' },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: theme.palette.divider,
          borderRadius: '4px',
        },
      },
      tooltip: {
        bgcolor: theme.palette.grey[800],
        fontSize: '0.85rem',
      },
    }),
    [theme, mode, activeBgColor, COR_LARANJA, hoverBgColor, isLight],
  )
}

// --- LÓGICA DE ROTA PARA UM ITEM ---
const useActiveRoute = (caminhoMenu: string) => {
  const location = useLocation()
  return useMemo(() => {
    const pathAtual = location.pathname.toLowerCase().replace(/\/$/, '')
    const pathMenu = caminhoMenu.toLowerCase().replace(/\/$/, '')
    if (!pathMenu) return false
    if (pathAtual === pathMenu) return true
    return pathAtual.startsWith(`${pathMenu}/`)
  }, [location.pathname, caminhoMenu])
}

// --- VERIFICA SE ALGUM DOS ITENS ESTÁ ATIVO ---
const useAnyMenuActive = (items: ItemMenuConfig[]) => {
  const location = useLocation()
  return useMemo(() => {
    if (!items.length) return false
    const pathAtual = location.pathname.toLowerCase().replace(/\/$/, '')
    return items.some(item => {
      const pathMenu = item.caminho.toLowerCase().replace(/\/$/, '')
      if (!pathMenu) return false
      if (pathAtual === pathMenu) return true
      return pathAtual.startsWith(`${pathMenu}/`)
    })
  }, [location.pathname, items])
}

// --- SUBCOMPONENTE MEMOIZADO ---
const ItemBarraLateral: React.FC<ItemProps> = React.memo(
  ({ item, aberta, isDashboard = false, index = 0, forceActive }) => {
    const theme = useTheme()
    const navigate = useNavigate()
    const styles = useSidebarStyles(theme, theme.palette.mode as SidebarMode)

    const defaultAtivo = useActiveRoute(item.caminho)
    const ativo = forceActive ?? defaultAtivo

    const handleClick = () => navigate(item.caminho)

    const iconStyle = {
      ...styles.listItemIcon,
      ...(ativo ? styles.activeIcon : {}),
      transitionDelay: `${index * 0.05}s`,
    }

    const conteudoBotao = (
      <ListItemButton
        selected={ativo}
        onClick={handleClick}
        role="menuitem"
        aria-label={`${item.rotulo} - ${ativo ? 'ativo' : 'navegar para'}`}
        sx={{
          ...styles.listItemButton,
          ...(ativo ? styles.active : styles.inactive),
        }}
        disableRipple={false}
      >
        <ListItemIcon sx={iconStyle}>{item.icone}</ListItemIcon>

        {aberta && (
          <ListItemText
            primary={item.rotulo}
            primaryTypographyProps={{
              style: styles.listItemText(ativo, isDashboard),
            }}
            sx={{
              opacity: aberta ? 1 : 0,
              transition: 'opacity 0.2s ease',
              whiteSpace: 'nowrap',
            }}
          />
        )}
      </ListItemButton>
    )

    if (aberta) return conteudoBotao

    return (
      <Tooltip
        title={item.rotulo}
        placement="right"
        arrow
        disableInteractive
        componentsProps={{ tooltip: { sx: styles.tooltip } }}
      >
        <Box sx={{ mx: 0.5 }}>{conteudoBotao}</Box>
      </Tooltip>
    )
  },
)

ItemBarraLateral.displayName = 'ItemBarraLateral'

// --- COMPONENTE PRINCIPAL ---
interface BarraLateralProps {
  aberta: boolean
}

const BarraLateral: React.FC<BarraLateralProps> = ({ aberta }) => {
  const theme = useTheme()
  const location = useLocation()
  const { usuario } = useAuth()

  const painelAtual = obterContextoPainel(usuario?.papel, location.pathname)
  const todosItens = useMemo(
    () => menusPorContexto[painelAtual] || [],
    [painelAtual],
  )

  const styles = useSidebarStyles(theme, theme.palette.mode as SidebarMode)

  const { dashboardItem, outrosItens } = useMemo(() => {
    const dash = todosItens[0] || null
    return { dashboardItem: dash, outrosItens: todosItens.slice(1) }
  }, [todosItens])

  // Se nenhum item "filho" está ativo, o dashboard vira o ativo do contexto
  const algumOutroAtivo = useAnyMenuActive(outrosItens)

  const renderItensAgrupados = useMemo(
    () =>
      outrosItens.map((item, index) => {
        const grupoAtual = item.grupo
        const grupoAnterior = index > 0 ? outrosItens[index - 1].grupo : null
        const mostrarHeader = aberta && grupoAtual && grupoAtual !== grupoAnterior
        const mostrarDivisorFechado =
          !aberta && grupoAtual !== grupoAnterior && index > 0

        return (
          <React.Fragment key={item.id}>
            {mostrarHeader && (
              <ListSubheader
                disableSticky
                sx={{
                  ...styles.subheader,
                  opacity: 1,
                  transitionDelay: `${(index + 1) * 0.1}s`,
                }}
              >
                {grupoAtual}
              </ListSubheader>
            )}
            {mostrarDivisorFechado && <Divider sx={styles.dividerClosed} />}
            <ItemBarraLateral
              item={item}
              aberta={aberta}
              isDashboard={false}
              index={index}
            />
          </React.Fragment>
        )
      }),
    [outrosItens, aberta, styles],
  )

  return (
    <List
      component="nav"
      role="navigation"
      aria-label="Navegação principal"
      sx={styles.list}
    >
      {/* DASHBOARD NO TOPO */}
      {dashboardItem && (
        <>
          <ItemBarraLateral
            item={dashboardItem}
            aberta={aberta}
            isDashboard={true}
            forceActive={!algumOutroAtivo}
          />
          {outrosItens.length > 0 && <Divider sx={styles.divider} />}
        </>
      )}

      {/* ITENS AGRUPADOS */}
      {renderItensAgrupados}
    </List>
  )
}

export default React.memo(BarraLateral)
