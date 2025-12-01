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
  Avatar, // Adicionado
  alpha
} from '@mui/material'

import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import VolumeOffIcon from '@mui/icons-material/VolumeOff'
import SettingsIcon from '@mui/icons-material/Settings'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew'

import { useNotificacaoContext } from '../../contextos/NotificacaoContext'

type FontScale = 'small' | 'medium' | 'large'

const FONT_STORAGE_KEY = 'sigeceja-font-scale'
const TOAST_SOUND_STORAGE_KEY = 'sigeceja-toast-som-ativo'

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

  const aplicarFontScale = (scale: FontScale) => {
    const px = fontScaleToPx[scale] ?? 16
    if (typeof document !== 'undefined') {
      document.documentElement.style.fontSize = `${px}px`
    }
  }

  useEffect(() => {
    try {
      const storedFont = localStorage.getItem(FONT_STORAGE_KEY) as FontScale | null
      if (storedFont && ['small', 'medium', 'large'].includes(storedFont)) {
        setFontScale(storedFont)
        aplicarFontScale(storedFont)
      } else {
        aplicarFontScale('medium')
      }
    } catch {
      aplicarFontScale('medium')
    }

    try {
      const storedSound = localStorage.getItem(TOAST_SOUND_STORAGE_KEY)
      setSomToastsAtivo(storedSound !== 'off')
    } catch {
      setSomToastsAtivo(true)
    }
  }, [])

  const handleFontScaleChange = (_: React.MouseEvent<HTMLElement>, novaEscala: FontScale | null) => {
    if (!novaEscala) return
    setFontScale(novaEscala)
    aplicarFontScale(novaEscala)
    try {
      localStorage.setItem(FONT_STORAGE_KEY, novaEscala)
    } catch {}
    aviso('Tamanho da fonte atualizado.', 'Acessibilidade')
  }

  const handleSomToastsToggle = (checked: boolean) => {
    setSomToastsAtivo(checked)
    try {
      localStorage.setItem(TOAST_SOUND_STORAGE_KEY, checked ? 'on' : 'off')
    } catch {}
    
    if (checked) sucesso('Sons ativados.', 'Notificações')
    else aviso('Sons desativados.', 'Notificações')
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: 2, mb: 4, px: { xs: 1, md: 0 } }}>
      
      {/* Cabeçalho */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 3, 
          bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.1) : theme.palette.grey[50],
          border: `1px solid ${theme.palette.divider}`,
          display: 'flex', 
          alignItems: 'center', 
          gap: 2 
        }}
      >
        <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 56, height: 56 }}>
          <SettingsIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Preferências do Sistema
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Personalize a aparência e o comportamento do SIGE-CEJA para melhor atender às suas necessidades.
          </Typography>
        </Box>
      </Paper>

      {/* Grid Layout substituindo MUI Grid para evitar erros de tipagem */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, gap: 3 }}>
        
        {/* Coluna Esquerda: Acessibilidade */}
        <Box>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <Stack direction="row" alignItems="center" gap={1.5} mb={2}>
              <AccessibilityNewIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>Acessibilidade e Visualização</Typography>
            </Stack>
            <Divider sx={{ mb: 3 }} />

            <Typography variant="subtitle2" gutterBottom>Tamanho da Fonte</Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Ajuste o tamanho do texto para tornar a leitura mais confortável.
            </Typography>

            <ToggleButtonGroup
              color="primary"
              value={fontScale}
              exclusive
              onChange={handleFontScaleChange}
              fullWidth
              sx={{ mb: 3 }}
            >
              <ToggleButton value="small">Pequeno</ToggleButton>
              <ToggleButton value="medium">Padrão</ToggleButton>
              <ToggleButton value="large">Grande</ToggleButton>
            </ToggleButtonGroup>

            {/* Preview Box */}
            <Box 
              sx={{ 
                p: 2, 
                borderRadius: 2, 
                bgcolor: theme.palette.background.default,
                border: `1px solid ${theme.palette.divider}` 
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>PREVIEW</Typography>
              <Typography variant="h6" gutterBottom>Título de Exemplo</Typography>
              <Typography variant="body1">
                O rápido caracol marrom saltou sobre o cachorro preguiçoso. 
                1234567890. Ajuste conforme necessário.
              </Typography>
            </Box>
          </Paper>
        </Box>

        {/* Coluna Direita: Notificações e Sistema */}
        <Box>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <Stack direction="row" alignItems="center" gap={1.5} mb={2}>
              <NotificationsActiveIcon color="warning" />
              <Typography variant="h6" fontWeight={600}>Notificações</Typography>
            </Stack>
            <Divider sx={{ mb: 3 }} />

            <Stack spacing={3}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2">Sons de Alerta</Typography>
                  <Switch 
                    checked={somToastsAtivo} 
                    onChange={(_, c) => handleSomToastsToggle(c)} 
                    color="primary" 
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Reproduzir som ao receber notificações de sucesso ou erro.
                </Typography>
              </Box>

              <Alert severity="info" variant="outlined" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
                <Typography variant="caption" display="block" gutterBottom>
                  Teste suas configurações:
                </Typography>
                <Button 
                  variant="contained" 
                  size="small" 
                  startIcon={somToastsAtivo ? <VolumeUpIcon /> : <VolumeOffIcon />}
                  onClick={() => sucesso('Teste de notificação realizado!', 'Configurações')}
                  fullWidth
                  disableElevation
                >
                  Emitir Notificação de Teste
                </Button>
              </Alert>
            </Stack>
          </Paper>
        </Box>

      </Box>
    </Box>
  )
}

export default ConfiguracoesPage