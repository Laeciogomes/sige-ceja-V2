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

  // Carrega e-mail lembrado
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOGIN_HINT_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as { email?: string; rememberMe?: boolean }
      if (parsed.email) setEmail(parsed.email)
      if (typeof parsed.rememberMe === 'boolean') setRememberMe(parsed.rememberMe)
    } catch {
      // ignora erro
    }
  }, [])

  // Salva e-mail / lembrar usuário
  useEffect(() => {
    try {
      localStorage.setItem(
        LOGIN_HINT_KEY,
        JSON.stringify({ email, rememberMe }),
      )
    } catch {
      // ignora
    }
  }, [email, rememberMe])

  const handleClickShowPassword = () => {
    setShowPassword(show => !show)
  }

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (loading) return

    setErro(null)
    setLoading(true)

    try {
      const emailTrim = email.trim()

      if (!emailTrim || !senha) {
        const msg = 'Informe e-mail e senha para continuar.'
        setErro(msg)
        toastErro(msg, 'Campos obrigatórios', 5000)
        return
      }

      await login(emailTrim, senha, rememberMe)

      toastSucesso('Login realizado com sucesso.', 'Bem-vindo(a) ao SIGE-CEJA', 3000)
      navigate('/', { replace: true })
    } catch (e: any) {
      const msg =
        (e && typeof e === 'object' && 'message' in e && (e as any).message) ||
        'Não foi possível realizar o login. Verifique suas credenciais ou tente novamente.'

      const mensagem = String(msg)
      setErro(mensagem)
      toastErro(mensagem, 'Falha no login', 6000)

      // Log detalhado no console para debug
      // eslint-disable-next-line no-console
      console.error('[LoginPage] Erro ao efetuar login:', e)
    } finally {
      setLoading(false)
    }
  }

  // Futuro: URL da foto de perfil quando o "lembrar usuário" tiver imagem
  const rememberedUserImageUrl: string | null = null
  const mostrarNomeUsuario = rememberMe && !!email.trim()

  return (
    <AuthLayout>
      {/* Wrapper interno para controlar melhor o espaçamento vertical */}
      <Box
        sx={{
          width: '100%',
          py: { xs: 2, md: 3 },
        }}
      >
        {/* Cabeçalho do card direito (avatar + título + toggle de tema) */}
        <Box
          sx={{
            textAlign: 'center',
            mt: { xs: 0.5, md: 1.5 },
            mb: 2.5,
          }}
        >
          <Box
            sx={{
              mb: 1.5,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.75,
            }}
          >
            <Avatar
              sx={{
                width: 76,
                height: 76,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                boxShadow: 4,
                border: theme => `4px solid ${theme.palette.background.paper}`,
              }}
              src={rememberedUserImageUrl || undefined}
            >
              {!rememberedUserImageUrl && <PersonIcon sx={{ fontSize: 34 }} />}
            </Avatar>
            {mostrarNomeUsuario && (
              <Typography variant="body2" color="text.secondary" noWrap>
                {email}
              </Typography>
            )}
          </Box>

          {/* Linha com título + ícone de tema bem visível */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.25,
              mb: 0.25,
            }}
          >
            <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold' }}>
              Acessar o sistema
            </Typography>

            <Tooltip title={ehDark ? 'Modo claro' : 'Modo escuro'}>
              <IconButton
                aria-label="alternar tema claro/escuro"
                onClick={alternarModo}
                size="medium"
                sx={{
                  bgcolor: 'action.hover',
                  borderRadius: 999,
                  '&:hover': {
                    bgcolor: 'action.selected',
                  },
                }}
              >
                {ehDark ? (
                  <LightModeRoundedIcon fontSize="small" color="warning" />
                ) : (
                  <DarkModeRoundedIcon fontSize="small" color="primary" />
                )}
              </IconButton>
            </Tooltip>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 380, mx: 'auto' }}
          >
            Utilize suas credenciais institucionais para entrar no SIGE-CEJA.
          </Typography>
        </Box>

        {/* Formulário */}
        <Box
          component="form"
          noValidate
          onSubmit={handleSubmit}
          sx={{ mt: 0.5 }}
        >
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Endereço de e-mail"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={e => setEmail(e.target.value)}
            error={!!erro}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MailOutlineIcon color="action" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Senha"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            error={!!erro}
            helperText={erro || ' '}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <KeyOutlinedIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="alternar visibilidade da senha"
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box
            sx={{
              mt: 0.5,
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  color="primary"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                />
              }
              label="Lembrar usuário"
            />

            <Link
              href="#"
              variant="body2"
              sx={{ fontSize: 13 }}
              onClick={e => {
                e.preventDefault()
                setModalRecuperarAberta(true)
              }}
            >
              Esqueceu a senha?
            </Link>
          </Box>

          <Button
            type="submit"
            fullWidth
            disabled={loading}
            variant="contained"
            startIcon={!loading ? <LoginIcon /> : undefined}
            sx={{
              mt: 2,
              mb: 1.5,
              py: 1.1,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={18} />
                <span>Entrando...</span>
              </Box>
            ) : (
              'Entrar'
            )}
          </Button>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', textAlign: 'center' }}
          >
            Acesso restrito a usuários autorizados.
          </Typography>
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
