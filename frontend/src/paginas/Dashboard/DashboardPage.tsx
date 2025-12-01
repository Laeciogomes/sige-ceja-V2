// src/paginas/Dashboard/DashboardPage.tsx
import React from 'react'
import { Box, Paper, Typography } from '@mui/material'
import InsightsIcon from '@mui/icons-material/Insights'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import SchoolIcon from '@mui/icons-material/School'

import { useAuth } from '../../contextos/AuthContext'

const DashboardPage: React.FC = () => {
  const { usuario } = useAuth()
  const papel = usuario?.papel

  const tituloPorPerfil: Record<string, string> = {
    ADMIN: 'Painel Administrativo',
    DIRETOR: 'Painel da Direção',
    COORDENACAO: 'Painel da Coordenação',
    SECRETARIA: 'Painel da Secretaria',
    PROFESSOR: 'Painel do Professor',
    ALUNO: 'Painel do Aluno',
  }

  const descricaoPorPerfil: Record<string, string> = {
    ADMIN:
      'Visão completa do sistema. Configure usuários, salas, protocolos e acompanhe os indicadores globais.',
    DIRETOR:
      'Resumo geral do atendimento, fluxo por sala e evolução dos indicadores pedagógicos.',
    COORDENACAO:
      'Acompanhe atendimentos, protocolos e o andamento das disciplinas por área de conhecimento.',
    SECRETARIA:
      'Gerencie cadastros de alunos, matrículas, SASP e consultas rápidas de situação escolar.',
    PROFESSOR:
      'Acesse seus atendimentos, protocolos e o progresso dos alunos por disciplina e ano.',
    ALUNO:
      'Visualize seu progresso, protocolos concluídos e status das disciplinas.',
  }

  const titulo = (papel && tituloPorPerfil[papel]) || 'Painel do SIGE-CEJA'
  const descricao =
    (papel && descricaoPorPerfil[papel]) ||
    'Selecione uma área no menu lateral para começar.'

  return (
    // maxWidth limita; mr:'auto' ancora à ESQUERDA perto do menu
    <Box sx={{ maxWidth: 1200, mr: 'auto' }}>
      {/* Cabeçalho do painel */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          {titulo}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {descricao}
        </Typography>
      </Box>

      {/* Cards/resumo iniciais – depois vamos ligar aos dados reais */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 2,
        }}
      >
        <Paper
          elevation={2}
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <InsightsIcon color="primary" />
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Indicadores
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Em breve
            </Typography>
          </Box>
        </Paper>

        <Paper
          elevation={2}
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <PeopleAltIcon color="primary" />
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Atendimentos
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Em breve
            </Typography>
          </Box>
        </Paper>

        <Paper
          elevation={2}
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <AssignmentTurnedInIcon color="primary" />
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Protocolos
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Em breve
            </Typography>
          </Box>
        </Paper>

        <Paper
          elevation={2}
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <SchoolIcon color="primary" />
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Alunos
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Em breve
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}

export { DashboardPage }
export default DashboardPage
