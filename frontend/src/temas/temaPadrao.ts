// src/tema.ts
import { createTheme } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'
import type { PaletteMode } from '@mui/material'

// Extensão da palette para cores específicas do SIGE-CEJA
declare module '@mui/material/styles' {
  interface Palette {
    custom: {
      salaAtendimento: string
      salaAvaliacao: string
    }
  }

  interface PaletteOptions {
    custom?: {
      salaAtendimento?: string
      salaAvaliacao?: string
    }
  }
}

// Função para criar o tema a partir do modo (light/dark)
export const criarTema = (mode: PaletteMode): Theme => {
  const isDark = mode === 'dark'

  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#F57C00', // laranja principal (mantido do tema original)
        dark: '#BB4D00',
        light: '#FFB74D',
      },
      secondary: {
        main: '#2E7D32', // verde principal (mantido do tema original)
        dark: '#005005',
        light: '#60AD5E',
      },
      background: {
        default: isDark ? '#121212' : '#FFF8F0', // fundo levemente quente no claro
        paper: isDark ? '#1E1E1E' : '#FFFFFF',
      },
      success: {
        main: '#2E7D32', // reaproveita o verde para sucesso
      },
      warning: {
        main: '#FFA000', // tom de aviso (âmbar)
      },
      error: {
        main: '#D32F2F',
      },
      info: {
        main: '#0288D1',
      },
      custom: {
        // Áreas específicas do SIGE-CEJA (ex: salas virtuais)
        salaAtendimento: isDark ? '#263238' : '#E3F2FD',
        salaAvaliacao: isDark ? '#311B92' : '#EDE7F6',
      },
    },
    typography: {
      fontFamily: [
        'Roboto',
        'system-ui',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'sans-serif',
      ].join(','),
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            textTransform: 'none',
            fontWeight: 600,
          },
        },
      },
    },
  })
}

// Mantém compatibilidade com o código legado que importava `temaPadrao`
export const temaPadrao: Theme = criarTema('light')
