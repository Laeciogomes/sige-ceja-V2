// src/layouts/RootLayout.tsx
import React, { useState } from 'react'
import {
  AppBar,
  Avatar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'

import MenuIcon from '@mui/icons-material/Menu'
import DashboardIcon from '@mui/icons-material/Dashboard'
import SchoolIcon from '@mui/icons-material/School'
import PeopleIcon from '@mui/icons-material/People'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import AssessmentIcon from '@mui/icons-material/Assessment'
import SettingsIcon from '@mui/icons-material/Settings'
import DoorFrontIcon from '@mui/icons-material/DoorFront'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import LogoutIcon from '@mui/icons-material/Logout'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'

import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { useTema } from '../contextos/TemaContext'
import { useAuth } from '../contextos/AuthContext'
import { useSupabase } from '../contextos/SupabaseContext'

import logoCeja from '../assets/logo-ceja.png'

const drawerWidth = 260

type MenuItemConfig = {
  label: string
  path: string
  icon: React.ReactElement
}

const menuItens: MenuItemConfig[] = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { label: 'Secretaria', path: '/secretaria', icon: <SchoolIcon /> },
  { label: 'Professores', path: '/professores', icon: <PeopleIcon /> },
  { label: 'Coordenação', path: '/coordenacao', icon: <AccountTreeIcon /> },
  { label: 'Direção', path: '/direcao', icon: <AdminPanelSettingsIcon /> },
  { label: 'Administração', path: '/administracao', icon: <SettingsIcon /> },
  { label: 'Alunos', path: '/alunos', icon: <SchoolIcon /> },
  { label: 'Salas de Atendimento', path: '/salas', icon: <DoorFrontIcon /> },
  { label: 'Atendimentos', path: '/atendimentos', icon: <MeetingRoomIcon /> },
  { label: 'Relatórios', path: '/relatorios', icon: <AssessmentIcon /> },
  { label: 'Configurações', path: '/config', icon: <SettingsIcon /> },
]

type PerfilUsuario = {
  name: string | null
  foto_url: string | null
}

export const RootLayout: React.FC = () => {
  const theme = useTheme()
  const { modo, alternarModo } = useTema()
  const { usuario, logout } = useAuth()
  const { supabase } = useSupabase()
  const navigate = useNavigate()
  const location = useLocation()

  const [drawerOpen, setDrawerOpen] = useState(true)
  const [anchorAvatar, setAnchorAvatar] = useState<null | HTMLElement>(null)

  const ehDark = modo === 'dark'

  // Busca nome e foto do usuário na tabela public.usuarios
  const { data: perfil } = useQuery({
    queryKey: ['perfil-usuario', usuario?.id],
    enabled: !!usuario && !!supabase,
    queryFn: async () => {
      if (!usuario || !supabase) return null

      const { data, error } = await supabase
        .from('usuarios')
        .select('name, foto_url')
        .eq('id', usuario.id)
        .maybeSingle<PerfilUsuario>()

      if (error) {
        console.error('Erro ao carregar perfil de usuário:', error)
        return null
      }

      return data
    },
  })

  const handleToggleDrawer = () => {
    setDrawerOpen(open => !open)
  }

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorAvatar(event.currentTarget)
  }

  const handleAvatarClose = () => {
    setAnchorAvatar(null)
  }

  const handleLogout = async () => {
    handleAvatarClose()
    await logout()
    navigate('/login', { replace: true })
  }

  const handleIrParaPerfil = () => {
    handleAvatarClose()
    // Futuro: criar rota /perfil
    navigate('/perfil', { replace: false })
  }

  const handleIrParaConfiguracoes = () => {
    handleAvatarClose()
    navigate('/config', { replace: false })
  }

  const isRouteActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const nomeUsuario =
    perfil?.name || usuario?.email || 'Usuário'

  const inicialUsuario = nomeUsuario.charAt(0).toUpperCase()

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* APP BAR SUPERIOR */}
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          background:
            theme.palette.mode === 'light'
              ? 'linear-gradient(90deg, #F7941D 0%, #4CAF50 50%, #2e7d32 100%)'
              : 'linear-gradient(90deg, #263238 0%, #37474f 50%, #1b5e20 100%)',
        }}
      >
        <Toolbar
          sx={{
            minHeight: 64,
            px: { xs: 1.5, sm: 3 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* LADO ESQUERDO: Hambúrguer + logo + nome do sistema */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleToggleDrawer}
              sx={{ mr: 0.5 }}
            >
              <MenuIcon />
            </IconButton>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Box
                component="img"
                src={logoCeja}
                alt="Logo CEJA"
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  bgcolor: 'background.paper',
                  boxShadow: 1,
                  objectFit: 'cover',
                }}
              />
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    lineHeight: 1.1,
                    color: 'common.white',
                  }}
                >
                  SIGE-CEJA
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255,255,255,0.8)',
                    letterSpacing: 0.3,
                  }}
                >
                  Sistema de Gestão Escolar
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* LADO DIREITO: tema + avatar / menu do usuário */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Tooltip title={ehDark ? 'Modo claro' : 'Modo escuro'}>
              <IconButton
                aria-label="alternar tema claro/escuro"
                onClick={alternarModo}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.25)',
                  },
                }}
              >
                {ehDark ? (
                  <LightModeRoundedIcon fontSize="small" sx={{ color: '#FFEB3B' }} />
                ) : (
                  <DarkModeRoundedIcon fontSize="small" sx={{ color: 'white' }} />
                )}
              </IconButton>
            </Tooltip>

            <Tooltip title="Conta do usuário">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                }}
                onClick={handleAvatarClick}
              >
                <Typography
                  variant="body2"
                  sx={{
                    display: { xs: 'none', sm: 'block' },
                    maxWidth: 160,
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    color: 'common.white',
                    fontWeight: 500,
                  }}
                >
                  {nomeUsuario}
                </Typography>
                <Avatar
                  src={perfil?.foto_url || undefined}
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: 'background.paper',
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    boxShadow: 2,
                  }}
                >
                  {perfil?.foto_url ? null : inicialUsuario}
                </Avatar>
              </Box>
            </Tooltip>

            <Menu
              anchorEl={anchorAvatar}
              open={Boolean(anchorAvatar)}
              onClose={handleAvatarClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={handleIrParaPerfil}>
                <ListItemIcon>
                  <ManageAccountsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Editar perfil" />
              </MenuItem>
              <MenuItem onClick={handleIrParaConfiguracoes}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Configurações" />
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Sair" />
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* DRAWER LATERAL */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={drawerOpen}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <Toolbar /> {/* espaço para não ficar embaixo do AppBar */}
        <Divider />
        <List sx={{ py: 1 }}>
          {menuItens.map(item => (
            <ListItemButton
              key={item.path}
              selected={isRouteActive(item.path)}
              onClick={() => navigate(item.path)}
              sx={{
                px: 2.5,
                '&.Mui-selected': {
                  bgcolor: theme.palette.action.selected,
                  '&:hover': {
                    bgcolor: theme.palette.action.selected,
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      {/* CONTEÚDO PRINCIPAL */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          bgcolor: theme.palette.background.default,
          ml: drawerOpen ? `${drawerWidth}px` : 0,
          transition: theme.transitions.create(['margin-left'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar /> {/* espaço abaixo do AppBar */}
        <Box sx={{ p: 2.5, pb: 4 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

export default RootLayout
