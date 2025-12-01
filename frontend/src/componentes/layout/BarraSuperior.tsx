// frontend/src/componentes/layout/BarraSuperior.tsx
import React from 'react'
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  IconButton,
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
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'

import { useTema } from '../../contextos/TemaContext'
import { useAuth } from '../../contextos/AuthContext'
import { useSupabase } from '../../contextos/SupabaseContext'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

type BarraSuperiorProps = {
  alternarMenuLateral: () => void
}

type PerfilUsuario = {
  name: string | null
  foto_url: string | null
}

const BarraSuperior: React.FC<BarraSuperiorProps> = ({ alternarMenuLateral }) => {
  const theme = useTheme()
  const { modo, alternarModo } = useTema()
  const { usuario, logout } = useAuth()
  const { supabase } = useSupabase()
  const navigate = useNavigate()

  const [anchorAvatar, setAnchorAvatar] = React.useState<null | HTMLElement>(
    null
  )

  const ehDark = modo === 'dark'

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

  const nomeUsuario = perfil?.name || 'Usuário'
  const inicialUsuario = nomeUsuario.charAt(0).toUpperCase()

  const aoClicarAvatar = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorAvatar(event.currentTarget)
  }

  const fecharMenuUsuario = () => {
    setAnchorAvatar(null)
  }

  const sair = async () => {
    fecharMenuUsuario()
    await logout()
    navigate('/login', { replace: true })
  }

  const irParaPerfil = () => {
    fecharMenuUsuario()
    navigate('/perfil')
  }

  const irParaConfiguracoes = () => {
    fecharMenuUsuario()
    navigate('/config')
  }

  return (
    <>
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
          {/* Lado esquerdo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={alternarMenuLateral}
              sx={{ mr: 0.5 }}
            >
              <MenuIcon />
            </IconButton>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                src="/logo-ceja.png"
                alt="Logo CEJA"
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.9)',
                  boxShadow: 2,
                }}
              >
                LOGO
              </Avatar>

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
                    color: 'rgba(255,255,255,0.85)',
                    letterSpacing: 0.3,
                  }}
                >
                  Sistema de Gestão Escolar
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Lado direito: tema + FOTO + NOME */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Tooltip title={ehDark ? 'Tema claro' : 'Tema escuro'}>
              <IconButton
                onClick={alternarModo}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.25)',
                  },
                }}
              >
                {ehDark ? (
                  <LightModeRoundedIcon
                    fontSize="small"
                    sx={{ color: '#FFEB3B' }}
                  />
                ) : (
                  <DarkModeRoundedIcon
                    fontSize="small"
                    sx={{ color: 'white' }}
                  />
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
                onClick={aoClicarAvatar}
              >
                {/* Primeiro a foto */}
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

                {/* Depois apenas o NOME (sem e-mail) */}
                <Typography
                  variant="body2"
                  sx={{
                    display: { xs: 'none', sm: 'block' },
                    maxWidth: 200,
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    color: 'common.white',
                    fontWeight: 500,
                  }}
                >
                  {nomeUsuario}
                </Typography>
              </Box>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Menu do usuário */}
      <Menu
        anchorEl={anchorAvatar}
        open={Boolean(anchorAvatar)}
        onClose={fecharMenuUsuario}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={irParaPerfil}>
          <ListItemIcon>
            <ManageAccountsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Editar perfil" />
        </MenuItem>
        <MenuItem onClick={irParaConfiguracoes}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Configurações" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={sair}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Sair" />
        </MenuItem>
      </Menu>
    </>
  )
}

export default BarraSuperior
