// src/paginas/Dashboard/DashboardPage.tsx
import React from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  IconButton,
  Button,
  Avatar,
  Chip,
  useTheme,
  alpha,
  Divider,
  Paper
} from '@mui/material'

// Ícones
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded'
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded'
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'

import { useAuth } from '../../contextos/AuthContext'

// --- Componente de Card Estatístico ---
interface StatCardProps {
  titulo: string
  valor: string
  tendencia?: string
  cor: string
  icone: React.ReactNode
}

const StatCard: React.FC<StatCardProps> = ({ titulo, valor, tendencia, cor, icone }) => {
  const theme = useTheme()
  
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px -10px rgba(0,0,0,0.15)',
          borderColor: alpha(cor, 0.5),
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(cor, 0.1),
              color: cor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icone}
          </Box>
          <IconButton size="small" sx={{ color: 'text.disabled' }}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Stack>
        
        <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
          {valor}
        </Typography>
        
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {titulo}
          </Typography>
          {tendencia && (
            <Chip 
              label={tendencia} 
              size="small" 
              sx={{ 
                height: 20, 
                fontSize: '0.7rem', 
                bgcolor: alpha(cor, 0.1), 
                color: cor,
                fontWeight: 700
              }} 
            />
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

const DashboardPage: React.FC = () => {
  const { usuario } = useAuth()
  const theme = useTheme()
  const papel = usuario?.papel || 'VISITANTE'

  // Dados Dinâmicos (Mock) baseados no papel
  const getConteudoPorPapel = () => {
    switch (papel) {
      case 'ADMIN':
      case 'DIRETOR':
        return {
          stats: [
            { titulo: 'Alunos Ativos', valor: '1.248', tendencia: '+12%', cor: '#2196F3', icone: <PeopleAltRoundedIcon /> },
            { titulo: 'Novas Matrículas', valor: '86', tendencia: '+5%', cor: '#4CAF50', icone: <SchoolRoundedIcon /> },
            { titulo: 'Turmas Abertas', valor: '42', cor: '#FF9800', icone: <AssignmentTurnedInRoundedIcon /> },
            { titulo: 'Taxa de Freq.', valor: '94%', tendencia: '-1%', cor: '#F44336', icone: <InsightsRoundedIcon /> },
          ]
        }
      default:
        // Padrão (Professor/Outros)
        return {
          stats: [
            { titulo: 'Meus Alunos', valor: '156', tendencia: '+2', cor: '#2196F3', icone: <PeopleAltRoundedIcon /> },
            { titulo: 'Aulas Hoje', valor: '4', cor: '#FF9800', icone: <CalendarTodayIcon /> },
            { titulo: 'Diários Pend.', valor: '1', cor: '#F44336', icone: <AssignmentTurnedInRoundedIcon /> },
            { titulo: 'Desempenho Médio', valor: '7.8', tendencia: '+0.5', cor: '#4CAF50', icone: <InsightsRoundedIcon /> },
          ]
        }
    }
  }

  const conteudo = getConteudoPorPapel()

  // Data formatada
  const dataHoje = new Date().toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  })

  // Primeiro nome para saudação
  const primeiroNome = usuario?.name?.split(' ')[0] || 'Usuário'

  return (
    <Box sx={{ maxWidth: 1600, mx: 'auto', p: { xs: 0, md: 1 } }}>
      
      {/* 1. Cabeçalho de Boas-vindas */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', md: 'center' },
          mb: 4, 
          gap: 2
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ color: 'text.primary', mb: 0.5 }}>
            Olá, {primeiroNome}! 👋
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
              {dataHoje}
            </Typography>
          </Stack>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              startIcon={<NotificationsActiveIcon />}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Avisos (3)
            </Button>
            <Button 
              variant="contained" 
              startIcon={<AddCircleOutlineIcon />}
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none',
                background: 'linear-gradient(45deg, #F7941D 30%, #FF8E53 90%)',
                color: 'white',
                boxShadow: '0 3px 5px 2px rgba(247, 148, 29, .3)',
              }}
            >
              Novo Atendimento
            </Button>
        </Box>
      </Box>

      {/* 2. Grid de Cards Estatísticos */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {conteudo.stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* 3. Seção Principal (Conteúdo Dividido) */}
      <Grid container spacing={3}>
        
        {/* Lado Esquerdo: Acesso Rápido + Banner */}
        <Grid item xs={12} md={8}>
          
          {/* Banner de Status (Exemplo) */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(135deg, #1b5e20 0%, #004d40 100%)'
                : 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
              color: theme.palette.mode === 'dark' ? '#fff' : '#1b5e20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Elemento decorativo de fundo */}
            <SchoolRoundedIcon 
              sx={{ 
                position: 'absolute', 
                right: -20, 
                bottom: -20, 
                fontSize: 180, 
                opacity: 0.1, 
                transform: 'rotate(-15deg)'
              }} 
            />

            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Período Letivo 2025.1 em andamento
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, maxWidth: 500, mb: 2 }}>
                Faltam 15 dias para o fechamento das notas parciais. Verifique se todos os diários estão atualizados no sistema.
              </Typography>
              <Button 
                variant="contained" 
                size="small" 
                color={theme.palette.mode === 'dark' ? 'success' : 'primary'}
                sx={{ borderRadius: 20, boxShadow: 'none' }}
              >
                Ver Cronograma
              </Button>
            </Box>
          </Paper>

          {/* Acesso Rápido */}
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Acesso Rápido
          </Typography>
          <Grid container spacing={2}>
             {['Cadastrar Aluno', 'Gerar Boletim', 'Consultar Turma', 'Agendar Reunião', 'Relatório Mensal', 'Configurações'].map((acao, i) => (
               <Grid item xs={6} sm={4} key={i}>
                 <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                        transform: 'translateY(-2px)'
                      }
                    }}
                 >
                    <Typography variant="body2" fontWeight={600} color="text.secondary">
                      {acao}
                    </Typography>
                 </Paper>
               </Grid>
             ))}
          </Grid>
        </Grid>

        {/* Lado Direito: Atividades Recentes (Timeline simples) */}
        <Grid item xs={12} md={4}>
           <Paper 
             elevation={0} 
             sx={{ 
               p: 0, 
               borderRadius: 3, 
               border: `1px solid ${theme.palette.divider}`,
               height: '100%',
               overflow: 'hidden'
             }}
           >
              <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, 0.5) }}>
                <Typography variant="h6" fontWeight={700}>
                  Atividade Recente
                </Typography>
              </Box>
              
              <Stack spacing={0}>
                {[
                  { user: 'Secretaria', action: 'Matriculou João Silva', time: '2 min atrás', color: '#2196F3' },
                  { user: 'Coordenação', action: 'Atualizou Pauta da Reunião', time: '1h atrás', color: '#FF9800' },
                  { user: 'Sistema', action: 'Backup Automático', time: '3h atrás', color: '#9E9E9E' },
                  { user: 'Prof. Ana', action: 'Lançou notas Turma A', time: '5h atrás', color: '#4CAF50' },
                  { user: 'Direção', action: 'Aprovou solicitação #123', time: 'Ontem', color: '#F44336' },
                ].map((item, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      p: 2, 
                      display: 'flex', 
                      gap: 2, 
                      borderBottom: index < 4 ? `1px solid ${theme.palette.divider}` : 'none',
                      '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.5) }
                    }}
                  >
                     <Avatar sx={{ width: 32, height: 32, bgcolor: item.color, fontSize: '0.8rem' }}>
                        {item.user.charAt(0)}
                     </Avatar>
                     <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {item.action}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.user} • {item.time}
                        </Typography>
                     </Box>
                     <IconButton size="small">
                       <ArrowForwardIcon fontSize="small" />
                     </IconButton>
                  </Box>
                ))}
              </Stack>
              
              <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Button fullWidth size="small" sx={{ textTransform: 'none' }}>
                  Ver todo o histórico
                </Button>
              </Box>
           </Paper>
        </Grid>

      </Grid>
    </Box>
  )
}

export { DashboardPage }
export default DashboardPage