// src/componentes/autenticacao/SolicitarNovaSenhaModal.tsx
import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material'

import { useSupabase } from '../../contextos/SupabaseContext'
import { useNotificacao } from '../../hooks/useNotificacao'

type SolicitarNovaSenhaModalProps = {
  open: boolean
  onClose: () => void
  emailInicial?: string
}

const SolicitarNovaSenhaModal: React.FC<SolicitarNovaSenhaModalProps> = ({
  open,
  onClose,
  emailInicial,
}) => {
  const { supabase } = useSupabase()
  const { sucesso, erro } = useNotificacao()

  const [email, setEmail] = useState(emailInicial ?? '')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setEmail(emailInicial ?? '')
    }
  }, [open, emailInicial])

  const fecharPeloUsuario = () => {
    if (loading) return
    onClose()
  }

  const handleDialogClose = (
    _event: object,
    reason: 'backdropClick' | 'escapeKeyDown',
  ) => {
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      return
    }
    fecharPeloUsuario()
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const emailTrim = email.trim()

    if (!emailTrim) {
      erro('Informe o e-mail cadastrado para continuar.', 'E-mail obrigatório', 5000)
      return
    }

    if (!emailTrim.includes('@') || !emailTrim.includes('.')) {
      erro('Digite um e-mail válido.', 'E-mail inválido', 5000)
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

    setLoading(true)

    try {
      const redirectTo = `${window.location.origin}/nova-senha`

      const { error } = await supabase.auth.resetPasswordForEmail(emailTrim, {
        redirectTo,
      })

      if (error) {
        console.error('Erro ao solicitar redefinição de senha:', error)
        erro(
          'Não foi possível enviar o link de redefinição. Verifique o e-mail informado ou tente novamente mais tarde.',
          'Erro ao enviar link',
          7000,
        )
        return
      }

      sucesso(
        'Se o e-mail estiver cadastrado, enviaremos um link para redefinir sua senha.',
        'Link de redefinição enviado',
        7000,
      )

      onClose()
    } catch (e) {
      console.error('Exceção ao solicitar redefinição de senha:', e)
      erro(
        'Ocorreu um erro inesperado ao solicitar a redefinição de senha.',
        'Erro inesperado',
        7000,
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      fullWidth
      maxWidth="xs"
      disableEscapeKeyDown
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Recuperar acesso
        </DialogTitle>

        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Informe o e-mail cadastrado no SIGE-CEJA. Se encontrarmos sua conta,
            enviaremos um link para você criar uma nova senha.
          </Typography>

          <TextField
            fullWidth
            required
            margin="dense"
            id="email-recuperacao"
            label="E-mail cadastrado"
            type="email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={fecharPeloUsuario}
            disabled={loading}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ minWidth: 170, fontWeight: 600 }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={18} />
                <span>Enviando...</span>
              </Box>
            ) : (
              'Enviar link de redefinição'
            )}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

export default SolicitarNovaSenhaModal
export { SolicitarNovaSenhaModal }
