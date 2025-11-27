import React from 'react'
import { Typography, Paper } from '@mui/material'

type Props = {
  titulo: string
}

export const PaginaSimples: React.FC<Props> = ({ titulo }) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {titulo}
      </Typography>
      <Typography variant="body1">
        Conteúdo em construção para a área: {titulo}.
      </Typography>
    </Paper>
  )
}
