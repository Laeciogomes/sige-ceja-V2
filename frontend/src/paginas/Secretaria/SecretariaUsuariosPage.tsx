// frontend/src/paginas/Secretaria/SecretariaUsuariosPage.tsx
import React, { useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Stack,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  InputAdornment,
  useTheme,
  alpha
} from '@mui/material'

import PersonAddIcon from '@mui/icons-material/PersonAdd'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import LockResetIcon from '@mui/icons-material/LockReset'
import BlockIcon from '@mui/icons-material/Block'

import { useNotificacaoContext } from '../../contextos/NotificacaoContext'

type PapelUsuario = 'ADMIN' | 'SECRETARIA' | 'PROFESSOR' | 'COORDENACAO' | 'DIRETOR' | 'ALUNO'

interface UsuarioData {
  id: number
  nome: string
  email: string
  papel: PapelUsuario
  status: 'ATIVO' | 'INATIVO'
}

const initialUsers: UsuarioData[] = [
  { id: 1, nome: 'Ana Secretária', email: 'ana.sec@ceja.gov.br', papel: 'SECRETARIA', status: 'ATIVO' },
  { id: 2, nome: 'Carlos Admin', email: 'carlos.admin@ceja.gov.br', papel: 'ADMIN', status: 'ATIVO' },
  { id: 3, nome: 'Prof. Roberto', email: 'roberto.bio@ceja.gov.br', papel: 'PROFESSOR', status: 'ATIVO' },
  { id: 4, nome: 'João Aluno', email: 'joao.2025@aluno.ceja.gov.br', papel: 'ALUNO', status: 'INATIVO' },
]

const SecretariaUsuariosPage: React.FC = () => {
  const theme = useTheme()
  const { sucesso, aviso } = useNotificacaoContext()

  const [usuarios, setUsuarios] = useState<UsuarioData[]>(initialUsers)
  const [busca, setBusca] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  
  const [formNome, setFormNome] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPapel, setFormPapel] = useState<string>('')

  const handleOpenDialog = () => {
    setFormNome('')
    setFormEmail('')
    setFormPapel('')
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!formNome || !formEmail || !formPapel) {
      aviso('Preencha todos os campos obrigatórios.', 'Atenção')
      return
    }

    const newUser: UsuarioData = {
      id: usuarios.length + 1,
      nome: formNome,
      email: formEmail,
      papel: formPapel as PapelUsuario,
      status: 'ATIVO'
    }

    setUsuarios([...usuarios, newUser])
    sucesso(`Usuário ${formNome} criado com sucesso.`, 'Cadastro Realizado')
    setDialogOpen(false)
  }

  const usuariosFiltrados = usuarios.filter(u => 
    u.nome.toLowerCase().includes(busca.toLowerCase()) ||
    u.email.toLowerCase().includes(busca.toLowerCase())
  )

  // Função helper segura para cores
  const getPapelColor = (papel: PapelUsuario): string => {
    switch(papel) {
      case 'ADMIN': return theme.palette.error.main
      case 'DIRETOR': return theme.palette.warning.main
      case 'SECRETARIA': return theme.palette.info.main
      case 'PROFESSOR': return theme.palette.success.main
      default: return theme.palette.grey[500]
    }
  }

  // Função helper para a cor do Chip (que usa nomes como 'error', 'success', etc.)
  const getChipColor = (papel: PapelUsuario) => {
    switch(papel) {
      case 'ADMIN': return 'error'
      case 'DIRETOR': return 'warning'
      case 'SECRETARIA': return 'info'
      case 'PROFESSOR': return 'success'
      default: return 'default'
    }
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={4} spacing={2}>
        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Usuários e Acessos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie quem tem acesso ao sistema e seus níveis de permissão.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={handleOpenDialog}
          sx={{ fontWeight: 600, px: 3 }}
        >
          Novo Usuário
        </Button>
      </Stack>

      <Paper elevation={0} sx={{ p: 2, mb: 3, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar por nome ou e-mail..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: theme.palette.action.hover }}>
            <TableRow>
              <TableCell width={60}>Avatar</TableCell>
              <TableCell>Nome / E-mail</TableCell>
              <TableCell>Perfil</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usuariosFiltrados.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>
                  <Avatar sx={{ bgcolor: alpha(getPapelColor(user.papel), 0.8), width: 40, height: 40, fontSize: '1rem' }}>
                    {user.nome.charAt(0).toUpperCase()}
                  </Avatar>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {user.nome}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user.email}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={user.papel} 
                    size="small" 
                    color={getChipColor(user.papel) as any} 
                    variant="outlined" 
                    sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={user.status} 
                    size="small" 
                    sx={{ 
                      bgcolor: user.status === 'ATIVO' ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.text.disabled, 0.1),
                      color: user.status === 'ATIVO' ? 'success.main' : 'text.disabled',
                      fontWeight: 600
                    }} 
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Editar">
                      <IconButton size="small"><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Redefinir Senha">
                      <IconButton size="small" color="primary"><LockResetIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Bloquear Acesso">
                      <IconButton size="small" color="error"><BlockIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {usuariosFiltrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">Nenhum usuário encontrado.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Novo Usuário</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField 
              label="Nome Completo" 
              fullWidth 
              value={formNome} 
              onChange={(e) => setFormNome(e.target.value)} 
            />
            <TextField 
              label="E-mail Corporativo" 
              type="email" 
              fullWidth 
              value={formEmail} 
              onChange={(e) => setFormEmail(e.target.value)} 
            />
            <FormControl fullWidth>
              <InputLabel>Perfil de Acesso</InputLabel>
              <Select
                value={formPapel}
                label="Perfil de Acesso"
                onChange={(e) => setFormPapel(e.target.value)}
              >
                <MenuItem value="SECRETARIA">Secretaria</MenuItem>
                <MenuItem value="PROFESSOR">Professor</MenuItem>
                <MenuItem value="COORDENACAO">Coordenação</MenuItem>
                <MenuItem value="DIRETOR">Direção</MenuItem>
                <MenuItem value="ADMIN">Administrador</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>Cadastrar Usuário</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SecretariaUsuariosPage