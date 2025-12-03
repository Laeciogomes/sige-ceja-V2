// frontend/src/componentes/layout/BarraSuperior.tsx
import React, { useState, useEffect } from 'react'
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
  Skeleton,
  Badge,
  Fade,
} from '@mui/material'

// Ícones
import MenuIcon from '@mui/icons-material/Menu'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'

// Contextos e Hooks
import { useTema } from '../../contextos/TemaContext'
import { useAuth } from '../../contextos/AuthContext'
import { useSupabase } from '../../contextos/SupabaseContext'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

// Assets
import logoCeja from '../../assets/imagens/logo-ceja.png'

// --- Tipagens ---
type BarraSuperiorProps = {
  alternarMenuLateral: () => void
}

type PerfilUsuario = {
  name: string | null
  username: string | null
  foto_url: string | null
  id_tipo_usuario: number | null
}

// --- Hook Personalizado para Dados (Separação de lógica) ---
const usePerfilUsuario = (usuario: any, supabase: any) => {
  return useQuery({
    queryKey: ['perfil-usuario', usuario?.id],
    enabled: !!usuario && !!supabase,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      if (!usuario || !supabase) return null
      const { data, error } = await supabase
        .from('usuarios')
        .select('name, username, foto_url, id_tipo_usuario')
        .eq('id', usuario.id)
        .maybeSingle()

      if (error) {
        console.error('Erro ao carregar perfil:', error)
        return null
      }
      return data as PerfilUsuario
    },
  })
}

// Mapeamento de tipo de usuário (para o subtítulo, ex.: Admin)
const mapTipoUsuario: Record<number, string> = {
  1: 'Diretor',
  2: 'Professor',
  3: 'Coordenador',
  4: 'Secretário',
  5: 'Aluno',
  6: 'Admin',
}

// Chave para o hint de login (usada junto com a LoginPage)
const LOGIN_HINT_KEY = 'sigeceja_login_hint'

const BarraSuperior: React.FC<BarraSuperiorProps> = ({ alternarMenuLateral }) => {
  const theme = useTheme()
  const navigate = useNavigate()

  // Contextos
  const { modo, alternarModo } = useTema()
  const { usuario, logout } = useAuth()
  const { supabase } = useSupabase()

  // Estados locais
  const [anchorAvatar, setAnchorAvatar] = useState<null | HTMLElement>(null)

  // Dados
  const { data: perfil, isLoading } = usePerfilUsuario(usuario, supabase)

  // Sincroniza foto/nome/username com o hint de login, respeitando o "Lembrar-me"
  useEffect(() => {
  console.log("DEBUG BarraSuperior → usuario:", usuario)
  console.log("DEBUG BarraSuperior → perfil:", perfil)

  if (!usuario?.email || !perfil) {
    console.log("DEBUG: sem usuário ou sem perfil, cancelando persistência.")
    return
  }

  try {
    const raw = localStorage.getItem(LOGIN_HINT_KEY)
    console.log("DEBUG → RAW localStorage:", raw)

    const prev = raw ? JSON.parse(raw) : {}

    if (!prev.rememberMe) {
      console.log("DEBUG: rememberMe = false, NÃO salvando foto.")
      return
    }

    const payload = {
      ...prev,
      email: usuario.email,
      foto_url: perfil.foto_url,
      name: perfil.name,
      username: perfil.username,
    }

    console.log("DEBUG → Salvando payload:", payload)

    localStorage.setItem(LOGIN_HINT_KEY, JSON.stringify(payload))
  } catch (error) {
    console.error('Erro ao atualizar hint de login:', error)
  }
}, [usuario?.email, perfil])


  const ehDark = modo === 'dark'
  const menuAberto = Boolean(anchorAvatar)

  // Lógica de exibição do nome
  const displayUsername = perfil?.username || perfil?.name || usuario?.email || 'Usuário'
  const nomeExibicao = displayUsername.split(' ')[0] // rótulo principal no "badge" verde
  const inicialUsuario = nomeExibicao.charAt(0).toUpperCase()
  const tipoUsuarioLabel =
    (perfil?.id_tipo_usuario && mapTipoUsuario[perfil.id_tipo_usuario]) || 'Admin'

  // Handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorAvatar(event.currentTarget)
  const handleMenuClose = () => setAnchorAvatar(null)

  const handleLogout = async () => {
    handleMenuClose()
    await logout()
    navigate('/login', { replace: true })
  }

  const handleNavigate = (path: string) => {
    handleMenuClose()
    navigate(path)
  }

  return (
    <>
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          borderRadius: 0,
          background:
            theme.palette.mode === 'light'
              ? 'linear-gradient(90deg, #F7941D 0%, #4CAF50 50%, #2e7d32 100%)'
              : 'linear-gradient(90deg, #263238 0%, #37474f 50%, #1b5e20 100%)',
          color: 'common.white',
          transition: 'all 0.3s ease',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', height: 70 }}>
          {/* --- ESQUERDA: Menu Hambúrguer + Marca --- */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={alternarMenuLateral}
              edge="start"
              sx={{
                color: 'common.white',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
              }}
            >
              <MenuIcon />
            </IconButton>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                cursor: 'pointer',
                userSelect: 'none',
              }}
              onClick={() => navigate('/')}
            >
              <Box
                component="img"
                src={logoCeja}
                alt="Logo CEJA"
                sx={{
                  height: 42,
                  width: 'auto',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.05)' },
                }}
              />
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{
                    fontWeight: 800,
                    lineHeight: 1,
                    letterSpacing: '-0.5px',
                    color: 'common.white',
                  }}
                >
                  SIGE-CEJA
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.8)',
                  }}
                >
                  Gestão Escolar Inteligente
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* --- DIREITA: Ações + Perfil --- */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Toggle Tema Animado */}
            <Tooltip title={`Mudar para tema ${ehDark ? 'claro' : 'escuro'}`}>
              <IconButton
                onClick={alternarModo}
                color="inherit"
                sx={{
                  transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: ehDark ? 'rotate(180deg)' : 'rotate(0deg)',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
                }}
              >
                {ehDark ? (
                  <LightModeRoundedIcon sx={{ color: '#FDD835' }} />
                ) : (
                  <DarkModeRoundedIcon sx={{ color: 'common.white' }} />
                )}
              </IconButton>
            </Tooltip>

            {/* Notificações (Mock visual) */}
            <Tooltip title="Notificações">
              <IconButton
                color="inherit"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
                }}
              >
                <Badge variant="dot" color="error">
                  <NotificationsNoneRoundedIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <Divider
              orientation="vertical"
              flexItem
              variant="middle"
              sx={{
                mx: 1,
                height: 24,
                alignSelf: 'center',
                bgcolor: 'rgba(255, 255, 255, 0.5)',
              }}
            />

            {/* Área do Usuário */}
            <Tooltip title="Gerenciar conta">
              <Box
                onClick={handleMenuOpen}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 0.5,
                  pl: 1.5,
                  pr: 1,
                  borderRadius: 50,
                  cursor: 'pointer',
                  border: `1px solid rgba(255, 255, 255, 0.4)`,
                  transition: 'all 0.2s',
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    borderColor: 'common.white',
                    boxShadow: '0 0 0 2px rgba(255,255,255,0.35)',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                {/* Texto com Skeleton Loading */}
                <Box
                  sx={{
                    display: { xs: 'none', sm: 'flex' },
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                  }}
                >
                  {isLoading ? (
                    <>
                      <Skeleton
                        width={80}
                        height={20}
                        variant="text"
                        sx={{ bgcolor: 'rgba(255,255,255,0.4)' }}
                      />
                      <Skeleton
                        width={50}
                        height={15}
                        variant="text"
                        sx={{ bgcolor: 'rgba(255,255,255,0.3)' }}
                      />
                    </>
                  ) : (
                    <>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          lineHeight: 1.2,
                          color: 'common.white',
                        }}
                        noWrap
                      >
                        {nomeExibicao}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          lineHeight: 1,
                          color: 'rgba(255,255,255,0.8)',
                        }}
                        noWrap
                      >
                        {tipoUsuarioLabel}
                      </Typography>
                    </>
                  )}
                </Box>

                {/* Avatar com Status Online */}
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                  sx={{
                    '& .MuiBadge-badge': {
                      backgroundColor: '#44b700',
                      color: '#44b700',
                      boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
                      '&::after': {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        animation: 'ripple 1.2s infinite ease-in-out',
                        border: '1px solid currentColor',
                        content: '""',
                      },
                    },
                    '@keyframes ripple': {
                      '0%': { transform: 'scale(.8)', opacity: 1 },
                      '100%': { transform: 'scale(2.4)', opacity: 0 },
                    },
                  }}
                >
                  <Avatar
                    src={perfil?.foto_url || undefined}
                    alt={nomeExibicao}
                    sx={{
                      width: 38,
                      height: 38,
                      border: `2px solid ${theme.palette.background.paper}`,
                    }}
                  >
                    {inicialUsuario}
                  </Avatar>
                </Badge>

                <KeyboardArrowDownIcon
                  fontSize="small"
                  sx={{
                    transition: 'transform 0.2s',
                    transform: menuAberto ? 'rotate(180deg)' : 'rotate(0deg)',
                    color: 'common.white',
                  }}
                />
              </Box>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Menu Dropdown */}
      <Menu
        anchorEl={anchorAvatar}
        open={menuAberto}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        TransitionComponent={Fade}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
            mt: 1.5,
            minWidth: 220,
            borderRadius: 2,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 24,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" noWrap>
            Logado como
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {displayUsername}
          </Typography>
        </Box>
        <Divider />
        <MenuItem
          onClick={() => handleNavigate('/perfil')}
          sx={{
            py: 1.5,
            '&:hover': {
              bgcolor: theme.palette.action.hover,
            },
          }}
        >
          <ListItemIcon>
            <ManageAccountsIcon fontSize="small" />
          </ListItemIcon>
          Editar Perfil
        </MenuItem>
        <MenuItem
          onClick={() => handleNavigate('/config')}
          sx={{
            py: 1.5,
            '&:hover': {
              bgcolor: theme.palette.action.hover,
            },
          }}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Configurações
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={handleLogout}
          sx={{
            py: 1.5,
            color: 'error.main',
            '&:hover': {
              bgcolor: 'rgba(244, 67, 54, 0.12)',
            },
          }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Sair do Sistema" />
        </MenuItem>
      </Menu>
    </>
  )
}

export default BarraSuperior
