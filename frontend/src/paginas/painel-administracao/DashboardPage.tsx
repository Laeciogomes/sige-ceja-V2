// src/paginas/painel-administracao/DashboardPage.tsx
import React from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  IconButton,
  Button,
  Avatar,
  Chip,
  useTheme,
  alpha,
  Paper,
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
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'

import { useAuth } from '../../contextos/AuthContext'

// --- Componente de Card Estatístico ---
interface StatCardProps {
  titulo: string
  valor: string
  tendencia?: string
  cor: string
  icone: React.ReactNode
}

const StatCard: React.FC<StatCardProps> = ({
  titulo,
  valor,
  tendencia,
  cor,
  icone,
}) => {
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
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={2}
        >
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
                fontWeight: 700,
              }}
            />
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

// --- Página de Dashboard ---
const DashboardPage: React.FC = () => {
  const { usuario } = useAuth()
  const theme = useTheme()

  // Papel do usuário (ADMIN, SECRETARIA, PROFESSOR, COORDENACAO, DIRETOR, ALUNO...)
  const papel = (usuario as any)?.papel || 'DESCONHECIDO'

  type ConteudoDashboard = {
    tituloPagina: string
    subtitulo: string
    stats: StatCardProps[]
    bannerTitulo: string
    bannerDescricao: string
    bannerBotaoLabel: string
    acessoRapido: string[]
    mostrarBotaoPrincipal: boolean
    textoBotaoPrincipal: string
  }

  const getConteudoPorPapel = (): ConteudoDashboard => {
    switch (papel) {
      case 'ADMIN':
        return {
          tituloPagina: 'Dashboard Administração',
          subtitulo:
            'Visão geral do SIGE-CEJA para administração: acesso rápido aos painéis de Secretaria, Professores, Coordenação, Direção e Alunos.',
          stats: [
            {
              titulo: 'Alunos Ativos',
              valor: '1.248',
              tendencia: '+12%',
              cor: '#2196F3',
              icone: <PeopleAltRoundedIcon />,
            },
            {
              titulo: 'Novas Matrículas',
              valor: '86',
              tendencia: '+5%',
              cor: '#4CAF50',
              icone: <SchoolRoundedIcon />,
            },
            {
              titulo: 'Turmas Abertas',
              valor: '42',
              cor: '#FF9800',
              icone: <AssignmentTurnedInRoundedIcon />,
            },
            {
              titulo: 'Taxa de Freq.',
              valor: '94%',
              tendencia: '-1%',
              cor: '#F44336',
              icone: <InsightsRoundedIcon />,
            },
          ],
          bannerTitulo: 'Visão geral da rede CEJA',
          bannerDescricao:
            'Use o menu lateral para navegar entre os painéis da Secretaria, Professores, Coordenação, Direção e Alunos. Em breve, esta área trará indicadores consolidados da escola.',
          bannerBotaoLabel: 'Ver relatórios gerenciais',
          acessoRapido: [
            'Painel da Secretaria',
            'Painel dos Professores',
            'Painel da Coordenação',
            'Painel da Direção',
            'Painel dos Alunos',
            'Configurações do sistema',
          ],
          mostrarBotaoPrincipal: true,
          textoBotaoPrincipal: 'Novo atendimento',
        }

      case 'SECRETARIA':
        return {
          tituloPagina: 'Dashboard Secretaria',
          subtitulo:
            'Rotina da Secretaria: matrículas, turmas, salas, disciplinas e protocolos.',
          stats: [
            {
              titulo: 'Matrículas ativas',
              valor: '732',
              tendencia: '+18',
              cor: '#4CAF50',
              icone: <SchoolRoundedIcon />,
            },
            {
              titulo: 'Renovações pendentes',
              valor: '21',
              cor: '#FF9800',
              icone: <AssignmentTurnedInRoundedIcon />,
            },
            {
              titulo: 'Turmas em andamento',
              valor: '36',
              cor: '#2196F3',
              icone: <PeopleAltRoundedIcon />,
            },
            {
              titulo: 'Protocolos em aberto',
              valor: '9',
              cor: '#F44336',
              icone: <InsightsRoundedIcon />,
            },
          ],
          bannerTitulo: 'Período letivo 2025.1 em andamento',
          bannerDescricao:
            'Faltam poucos dias para o fechamento das matrículas e renovações. Verifique a situação de cada aluno e das turmas antes do encerramento.',
          bannerBotaoLabel: 'Ir para matrículas',
          acessoRapido: [
            'Cadastrar aluno',
            'Matricular aluno',
            'Renovar matrícula',
            'Gerenciar turmas',
            'Gerenciar salas',
            'Gerenciar disciplinas',
          ],
          mostrarBotaoPrincipal: true,
          textoBotaoPrincipal: 'Nova matrícula',
        }

      case 'PROFESSOR':
        return {
          tituloPagina: 'Dashboard Professor',
          subtitulo:
            'Foco nos atendimentos e no acompanhamento pedagógico dos alunos.',
          stats: [
            {
              titulo: 'Meus alunos',
              valor: '156',
              tendencia: '+2',
              cor: '#2196F3',
              icone: <PeopleAltRoundedIcon />,
            },
            {
              titulo: 'Atendimentos hoje',
              valor: '4',
              cor: '#FF9800',
              icone: <CalendarTodayIcon />,
            },
            {
              titulo: 'Atividades pendentes',
              valor: '3',
              cor: '#F44336',
              icone: <AssignmentTurnedInRoundedIcon />,
            },
            {
              titulo: 'Desempenho médio',
              valor: '7,8',
              tendencia: '+0,5',
              cor: '#4CAF50',
              icone: <InsightsRoundedIcon />,
            },
          ],
          bannerTitulo: 'Agenda de atendimentos do dia',
          bannerDescricao:
            'Revise os atendimentos previstos e os registros pendentes antes do fim do turno. Manter os lançamentos em dia facilita o acompanhamento dos alunos.',
          bannerBotaoLabel: 'Ver agenda de atendimentos',
          acessoRapido: [
            'Registrar atendimento',
            'Lançar notas',
            'Consultar turma',
            'Planejar aula',
            'Relatório de turma',
            'Comunicações com a coordenação',
          ],
          mostrarBotaoPrincipal: true,
          textoBotaoPrincipal: 'Novo atendimento',
        }

      case 'COORDENACAO':
        return {
          tituloPagina: 'Dashboard Coordenação',
          subtitulo:
            'Tudo da Secretaria, com foco adicional em SASP e acompanhamento pedagógico.',
          stats: [
            {
              titulo: 'Alunos com SASP preenchido',
              valor: '428',
              tendencia: '+32',
              cor: '#2196F3',
              icone: <PeopleAltRoundedIcon />,
            },
            {
              titulo: 'Atendimentos na semana',
              valor: '73',
              cor: '#4CAF50',
              icone: <MeetingRoomIcon />,
            },
            {
              titulo: 'Turmas críticas',
              valor: '5',
              cor: '#F44336',
              icone: <AssignmentTurnedInRoundedIcon />,
            },
            {
              titulo: 'Protocolos concluídos',
              valor: '61%',
              tendencia: '+4%',
              cor: '#FF9800',
              icone: <InsightsRoundedIcon />,
            },
          ],
          bannerTitulo: 'Visão consolidada SASP e atendimentos',
          bannerDescricao:
            'Analise as informações do SASP e dos atendimentos para apoiar decisões pedagógicas e intervenções junto às turmas.',
          bannerBotaoLabel: 'Abrir módulo SASP',
          acessoRapido: [
            'Painel SASP',
            'Acompanhamento de alunos',
            'Relatórios por turma',
            'Protocolos por disciplina',
            'Matrículas e renovações',
            'Agenda de reuniões',
          ],
          mostrarBotaoPrincipal: true,
          textoBotaoPrincipal: 'Novo atendimento',
        }

      case 'DIRETOR':
        return {
          tituloPagina: 'Dashboard Direção',
          subtitulo:
            'Visão estratégica da escola: indicadores consolidados de matrículas, atendimentos e resultados.',
          stats: [
            {
              titulo: 'Alunos ativos',
              valor: '1.248',
              tendencia: '+12%',
              cor: '#2196F3',
              icone: <PeopleAltRoundedIcon />,
            },
            {
              titulo: 'Atendimentos no mês',
              valor: '312',
              tendencia: '+8%',
              cor: '#4CAF50',
              icone: <SchoolRoundedIcon />,
            },
            {
              titulo: 'Taxa de conclusão',
              valor: '78%',
              tendencia: '+3%',
              cor: '#FF9800',
              icone: <InsightsRoundedIcon />,
            },
            {
              titulo: 'Solicitações pendentes',
              valor: '7',
              cor: '#F44336',
              icone: <AssignmentTurnedInRoundedIcon />,
            },
          ],
          bannerTitulo: 'Panorama geral da unidade',
          bannerDescricao:
            'Acompanhe matrículas, atendimentos, desempenho e solicitações críticas para tomar decisões estratégicas ao longo do período letivo.',
          bannerBotaoLabel: 'Ver relatórios estratégicos',
          acessoRapido: [
            'Relatórios consolidados',
            'Acompanhamento de turmas',
            'Solicitações pendentes',
            'Agenda da direção',
            'Painel de atendimentos',
            'Configurações institucionais',
          ],
          mostrarBotaoPrincipal: true,
          textoBotaoPrincipal: 'Nova solicitação',
        }

      case 'ALUNO':
        return {
          tituloPagina: 'Minha área',
          subtitulo:
            'Resumo das suas matrículas, do seu progresso por disciplina e dos próximos atendimentos.',
          stats: [
            {
              titulo: 'Matrículas ativas',
              valor: '2',
              cor: '#2196F3',
              icone: <SchoolRoundedIcon />,
            },
            {
              titulo: 'Atividades pendentes',
              valor: '4',
              cor: '#FF9800',
              icone: <AssignmentTurnedInRoundedIcon />,
            },
            {
              titulo: 'Média geral',
              valor: '8,1',
              cor: '#4CAF50',
              icone: <InsightsRoundedIcon />,
            },
            {
              titulo: 'Atendimentos agendados',
              valor: '1',
              cor: '#9C27B0',
              icone: <CalendarTodayIcon />,
            },
          ],
          bannerTitulo: 'Acompanhe seus estudos',
          bannerDescricao:
            'Veja suas matrículas, notas e atendimentos. Mantenha seus dados atualizados e acompanhe seu progresso ao longo do período letivo.',
          bannerBotaoLabel: 'Ver meu progresso',
          acessoRapido: [
            'Ver minhas matrículas',
            'Ver meu boletim',
            'Próximos atendimentos',
            'Atualizar meus dados',
            'Documentos da escola',
            'Ajuda / suporte',
          ],
          mostrarBotaoPrincipal: false,
          textoBotaoPrincipal: 'Novo atendimento',
        }

      default:
        return {
          tituloPagina: 'Dashboard',
          subtitulo:
            'Carregando informações do seu perfil. Assim que o papel for identificado, a dashboard é adaptada automaticamente.',
          stats: [
            {
              titulo: 'Usuários online',
              valor: '—',
              cor: '#2196F3',
              icone: <PeopleAltRoundedIcon />,
            },
            {
              titulo: 'Ações recentes',
              valor: '—',
              cor: '#FF9800',
              icone: <AssignmentTurnedInRoundedIcon />,
            },
            {
              titulo: 'Indicadores',
              valor: '—',
              cor: '#4CAF50',
              icone: <InsightsRoundedIcon />,
            },
            {
              titulo: 'Alertas',
              valor: '—',
              cor: '#F44336',
              icone: <NotificationsActiveIcon />,
            },
          ],
          bannerTitulo: 'Bem-vindo ao SIGE-CEJA',
          bannerDescricao:
            'Estamos carregando os dados do seu perfil para montar a visão correta da sua função no sistema.',
          bannerBotaoLabel: 'Atualizar',
          acessoRapido: [
            'Meus dados',
            'Ajuda',
            'Configurações',
            'Suporte',
            'Documentação',
            'Sobre o sistema',
          ],
          mostrarBotaoPrincipal: false,
          textoBotaoPrincipal: 'Novo atendimento',
        }
    }
  }

  const conteudo = getConteudoPorPapel()

  // Data formatada
  const dataHoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Nome do usuário com fallback
  const nomeCompleto = (usuario as any)?.name || 'Usuário'
  const primeiroNome = nomeCompleto.split(' ')[0]

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
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{ color: 'text.primary', mb: 0.5 }}
          >
            Olá, {primeiroNome}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textTransform: 'capitalize' }}
            >
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

          {conteudo.mostrarBotaoPrincipal && (
            <Button
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                background:
                  'linear-gradient(45deg, #F7941D 30%, #FF8E53 90%)',
                color: 'white',
                boxShadow: '0 3px 5px 2px rgba(247, 148, 29, .3)',
              }}
            >
              {conteudo.textoBotaoPrincipal}
            </Button>
          )}
        </Box>
      </Box>

      {/* 2. Área de Cards Estatísticos */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 1fr',
            md: 'repeat(4, 1fr)',
          },
          gap: 3,
          mb: 4,
        }}
      >
        {conteudo.stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </Box>

      {/* 3. Seção Principal (Conteúdo Dividido) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
          gap: 3,
        }}
      >
        {/* Lado Esquerdo: Banner + Acesso Rápido */}
        <Box>
          {/* Banner de Status */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              background:
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #1b5e20 0%, #004d40 100%)'
                  : 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
              color: theme.palette.mode === 'dark' ? '#fff' : '#1b5e20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
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
                transform: 'rotate(-15deg)',
              }}
            />

            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                {conteudo.bannerTitulo}
              </Typography>
              <Typography
                variant="body2"
                sx={{ opacity: 0.9, maxWidth: 500, mb: 2 }}
              >
                {conteudo.bannerDescricao}
              </Typography>
              <Button
                variant="contained"
                size="small"
                color={theme.palette.mode === 'dark' ? 'success' : 'primary'}
                sx={{ borderRadius: 20, boxShadow: 'none' }}
              >
                {conteudo.bannerBotaoLabel}
              </Button>
            </Box>
          </Paper>

          {/* Acesso Rápido (Grid Interno) */}
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Acesso rápido
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr 1fr',
                sm: '1fr 1fr 1fr',
              },
              gap: 2,
            }}
          >
            {conteudo.acessoRapido.map((acao, i) => (
              <Paper
                key={i}
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
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color="text.secondary"
                >
                  {acao}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Box>

        {/* Lado Direito: Atividades Recentes */}
        <Box>
          <Paper
            elevation={0}
            sx={{
              p: 0,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              height: '100%',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                p: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
                bgcolor: alpha(theme.palette.background.paper, 0.5),
              }}
            >
              <Typography variant="h6" fontWeight={700}>
                Atividade recente
              </Typography>
            </Box>

            <Stack spacing={0}>
              {[
                {
                  user: 'Secretaria',
                  action: 'Matriculou João Silva',
                  time: '2 min atrás',
                  color: '#2196F3',
                },
                {
                  user: 'Coordenação',
                  action: 'Atualizou pauta da reunião',
                  time: '1h atrás',
                  color: '#FF9800',
                },
                {
                  user: 'Sistema',
                  action: 'Backup automático',
                  time: '3h atrás',
                  color: '#9E9E9E',
                },
                {
                  user: 'Prof. Ana',
                  action: 'Lançou notas Turma A',
                  time: '5h atrás',
                  color: '#4CAF50',
                },
                {
                  user: 'Direção',
                  action: 'Aprovou solicitação #123',
                  time: 'Ontem',
                  color: '#F44336',
                },
              ].map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    display: 'flex',
                    gap: 2,
                    borderBottom:
                      index < 4
                        ? `1px solid ${theme.palette.divider}`
                        : 'none',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.action.hover, 0.5),
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: item.color,
                      fontSize: '0.8rem',
                    }}
                  >
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

            <Box
              sx={{
                p: 2,
                borderTop: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Button fullWidth size="small" sx={{ textTransform: 'none' }}>
                Ver todo o histórico
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  )
}

export { DashboardPage }
export default DashboardPage
