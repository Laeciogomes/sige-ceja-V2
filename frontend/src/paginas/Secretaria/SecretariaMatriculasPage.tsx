// frontend/src/paginas/Secretaria/SecretariaMatriculasPage.tsx
import React, { useState } from 'react'
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  TablePagination,
  useTheme,
} from '@mui/material'

import type { SelectChangeEvent } from '@mui/material' // Corrigido

import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import VisibilityIcon from '@mui/icons-material/Visibility'
import FilterListOffIcon from '@mui/icons-material/FilterListOff'
import PrintIcon from '@mui/icons-material/Print'

import { useNotificacaoContext } from '../../contextos/NotificacaoContext'

type StatusMatricula = 'ATIVA' | 'CONCLUIDA' | 'TRANCADA' | 'PENDENTE'

interface MatriculaData {
  id: number
  aluno: string
  matricula: string
  nivel: string
  serie: string
  turno: string
  status: StatusMatricula
}

const mockMatriculas: MatriculaData[] = [
  { id: 1, aluno: 'Ana Clara Silva', matricula: '2025001', nivel: 'Fundamental', serie: '8º Ano', turno: 'Manhã', status: 'ATIVA' },
  { id: 2, aluno: 'Bruno Ferreira', matricula: '2025002', nivel: 'Médio', serie: '2º Ano', turno: 'Noite', status: 'PENDENTE' },
  { id: 3, aluno: 'Carlos Eduardo', matricula: '2024150', nivel: 'EJA', serie: 'Etapa V', turno: 'Noite', status: 'TRANCADA' },
  { id: 4, aluno: 'Daniela Souza', matricula: '2023099', nivel: 'Médio', serie: '3º Ano', turno: 'Manhã', status: 'CONCLUIDA' },
  { id: 5, aluno: 'Eduardo Lima', matricula: '2025005', nivel: 'Fundamental', serie: '6º Ano', turno: 'Tarde', status: 'ATIVA' },
]

const SecretariaMatriculasPage: React.FC = () => {
  const theme = useTheme()
  const { sucesso } = useNotificacaoContext()

  const [busca, setBusca] = useState('')
  const [anoLetivo, setAnoLetivo] = useState('2025')
  const [statusFiltro, setStatusFiltro] = useState<string>('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const handleNovaMatricula = () => {
    sucesso('Abrindo formulário de matrícula...', 'Nova Matrícula')
  }

  const handleLimparFiltros = () => {
    setBusca('')
    setStatusFiltro('')
    setAnoLetivo('2025')
  }

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage)
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value)
    setPage(0)
  }

  const getStatusColor = (status: StatusMatricula) => {
    switch (status) {
      case 'ATIVA': return { color: 'success', label: 'Ativa' }
      case 'PENDENTE': return { color: 'warning', label: 'Pendente' }
      case 'TRANCADA': return { color: 'error', label: 'Trancada' }
      case 'CONCLUIDA': return { color: 'info', label: 'Concluída' }
      default: return { color: 'default', label: status }
    }
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={3} spacing={2}>
        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Matrículas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie o vínculo dos alunos com as turmas e anos letivos.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNovaMatricula}
          sx={{ fontWeight: 600, textTransform: 'none', px: 3 }}
        >
          Nova Matrícula
        </Button>
      </Stack>

      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          mb: 3, 
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems="center"
        >
          <TextField
            size="small"
            placeholder="Buscar aluno ou matrícula..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, minWidth: { xs: '100%', md: 300 } }}
          />

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Ano Letivo</InputLabel>
            <Select 
              value={anoLetivo} 
              label="Ano Letivo" 
              onChange={(e: SelectChangeEvent) => setAnoLetivo(e.target.value)}
            >
              <MenuItem value="2025">2025</MenuItem>
              <MenuItem value="2024">2024</MenuItem>
              <MenuItem value="2023">2023</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select 
              value={statusFiltro} 
              label="Status" 
              onChange={(e: SelectChangeEvent) => setStatusFiltro(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="ATIVA">Ativa</MenuItem>
              <MenuItem value="PENDENTE">Pendente</MenuItem>
              <MenuItem value="TRANCADA">Trancada</MenuItem>
              <MenuItem value="CONCLUIDA">Concluída</MenuItem>
            </Select>
          </FormControl>

          {(busca || statusFiltro || anoLetivo !== '2025') && (
            <Tooltip title="Limpar filtros">
              <IconButton onClick={handleLimparFiltros} size="small">
                <FilterListOffIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Paper>

      <Paper sx={{ width: '100%', overflow: 'hidden', border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }} elevation={0}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="medium">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Matrícula</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Aluno</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Nível / Série</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Turno</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockMatriculas.map((row) => {
                const statusInfo = getStatusColor(row.status)
                
                return (
                  <TableRow hover key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                      {row.matricula}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {row.aluno}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{row.nivel}</Typography>
                      <Typography variant="caption" color="text.secondary">{row.serie}</Typography>
                    </TableCell>
                    <TableCell>{row.turno}</TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={statusInfo.label} 
                        size="small" 
                        color={statusInfo.color as any} 
                        variant="outlined"
                        sx={{ fontWeight: 600, minWidth: 80 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" justifyContent="flex-end" spacing={1}>
                        <Tooltip title="Visualizar Ficha">
                          <IconButton size="small" color="primary">
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton size="small">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Imprimir Comprovante">
                          <IconButton size="small">
                            <PrintIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[10, 25, 100]}
          component="div"
          count={mockMatriculas.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      </Paper>
    </Box>
  )
}

export default SecretariaMatriculasPage