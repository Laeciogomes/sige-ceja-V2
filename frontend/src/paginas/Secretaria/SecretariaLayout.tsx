// src/paginas/Secretaria/SecretariaLayout.tsx
import React, { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Breadcrumbs,
  Link as MuiLink,
  Chip,
  useTheme,
  alpha,
} from '@mui/material'

import SchoolIcon from '@mui/icons-material/School'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import FolderSharedIcon from '@mui/icons-material/FolderShared'
import AssignmentIcon from '@mui/icons-material/Assignment'

const abasSecretaria = [
  { label: 'Visão Geral', path: '/secretaria', icon: <DashboardIcon fontSize="small" /> },
  { label: 'Matrículas', path: '/secretaria/matriculas', icon: <PersonAddIcon fontSize="small" /> },
  { label: 'Documentação', path: '/secretaria/documentos', icon: <FolderSharedIcon fontSize="small" /> },
  { label: 'SASP / Censo', path: '/secretaria/sasp', icon: <AssignmentIcon fontSize="small" /> },
]

const SecretariaLayout: React.FC = () => {
  const theme = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  
  const getAbaAtiva = () => {
    const found = abasSecretaria.findIndex(aba => 
      aba.path === '/secretaria' 
        ? location.pathname === '/secretaria' 
        : location.pathname.startsWith(aba.path)
    )
    return found === -1 ? 0 : found
  }

  const [value, setValue] = useState(getAbaAtiva())

  useEffect(() => {
    setValue(getAbaAtiva())
  }, [location.pathname])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue)
    navigate(abasSecretaria[newValue].path)
  }

  return (
    <Box sx={{ width: '100%', pb: 4 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`
            : `linear-gradient(to right, ${theme.palette.grey[50]}, #fff)`,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box>
          <Breadcrumbs 
            separator={<NavigateNextIcon fontSize="small" />} 
            aria-label="breadcrumb"
            sx={{ mb: 1, fontSize: '0.85rem' }}
          >
            <MuiLink underline="hover" color="inherit" onClick={() => navigate('/')} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <DashboardIcon sx={{ mr: 0.5, fontSize: 'inherit' }} />
              Início
            </MuiLink>
            <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
              <SchoolIcon sx={{ mr: 0.5, fontSize: 'inherit' }} />
              Secretaria
            </Typography>
          </Breadcrumbs>

          <Typography variant="h5" fontWeight={700} sx={{ color: theme.palette.text.primary }}>
            Gestão de Secretaria
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 600 }}>
            Gerencie matrículas, documentação escolar, histórico de alunos e relatórios do SASP em um só lugar.
          </Typography>
        </Box>

        <Box sx={{ alignSelf: 'center' }}>
           <Chip 
             label="Ano Letivo: 2025" 
             color="primary" 
             variant="outlined" 
             sx={{ fontWeight: 600 }} 
           />
        </Box>
      </Paper>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={value} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Abas da secretaria"
          sx={{
            '& .MuiTab-root': {
              minHeight: 48,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
            }
          }}
        >
          {abasSecretaria.map((aba, index) => (
            <Tab 
              key={index} 
              label={aba.label} 
              icon={aba.icon} 
              iconPosition="start" 
            />
          ))}
        </Tabs>
      </Box>

      <Box 
        sx={{ 
          animation: 'fadeIn 0.3s ease-in-out',
          '@keyframes fadeIn': {
            '0%': { opacity: 0, transform: 'translateY(10px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' },
          }
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}

export default SecretariaLayout