// frontend/src/layouts/RootLayout.tsx
import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { 
  Box, 
  Toolbar, 
  useTheme, 
  useMediaQuery, 
  CssBaseline 
} from '@mui/material'

import BarraSuperior from '../componentes/layout/BarraSuperior'
import BarraLateral from '../componentes/layout/BarraLateral'

// Define a largura do menu para cálculo do layout
const LARGURA_DRAWER = 280 

// ALTERAÇÃO AQUI: Adicionado 'export' antes de const e removido o export default do final
export const RootLayout: React.FC = () => {
  const theme = useTheme()
  // Detecta se a tela é menor que 'md' (tablet/celular)
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  // Estado para controlar se o menu mobile está aberto
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Barra Superior */}
      <BarraSuperior alternarMenuLateral={handleDrawerToggle} />

      {/* Área de Navegação (Barra Lateral) */}
      <Box
        component="nav"
        sx={{ width: { md: LARGURA_DRAWER }, flexShrink: { md: 0 } }}
      >
        <BarraLateral
          variante={isMobile ? 'temporary' : 'permanent'}
          aberto={isMobile ? mobileOpen : true}
          fechar={handleDrawerToggle}
          largura={LARGURA_DRAWER}
        />
      </Box>

      {/* Conteúdo Principal (Main) */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${LARGURA_DRAWER}px)` },
          bgcolor: theme.palette.background.default,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Toolbar />
        
        <Box sx={{ width: '100%', mt: 2 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
// Removida a linha 'export default RootLayout'