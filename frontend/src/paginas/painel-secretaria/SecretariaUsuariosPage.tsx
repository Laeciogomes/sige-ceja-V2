// frontend/src/paginas/Secretaria/SecretariaUsuariosPage.tsx
import {
  useEffect,
  useMemo,
  useState,
  type FC,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputAdornment,
  InputLabel,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  alpha,
} from '@mui/material'
import { green } from '@mui/material/colors'

import PersonAddIcon from '@mui/icons-material/PersonAdd'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import LockResetIcon from '@mui/icons-material/LockReset'
import BlockIcon from '@mui/icons-material/Block'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

import { useSupabase } from '../../contextos/SupabaseContext'
import { useNotificacaoContext } from '../../contextos/NotificacaoContext'
import type { PapelUsuario } from '../../contextos/AuthContext'

type UsuarioStatus = 'ATIVO' | 'INATIVO' | 'PENDENTE'

interface UsuarioRow {
  id: string
  name: string
  email: string
  id_tipo_usuario: number | null
  status: string | null
}

interface TipoUsuarioRow {
  id_tipo_usuario: number
  nome: string
}

interface UsuarioLista {
  id: string
  nome: string
  email: string
  id_tipo_usuario: number | null
  papel?: PapelUsuario
  papelDescricao: string
  status: UsuarioStatus
}

const SecretariaUsuariosPage: FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const { supabase } = useSupabase()
  const { sucesso, aviso, erro } = useNotificacaoContext()

  const [usuarios, setUsuarios] = useState<UsuarioLista[]>([])
  const [tiposUsuario, setTiposUsuario] = useState<TipoUsuarioRow[]>([])
  const [carregando, setCarregando] = useState<boolean>(true)
  const [salvando, setSalvando] = useState<boolean>(false)

  const [busca, setBusca] = useState<string>('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<UsuarioLista | null>(null)
  const [formNome, setFormNome] = useState<string>('')
  const [formEmail, setFormEmail] = useState<string>('')
  const [formPapelId, setFormPapelId] = useState<string>('')

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // ======= Helpers de mapeamento =======

  // Mesmo mapa usado no AuthContext (id_tipo_usuario -> PapelUsuario)
  const normalizarPapelPorId = (
    idTipoUsuario: number | null | undefined,
  ): PapelUsuario | undefined => {
    if (idTipoUsuario == null) return undefined

    switch (idTipoUsuario) {
      case 6:
        return 'ADMIN'
      case 1:
        return 'DIRETOR'
      case 3:
        return 'COORDENACAO'
      case 4:
        return 'SECRETARIA'
      case 2:
        return 'PROFESSOR'
      case 5:
        return 'ALUNO'
      case 7:
        return 'AVALIADOR'
      default:
        return undefined
    }
  }

  const mapStatusDbToUi = (status: string | null | undefined): UsuarioStatus => {
    switch (status) {
      case 'Ativo':
        return 'ATIVO'
      case 'Inativo':
        return 'INATIVO'
      case 'Pendente':
        return 'PENDENTE'
      default:
        return 'ATIVO'
    }
  }

  const mapStatusUiToDb = (status: UsuarioStatus): string => {
    switch (status) {
      case 'ATIVO':
        return 'Ativo'
      case 'INATIVO':
        return 'Inativo'
      case 'PENDENTE':
        return 'Pendente'
      default:
        return 'Ativo'
    }
  }

  const getPapelChipColor = (papel?: PapelUsuario) => {
    switch (papel) {
      case 'ADMIN':
        return 'error'
      case 'DIRETOR':
        return 'warning'
      case 'SECRETARIA':
        return 'info'
      case 'PROFESSOR':
        return 'success'
      case 'COORDENACAO':
        return 'primary'
      case 'ALUNO':
        return 'default'
      case 'AVALIADOR':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const getAvatarColor = (papel?: PapelUsuario): string => {
    switch (papel) {
      case 'ADMIN':
        return theme.palette.error.main
      case 'DIRETOR':
        return theme.palette.warning.main
      case 'SECRETARIA':
        return theme.palette.info.main
      case 'PROFESSOR':
        return theme.palette.success.main
      case 'COORDENACAO':
        return theme.palette.primary.main
      case 'ALUNO':
        return theme.palette.grey[500]
      case 'AVALIADOR':
        return theme.palette.secondary.main
      default:
        return theme.palette.grey[500]
    }
  }

  // ======= Carregamento de dados =======

  const carregarDados = async () => {
    if (!supabase) return

    try {
      setCarregando(true)

      const [
        { data: usuariosData, error: usuariosError },
        { data: tiposData, error: tiposError },
      ] = await Promise.all([
        supabase
          .from('usuarios')
          .select('id, name, email, id_tipo_usuario, status')
          .order('name', { ascending: true }),
        supabase
          .from('tipos_usuario')
          .select('id_tipo_usuario, nome')
          .order('id_tipo_usuario', { ascending: true }),
      ])

      if (usuariosError) {
        console.error(usuariosError)
        erro('Erro ao carregar usuários.')
      }

      if (tiposError) {
        console.error(tiposError)
        erro('Erro ao carregar perfis de acesso.')
      }

      const tiposMap = new Map<number, string>()
      if (tiposData) {
        ;(tiposData as TipoUsuarioRow[]).forEach((t) => {
          tiposMap.set(t.id_tipo_usuario, t.nome)
        })
        setTiposUsuario(tiposData as TipoUsuarioRow[])
      }

      if (usuariosData) {
        const normalizados: UsuarioLista[] = (usuariosData as UsuarioRow[]).map((u) => {
          const papel = normalizarPapelPorId(u.id_tipo_usuario)
          const papelDescricao = u.id_tipo_usuario
            ? tiposMap.get(u.id_tipo_usuario) ?? ''
            : ''

          return {
            id: u.id,
            nome: u.name,
            email: u.email,
            id_tipo_usuario: u.id_tipo_usuario,
            papel,
            papelDescricao,
            status: mapStatusDbToUi(u.status),
          }
        })
        setUsuarios(normalizados)
      }
    } catch (e) {
      console.error(e)
      erro('Erro técnico ao carregar usuários.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    void carregarDados()
  }, [supabase])

  // ======= Formulário / Dialog =======

  const limparFormulario = () => {
    setFormNome('')
    setFormEmail('')
    setFormPapelId('')
    setEditando(null)
  }

  const handleOpenDialogCriar = () => {
    limparFormulario()
    setDialogOpen(true)
  }

  const handleOpenDialogEditar = (usuario: UsuarioLista) => {
    setEditando(usuario)
    setFormNome(usuario.nome)
    setFormEmail(usuario.email)
    setFormPapelId(usuario.id_tipo_usuario ? String(usuario.id_tipo_usuario) : '')
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    if (salvando) return
    setDialogOpen(false)
  }

  const handleSalvarUsuario = async (event?: FormEvent) => {
    if (event) event.preventDefault()
    if (!supabase) return

    const nome = formNome.trim()
    const email = formEmail.trim()
    const papelIdNumber = formPapelId ? Number.parseInt(formPapelId, 10) : NaN

    if (!nome || !email || !formPapelId || Number.isNaN(papelIdNumber)) {
      aviso('Preencha nome, e-mail e perfil de acesso.')
      return
    }

    try {
      setSalvando(true)

      if (editando) {
        // UPDATE
        const payload = {
          name: nome,
          email,
          id_tipo_usuario: papelIdNumber,
          updated_at: new Date().toISOString(),
        }

        const { data, error } = await supabase
          .from('usuarios')
          .update(payload)
          .eq('id', editando.id)
          .select('id, name, email, id_tipo_usuario, status')
          .single<UsuarioRow>()

        if (error) {
          console.error(error)
          erro('Erro ao atualizar usuário.')
          return
        }

        const papel = normalizarPapelPorId(data.id_tipo_usuario)
        const papelDescricao =
          data.id_tipo_usuario != null
            ? tiposUsuario.find((t) => t.id_tipo_usuario === data.id_tipo_usuario)?.nome ?? ''
            : ''

        const atualizado: UsuarioLista = {
          id: data.id,
          nome: data.name,
          email: data.email,
          id_tipo_usuario: data.id_tipo_usuario,
          papel,
          papelDescricao,
          status: mapStatusDbToUi(data.status),
        }

        setUsuarios((prev) => prev.map((u) => (u.id === atualizado.id ? atualizado : u)))
        sucesso('Usuário atualizado com sucesso.')
      } else {
        // INSERT
        const payload = {
          name: nome,
          email,
          id_tipo_usuario: papelIdNumber,
          status: mapStatusUiToDb('ATIVO'),
        }

        const { data, error } = await supabase
          .from('usuarios')
          .insert(payload)
          .select('id, name, email, id_tipo_usuario, status')
          .single<UsuarioRow>()

        if (error) {
          console.error(error)
          erro('Erro ao criar usuário.')
          return
        }

        const papel = normalizarPapelPorId(data.id_tipo_usuario)
        const papelDescricao =
          data.id_tipo_usuario != null
            ? tiposUsuario.find((t) => t.id_tipo_usuario === data.id_tipo_usuario)?.nome ?? ''
            : ''

        const novo: UsuarioLista = {
          id: data.id,
          nome: data.name,
          email: data.email,
          id_tipo_usuario: data.id_tipo_usuario,
          papel,
          papelDescricao,
          status: mapStatusDbToUi(data.status),
        }

        setUsuarios((prev) => [...prev, novo])
        sucesso('Usuário criado com sucesso.')
      }

      setDialogOpen(false)
      limparFormulario()
    } catch (e) {
      console.error(e)
      erro('Erro ao salvar usuário.')
    } finally {
      setSalvando(false)
    }
  }

  // ======= Ações de linha =======

  const handleToggleStatus = async (usuario: UsuarioLista) => {
    if (!supabase) return

    const novoStatusUi: UsuarioStatus =
      usuario.status === 'ATIVO' ? 'INATIVO' : 'ATIVO'

    try {
      setSalvando(true)

      const { data, error } = await supabase
        .from('usuarios')
        .update({
          status: mapStatusUiToDb(novoStatusUi),
          updated_at: new Date().toISOString(),
        })
        .eq('id', usuario.id)
        .select('id, status')
        .single<UsuarioRow>()

      if (error) {
        console.error(error)
        erro('Erro ao alterar status do usuário.')
        return
      }

      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === usuario.id ? { ...u, status: mapStatusDbToUi(data.status) } : u,
        ),
      )

      sucesso(
        novoStatusUi === 'ATIVO'
          ? 'Usuário reativado com sucesso.'
          : 'Usuário bloqueado com sucesso.',
      )
    } catch (e) {
      console.error(e)
      erro('Erro técnico ao alterar status do usuário.')
    } finally {
      setSalvando(false)
    }
  }

  const handleResetSenha = (usuario: UsuarioLista) => {
    aviso(
      `Em breve será possível enviar um link de redefinição de senha para ${usuario.email}.`,
      'Funcionalidade em construção',
    )
  }

  // ======= Filtros, paginação e estilos =======

  const usuariosFiltrados = useMemo(
    () =>
      usuarios.filter((u) => {
        const termo = busca.trim().toLowerCase()
        if (!termo) return true
        return (
          u.nome.toLowerCase().includes(termo) ||
          u.email.toLowerCase().includes(termo) ||
          u.papelDescricao.toLowerCase().includes(termo) ||
          (u.papel ?? '').toLowerCase().includes(termo)
        )
      }),
    [usuarios, busca],
  )

  useEffect(() => {
    setPage(0)
  }, [busca])

  const usuariosPaginados = useMemo(
    () => usuariosFiltrados.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [usuariosFiltrados, page, rowsPerPage],
  )

  const headerBgColor =
    theme.palette.mode === 'light' ? green[100] : alpha(green[900], 0.4)
  const headerTextColor =
    theme.palette.mode === 'light'
      ? theme.palette.success.dark
      : theme.palette.success.light

  const zebraColor =
    theme.palette.mode === 'light'
      ? alpha(theme.palette.grey[400], 0.12)
      : alpha(theme.palette.common.white, 0.04)

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  // ======= Render =======

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        width: '100%',
        maxWidth: 1400,
        mx: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      {/* Cabeçalho */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Usuários e acessos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie quem tem acesso ao sistema e seus níveis de permissão.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={handleOpenDialogCriar}
          sx={{ fontWeight: 600, px: 3 }}
        >
          Novo usuário
        </Button>
      </Stack>

      {/* Filtro de busca */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar por nome, e-mail ou perfil..."
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

      {/* Lista de usuários: tabela (desktop) ou cards (mobile) */}
      <TableContainer
        component={Paper}
        elevation={0}
        variant="outlined"
        sx={{ borderRadius: 3, overflow: 'hidden' }}
      >
        {carregando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <Stack spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Carregando usuários...
              </Typography>
            </Stack>
          </Box>
        ) : (
          <>
            {isMobile ? (
              // MOBILE: cards
              <Box sx={{ p: 2 }}>
                <Stack spacing={2}>
                  {usuariosFiltrados.length === 0 && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                      sx={{ py: 2 }}
                    >
                      Nenhum usuário encontrado com os filtros aplicados.
                    </Typography>
                  )}

                  {usuariosFiltrados.map((user) => (
                    <Paper
                      key={user.id}
                      variant="outlined"
                      sx={{ borderRadius: 2, p: 2 }}
                    >
                      <Stack spacing={1.5}>
                        <Stack
                          direction="row"
                          spacing={2}
                          alignItems="center"
                        >
                          <Avatar
                            sx={{
                              bgcolor: alpha(getAvatarColor(user.papel), 0.9),
                              width: 40,
                              height: 40,
                              fontSize: '1rem',
                              flexShrink: 0,
                            }}
                          >
                            {user.nome.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant="subtitle2"
                              fontWeight={600}
                              sx={{ wordBreak: 'break-word' }}
                            >
                              {user.nome}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block', mt: 0.25 }}
                            >
                              {user.email}
                            </Typography>
                          </Box>
                        </Stack>

                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Chip
                            label={
                              user.papelDescricao ||
                              user.papel ||
                              'Perfil não definido'
                            }
                            size="small"
                            color={getPapelChipColor(user.papel) as any}
                            variant="outlined"
                            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                          />
                          <Chip
                            label={
                              user.status === 'ATIVO'
                                ? 'Ativo'
                                : user.status === 'INATIVO'
                                ? 'Inativo'
                                : 'Pendente'
                            }
                            size="small"
                            icon={
                              user.status === 'ATIVO' ? (
                                <CheckCircleIcon fontSize="small" />
                              ) : undefined
                            }
                            sx={{
                              bgcolor:
                                user.status === 'ATIVO'
                                  ? alpha(theme.palette.success.main, 0.1)
                                  : alpha(
                                      theme.palette.text.disabled,
                                      0.07,
                                    ),
                              color:
                                user.status === 'ATIVO'
                                  ? 'success.main'
                                  : 'text.secondary',
                              fontWeight: 600,
                            }}
                          />
                        </Stack>

                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="flex-end"
                          sx={{ pt: 1 }}
                        >
                          <Tooltip title="Editar dados">
                            <span>
                              <Button
                                size="small"
                                variant="text"
                                onClick={() => handleOpenDialogEditar(user)}
                                startIcon={<EditIcon fontSize="small" />}
                              >
                                Editar
                              </Button>
                            </span>
                          </Tooltip>
                          <Tooltip title="Redefinir senha (em construção)">
                            <span>
                              <Button
                                size="small"
                                variant="text"
                                onClick={() => handleResetSenha(user)}
                                startIcon={<LockResetIcon fontSize="small" />}
                              >
                                Senha
                              </Button>
                            </span>
                          </Tooltip>
                          <Tooltip
                            title={
                              user.status === 'ATIVO'
                                ? 'Bloquear acesso'
                                : 'Reativar usuário'
                            }
                          >
                            <span>
                              <Button
                                size="small"
                                variant="text"
                                color={user.status === 'ATIVO' ? 'error' : 'success'}
                                onClick={() => handleToggleStatus(user)}
                                startIcon={<BlockIcon fontSize="small" />}
                                disabled={salvando}
                              >
                                {user.status === 'ATIVO'
                                  ? 'Bloquear'
                                  : 'Reativar'}
                              </Button>
                            </span>
                          </Tooltip>
                        </Stack>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            ) : (
              // DESKTOP: tabela com paginação
              <>
                <Table size="medium">
                  <TableHead>
                    <TableRow sx={{ bgcolor: headerBgColor }}>
                      <TableCell
                        width={60}
                        sx={{ fontWeight: 'bold', color: headerTextColor }}
                      >
                        Avatar
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 'bold', color: headerTextColor }}
                      >
                        Nome / E-mail
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 'bold', color: headerTextColor }}
                      >
                        Perfil
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 'bold', color: headerTextColor }}
                      >
                        Status
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontWeight: 'bold', color: headerTextColor }}
                      >
                        Ações
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {usuariosPaginados.map((user, index) => {
                      const isEven = index % 2 === 0
                      return (
                        <TableRow
                          key={user.id}
                          hover
                          sx={{
                            bgcolor: isEven ? 'inherit' : zebraColor,
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.08),
                            },
                          }}
                        >
                          <TableCell>
                            <Avatar
                              sx={{
                                bgcolor: alpha(getAvatarColor(user.papel), 0.9),
                                width: 40,
                                height: 40,
                                fontSize: '1rem',
                              }}
                            >
                              {user.nome.charAt(0).toUpperCase()}
                            </Avatar>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {user.nome}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {user.email}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={
                                user.papelDescricao ||
                                user.papel ||
                                'Perfil não definido'
                              }
                              size="small"
                              color={getPapelChipColor(user.papel) as any}
                              variant="outlined"
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.7rem',
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={
                                user.status === 'ATIVO'
                                  ? 'ATIVO'
                                  : user.status === 'INATIVO'
                                  ? 'INATIVO'
                                  : 'PENDENTE'
                              }
                              size="small"
                              sx={{
                                bgcolor:
                                  user.status === 'ATIVO'
                                    ? alpha(
                                        theme.palette.success.main,
                                        0.1,
                                      )
                                    : alpha(
                                        theme.palette.text.disabled,
                                        0.1,
                                      ),
                                color:
                                  user.status === 'ATIVO'
                                    ? 'success.main'
                                    : 'text.disabled',
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Stack
                              direction="row"
                              spacing={1}
                              justifyContent="flex-end"
                            >
                              <Tooltip title="Editar dados">
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenDialogEditar(user)}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Redefinir senha (em construção)">
                                <span>
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleResetSenha(user)}
                                  >
                                    <LockResetIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip
                                title={
                                  user.status === 'ATIVO'
                                    ? 'Bloquear acesso'
                                    : 'Reativar usuário'
                                }
                              >
                                <span>
                                  <IconButton
                                    size="small"
                                    color={
                                      user.status === 'ATIVO'
                                        ? 'error'
                                        : 'success'
                                    }
                                    onClick={() => handleToggleStatus(user)}
                                    disabled={salvando}
                                  >
                                    <BlockIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      )
                    })}

                    {usuariosPaginados.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            Nenhum usuário encontrado com os filtros aplicados.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                <TablePagination
                  component="div"
                  count={usuariosFiltrados.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25]}
                />
              </>
            )}
          </>
        )}
      </TableContainer>

      {/* Dialog de criar/editar usuário */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <form onSubmit={handleSalvarUsuario}>
          <DialogTitle>
            {editando ? 'Editar usuário' : 'Novo usuário'}
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                label="Nome completo"
                fullWidth
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
              />
              <TextField
                label="E-mail"
                type="email"
                fullWidth
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
              <FormControl fullWidth>
                <InputLabel id="perfil-acesso-label">Perfil de acesso</InputLabel>
                <Select
                  labelId="perfil-acesso-label"
                  value={formPapelId}
                  label="Perfil de acesso"
                  onChange={(e) => setFormPapelId(e.target.value)}
                >
                  {tiposUsuario.map((tipo) => (
                    <MenuItem
                      key={tipo.id_tipo_usuario}
                      value={String(tipo.id_tipo_usuario)}
                    >
                      {tipo.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseDialog} disabled={salvando}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={salvando}>
              {salvando
                ? editando
                  ? 'Salvando...'
                  : 'Cadastrando...'
                : editando
                ? 'Salvar alterações'
                : 'Cadastrar usuário'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  )
}

export default SecretariaUsuariosPage
