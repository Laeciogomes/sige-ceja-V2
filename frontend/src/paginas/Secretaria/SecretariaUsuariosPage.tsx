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
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import { useNotificacaoContext } from '../../contextos/NotificacaoContext'

type UsuarioTabela = {
  id: number
  nome: string
  email: string
  papel: string
}

const SecretariaUsuariosPage: React.FC = () => {
  const { sucesso, aviso } = useNotificacaoContext()

  const [usuarios, setUsuarios] = useState<UsuarioTabela[]>([
    {
      id: 1,
      nome: 'Ana Secretária',
      email: 'ana.secretaria@ceja.gov',
      papel: 'SECRETARIA',
    },
    {
      id: 2,
      nome: 'Carlos Administrador',
      email: 'carlos.admin@ceja.gov',
      papel: 'ADMIN',
    },
  ])

  const [dialogAberto, setDialogAberto] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [papel, setPapel] = useState('')

  const limparFormulario = () => {
    setNome('')
    setEmail('')
    setPapel('')
  }

  const handleAbrirDialog = () => {
    limparFormulario()
    setDialogAberto(true)
  }

  const handleFecharDialog = () => {
    setDialogAberto(false)
  }

  const handleSalvarUsuario = () => {
    if (!nome || !email || !papel) {
      aviso('Preencha nome, e-mail e perfil do usuário.', 'Dados incompletos')
      return
    }

    setUsuarios(lista => [
      ...lista,
      {
        id: lista.length + 1,
        nome,
        email,
        papel,
      },
    ])

    sucesso('Usuário cadastrado (mock). Na próxima etapa conectaremos ao Supabase.', 'Usuário criado')
    setDialogAberto(false)
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Adicionar usuários
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Cadastro e gestão de usuários do sistema SIGE-CEJA. Mais à frente,
        este fluxo será ligado à tabela <code>public.usuarios</code> no Supabase.
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
            Usuários cadastrados (exemplo)
          </Typography>

          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={handleAbrirDialog}
          >
            Novo usuário
          </Button>
        </Box>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>E-mail</TableCell>
              <TableCell>Papel</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usuarios.map(usuario => (
              <TableRow key={usuario.id} hover>
                <TableCell>{usuario.nome}</TableCell>
                <TableCell>{usuario.email}</TableCell>
                <TableCell>{usuario.papel}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Diálogo de novo usuário */}
      <Dialog open={dialogAberto} onClose={handleFecharDialog} fullWidth maxWidth="sm">
        <DialogTitle>Novo usuário</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Nome completo"
              value={nome}
              onChange={e => setNome(e.target.value)}
              fullWidth
              autoFocus
            />
            <TextField
              label="E-mail"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel id="papel-label">Perfil</InputLabel>
              <Select
                labelId="papel-label"
                label="Perfil"
                value={papel}
                onChange={e => setPapel(e.target.value)}
              >
                <MenuItem value="SECRETARIA">Secretaria</MenuItem>
                <MenuItem value="PROFESSOR">Professor</MenuItem>
                <MenuItem value="COORDENACAO">Coordenação</MenuItem>
                <MenuItem value="DIRETOR">Direção</MenuItem>
                <MenuItem value="ALUNO">Aluno</MenuItem>
                <MenuItem value="ADMIN">Administrador</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFecharDialog}>Cancelar</Button>
          <Button variant="contained" onClick={handleSalvarUsuario}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SecretariaUsuariosPage
