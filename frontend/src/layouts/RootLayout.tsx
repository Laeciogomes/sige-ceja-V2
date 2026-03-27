// frontend/src/layouts/RootLayout.tsx
import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { 
  Box, 
  Toolbar, 
  useTheme, 
  useMediaQuery, 
  CssBaseline,
  Drawer
} from '@mui/material'

import BarraSuperior from '../componentes/layout/BarraSuperior'
import BarraLateral from '../componentes/layout/BarraLateral'

// Larguras do menu
const LARGURA_ABERTO = 260
const LARGURA_FECHADO = 72

export const RootLayout: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  // Mobile começa fechado (false), Desktop começa aberto (true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopOpen, setDesktopOpen] = useState(true)

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen)
    } else {
      setDesktopOpen(!desktopOpen)
    }
  }

  // Calcula a largura atual para empurrar o conteúdo principal
  const larguraAtual = isMobile 
    ? 0 
    : (desktopOpen ? LARGURA_ABERTO : LARGURA_FECHADO)

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Barra Superior */}
      <BarraSuperior alternarMenuLateral={handleDrawerToggle} />

      {/* Navegação (Nav) */}
      <Box
        component="nav"
        sx={{ 
          width: { md: larguraAtual }, 
          flexShrink: { md: 0 },
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        {/* Drawer Mobile (Temporário - abre por cima) */}
        {isMobile && (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }} // Melhor desempenho mobile
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: LARGURA_ABERTO // No mobile é sempre largura total quando abre
              },
            }}
          >
            <Toolbar /> 
            {/* No mobile, o menu está sempre "aberto" visualmente dentro do drawer */}
            <BarraLateral aberta={true} />
          </Drawer>
        )}

        {/* Drawer Desktop (Permanente - encolhe/estica) */}
        {!isMobile && (
          <Drawer
            variant="permanent"
            open={desktopOpen}
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: larguraAtual,
                overflowX: 'hidden', // Esconde scroll horizontal na transição
                borderRight: `1px solid ${theme.palette.divider}`,
                transition: theme.transitions.create('width', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
              },
            }}
          >
            <Toolbar />
            {/* Passa o estado para a BarraLateral esconder/mostrar textos */}
            <BarraLateral aberta={desktopOpen} />
          </Drawer>
        )}
      </Box>

      {/* Conteúdo Principal (Main) */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${larguraAtual}px)` },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        {/* Espaço para a AppBar fixa */}
        <Toolbar />
        
        {/* Onde as páginas são renderizadas */}
        <Box sx={{ width: '100%', mt: 2 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
