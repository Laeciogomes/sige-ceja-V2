import React from 'react'
import Grid from '@mui/material/Grid'
import { Paper, Typography } from '@mui/material'

export const DashboardPage: React.FC = () => {
  return (
    <Grid container spacing={2}>
      {/* Título ocupa 12 colunas em todos os tamanhos */}
      <Grid size={12}>
        <Typography variant="h4" gutterBottom>
          Painel Geral
        </Typography>
      </Grid>

      {/* Cards: 1 por linha no mobile (xs=12), 3 colunas no md+ */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1">Alunos</Typography>
          <Typography variant="h5">–</Typography>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1">Atendimentos Hoje</Typography>
          <Typography variant="h5">–</Typography>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1">Pendências</Typography>
          <Typography variant="h5">–</Typography>
        </Paper>
      </Grid>
    </Grid>
  )
}
