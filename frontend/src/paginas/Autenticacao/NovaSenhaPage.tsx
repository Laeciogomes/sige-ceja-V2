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
  const { sucesso, erro } = useNotificacao()
  const { modo, alternarModo } = useTema()
  const navigate = useNavigate()

  const ehDark = modo === 'dark'

  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [mostrarSenha1, setMostrarSenha1] = useState(false)
  const [mostrarSenha2, setMostrarSenha2] = useState(false)
  const [loading, setLoading] = useState(false)

  // Controle da sessão de recuperação
  const [checandoSessao, setChecandoSessao] = useState(true)
  const [sessaoPronta, setSessaoPronta] = useState(false)

  useEffect(() => {
    console.log('NovaSenhaPage montada – rota /nova-senha ativa')
    console.log('URL atual:', window.location.href)
  }, [])

  useEffect(() => {
    const prepararSessaoRecuperacao = async () => {
      if (!supabase) {
        erro(
          'Serviço de autenticação indisponível no momento.',
          'Falha interna',
          8000,
        )
        setChecandoSessao(false)
        return
      }

      try {
        // 1) Já tem sessão ativa?
        const { data: sessaoData } = await supabase.auth.getSession()
        if (sessaoData.session) {
          setSessaoPronta(true)
          return
        }

        // 2) Recupera tokens do hash da URL (#access_token=...&refresh_token=...)
        const hash = window.location.hash.startsWith('#')
          ? window.location.hash.substring(1)
          : window.location.hash

        const params = new URLSearchParams(hash)
        const access_token = params.get('access_token')
        const refresh_token = params.get('refresh_token')

        if (!access_token || !refresh_token) {
          console.error('Tokens de recuperação ausentes no hash:', hash)
          erro(
            'Link de redefinição inválido ou expirado. Solicite um novo link de recuperação.',
            'Link inválido',
            9000,
          )
          return
        }

        // 3) Força a sessão no Supabase
        const { error: erroSessao } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        })

        if (erroSessao) {
          console.error('Erro ao ativar sessão de recuperação:', erroSessao)
          erro(
            'Não foi possível validar o link de redefinição. Solicite um novo link.',
            'Sessão inválida',
            9000,
          )
          return
        }

        // 4) Limpa o hash da URL (remove access_token/refresh_token da barra)
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname + window.location.search,
        )

        setSessaoPronta(true)
      } catch (e) {
        console.error('Exceção ao preparar sessão de recuperação:', e)
        erro(
          'Ocorreu um erro ao preparar a redefinição de senha. Gere um novo link e tente novamente.',
          'Erro na sessão de recuperação',
          9000,
        )
      } finally {
        setChecandoSessao(false)
      }
    }

    prepararSessaoRecuperacao()
  }, [supabase, erro])

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    // Evita submit enquanto ainda valida o link ou já está processando
    if (checandoSessao || loading) return

    const s1 = senha.trim()
    const s2 = confirmacao.trim()

    if (!s1 || !s2) {
      erro('Preencha os dois campos de senha.', 'Campos obrigatórios', 6000)
      return
    }

    if (s1.length < 8) {
      erro(
        'A nova senha deve ter pelo menos 8 caracteres.',
        'Senha muito curta',
        6000,
      )
      return
    }

    if (s1 !== s2) {
      erro('As senhas informadas não coincidem.', 'Confirmação incorreta', 6000)
      return
    }

    if (!supabase) {
      erro(
        'Serviço de autenticação indisponível no momento.',
        'Falha interna',
        7000,
      )
      return
    }

    if (!sessaoPronta) {
      erro(
        'A sessão de recuperação não está ativa. Abra novamente o link enviado para seu e-mail ou solicite um novo.',
        'Sessão ausente',
        9000,
      )
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password: s1 })

      if (error) {
        console.error('Erro ao atualizar senha:', error)
        erro(
          'Não foi possível atualizar a senha. Tente novamente com o mesmo link ou gere um novo.',
          'Erro ao redefinir senha',
          8000,
        )
        return
      }

      sucesso('Senha atualizada com sucesso.', 'Senha redefinida', 5000)
      navigate('/login', { replace: true })
    } catch (e) {
      console.error('Exceção ao atualizar senha:', e)
      erro(
        'Ocorreu um erro inesperado ao atualizar a senha.',
        'Erro inesperado',
        8000,
      )
    } finally {
      setLoading(false)
    }
  }

  const carregandoGeral = checandoSessao || loading

  return (
    <AuthLayout>
      <Box
        sx={{
          width: '100%',
          py: { xs: 2, md: 3 },
        }}
      >
        {/* Cabeçalho */}
        <Box sx={{ mb: 2.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <LockResetIcon color="primary" sx={{ fontSize: 32 }} />
              <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold' }}>
                Definir nova senha
              </Typography>
            </Box>

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
            Crie uma nova senha para acessar o SIGE-CEJA. Após salvar, você será
            redirecionado para a tela de login.
          </Typography>
        </Box>

        {/* Validação do link de redefinição */}
        {checandoSessao ? (
          <Box
            sx={{
              mt: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Validando link de redefinição de senha...
            </Typography>
          </Box>
        ) : (
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
              name="nova-senha"
              label="Nova senha"
              type={mostrarSenha1 ? 'text' : 'password'}
              id="nova-senha"
              autoComplete="new-password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="alternar visibilidade da nova senha"
                      onClick={() => setMostrarSenha1(v => !v)}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {mostrarSenha1 ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmacao-senha"
              label="Confirmar nova senha"
              type={mostrarSenha2 ? 'text' : 'password'}
              id="confirmacao-senha"
              autoComplete="new-password"
              value={confirmacao}
              onChange={e => setConfirmacao(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="alternar visibilidade da confirmação de senha"
                      onClick={() => setMostrarSenha2(v => !v)}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {mostrarSenha2 ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              disabled={carregandoGeral}
              variant="contained"
              sx={{
                mt: 3,
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
                  <span>Atualizando senha...</span>
                </Box>
              ) : (
                'Salvar nova senha'
              )}
            </Button>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', textAlign: 'center' }}
            >
              Por segurança, escolha uma senha forte e não a compartilhe com ninguém.
            </Typography>
          </Box>
        )}
      </Box>
    </AuthLayout>
  )
}

export default NovaSenhaPage
export { NovaSenhaPage }
