// frontend/src/componentes/layout/BarraLateral.tsx
import React from 'react'
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  Divider,
  Chip,
  alpha
} from '@mui/material'

// Ícones
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded'
import HelpCenterRoundedIcon from '@mui/icons-material/HelpCenterRounded'

import { useNavigate, useLocation } from 'react-router-dom'

type BarraLateralProps = {
  aberto: boolean
  fechar: () => void
  variante: 'permanent' | 'temporary'
  largura: number
}

// Configuração dos itens (adicionei cores individuais opcionais para futuro)
const itensMenu = [
  { texto: 'Dashboard', path: '/', icone: <DashboardRoundedIcon /> },
  { texto: 'Alunos', path: '/alunos', icone: <PeopleRoundedIcon /> },
  { texto: 'Turmas', path: '/turmas', icone: <SchoolRoundedIcon /> },
  { texto: 'Provas', path: '/provas', icone: <AssignmentRoundedIcon /> },
  { texto: 'Relatórios', path: '/relatorios', icone: <BarChartRoundedIcon /> },
  { texto: 'Configurações', path: '/config', icone: <SettingsRoundedIcon /> },
]

const BarraLateral: React.FC<BarraLateralProps> = ({
  aberto,
  fechar,
  variante,
  largura,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()

  const handleNavegar = (path: string) => {
    navigate(path)
    if (variante === 'temporary') {
      fechar()
    }
  }

  // Cor primária ativa baseada no tema (verde no light, laranja/verde no dark)
  const corAtiva = theme.palette.primary.main

  return (
    <Drawer
      variant={variante}
      open={aberto}
      onClose={fechar}
      sx={{
        width: largura,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: largura,
          boxSizing: 'border-box',
          borderRight: 'none', // Remove a borda dura padrão
          boxShadow: '4px 0 20px rgba(0,0,0,0.03)', // Sombra suave para separar do conteúdo
          bgcolor: theme.palette.background.default, // Fundo neutro
        },
      }}
    >
      {/* Spacer para empurrar conteúdo para baixo da BarraSuperior */}
      <Toolbar />

      {/* Container Principal com Flex para empurrar rodapé */}
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', pt: 2 }}>
        
        {/* Título da Seção (Opcional, mas organiza) */}
        <Typography
          variant="caption"
          sx={{
            px: 3,
            pb: 1,
            fontWeight: 700,
            color: 'text.secondary',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            fontSize: '0.7rem'
          }}
        >
          Menu Principal
        </Typography>

        <List sx={{ px: 1.5 }}>
          {itensMenu.map((item) => {
            const ativo = location.pathname === item.path

            return (
              <ListItem key={item.texto} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavegar(item.path)}
                  selected={ativo}
                  sx={{
                    borderRadius: 3, // Bordas bem arredondadas (Pill shape)
                    minHeight: 48,
                    mb: 0.5,
                    transition: 'all 0.2s ease-in-out',
                    color: ativo ? corAtiva : theme.palette.text.secondary,
                    bgcolor: ativo ? alpha(corAtiva, 0.12) : 'transparent',
                    position: 'relative',
                    overflow: 'hidden',
                    
                    // Hover effect
                    '&:hover': {
                      bgcolor: ativo 
                        ? alpha(corAtiva, 0.20) 
                        : alpha(theme.palette.text.primary, 0.04),
                      transform: 'translateX(4px)', // Leve movimento para a direita
                    },
                    
                    // Barra lateral visual quando ativo
                    '&::before': ativo ? {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      height: '24px',
                      width: '4px',
                      backgroundColor: corAtiva,
                      borderRadius: '0 4px 4px 0',
                    } : {},
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: 'inherit', // Herda a cor do botão (ativo ou inativo)
                      transition: 'transform 0.2s',
                      // Ícone pula levemente no hover do pai
                      '.MuiListItemButton-root:hover &': {
                        transform: 'scale(1.1)',
                      }
                    }}
                  >
                    {item.icone}
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={item.texto}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: ativo ? 700 : 500,
                      fontSize: '0.95rem'
                    }}
                  />
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>

        {/* Espaçador flexível para empurrar o rodapé para baixo */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Rodapé da Barra Lateral */}
        <Box sx={{ p: 2 }}>
          {/* Card de Suporte/Ajuda */}
          <Box
            sx={{
              bgcolor: alpha(theme.palette.info.main, 0.08),
              borderRadius: 3,
              p: 2,
              mb: 2,
              textAlign: 'center'
            }}
          >
             <HelpCenterRoundedIcon color="info" sx={{ fontSize: 30, mb: 1, opacity: 0.8 }} />
             <Typography variant="body2" fontWeight={600} gutterBottom>
               Precisa de ajuda?
             </Typography>
             <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.2 }}>
               Consulte o manual ou contate o suporte.
             </Typography>
             <Chip 
               label="Ver Documentação" 
               size="small" 
               color="info" 
               variant="outlined" 
               onClick={() => console.log('Abrir ajuda')}
               sx={{ fontWeight: 600, fontSize: '0.7rem', cursor: 'pointer' }}
             />
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1 }}>
            <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 500 }}>
              SIGE-CEJA v2.1
            </Typography>
            <Typography variant="caption" color="text.disabled">
              © 2025
            </Typography>
          </Box>
        </Box>

      </Box>
    </Drawer>
  )
}

export default BarraLateral