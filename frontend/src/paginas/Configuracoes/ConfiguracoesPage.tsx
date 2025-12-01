// src/paginas/Configuracoes/ConfiguracoesPage.tsx
import React, { useEffect, useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  useTheme,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  Alert,
} from '@mui/material'

import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import VolumeOffIcon from '@mui/icons-material/VolumeOff'
import TextFieldsIcon from '@mui/icons-material/TextFields'
import SettingsIcon from '@mui/icons-material/Settings'

import { useNotificacaoContext } from '../../contextos/NotificacaoContext'

type FontScale = 'small' | 'medium' | 'large'

const FONT_STORAGE_KEY = 'sigeceja-font-scale'
const TOAST_SOUND_STORAGE_KEY = 'sigeceja-toast-som-ativo' // 'on' | 'off'

const fontScaleToPx: Record<FontScale, number> = {
  small: 14,
  medium: 16,
  large: 18,
}

const ConfiguracoesPage: React.FC = () => {
  const theme = useTheme()
  const { sucesso, aviso } = useNotificacaoContext()

  const [fontScale, setFontScale] = useState<FontScale>('medium')
  const [somToastsAtivo, setSomToastsAtivo] = useState(true)

  // Aplica o tamanho de fonte global (html { font-size })
  const aplicarFontScale = (scale: FontScale) => {
    const px = fontScaleToPx[scale] ?? 16
    if (typeof document !== 'undefined') {
      document.documentElement.style.fontSize = `${px}px`
    }
  }

  // Carrega preferências salvas
  useEffect(() => {
    try {
      const armazenadoFonte = localStorage.getItem(FONT_STORAGE_KEY) as
        | FontScale
        | null
      if (
        armazenadoFonte === 'small' ||
        armazenadoFonte === 'medium' ||
        armazenadoFonte === 'large'
      ) {
        setFontScale(armazenadoFonte)
        aplicarFontScale(armazenadoFonte)
      } else {
        aplicarFontScale('medium')
      }
    } catch {
      aplicarFontScale('medium')
    }

    try {
      const som = localStorage.getItem(TOAST_SOUND_STORAGE_KEY)
      setSomToastsAtivo(som !== 'off')
    } catch {
      setSomToastsAtivo(true)
    }
  }, [])

  // Handler de mudança de fonte
  const handleFontScaleChange = (
    _event: React.MouseEvent<HTMLElement>,
    novaEscala: FontScale | null,
  ) => {
    if (!novaEscala) return
    setFontScale(novaEscala)
    aplicarFontScale(novaEscala)
    try {
      localStorage.setItem(FONT_STORAGE_KEY, novaEscala)
    } catch {
      // se não conseguir salvar, ignora
    }
    aviso('Tamanho da fonte atualizado.', 'Configurações')
  }

  // Handler de som dos toasts (sem usar o event, só o checked)
  const handleSomToastsToggle = (checked: boolean) => {
    setSomToastsAtivo(checked)
    try {
      localStorage.setItem(TOAST_SOUND_STORAGE_KEY, checked ? 'on' : 'off')
    } catch {
      // ignora erro em localStorage
    }
    if (checked) {
      sucesso('Som das notificações ativado.', 'Configurações')
    } else {
      aviso('Som das notificações desativado.', 'Configurações')
    }
  }

  const handleTestarToast = () => {
    sucesso('Este é um teste de notificação.', 'Teste de Toast')
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: 2, mb: 4, px: { xs: 1, md: 0 } }}>
      {/* Cabeçalho da página */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 3,
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            bgcolor: theme.palette.primary.main,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'common.white',
          }}
        >
          <SettingsIcon />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Configurações do Usuário
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Personalize a experiência do SIGE-CEJA conforme sua preferência.
          </Typography>
        </Box>
      </Box>

      <Stack spacing={3}>
        {/* Card: Tamanho da Fonte */}
        <Paper
          elevation={1}
          sx={{
            p: 3,
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TextFieldsIcon color="primary" />
            <Typography variant="h6">Tamanho da fonte</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ajuste o tamanho da fonte de todo o sistema. A alteração afeta
            menus, tabelas e formulários.
          </Typography>

          <ToggleButtonGroup
            color="primary"
            exclusive
            value={fontScale}
            onChange={handleFontScaleChange}
            size="small"
          >
            <ToggleButton value="small">Pequena</ToggleButton>
            <ToggleButton value="medium">Padrão</ToggleButton>
            <ToggleButton value="large">Grande</ToggleButton>
          </ToggleButtonGroup>

          <Box
            sx={{
              mt: 3,
              p: 2,
              borderRadius: 2,
              border: `1px dashed ${theme.palette.divider}`,
              bgcolor: theme.palette.action.hover,
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Pré-visualização
            </Typography>
            <Typography variant="body1">
              Este é um exemplo de texto com o tamanho atualmente selecionado.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ajuste até encontrar o tamanho mais confortável para leitura.
            </Typography>
          </Box>
        </Paper>

        {/* Card: Som das notificações (toasts) */}
        <Paper
          elevation={1}
          sx={{
            p: 3,
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            {somToastsAtivo ? (
              <VolumeUpIcon color="primary" />
            ) : (
              <VolumeOffIcon color="action" />
            )}
            <Typography variant="h6">Som das notificações</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Ative ou desative o som reproduzido quando uma notificação é
            exibida no canto da tela.
          </Typography>

          <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
            Esta configuração é salva neste navegador. Outros dispositivos
            podem ter preferências diferentes.
          </Alert>

          <FormControlLabel
            control={
              <Switch
                checked={somToastsAtivo}
                onChange={(_, checked) => handleSomToastsToggle(checked)}
              />
            }
            label={
              somToastsAtivo
                ? 'Som das notificações ativado'
                : 'Som das notificações desativado'
            }
          />

          <Divider sx={{ my: 2 }} />

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<VolumeUpIcon />}
              onClick={handleTestarToast}
            >
              Testar notificação
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  )
}

export default ConfiguracoesPage
