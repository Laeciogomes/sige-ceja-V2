// frontend/src/paginas/Autenticacao/LoginPage.tsx
import React, { useEffect, useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  Tooltip,
  TextField,
  Typography,
} from '@mui/material'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import LoginIcon from '@mui/icons-material/Login'
import PersonIcon from '@mui/icons-material/Person'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../contextos/AuthContext'
import AuthLayout from '../../componentes/layout/AuthLayout'
import { useNotificacao } from '../../hooks/useNotificacao'
import { useTema } from '../../contextos/TemaContext'
import { SolicitarNovaSenhaModal } from '../../componentes/autenticacao/SolicitarNovaSenhaModal'

const LOGIN_HINT_KEY = 'sigeceja_login_hint'

type LoginHint = {
  email?: string
  rememberMe?: boolean
  foto_url?: string | null
  photoUrl?: string | null
  name?: string | null
  username?: string | null
}

const LoginPage: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const {
    sucesso: toastSucesso,
    erro: toastErro,
  } = useNotificacao()
  const { modo, alternarModo } = useTema()
  const ehDark = modo === 'dark'

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [modalRecuperarAberta, setModalRecuperarAberta] = useState(false)

  const [fotoUrlLembrada, setFotoUrlLembrada] = useState<string | null>(null)
  const [nomeLembrado, setNomeLembrado] = useState<string | null>(null)
  const [hintCarregado, setHintCarregado] = useState(false)

  // 1) Carrega e-mail / rememberMe / foto / nome lembrados
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOGIN_HINT_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as LoginHint

        if (parsed.email) setEmail(parsed.email)
        if (typeof parsed.rememberMe === 'boolean') setRememberMe(parsed.rememberMe)

        const foto = (parsed.photoUrl ?? parsed.foto_url) || null
        setFotoUrlLembrada(foto)
        setNomeLembrado(parsed.name ?? parsed.username ?? null)
      }
    } finally {
      setHintCarregado(true)
    }
  }, [])

  // 2) Salva e-mail / rememberMe sem apagar foto/nome já existentes
  useEffect(() => {
    if (!hintCarregado) return

    try {
      const raw = localStorage.getItem(LOGIN_HINT_KEY)
      const prev: LoginHint = raw ? JSON.parse(raw) : {}

      const payload: LoginHint = {
        ...prev,
        email,
        rememberMe,
      }

      localStorage.setItem(LOGIN_HINT_KEY, JSON.stringify(payload))
    } catch {
      // silencioso
    }
  }, [hintCarregado, email, rememberMe])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErro(null)

    const emailTrim = email.trim()

    if (!emailTrim || !senha) {
      const msg = 'Informe e-mail e senha para continuar.'
      setErro(msg)
      toastErro(msg, 'Campos obrigatórios', 5000)
      return
    }

    setLoading(true)
    try {
      await login(emailTrim, senha, rememberMe)
      toastSucesso('Login efetuado com sucesso.', 'Bem-vindo(a)!', 3000)
      navigate('/')
    } catch (error: any) {
      const mensagemErro =
        error?.message ||
        'Não foi possível entrar. Verifique seus dados e tente novamente.'

      setErro(mensagemErro)
      toastErro(mensagemErro, 'Falha no login', 8000)
    } finally {
      setLoading(false)
    }
  }

  const handleClickMostrarSenha = () => {
    setShowPassword(prev => !prev)
  }

  const handleMouseDownSenha = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
  }

  const handleClickEsqueceuSenha = (
    event: React.MouseEvent<HTMLAnchorElement>,
  ) => {
    event.preventDefault()
    setModalRecuperarAberta(true)
  }

  const desabilitado = loading

  const primeiraParteNome =
    nomeLembrado && nomeLembrado.trim().length > 0
      ? nomeLembrado.split(' ')[0]
      : 'Usuário'

  // Só mostra foto se houver URL E se "Lembrar de mim" estiver marcado
  const deveMostrarFoto = !!fotoUrlLembrada && rememberMe

  return (
    <AuthLayout>
      <Box
        sx={{
          width: '100%',
          maxWidth: 420,
          mx: 'auto',
          bgcolor: theme =>
            theme.palette.mode === 'dark'
              ? 'background.paper'
              : 'rgba(255,255,255,0.95)',
          borderRadius: 3,
          boxShadow: theme =>
            theme.palette.mode === 'dark'
              ? '0 16px 45px rgba(0,0,0,0.8)'
              : '0 16px 45px rgba(0,0,0,0.12)',
          p: 4,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Botão de tema no canto */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 2,
          }}
        >
          <Tooltip
            title={
              ehDark ? 'Alternar para tema claro' : 'Alternar para tema escuro'
            }
          >
            <IconButton
              size="small"
              onClick={alternarModo}
              sx={{
                bgcolor: theme =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.02)',
              }}
            >
              {ehDark ? (
                <LightModeRoundedIcon fontSize="small" />
              ) : (
                <DarkModeRoundedIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Avatar + título */}
        <Box sx={{ textAlign: 'center', mb: 3, position: 'relative', zIndex: 1 }}>
          <Avatar
            src={deveMostrarFoto ? fotoUrlLembrada ?? undefined : undefined}
            alt={deveMostrarFoto ? primeiraParteNome : 'Usuário'}
            sx={{
              bgcolor: deveMostrarFoto ? 'transparent' : 'primary.main',
              width: 64,
              height: 64,
              mx: 'auto',
              mb: 1.5,
              boxShadow: deveMostrarFoto
                ? '0 0 0 3px rgba(76, 175, 80, 0.55)'
                : 'none',
            }}
          >
            {!deveMostrarFoto && <PersonIcon sx={{ fontSize: 30 }} />}
          </Avatar>

          <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
            Entrar no SIGE-CEJA
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Acesse com seu e-mail institucional e senha.
          </Typography>
        </Box>

        {/* Formulário */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{ position: 'relative', zIndex: 1 }}
        >
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="E-mail"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={desabilitado}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MailOutlineIcon
                    fontSize="small"
                    color={deveMostrarFoto ? 'primary' : 'action'}
                  />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            name="senha"
            label="Senha"
            type={showPassword ? 'text' : 'password'}
            id="senha"
            autoComplete="current-password"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            disabled={desabilitado}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <KeyOutlinedIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="mostrar ou ocultar senha"
                    onClick={handleClickMostrarSenha}
                    onMouseDown={handleMouseDownSenha}
                    edge="end"
                  >
                    {showPassword ? (
                      <VisibilityOff fontSize="small" />
                    ) : (
                      <Visibility fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 1,
              mb: 2,
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  color="primary"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  disabled={desabilitado}
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  Lembrar de mim neste dispositivo
                </Typography>
              }
            />

            <Link
              href="#"
              onClick={handleClickEsqueceuSenha}
              variant="body2"
              underline="hover"
              sx={{ fontWeight: 500 }}
            >
              Esqueceu a senha?
            </Link>
          </Box>

          {erro && (
            <Typography
              variant="body2"
              color="error"
              sx={{ mt: 1, mb: 1, textAlign: 'center' }}
            >
              {erro}
            </Typography>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={desabilitado}
            startIcon={
              loading ? <CircularProgress size={18} color="inherit" /> : <LoginIcon />
            }
            sx={{
              mt: 1,
              mb: 2,
              py: 1.2,
              fontWeight: 700,
              textTransform: 'none',
            }}
          >
            {desabilitado ? 'Entrando...' : 'Entrar'}
          </Button>
        </Box>
      </Box>

      {/* Modal de solicitação de nova senha */}
      <SolicitarNovaSenhaModal
        open={modalRecuperarAberta}
        onClose={() => setModalRecuperarAberta(false)}
        emailInicial={email}
      />
    </AuthLayout>
  )
}

export default LoginPage
export { LoginPage }
