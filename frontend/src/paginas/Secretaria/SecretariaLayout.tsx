// src/paginas/Secretaria/SecretariaLayout.tsx
import React from 'react'
import { Outlet } from 'react-router-dom'
import { Box } from '@mui/material'

const SecretariaLayout: React.FC = () => {
  return (
    <Box sx={{ p: 0 }}>
      <Outlet />
    </Box>
  )
}

export default SecretariaLayout
