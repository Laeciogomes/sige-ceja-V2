// frontend/src/componentes/layout/AuthLayout.tsx
import React from 'react'
import { Box, Paper, Typography } from '@mui/material'
import logoCeja from '../../assets/imagens/logo-ceja.png'

type AuthLayoutProps = {
  children: React.ReactNode
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const ano = new Date().getFullYear()

  const orangeGradient = 'linear-gradient(135deg, #ff9800 0%, #e65100 100%)'
  const outerRadius = '24px'
  const innerRadius = '20px'

  return (
    // Fundo verde
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: { xs: 1.5, md: 2 },
        position: 'relative',
        background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -100,
          left: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          zIndex: 0,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: -50,
          right: -50,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          zIndex: 0,
        },
      }}
    >
      {/* Wrapper com borda laranja */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 960,                // largura total do card
          maxHeight: { xs: 'none', md: 540 },
          p: '4px',
          background: orangeGradient,
          borderRadius: outerRadius,
          boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
          zIndex: 1,
          position: 'relative',
          display: 'flex',
        }}
      >
        {/* Card interno */}
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            borderRadius: innerRadius,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            // ANTES: bgcolor: '#fff'
            // Agora usa o tema (claro/escuro)
            bgcolor: 'background.paper',
          }}
        >
          {/* Lado esquerdo */}
          <Box
            sx={{
              flex: { xs: '0 0 auto', md: 1.1 },
              p: { xs: 2.5, md: 3.25 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              background: orangeGradient,
              color: '#fff',
              position: 'relative',
            }}
          >
            {/* textura */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: 0.1,
                backgroundImage:
                  'radial-gradient(circle at 50% 0%, #ffffff 2px, transparent 2.5px)',
                backgroundSize: '24px 24px',
                pointerEvents: 'none',
              }}
            />

            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                zIndex: 2,
              }}
            >
              {/* Logo CEJA */}
              <Box
                sx={{
                  width: 140,
                  height: 140,
                  borderRadius: '50%',
                  border: '4px solid rgba(255,255,255,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
                  mb: 1,
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    width: '140%',
                    height: '140%',
                    background:
                      'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)',
                    borderRadius: '50%',
                    zIndex: -1,
                  },
                }}
              >
                <Box
                  component="img"
                  src={logoCeja}
                  alt="Logo CEJA"
                  sx={{
                    width: '82%',
                    height: '82%',
                    objectFit: 'contain',
                    borderRadius: '50%',
                  }}
                />
              </Box>

              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: 1,
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                >
                  SIGE-CEJA
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 500, opacity: 0.9, mt: 0.5 }}
                >
                  Sistema Integrado de Gestão Escolar
                </Typography>
              </Box>

              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Frei José Ademir de Almeida
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ maxWidth: 320, mt: 0.5, opacity: 0.95 }}
                >
                  Inovação e eficiência na gestão pedagógica e acompanhamento dos
                  estudantes.
                </Typography>
              </Box>

              <Typography variant="caption" sx={{ opacity: 0.85, mt: 2 }}>
                © {ano} Todos os direitos reservados.
              </Typography>
            </Box>
          </Box>

          {/* Lado direito – login */}
          <Box
            sx={{
              flex: 1,
              p: { xs: 2.5, md: 3.25 },
              // ANTES: bgcolor: '#ffffff'
              // Agora também usa background do tema, para escurecer no dark mode
              bgcolor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ width: '100%', maxWidth: 380 }}>{children}</Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}

export default AuthLayout
export { AuthLayout }
