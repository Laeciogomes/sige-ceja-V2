// frontend/src/layouts/RootLayout.tsx
import React, { useEffect, useState } from 'react'
import {
  Box,
  CssBaseline,
  Divider,
  Drawer,
  Toolbar,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { Outlet } from 'react-router-dom'

import BarraSuperior from '../componentes/layout/BarraSuperior'
import BarraLateral from '../componentes/layout/BarraLateral'

const LARGURA_MENU = 260
const LARGURA_MENU_RECOLHIDO = 72

export const RootLayout: React.FC = () => {
  const theme = useTheme()
  const telaPequena = useMediaQuery(theme.breakpoints.down('md'))

  // Em telas pequenas começa recolhido; em telas maiores, aberto
  const [menuAberto, setMenuAberto] = useState(!telaPequena)

  useEffect(() => {
    setMenuAberto(!telaPequena)
  }, [telaPequena])

  const alternarMenuLateral = () => {
    setMenuAberto((aberto) => !aberto)
  }

  const larguraMenu = menuAberto ? LARGURA_MENU : LARGURA_MENU_RECOLHIDO

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* Barra superior com logo, tema e usuário */}
      <BarraSuperior alternarMenuLateral={alternarMenuLateral} />

      {/* Menu lateral (abre/fecha, só ícones quando recolhido) */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={menuAberto}
        sx={{
          width: larguraMenu,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: larguraMenu,
            boxSizing: 'border-box',
            borderRight: `1px solid ${theme.palette.divider}`,
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.shortest,
            }),
          },
        }}
      >
        {/* Compensa a altura da AppBar */}
        <Toolbar />
        <Divider />
        <BarraLateral aberta={menuAberto} />
      </Drawer>

      {/* Conteúdo principal, colado ao menu e acompanhando expandir/recolher */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          bgcolor: theme.palette.background.default,
          ml: `${larguraMenu}px`,
          transition: theme.transitions.create(['margin-left'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.shortest,
          }),
        }}
      >
        {/* Compensa a AppBar */}
        <Toolbar />
        <Box sx={{ p: 2.5, pb: 4 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

export default RootLayout
