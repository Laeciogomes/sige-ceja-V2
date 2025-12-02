// frontend/src/paginas/Secretaria/SecretariaLayout.tsx
import React from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
  useTheme,
} from '@mui/material'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import ClassIcon from '@mui/icons-material/Class'
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'
import DescriptionIcon from '@mui/icons-material/Description'

type ItemMenuSecretaria = {
  id: string
  rotulo: string
  descricao: string
  caminho: string
  icone: React.ReactElement
}

const itensMenuSecretaria: ItemMenuSecretaria[] = [
  {
    id: 'usuarios',
    rotulo: 'Adicionar usuários',
    descricao: 'Cadastro e gestão de usuários vinculados à escola.',
    caminho: '/secretaria/usuarios',
    icone: <PersonAddIcon />,
  },
  {
    id: 'turmas',
    rotulo: 'Gerenciar turmas',
    descricao: 'Organização das turmas por nível, ano e modalidade.',
    caminho: '/secretaria/turmas',
    icone: <ClassIcon />,
  },
  {
    id: 'matriculas',
    rotulo: 'Matrículas',
    descricao: 'Controle de matrículas, status e níveis de ensino.',
    caminho: '/secretaria/matriculas',
    icone: <AssignmentIndIcon />,
  },
  {
    id: 'relatorios',
    rotulo: 'Relatórios e fichas',
    descricao: 'Geração de relatórios e fichas individuais de alunos.',
    caminho: '/secretaria/relatorios-fichas',
    icone: <DescriptionIcon />,
  },
]

const SecretariaLayout: React.FC = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const laranja = '#F7941D'

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        flexDirection: { xs: 'column', md: 'row' },
      }}
    >
      {/* Menu lateral interno da Secretaria */}
      <Paper
        elevation={1}
        sx={{
          p: 2,
          width: { xs: '100%', md: 280 },
          flexShrink: 0,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          Secretaria
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Área restrita à Secretaria e Administração para gestão de cadastros,
          matrículas e relatórios.
        </Typography>

        <List component="nav" dense>
          {itensMenuSecretaria.map(item => {
            const ativo =
              location.pathname === item.caminho ||
              location.pathname.startsWith(`${item.caminho}/`)

            return (
              <ListItemButton
                key={item.id}
                selected={ativo}
                onClick={() => navigate(item.caminho)}
                sx={{
                  borderRadius: 1.5,
                  mb: 0.5,
                  alignItems: 'flex-start',
                  '&.Mui-selected': {
                    bgcolor:
                      theme.palette.mode === 'light'
                        ? 'rgba(247, 148, 29, 0.08)'
                        : 'rgba(247, 148, 29, 0.2)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    mt: 0.4,
                    color: ativo ? laranja : theme.palette.text.secondary,
                  }}
                >
                  {item.icone}
                </ListItemIcon>
                <ListItemText
                  primary={item.rotulo}
                  secondary={item.descricao}
                  primaryTypographyProps={{
                    variant: 'body1',
                    fontWeight: ativo ? 700 : 500,
                    color: ativo ? laranja : theme.palette.text.primary,
                  }}
                  secondaryTypographyProps={{
                    variant: 'body2',
                    color: theme.palette.text.secondary,
                  }}
                />
              </ListItemButton>
            )
          })}
        </List>
      </Paper>

      {/* Conteúdo da área selecionada */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Outlet />
      </Box>
    </Box>
  )
}

export default SecretariaLayout
