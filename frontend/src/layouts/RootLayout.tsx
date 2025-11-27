import React from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Box,
  Button,
} from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import { useAuth } from '../contextos/AuthContext'

type MenuItem = {
  label: string
  path: string
}

const menuItens: MenuItem[] = [
  { label: 'Dashboard', path: '/' },
  { label: 'Secretaria', path: '/secretaria' },
  { label: 'Professores', path: '/professores' },
  { label: 'Coordenação', path: '/coordenacao' },
  { label: 'Direção', path: '/direcao' },
  { label: 'Administração', path: '/administracao' },
  { label: 'Alunos', path: '/alunos' },
  { label: 'Salas de Atendimento', path: '/salas' },
  { label: 'Atendimentos', path: '/atendimentos' },
  { label: 'Relatórios', path: '/relatorios' },
  { label: 'Configurações', path: '/config' },
]

const drawerWidth = 260

export const RootLayout: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      // limpa rota e volta para o login
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('Erro ao sair:', err)
    }
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            SIGE-CEJA
          </Typography>

          {/* empurra o botão para a direita */}
          <Box sx={{ flexGrow: 1 }} />

          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ textTransform: 'none', fontWeight: 500 }}
          >
            Sair
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItens.map((item) => (
              <ListItemButton
                key={item.path}
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          ml: { xs: 0, md: `${drawerWidth}px` },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  )
}
