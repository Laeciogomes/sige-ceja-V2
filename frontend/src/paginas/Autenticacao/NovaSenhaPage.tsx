// src/paginas/Autenticacao/NovaSenhaPage.tsx
import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import LockResetIcon from '@mui/icons-material/LockReset'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import { useNavigate } from 'react-router-dom'

import AuthLayout from '../../componentes/layout/AuthLayout'
import { useSupabase } from '../../contextos/SupabaseContext'
import { useNotificacao } from '../../hooks/useNotificacao'
import { useTema } from '../../contextos/TemaContext'

const NovaSenhaPage: React.FC = () => {
  const { supabase } = useSupabase()
  const { sucesso: toastSucesso, erro: toastErro, info: toastInfo } =
    useNotificacao()
  const { modo, alternarModo } = useTema()
  const ehDark = modo === 'dark'
  const navigate = useNavigate()

  const [senha, setSenha] = useState('')
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('')
  const [mostrandoSenha, setMostrandoSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [tokenValido, setTokenValido] = useState(false)

  useEffect(() => {
    const url = new URL(window.location.href)
    const tokenHash = url.hash

    if (!tokenHash.includes('access_token')) {
      setMensagem(
        'Link inválido ou expirado. Solicite uma nova redefinição de senha.',
      )
      setTokenValido(false)
      return
    }

    setTokenValido(true)
    setMensagem(
      'Informe e confirme sua nova senha para concluir a redefinição.',
    )
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault()
  setMensagem(null)

  if (!tokenValido) {
    toastErro(
      'Link inválido ou expirado.',
      'Solicite uma nova redefinição de senha.',
    )
    return
  }

  if (!senha || !confirmacaoSenha) {
    const msg = 'Preencha os campos de nova senha e confirmação.'
    setMensagem(msg)
    toastErro(msg, 'Campos obrigatórios', 5000)
    return
  }

  if (senha !== confirmacaoSenha) {
    const msg = 'As senhas não conferem. Verifique e tente novamente.'
    setMensagem(msg)
    toastErro(msg, 'Senhas diferentes', 5000)
    return
  }

  if (senha.length < 6) {
    const msg = 'A senha deve ter pelo menos 6 caracteres.'
    setMensagem(msg)
    toastErro(msg, 'Senha muito curta', 5000)
    return
  }

  // 🔴 Aqui garantimos para o TypeScript que supabase não é nulo
  if (!supabase) {
    const msg =
      'Sessão inválida. Não foi possível acessar o serviço de autenticação.'
    setMensagem(msg)
    toastErro(msg, 'Sessão inválida', 5000)
    return
  }

  try {
    setCarregando(true)

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      setMensagem(
        'Sessão de redefinição não encontrada. Abra novamente o link enviado por e-mail.',
      )
      toastErro(
        'Sessão de redefinição expirada ou inválida.',
        'Tente abrir novamente o link enviado por e-mail.',
      )
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: senha,
    })

    if (updateError) {
      console.error('Erro ao atualizar senha:', updateError)
      setMensagem(
        updateError.message ||
          'Não foi possível atualizar a senha. Tente novamente mais tarde.',
      )
      toastErro(
        updateError.message ||
          'Não foi possível atualizar a senha. Tente novamente mais tarde.',
        'Erro ao atualizar senha',
      )
      return
    }

    toastSucesso(
      'Senha atualizada com sucesso.',
      'Você já pode entrar com sua nova senha.',
      6000,
    )

    navigate('/login', { replace: true })
  } catch (error: any) {
    console.error('Erro inesperado ao redefinir senha:', error)
    const msg =
      error?.message ||
      'Ocorreu um erro inesperado ao tentar redefinir sua senha.'
    setMensagem(msg)
    toastErro(msg, 'Erro inesperado', 6000)
  } finally {
    setCarregando(false)
  }
}


  const handleClickMostrarSenha = () => {
    setMostrandoSenha(prev => !prev)
  }

  const handleMouseDownSenha = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
  }

  const desabilitado = carregando || !tokenValido

  return (
    <AuthLayout>
      <Box
        sx={{
          width: '100%',
          maxWidth: 480,
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

        <Box sx={{ textAlign: 'center', mb: 3, position: 'relative', zIndex: 1 }}>
          <LockResetIcon
            sx={{ fontSize: 40, color: 'primary.main', mb: 1.5 }}
          />
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
            Definir nova senha
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Crie uma nova senha para sua conta. Ela será usada para acessar o
            SIGE-CEJA.
          </Typography>
        </Box>

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
            name="senha"
            label="Nova senha"
            type={mostrandoSenha ? 'text' : 'password'}
            id="senha"
            autoComplete="new-password"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            disabled={desabilitado}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="mostrar ou ocultar senha"
                    onClick={handleClickMostrarSenha}
                    onMouseDown={handleMouseDownSenha}
                    edge="end"
                  >
                    {mostrandoSenha ? (
                      <VisibilityOff fontSize="small" />
                    ) : (
                      <Visibility fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmacaoSenha"
            label="Confirmar nova senha"
            type={mostrandoSenha ? 'text' : 'password'}
            id="confirmacaoSenha"
            autoComplete="new-password"
            value={confirmacaoSenha}
            onChange={e => setConfirmacaoSenha(e.target.value)}
            disabled={desabilitado}
          />

          {mensagem && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1, mb: 1, textAlign: 'center' }}
            >
              {mensagem}
            </Typography>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={desabilitado}
            startIcon={
              carregando ? (
                <CircularProgress color="inherit" size={18} />
              ) : (
                <LockResetIcon />
              )
            }
            sx={{
              mt: 2,
              mb: 1,
              py: 1.2,
              fontWeight: 700,
              textTransform: 'none',
            }}
          >
            {carregando ? 'Atualizando senha...' : 'Atualizar senha'}
          </Button>

          <Button
            fullWidth
            variant="text"
            sx={{ mt: 0.5, textTransform: 'none' }}
            onClick={() => {
              toastInfo('Você será redirecionado para a tela de login.')
              navigate('/login')
            }}
          >
            Voltar para o login
          </Button>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', textAlign: 'center' }}
          >
            Por segurança, escolha uma senha forte e não a compartilhe com
            ninguém.
          </Typography>
        </Box>
      </Box>
    </AuthLayout>
  )
}

export default NovaSenhaPage
export { NovaSenhaPage }
