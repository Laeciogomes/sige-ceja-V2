// src/paginas/Secretaria/SecretariaRelatoriosFichasPage.tsx
import React, { useState } from 'react'
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  LinearProgress,
  Stack,
  useTheme,
  alpha,
  Divider
} from '@mui/material'

import SearchIcon from '@mui/icons-material/Search'
// PictureAsPdfIcon removido pois não estava em uso
import TableViewIcon from '@mui/icons-material/TableView'
import DownloadIcon from '@mui/icons-material/Download'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import SchoolIcon from '@mui/icons-material/School'
import AssessmentIcon from '@mui/icons-material/Assessment'
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'

import { useNotificacaoContext } from '../../contextos/NotificacaoContext'

type FormatoRelatorio = 'PDF' | 'EXCEL' | 'AMBOS'

interface RelatorioConfig {
  id: string
  titulo: string
  descricao: string
  categoria: 'Cadastrais' | 'Pedagógicos' | 'Administrativos'
  formato: FormatoRelatorio
  icon: React.ReactNode
  cor: string
}

const relatoriosData: RelatorioConfig[] = [
  {
    id: 'rel-geral-alunos',
    titulo: 'Relatório Geral de Alunos',
    descricao: 'Listagem completa de alunos ativos por nível, série e turno.',
    categoria: 'Cadastrais',
    formato: 'AMBOS',
    icon: <PeopleAltIcon />,
    cor: '#2196F3'
  },
  {
    id: 'ficha-individual',
    titulo: 'Ficha Individual do Aluno',
    descricao: 'Dados cadastrais, filiação, endereço e histórico de matrículas.',
    categoria: 'Cadastrais',
    formato: 'PDF',
    icon: <AssignmentIndIcon />,
    cor: '#00BCD4'
  },
  {
    id: 'rel-salas',
    titulo: 'Ocupação por Sala de Atendimento',
    descricao: 'Mapa de alunos atendidos por professor e sala física.',
    categoria: 'Pedagógicos',
    formato: 'EXCEL',
    icon: <SchoolIcon />,
    cor: '#FF9800'
  },
  {
    id: 'progresso-disciplina',
    titulo: 'Progresso por Disciplina',
    descricao: 'Status de conclusão dos alunos agrupados por área de conhecimento.',
    categoria: 'Pedagógicos',
    formato: 'AMBOS',
    icon: <AssessmentIcon />,
    cor: '#4CAF50'
  },
  {
    id: 'censo-escolar',
    titulo: 'Exportação Censo Escolar',
    descricao: 'Dados formatados para importação no sistema do Educacenso.',
    categoria: 'Administrativos',
    formato: 'EXCEL',
    icon: <TableViewIcon />,
    cor: '#607D8B'
  }
]

const SecretariaRelatoriosFichasPage: React.FC = () => {
  const theme = useTheme()
  const { sucesso } = useNotificacaoContext()
  
  const [busca, setBusca] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleGerar = (relatorio: RelatorioConfig) => {
    setLoadingId(relatorio.id)
    setTimeout(() => {
      setLoadingId(null)
      sucesso(`Download de "${relatorio.titulo}" iniciado.`, 'Relatório Gerado')
    }, 2000)
  }

  const relatoriosFiltrados = relatoriosData.filter(rel => 
    rel.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    rel.descricao.toLowerCase().includes(busca.toLowerCase())
  )

  const categorias = Array.from(new Set(relatoriosFiltrados.map(r => r.categoria)))

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Central de Relatórios
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Gere fichas, listagens e exportações de dados do sistema.
        </Typography>

        <Paper 
          elevation={0} 
          sx={{ 
            p: 2, 
            border: `1px solid ${theme.palette.divider}`, 
            borderRadius: 2,
            bgcolor: theme.palette.background.default 
          }}
        >
          <TextField
            fullWidth
            placeholder="Buscar relatório (ex: 'Alunos', 'Censo', 'Ficha')..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            size="small"
            sx={{ bgcolor: 'background.paper' }}
          />
        </Paper>
      </Box>

      {relatoriosFiltrados.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 5, opacity: 0.7 }}>
          <SearchIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" color="text.secondary">Nenhum relatório encontrado</Typography>
          <Typography variant="body2" color="text.disabled">Tente buscar com outros termos.</Typography>
        </Box>
      ) : (
        <Stack spacing={4}>
          {categorias.map(cat => (
            <Box key={cat}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: theme.palette.primary.main }}>
                {cat}
              </Typography>
              <Box 
                sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, 
                  gap: 2 
                }}
              >
                {relatoriosFiltrados.filter(r => r.categoria === cat).map(relatorio => (
                  <Paper
                    key={relatorio.id}
                    elevation={0}
                    sx={{
                      p: 2.5,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 2,
                      transition: 'all 0.2s ease-in-out',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        borderColor: relatorio.cor,
                        boxShadow: `0 4px 12px ${alpha(relatorio.cor, 0.15)}`,
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    {loadingId === relatorio.id && (
                      <LinearProgress 
                        sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3 }} 
                        color="primary" 
                      />
                    )}

                    <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
                      <Avatar 
                        variant="rounded" 
                        sx={{ bgcolor: alpha(relatorio.cor, 0.1), color: relatorio.cor }}
                      >
                        {relatorio.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2} mb={0.5}>
                          {relatorio.titulo}
                        </Typography>
                        <Chip 
                          label={relatorio.formato === 'AMBOS' ? 'PDF / Excel' : relatorio.formato} 
                          size="small" 
                          variant="outlined" 
                          sx={{ fontSize: '0.65rem', height: 20, fontWeight: 600 }}
                        />
                      </Box>
                    </Stack>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                      {relatorio.descricao}
                    </Typography>

                    <Divider sx={{ mb: 2 }} />

                    <Button
                      variant="contained"
                      fullWidth
                      disabled={loadingId === relatorio.id}
                      onClick={() => handleGerar(relatorio)}
                      startIcon={loadingId === relatorio.id ? null : <DownloadIcon />}
                      sx={{ 
                        bgcolor: alpha(relatorio.cor, 0.9), 
                        '&:hover': { bgcolor: relatorio.cor },
                        textTransform: 'none',
                        fontWeight: 600
                      }}
                    >
                      {loadingId === relatorio.id ? 'Gerando...' : 'Gerar Arquivo'}
                    </Button>
                  </Paper>
                ))}
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  )
}

export default SecretariaRelatoriosFichasPage