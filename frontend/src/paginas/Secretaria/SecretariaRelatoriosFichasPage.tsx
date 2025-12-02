// src/paginas/Secretaria/SecretariaRelatoriosFichasPage.tsx
import React from 'react'
import { Box, Button, Paper, Typography } from '@mui/material'
import DescriptionIcon from '@mui/icons-material/Description'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import SummarizeIcon from '@mui/icons-material/Summarize'
import { useNotificacaoContext } from '../../contextos/NotificacaoContext'

const SecretariaRelatoriosFichasPage: React.FC = () => {
  const { aviso } = useNotificacaoContext()

  const handleGerar = (descricao: string) => {
    aviso(
      `Geração de “${descricao}” ainda em construção. Integraremos com consultas específicas no Supabase.`,
      'Relatório em construção',
    )
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Relatórios e fichas
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Geração de relatórios gerenciais e fichas individuais de alunos, com
        base nas matrículas, atendimentos e progresso por disciplina.
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          gap: 2,
        }}
      >
        {/* Card 1 */}
        <Paper sx={{ p: 2, height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <SummarizeIcon sx={{ mr: 1 }} />
            <Typography variant="subtitle1">
              Relatório geral de alunos ativos
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Listagem de alunos ativos por nível, ano/série e sala de atendimento,
            para uso da Secretaria e Direção.
          </Typography>
          <Button
            variant="contained"
            startIcon={<DescriptionIcon />}
            onClick={() =>
              handleGerar('Relatório geral de alunos ativos')
            }
          >
            Gerar relatório
          </Button>
        </Paper>

        {/* Card 2 */}
        <Paper sx={{ p: 2, height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <PictureAsPdfIcon sx={{ mr: 1 }} />
            <Typography variant="subtitle1">
              Ficha individual do aluno
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ficha detalhada com dados cadastrais, matrículas, atendimentos,
            protocolos e status por disciplina/ano.
          </Typography>
          <Button
            variant="contained"
            startIcon={<PictureAsPdfIcon />}
            onClick={() => handleGerar('Ficha individual do aluno')}
          >
            Gerar ficha
          </Button>
        </Paper>

        {/* Card 3 */}
        <Paper
          sx={{
            p: 2,
            height: '100%',
            gridColumn: { xs: 'auto', md: 'span 2' },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <SummarizeIcon sx={{ mr: 1 }} />
            <Typography variant="subtitle1">
              Relatório por sala de atendimento
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Quantidade de alunos atendidos por sala, professor e período,
            aproveitando a dimensão de <strong>salas de atendimento</strong>.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<DescriptionIcon />}
            onClick={() => handleGerar('Relatório por sala de atendimento')}
          >
            Gerar relatório
          </Button>
        </Paper>
      </Box>
    </Box>
  )
}

export default SecretariaRelatoriosFichasPage
