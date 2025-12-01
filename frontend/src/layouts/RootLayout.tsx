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

const RootLayout: React.FC = () => {
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
      {/* Passamos a função de toggle para o botão de hambúrguer funcionar */}
      <BarraSuperior alternarMenuLateral={handleDrawerToggle} />

      {/* Área de Navegação (Barra Lateral) 
        - No Desktop: Ocupa espaço físico (box)
        - No Mobile: É zero (overlay)
      */}
      <Box
        component="nav"
        sx={{ width: { md: LARGURA_DRAWER }, flexShrink: { md: 0 } }}
      >
        <BarraLateral
          // Lógica inteligente:
          // Se for mobile -> variant="temporary" (abre por cima)
          // Se for desktop -> variant="permanent" (sempre fixo na lateral)
          variante={isMobile ? 'temporary' : 'permanent'}
          
          // Se for mobile, obedece o estado 'mobileOpen'. 
          // Se for desktop, é sempre 'true' (aberto).
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
          // No desktop, definimos a largura subtraindo o menu para não vazar a tela horizontalmente
          width: { md: `calc(100% - ${LARGURA_DRAWER}px)` },
          bgcolor: theme.palette.background.default,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Toolbar vazia para empurrar o conteúdo para baixo da BarraSuperior fixa */}
        <Toolbar />
        
        {/* Renderiza as páginas filhas (Dashboard, Alunos, etc) */}
        <Box sx={{ width: '100%', mt: 2 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

export default RootLayout