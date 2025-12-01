// frontend/src/paginas/Perfil/PerfilPage.tsx
import React, { useEffect, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '../../contextos/AuthContext'
import { useSupabase } from '../../contextos/SupabaseContext'

type UsuarioPerfil = {
  id: string
  id_tipo_usuario: number
  name: string
  username: string | null
  email: string
  data_nascimento: string | null
  sexo: string | null
  cpf: string | null
  rg: string | null
  celular: string | null
  logradouro: string | null
  numero_endereco: string | null
  bairro: string | null
  municipio: string | null
  ponto_referencia: string | null
  raca: string | null
  foto_url: string | null
  facebook_url: string | null
  instagram_url: string | null
  status: string
  created_at: string
  updated_at: string
}

type FormPerfil = {
  name: string
  username: string
  email: string
  data_nascimento: string
  sexo: string
  cpf: string
  rg: string
  celular: string
  logradouro: string
  numero_endereco: string
  bairro: string
  municipio: string
  ponto_referencia: string
  raca: string
  foto_url: string
  facebook_url: string
  instagram_url: string
}

const opcoesSexo = [
  { value: '', label: 'Não informado' },
  { value: 'Masculino', label: 'Masculino' },
  { value: 'Feminino', label: 'Feminino' },
  { value: 'Outro', label: 'Outro' },
]

const opcoesRaca = [
  { value: '', label: 'Não informado' },
  { value: 'Branca', label: 'Branca' },
  { value: 'Preta', label: 'Preta' },
  { value: 'Parda', label: 'Parda' },
  { value: 'Amarela', label: 'Amarela' },
  { value: 'Indígena', label: 'Indígena' },
  { value: 'Outro', label: 'Outro' },
]

const mapTipoUsuario: Record<number, string> = {
  1: 'Administrador',
  2: 'Direção',
  3: 'Coordenação',
  4: 'Secretaria',
  5: 'Professor',
  6: 'Aluno',
}

const PerfilPage: React.FC = () => {
  const theme = useTheme()
  const { usuario } = useAuth()
  const { supabase } = useSupabase()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<FormPerfil | null>(null)
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null)
  const [mensagemErro, setMensagemErro] = useState<string | null>(null)

  const {
    data: perfil,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['perfil-usuario-editar', usuario?.id],
    enabled: !!usuario && !!supabase,
    queryFn: async (): Promise<UsuarioPerfil | null> => {
      if (!usuario || !supabase) return null

      const { data, error: err } = await supabase
        .from('usuarios')
        .select(
          [
            'id',
            'id_tipo_usuario',
            'name',
            'username',
            'email',
            'data_nascimento',
            'sexo',
            'cpf',
            'rg',
            'celular',
            'logradouro',
            'numero_endereco',
            'bairro',
            'municipio',
            'ponto_referencia',
            'raca',
            'foto_url',
            'facebook_url',
            'instagram_url',
            'status',
            'created_at',
            'updated_at',
          ].join(','),
        )
        .eq('id', usuario.id)
        .maybeSingle<UsuarioPerfil>()

      if (err) {
        console.error('Erro ao carregar perfil:', err)
        throw err
      }

      return data
    },
  })

  useEffect(() => {
    if (perfil) {
      setForm({
        name: perfil.name ?? '',
        username: perfil.username ?? '',
        email: perfil.email ?? '',
        data_nascimento: perfil.data_nascimento ?? '',
        sexo: perfil.sexo ?? '',
        cpf: perfil.cpf ?? '',
        rg: perfil.rg ?? '',
        celular: perfil.celular ?? '',
        logradouro: perfil.logradouro ?? '',
        numero_endereco: perfil.numero_endereco ?? '',
        bairro: perfil.bairro ?? '',
        municipio: perfil.municipio ?? '',
        ponto_referencia: perfil.ponto_referencia ?? '',
        raca: perfil.raca ?? '',
        foto_url: perfil.foto_url ?? '',
        facebook_url: perfil.facebook_url ?? '',
        instagram_url: perfil.instagram_url ?? '',
      })
    }
  }, [perfil])

  const handleChange =
    (campo: keyof FormPerfil) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => (prev ? { ...prev, [campo]: event.target.value } : prev))
    }

  const mutation = useMutation({
    mutationFn: async (dados: FormPerfil) => {
      if (!usuario || !supabase) {
        throw new Error('Usuário ou conexão com o banco indisponível.')
      }

      const payload = {
        name: dados.name.trim(),
        username: dados.username.trim() || null,
        email: dados.email.trim(),
        data_nascimento: dados.data_nascimento || null,
        sexo: dados.sexo || null,
        cpf: dados.cpf.trim() || null,
        rg: dados.rg.trim() || null,
        celular: dados.celular.trim() || null,
        logradouro: dados.logradouro.trim() || null,
        numero_endereco: dados.numero_endereco.trim() || null,
        bairro: dados.bairro.trim() || null,
        municipio: dados.municipio.trim() || null,
        ponto_referencia: dados.ponto_referencia.trim() || null,
        raca: dados.raca || null,
        foto_url: dados.foto_url.trim() || null,
        facebook_url: dados.facebook_url.trim() || null,
        instagram_url: dados.instagram_url.trim() || null,
        updated_at: new Date().toISOString(),
      }

      const { error: err } = await supabase
        .from('usuarios')
        .update(payload)
        .eq('id', usuario.id)

      if (err) {
        console.error('Erro ao atualizar perfil:', err)
        throw err
      }

      return payload
    },
    onSuccess: () => {
      setMensagemErro(null)
      setMensagemSucesso('Perfil atualizado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['perfil-usuario', usuario?.id] })
      queryClient.invalidateQueries({
        queryKey: ['perfil-usuario-editar', usuario?.id],
      })
    },
    onError: (err: unknown) => {
      console.error(err)
      setMensagemSucesso(null)
      setMensagemErro('Não foi possível salvar as alterações. Tente novamente.')
    },
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!form) return

    if (!form.name.trim()) {
      setMensagemSucesso(null)
      setMensagemErro('O nome completo é obrigatório.')
      return
    }
    if (!form.email.trim()) {
      setMensagemSucesso(null)
      setMensagemErro('O e-mail é obrigatório.')
      return
    }

    mutation.mutate(form)
  }

  if (isLoading || !form || !perfil) {
    return (
      <Box
        sx={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (isError) {
    return (
      <Box sx={{ maxWidth: 960, mx: 'auto', mt: 4 }}>
        <Alert severity="error">
          Ocorreu um erro ao carregar seus dados de perfil.
          {error instanceof Error ? ` Detalhes: ${error.message}` : null}
        </Alert>
      </Box>
    )
  }

  const tipoUsuarioLabel =
    mapTipoUsuario[perfil.id_tipo_usuario] ?? `Tipo #${perfil.id_tipo_usuario}`

  const avatarInicial = form.name ? form.name.charAt(0).toUpperCase() : 'U'

  const salvando = mutation.status === 'pending'

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto' }}>
      {/* Cabeçalho */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={3}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        sx={{ mb: 3 }}
      >
        <Avatar
          src={form.foto_url || undefined}
          sx={{
            width: 72,
            height: 72,
            bgcolor: theme.palette.primary.main,
            fontSize: 32,
            fontWeight: 700,
          }}
        >
          {form.foto_url ? null : avatarInicial}
        </Avatar>

        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Meu perfil
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Atualize seus dados pessoais, de contato e endereço. Essas
            informações são utilizadas em cadastros, matrículas e relatórios.
          </Typography>
        </Box>

        <Chip
          label={tipoUsuarioLabel}
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 500 }}
        />
      </Stack>

      {/* Feedback */}
      <Stack spacing={2} sx={{ mb: 2 }}>
        {mensagemSucesso && (
          <Alert severity="success" onClose={() => setMensagemSucesso(null)}>
            {mensagemSucesso}
          </Alert>
        )}
        {mensagemErro && (
          <Alert severity="error" onClose={() => setMensagemErro(null)}>
            {mensagemErro}
          </Alert>
        )}
      </Stack>

      <Box component="form" noValidate onSubmit={handleSubmit}>
        <Stack spacing={3}>
          {/* Dados pessoais */}
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Dados pessoais
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 2,
              }}
            >
              <TextField
                label="Nome completo"
                fullWidth
                required
                value={form.name}
                onChange={handleChange('name')}
              />
              <TextField
                label="Nome de usuário"
                fullWidth
                value={form.username}
                onChange={handleChange('username')}
                helperText="Opcional. Usado em relatórios e identificações rápidas."
              />
            </Box>

            <Box
              sx={{
                mt: 2,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' },
                gap: 2,
              }}
            >
              <TextField
                label="E-mail"
                type="email"
                fullWidth
                required
                value={form.email}
                onChange={handleChange('email')}
                helperText="Usado para contato e notificações."
              />
              <TextField
                label="Data de nascimento"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.data_nascimento}
                onChange={handleChange('data_nascimento')}
              />
              <TextField
                label="Sexo"
                select
                fullWidth
                value={form.sexo}
                onChange={handleChange('sexo')}
              >
                {opcoesSexo.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box
              sx={{
                mt: 2,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 2,
              }}
            >
              <TextField
                label="CPF"
                fullWidth
                value={form.cpf}
                onChange={handleChange('cpf')}
              />
              <TextField
                label="RG"
                fullWidth
                value={form.rg}
                onChange={handleChange('rg')}
              />
              <TextField
                label="Celular"
                fullWidth
                value={form.celular}
                onChange={handleChange('celular')}
              />
            </Box>

            <Box
              sx={{
                mt: 2,
                maxWidth: { xs: '100%', md: 280 },
              }}
            >
              <TextField
                label="Raça / Cor"
                select
                fullWidth
                value={form.raca}
                onChange={handleChange('raca')}
              >
                {opcoesRaca.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Paper>

          {/* Endereço */}
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Endereço
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
                gap: 2,
              }}
            >
              <TextField
                label="Logradouro"
                fullWidth
                value={form.logradouro}
                onChange={handleChange('logradouro')}
              />
              <TextField
                label="Número"
                fullWidth
                value={form.numero_endereco}
                onChange={handleChange('numero_endereco')}
              />
            </Box>

            <Box
              sx={{
                mt: 2,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 2,
              }}
            >
              <TextField
                label="Bairro"
                fullWidth
                value={form.bairro}
                onChange={handleChange('bairro')}
              />
              <TextField
                label="Município"
                fullWidth
                value={form.municipio}
                onChange={handleChange('municipio')}
              />
              <TextField
                label="Ponto de referência"
                fullWidth
                value={form.ponto_referencia}
                onChange={handleChange('ponto_referencia')}
              />
            </Box>
          </Paper>

          {/* Foto e redes sociais */}
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Foto e redes sociais
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
                gap: 2,
                alignItems: 'center',
              }}
            >
              <TextField
                label="URL da foto de perfil"
                fullWidth
                value={form.foto_url}
                onChange={handleChange('foto_url')}
                helperText="Cole o link da imagem (por exemplo, do Storage do Supabase)."
              />

              <Stack spacing={1} alignItems="center">
                <Avatar
                  src={form.foto_url || undefined}
                  sx={{
                    width: 72,
                    height: 72,
                    bgcolor: theme.palette.primary.main,
                    fontSize: 32,
                    fontWeight: 700,
                  }}
                >
                  {form.foto_url ? null : avatarInicial}
                </Avatar>
                <Typography variant="caption" color="text.secondary">
                  Pré-visualização da foto
                </Typography>
              </Stack>
            </Box>

            <Box
              sx={{
                mt: 2,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 2,
              }}
            >
              <TextField
                label="Facebook"
                fullWidth
                value={form.facebook_url}
                onChange={handleChange('facebook_url')}
                placeholder="https://facebook.com/seu_usuario"
              />
              <TextField
                label="Instagram"
                fullWidth
                value={form.instagram_url}
                onChange={handleChange('instagram_url')}
                placeholder="https://instagram.com/seu_usuario"
              />
            </Box>
          </Paper>

          {/* Informações do sistema */}
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Informações do sistema
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' },
                gap: 2,
              }}
            >
              <TextField
                label="ID do usuário"
                fullWidth
                value={perfil.id}
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="Tipo de usuário (ID)"
                fullWidth
                value={perfil.id_tipo_usuario}
                InputProps={{ readOnly: true }}
                helperText={tipoUsuarioLabel}
              />
              <TextField
                label="Status"
                fullWidth
                value={perfil.status}
                InputProps={{ readOnly: true }}
              />
            </Box>

            <Box
              sx={{
                mt: 2,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 2,
              }}
            >
              <TextField
                label="Criado em"
                fullWidth
                value={new Date(perfil.created_at).toLocaleString()}
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="Última atualização"
                fullWidth
                value={new Date(perfil.updated_at).toLocaleString()}
                InputProps={{ readOnly: true }}
              />
            </Box>
          </Paper>

          {/* Ações */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 1,
              mb: 4,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              As alterações serão refletidas em cadastros, matrículas e
              relatórios do sistema.
            </Typography>

            <Stack direction="row" spacing={2}>
              <Button
                type="button"
                variant="outlined"
                disabled={salvando}
                onClick={() => {
                  if (perfil) {
                    setForm({
                      name: perfil.name ?? '',
                      username: perfil.username ?? '',
                      email: perfil.email ?? '',
                      data_nascimento: perfil.data_nascimento ?? '',
                      sexo: perfil.sexo ?? '',
                      cpf: perfil.cpf ?? '',
                      rg: perfil.rg ?? '',
                      celular: perfil.celular ?? '',
                      logradouro: perfil.logradouro ?? '',
                      numero_endereco: perfil.numero_endereco ?? '',
                      bairro: perfil.bairro ?? '',
                      municipio: perfil.municipio ?? '',
                      ponto_referencia: perfil.ponto_referencia ?? '',
                      raca: perfil.raca ?? '',
                      foto_url: perfil.foto_url ?? '',
                      facebook_url: perfil.facebook_url ?? '',
                      instagram_url: perfil.instagram_url ?? '',
                    })
                  }
                  setMensagemErro(null)
                  setMensagemSucesso(null)
                }}
              >
                Desfazer alterações
              </Button>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={salvando}
              >
                {salvando ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Box>
  )
}

export { PerfilPage }
export default PerfilPage
