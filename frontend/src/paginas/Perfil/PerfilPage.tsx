// frontend/src/paginas/Perfil/PerfilPage.tsx
import React, { useEffect, useState, useRef } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '../../contextos/AuthContext'
import { useSupabase } from '../../contextos/SupabaseContext'

type UsuarioPerfil = {
  id: string
  id_tipo_usuario: number
  tipo_usuario_nome?: string | null
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

// Deixa o texto seguro para usar em caminho de arquivo do Storage
const normalizarCaminhoNome = (texto: string): string => {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-zA-Z0-9._-]/g, '_') // só letras, números, ponto, underline e hífen
}

const PerfilPage: React.FC = () => {
  const theme = useTheme()
  const { usuario } = useAuth()
  const { supabase } = useSupabase()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<FormPerfil | null>(null)
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null)
  const [mensagemErro, setMensagemErro] = useState<string | null>(null)
  const [uploadingFoto, setUploadingFoto] = useState(false)

  // Campos de alteração de senha
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false)
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false)
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false)

  // Inputs de arquivo
  const fileInputGaleriaRef = useRef<HTMLInputElement | null>(null)
  const fileInputCameraRef = useRef<HTMLInputElement | null>(null)

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
            'tipos_usuario ( nome )',
          ].join(','),
        )
        .eq('id', usuario.id)
        .maybeSingle<any>()

      if (err) {
        console.error('Erro ao carregar perfil:', err)
        throw err
      }

      if (!data) return null

      const perfilNormalizado: UsuarioPerfil = {
        id: data.id,
        id_tipo_usuario: data.id_tipo_usuario,
        tipo_usuario_nome: data.tipos_usuario?.nome ?? null,
        name: data.name,
        username: data.username,
        email: data.email,
        data_nascimento: data.data_nascimento,
        sexo: data.sexo,
        cpf: data.cpf,
        rg: data.rg,
        celular: data.celular,
        logradouro: data.logradouro,
        numero_endereco: data.numero_endereco,
        bairro: data.bairro,
        municipio: data.municipio,
        ponto_referencia: data.ponto_referencia,
        raca: data.raca,
        foto_url: data.foto_url,
        facebook_url: data.facebook_url,
        instagram_url: data.instagram_url,
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at,
      }

      return perfilNormalizado
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

  // Mutação para salvar dados de perfil
  const mutationPerfil = useMutation({
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

  // Mutação para alteração de senha
  const mutationSenha = useMutation({
    mutationFn: async () => {
      if (!usuario || !supabase) {
        throw new Error('Usuário ou conexão com o banco indisponível.')
      }

      const emailLogin = usuario.email || form?.email
      if (!emailLogin) {
        throw new Error('E-mail do usuário não encontrado para reautenticação.')
      }

      // 1. Reautentica com senha atual
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: emailLogin,
        password: senhaAtual,
      })

      if (loginError) {
        throw new Error('Senha atual incorreta.')
      }

      // 2. Atualiza a senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: novaSenha,
      })

      if (updateError) {
        console.error(updateError)
        throw new Error('Erro ao atualizar senha.')
      }
    },
    onSuccess: () => {
      setMensagemErro(null)
      setMensagemSucesso('Senha alterada com sucesso.')
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
    },
    onError: (err: unknown) => {
      console.error(err)
      setMensagemSucesso(null)
      if (err instanceof Error) {
        setMensagemErro(err.message)
      } else {
        setMensagemErro('Não foi possível alterar a senha. Tente novamente.')
      }
    },
  })

  const handleSubmitPerfil = (event: React.FormEvent) => {
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

    mutationPerfil.mutate(form)
  }

  const handleSubmitSenha = (event: React.FormEvent) => {
    event.preventDefault()
    setMensagemErro(null)
    setMensagemSucesso(null)

    if (!senhaAtual.trim()) {
      setMensagemErro('Informe a senha atual.')
      return
    }

    if (novaSenha.length < 6) {
      setMensagemErro('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (novaSenha !== confirmarSenha) {
      setMensagemErro('A confirmação da nova senha não confere.')
      return
    }

    mutationSenha.mutate()
  }

  const handleSelecionarFotoClick = () => {
    fileInputGaleriaRef.current?.click()
  }

  const handleSelecionarCameraClick = () => {
    fileInputCameraRef.current?.click()
  }

  const handleArquivoSelecionado = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const arquivo = event.target.files?.[0]
    if (!arquivo || !usuario || !supabase) return

    setMensagemErro(null)
    setMensagemSucesso(null)
    setUploadingFoto(true)

    try {
      const nomeBase =
        form?.name && form.name.trim().length > 0
          ? normalizarCaminhoNome(form.name)
          : normalizarCaminhoNome(usuario.email ?? usuario.id)

      const nomeArquivoOriginal = arquivo.name
      const indicePonto = nomeArquivoOriginal.lastIndexOf('.')
      const extensao =
        indicePonto !== -1 ? nomeArquivoOriginal.substring(indicePonto) : ''
      const nomeSemExtensao =
        indicePonto !== -1
          ? nomeArquivoOriginal.substring(0, indicePonto)
          : nomeArquivoOriginal

      const nomeArquivoLimpo = normalizarCaminhoNome(nomeSemExtensao)

      const caminho = `${nomeBase}/${Date.now()}_${nomeArquivoLimpo}${extensao}`

      const { error: uploadError } = await supabase.storage
        .from('avatars') // bucket precisa existir e ter policy de INSERT/UPDATE para authenticated
        .upload(caminho, arquivo, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        console.error(uploadError)
        throw uploadError
      }

      const { data: publicData } = supabase.storage
        .from('avatars')
        .getPublicUrl(caminho)

      const novaUrl = publicData.publicUrl

      const { error: updateError } = await supabase
        .from('usuarios')
        .update({
          foto_url: novaUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', usuario.id)

      if (updateError) {
        console.error(updateError)
        throw updateError
      }

      setForm((prev) => (prev ? { ...prev, foto_url: novaUrl } : prev))
      queryClient.invalidateQueries({ queryKey: ['perfil-usuario', usuario.id] })
      queryClient.invalidateQueries({
        queryKey: ['perfil-usuario-editar', usuario.id],
      })

      setMensagemSucesso('Foto de perfil atualizada com sucesso.')
    } catch (err) {
      console.error(err)
      setMensagemErro(
        'Não foi possível enviar a foto. Verifique o arquivo e tente novamente.',
      )
    } finally {
      setUploadingFoto(false)
      if (event.target) event.target.value = ''
    }
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
    perfil.tipo_usuario_nome || `Tipo #${perfil.id_tipo_usuario}`

  const avatarInicial = form.name ? form.name.charAt(0).toUpperCase() : 'U'
  const salvandoPerfil = mutationPerfil.status === 'pending'
  const salvandoSenha = mutationSenha.status === 'pending'

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
            Atualize seus dados pessoais, de contato, endereço, foto e senha de
            acesso.
          </Typography>
        </Box>

        <Chip
          label={tipoUsuarioLabel}
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 500 }}
        />
      </Stack>

      {/* Feedback geral */}
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

      {/* Inputs ocultos para upload */}
      <input
        ref={fileInputGaleriaRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleArquivoSelecionado}
      />
      <input
        ref={fileInputCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleArquivoSelecionado}
      />

      <Stack spacing={3}>
        {/* FORMULÁRIO DE PERFIL */}
        <Box component="form" noValidate onSubmit={handleSubmitPerfil}>
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

              <Stack spacing={2}>
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
                    helperText="Se preferir, use os botões abaixo para enviar uma foto."
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
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1.5,
                  }}
                >
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={handleSelecionarFotoClick}
                    disabled={uploadingFoto}
                  >
                    {uploadingFoto ? 'Enviando...' : 'Selecionar foto'}
                  </Button>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={handleSelecionarCameraClick}
                    disabled={uploadingFoto}
                  >
                    {uploadingFoto ? 'Enviando...' : 'Usar câmera'}
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    No celular, "Usar câmera" costuma abrir a câmera do aparelho.
                    No computador, o comportamento depende do navegador (pode abrir
                    a webcam ou o seletor de arquivos).
                  </Typography>
                </Box>

                <Box
                  sx={{
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
              </Stack>
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
                  label="Tipo de usuário"
                  fullWidth
                  value={tipoUsuarioLabel}
                  InputProps={{ readOnly: true }}
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

            {/* Ações do perfil */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 1,
                mb: 2,
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                As alterações serão refletidas em cadastros, matrículas e relatórios
                do sistema.
              </Typography>

              <Stack direction="row" spacing={2}>
                <Button
                  type="button"
                  variant="outlined"
                  disabled={salvandoPerfil}
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
                  disabled={salvandoPerfil}
                >
                  {salvandoPerfil ? 'Salvando...' : 'Salvar alterações'}
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* FORMULÁRIO DE ALTERAÇÃO DE SENHA */}
        <Box
          component="form"
          noValidate
          onSubmit={handleSubmitSenha}
          sx={{ mb: 4 }}
        >
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Alterar senha
            </Typography>

            <Stack spacing={2}>
              <TextField
                label="Senha atual"
                fullWidth
                type={mostrarSenhaAtual ? 'text' : 'password'}
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          setMostrarSenhaAtual((prev) => !prev)
                        }
                        edge="end"
                      >
                        {mostrarSenhaAtual ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Nova senha"
                fullWidth
                type={mostrarNovaSenha ? 'text' : 'password'}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                helperText="Mínimo de 6 caracteres."
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          setMostrarNovaSenha((prev) => !prev)
                        }
                        edge="end"
                      >
                        {mostrarNovaSenha ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Confirmar nova senha"
                fullWidth
                type={mostrarConfirmarSenha ? 'text' : 'password'}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          setMostrarConfirmarSenha((prev) => !prev)
                        }
                        edge="end"
                      >
                        {mostrarConfirmarSenha ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 2,
                  mt: 1,
                }}
              >
                <Button
                  type="button"
                  variant="outlined"
                  disabled={salvandoSenha}
                  onClick={() => {
                    setSenhaAtual('')
                    setNovaSenha('')
                    setConfirmarSenha('')
                  }}
                >
                  Limpar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={salvandoSenha}
                >
                  {salvandoSenha ? 'Atualizando senha...' : 'Atualizar senha'}
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Box>
      </Stack>
    </Box>
  )
}

export { PerfilPage }
export default PerfilPage
