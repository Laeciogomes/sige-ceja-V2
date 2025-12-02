// frontend/src/paginas/Secretaria/SecretariaTurmasPage.tsx
import React from 'react'
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import ClassIcon from '@mui/icons-material/Class'
import { useNotificacaoContext } from '../../contextos/NotificacaoContext'

const SecretariaTurmasPage: React.FC = () => {
  const { aviso } = useNotificacaoContext()

  const handleNovaTurma = () => {
    aviso(
      'Gestão de turmas ainda em construção. Em breve, integraremos com a modelagem de turmas e matrículas.',
      'Funcionalidade em construção',
    )
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Gerenciar turmas
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Organização das turmas por nível, ano/série e modalidade. Esta tela
        será ligada às matrículas e ao progresso dos alunos.
      </Typography>

      <Paper sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            mb: 2,
            gap: 2,
          }}
        >
          <Typography variant="subtitle1" sx={{ flex: 1 }}>
            Turmas cadastradas (exemplo)
          </Typography>

          <Button
            variant="contained"
            startIcon={<ClassIcon />}
            onClick={handleNovaTurma}
          >
            Nova turma
          </Button>
        </Box>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Turma</TableCell>
              <TableCell>Nível</TableCell>
              <TableCell>Ano / Série</TableCell>
              <TableCell>Modalidade</TableCell>
              <TableCell>Nº de alunos</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow hover>
              <TableCell>F1-2025A</TableCell>
              <TableCell>Fundamental</TableCell>
              <TableCell>6º ano</TableCell>
              <TableCell>Orientação de Estudos</TableCell>
              <TableCell>32</TableCell>
            </TableRow>
            <TableRow hover>
              <TableCell>M2-2025B</TableCell>
              <TableCell>Médio</TableCell>
              <TableCell>2º ano</TableCell>
              <TableCell>Aproveitamento de Estudos</TableCell>
              <TableCell>18</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Paper>
    </Box>
  )
}

export default SecretariaTurmasPage
