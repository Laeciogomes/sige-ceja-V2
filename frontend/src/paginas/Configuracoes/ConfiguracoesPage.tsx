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
  Divider,
  Button,
  Alert,
  Avatar,
  alpha,
} from '@mui/material'

import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import VolumeOffIcon from '@mui/icons-material/VolumeOff'
import SettingsIcon from '@mui/icons-material/Settings'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew'

import { useNotificacaoContext } from '../../contextos/NotificacaoContext'

type FontScale = 'small' | 'medium' | 'large'

const FONT_STORAGE_KEY = 'sigeceja-font-scale'
const TOAST_SOUND_STORAGE_KEY = 'sigeceja-toast-som-ativo' // 'on' | 'off'

const ConfiguracoesPage: React.FC = () => {
  const theme = useTheme()
  const { info: toastInfo } = useNotificacaoContext()

  const [fontScale, setFontScale] = useState<FontScale>('medium')
  const [somAtivo, setSomAtivo] = useState(true)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(FONT_STORAGE_KEY) as FontScale | null
      if (saved && ['small', 'medium', 'large'].includes(saved)) {
        setFontScale(saved)
      }
    } catch {
      // ignore
    }

    try {
      const soundPref = window.localStorage.getItem(TOAST_SOUND_STORAGE_KEY)
      setSomAtivo(soundPref !== 'off')
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(FONT_STORAGE_KEY, fontScale)
    } catch {
      // ignore
    }
  }, [fontScale])

  useEffect(() => {
    try {
      window.localStorage.setItem(TOAST_SOUND_STORAGE_KEY, somAtivo ? 'on' : 'off')
    } catch {
      // ignore
    }
  }, [somAtivo])

  const handleFontScaleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newScale: FontScale | null,
  ) => {
    if (!newScale) return
    setFontScale(newScale)
    toastInfo('Tamanho de fonte atualizado. Algumas telas podem se ajustar ao recarregar.')
  }

  const handleToggleSom = () => {
    setSomAtivo(prev => !prev)
    toastInfo(
      `Sons de notificação ${!somAtivo ? 'ativados' : 'desativados'}.`,
      'Preferências de som',
    )
  }

  const handleLimparPreferencias = () => {
    try {
      window.localStorage.removeItem(FONT_STORAGE_KEY)
      window.localStorage.removeItem(TOAST_SOUND_STORAGE_KEY)
      setFontScale('medium')
      setSomAtivo(true)
      toastInfo(
        'Preferências locais limpas. As configurações voltaram ao padrão.',
        'Preferências limpas',
      )
    } catch {
      toastInfo(
        'Não foi possível limpar as preferências locais. Tente novamente.',
      )
    }
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
        Configurações do sistema
      </Typography>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          background: theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.paper, 0.95)
            : alpha(theme.palette.background.paper, 0.9),
        }}
      >
        <Stack spacing={3}>
          {/* Cabeçalho */}
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{ mb: 1 }}
          >
            <Avatar
              sx={{
                bgcolor: theme.palette.primary.main,
                width: 40,
                height: 40,
              }}
            >
              <SettingsIcon />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Preferências do usuário
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ajuste detalhes de acessibilidade, notificações e comportamento
                do sistema conforme sua preferência.
              </Typography>
            </Box>
          </Stack>

          <Divider />

          {/* Tamanho de fonte */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              <AccessibilityNewIcon
                fontSize="small"
                sx={{ mr: 1, verticalAlign: 'middle' }}
              />
              Tamanho da fonte
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Ajuste a escala de texto para melhorar a leitura em diferentes
              telas e resoluções.
            </Typography>
            <ToggleButtonGroup
              value={fontScale}
              exclusive
              onChange={handleFontScaleChange}
              size="small"
            >
              <ToggleButton value="small">Pequena</ToggleButton>
              <ToggleButton value="medium">Padrão</ToggleButton>
              <ToggleButton value="large">Grande</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Divider />

          {/* Sons de notificação */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              <NotificationsActiveIcon
                fontSize="small"
                sx={{ mr: 1, verticalAlign: 'middle' }}
              />
              Sons de notificação
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Ative ou desative os sons reproduzidos ao exibir notificações no
              sistema.
            </Typography>

            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={1} alignItems="center">
                {somAtivo ? <VolumeUpIcon /> : <VolumeOffIcon />}
                <Typography variant="body2">
                  {somAtivo ? 'Sons ativados' : 'Sons desativados'}
                </Typography>
              </Stack>
              <Switch
                checked={somAtivo}
                onChange={handleToggleSom}
                color="primary"
              />
            </Stack>
          </Box>

          <Divider />

          {/* Limpar preferências */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Limpar preferências
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Remove as configurações salvas localmente neste navegador, como
              tamanho de fonte e preferência de som.
            </Typography>
            <Button
              variant="outlined"
              color="error"
              onClick={handleLimparPreferencias}
            >
              Limpar preferências locais
            </Button>
          </Box>

          <Alert severity="info">
            Novas opções de configuração serão adicionadas conforme o sistema
            evoluir. Sugestões podem ser encaminhadas à equipe de desenvolvimento.
          </Alert>
        </Stack>
      </Paper>
    </Box>
  )
}

export default ConfiguracoesPage
