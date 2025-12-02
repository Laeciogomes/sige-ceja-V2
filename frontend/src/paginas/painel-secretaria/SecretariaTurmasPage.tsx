// frontend/src/paginas/Secretaria/SecretariaTurmasPage.tsx
import React, { useState } from 'react'
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Stack,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  LinearProgress,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material'

import ClassIcon from '@mui/icons-material/Class'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import GroupsIcon from '@mui/icons-material/Groups'
import SchoolIcon from '@mui/icons-material/School'
import EventSeatIcon from '@mui/icons-material/EventSeat'

import { useNotificacaoContext } from '../../contextos/NotificacaoContext'

interface TurmaData {
  id: string
  nome: string
  nivel: string
  serie: string
  modalidade: string
  turno: 'Manhã' | 'Tarde' | 'Noite'
  alunosAtuais: number
  capacidade: number
}

const mockTurmas: TurmaData[] = [
  { id: '1', nome: 'TURMA-F1-A', nivel: 'Fundamental', serie: '6º Ano', modalidade: 'Regular', turno: 'Manhã', alunosAtuais: 32, capacidade: 40 },
  { id: '2', nome: 'TURMA-F1-B', nivel: 'Fundamental', serie: '6º Ano', modalidade: 'Regular', turno: 'Tarde', alunosAtuais: 28, capacidade: 40 },
  { id: '3', nome: 'TURMA-M2-A', nivel: 'Médio', serie: '2º Ano', modalidade: 'EJA', turno: 'Noite', alunosAtuais: 45, capacidade: 50 },
  { id: '4', nome: 'TURMA-M3-C', nivel: 'Médio', serie: '3º Ano', modalidade: 'Regular', turno: 'Manhã', alunosAtuais: 38, capacidade: 40 },
  { id: '5', nome: 'TURMA-EJA-IV', nivel: 'Fundamental', serie: 'Etapa IV', modalidade: 'EJA', turno: 'Noite', alunosAtuais: 15, capacidade: 35 },
]

const SecretariaTurmasPage: React.FC = () => {
  const theme = useTheme()
  const { aviso, sucesso } = useNotificacaoContext()

  const [busca, setBusca] = useState('')
  const [filtroNivel, setFiltroNivel] = useState('')

  const handleNovaTurma = () => {
    sucesso('Modal de cadastro de turma aberto.', 'Nova Turma')
  }

  const totalTurmas = mockTurmas.length
  const totalAlunos = mockTurmas.reduce((acc, t) => acc + t.alunosAtuais, 0)
  const totalVagas = mockTurmas.reduce((acc, t) => acc + (t.capacidade - t.alunosAtuais), 0)

  const turmasFiltradas = mockTurmas.filter(t => 
    t.nome.toLowerCase().includes(busca.toLowerCase()) &&
    (filtroNivel === '' || t.nivel === filtroNivel)
  )

  const getOcupacaoColor = (atual: number, max: number) => {
    const pct = (atual / max) * 100
    if (pct >= 100) return 'error'
    if (pct >= 80) return 'warning'
    return 'success'
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Gestão de Turmas
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Administre a alocação de alunos, capacidade das salas e organização curricular.
        </Typography>

        {/* Substituído Grid por Box display grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
            <Paper elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                <ClassIcon />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700}>{totalTurmas}</Typography>
                <Typography variant="caption" color="text.secondary">Turmas Ativas</Typography>
              </Box>
            </Paper>
            
            <Paper elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main' }}>
                <GroupsIcon />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700}>{totalAlunos}</Typography>
                <Typography variant="caption" color="text.secondary">Alunos Alocados</Typography>
              </Box>
            </Paper>
            
            <Paper elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main' }}>
                <EventSeatIcon />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700}>{totalVagas}</Typography>
                <Typography variant="caption" color="text.secondary">Vagas Disponíveis</Typography>
              </Box>
            </Paper>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }} elevation={0} variant="outlined">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Buscar por nome da turma..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>
            }}
            sx={{ flexGrow: 1 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Nível de Ensino</InputLabel>
            <Select
              value={filtroNivel}
              label="Nível de Ensino"
              onChange={(e) => setFiltroNivel(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="Fundamental">Fundamental</MenuItem>
              <MenuItem value="Médio">Médio</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNovaTurma}
            sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}
          >
            Nova Turma
          </Button>
        </Stack>
      </Paper>

      <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: theme.palette.mode === 'light' ? theme.palette.grey[50] : theme.palette.grey[900] }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Identificação</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Nível / Série</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Turno</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Ocupação (Alunos)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {turmasFiltradas.map((turma) => {
              const ocupacaoPct = (turma.alunosAtuais / turma.capacidade) * 100
              const corStatus = getOcupacaoColor(turma.alunosAtuais, turma.capacidade)

              return (
                <TableRow key={turma.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <SchoolIcon color="action" fontSize="small" />
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{turma.nome}</Typography>
                        <Typography variant="caption" color="text.secondary">{turma.modalidade}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{turma.nivel}</Typography>
                    <Typography variant="caption" color="text.secondary">{turma.serie}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={turma.turno} 
                      size="small" 
                      variant="outlined" 
                      color={turma.turno === 'Noite' ? 'default' : 'primary'}
                      sx={{ height: 24 }}
                    />
                  </TableCell>
                  <TableCell sx={{ width: 200 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" fontWeight={600}>
                        {turma.alunosAtuais} / {turma.capacidade}
                      </Typography>
                      <Typography variant="caption" color={ocupacaoPct >= 100 ? 'error.main' : 'text.secondary'}>
                        {ocupacaoPct.toFixed(0)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(ocupacaoPct, 100)} 
                      color={corStatus}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar Turma">
                      <IconButton size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton size="small" color="error" onClick={() => aviso('Função restrita a administradores.', 'Acesso Negado')}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              )
            })}
            {turmasFiltradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">Nenhuma turma encontrada.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default SecretariaTurmasPage