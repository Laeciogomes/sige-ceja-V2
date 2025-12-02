// frontend/src/paginas/Secretaria/SecretariaMatriculasPage.tsx
import React from 'react'
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
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import FilterListIcon from '@mui/icons-material/FilterList'
import { useNotificacaoContext } from '../../contextos/NotificacaoContext'

const SecretariaMatriculasPage: React.FC = () => {
  const { sucesso } = useNotificacaoContext()

  const handleNovaMatricula = () => {
    sucesso(
      'Fluxo de nova matrícula ainda em construção, mas o painel da Secretaria já está pronto.',
      'Nova matrícula',
    )
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Matrículas
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Controle de matrículas por nível de ensino, ano letivo e status. Em
        seguida, conectaremos esta tela diretamente às tabelas de matrículas no
        Supabase.
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="filtro-ano-letivo-label">Ano letivo</InputLabel>
            <Select
              labelId="filtro-ano-letivo-label"
              label="Ano letivo"
              defaultValue="2025"
            >
              <MenuItem value="2025">2025</MenuItem>
              <MenuItem value="2024">2024</MenuItem>
              <MenuItem value="2023">2023</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="filtro-nivel-label">Nível</InputLabel>
            <Select labelId="filtro-nivel-label" label="Nível" defaultValue="">
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="FUNDAMENTAL">Fundamental</MenuItem>
              <MenuItem value="MEDIO">Médio</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="filtro-status-label">Status</InputLabel>
            <Select labelId="filtro-status-label" label="Status" defaultValue="">
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="ATIVA">Ativa</MenuItem>
              <MenuItem value="CONCLUIDA">Concluída</MenuItem>
              <MenuItem value="TRANCADA">Trancada</MenuItem>
              <MenuItem value="INATIVA">Inativa</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ flex: 1 }} />

          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}
          >
            Aplicar filtros
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNovaMatricula}
            sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}
          >
            Nova matrícula
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
          Matrículas recentes (exemplo)
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Aluno</TableCell>
              <TableCell>Nível</TableCell>
              <TableCell>Ano / Série</TableCell>
              <TableCell>Modalidade</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow hover>
              <TableCell>Maria Silva</TableCell>
              <TableCell>Fundamental</TableCell>
              <TableCell>8º ano</TableCell>
              <TableCell>Orientação de Estudos</TableCell>
              <TableCell>Ativa</TableCell>
            </TableRow>
            <TableRow hover>
              <TableCell>João Souza</TableCell>
              <TableCell>Médio</TableCell>
              <TableCell>2º ano</TableCell>
              <TableCell>Aproveitamento de Estudos</TableCell>
              <TableCell>Concluída</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Paper>
    </Box>
  )
}

export default SecretariaMatriculasPage
