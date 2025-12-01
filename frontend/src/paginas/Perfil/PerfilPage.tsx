// src/paginas/Perfil/PerfilPage.tsx
import React, { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
  GridLegacy as Grid,
  Snackbar,
} from '@mui/material'

import {
  Image as ImageIcon,
  PhotoCamera,
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Home as HomeIcon,
  Security as SecurityIcon,
  PhotoCameraFront as PhotoIcon,
} from '@mui/icons-material'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '../../contextos/AuthContext'
import { useSupabase } from '../../contextos/SupabaseContext'

// ---------------- Tipagens ----------------

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

// ---------------- Tabs / helpers ----------------

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
      style={{ width: '100%' }}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

const masks = {
  cpf: (v: string) =>
    v
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .substring(0, 14),
  celular: (v: string) =>
    v
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15),
}

const mapTipoUsuario: Record<number, string> = {
  1: 'Diretor',
  2: 'Professor',
  3: 'Coordenador',
  4: 'Secretário',
  5: 'Aluno',
  6: 'Administrador',
}

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')

// Toast local
type ToastSeverity = 'success' | 'error' | 'warning'

// ---------------- Componente principal ----------------

const PerfilPage: React.FC = () => {
  const theme = useTheme()
  const { usuario } = useAuth()
  const { supabase } = useSupabase()
  const queryClient = useQueryClient()

  // Tabs
  const [tabValue, setTabValue] = useState(0)

  // Formulário
  const [form, setForm] = useState<FormPerfil | null>(null)

  // Toast
  const [toast, setToast] = useState<{
    open: boolean
    message: string
    severity: ToastSeverity
  } | null>(null)

  const showToast = (severity: ToastSeverity, message: string) => {
    setToast({ open: true, severity, message })
  }

  const handleCloseToast = () => {
    setToast(prev => (prev ? { ...prev, open: false } : prev))
  }

  // Câmera & upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputGaleriaRef = useRef<HTMLInputElement | null>(null)
  const [cameraAberta, setCameraAberta] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Senha
  const [senhaData, setSenhaData] = useState({ atual: '', nova: '', conf: '' })
  const [mostrarSenhas, setMostrarSenhas] = useState({
    atual: false,
    nova: false,
    conf: false,
  })
  const [loadingSenha, setLoadingSenha] = useState(false)

  // --------- Query: carregar perfil do Supabase ---------

  const {
    data: perfil,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['perfil-usuario', usuario?.id],
    enabled: !!usuario && !!supabase,
    queryFn: async (): Promise<UsuarioPerfil | null> => {
      if (!usuario || !supabase) return null
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', usuario.id)
        .maybeSingle()

      if (error) throw error
      return data
    },
  })

  // Popular form quando perfil chegar
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

  useEffect(() => {
    if (isError) {
      showToast('error', 'Erro ao carregar os dados do perfil.')
    }
  }, [isError])

  // Som opcional dos toasts
  useEffect(() => {
    if (toast?.open) {
      const audioMap: Record<ToastSeverity, string> = {
        success: '/sons/toast-sucesso.mp3',
        warning: '/sons/toast-aviso.mp3',
        error: '/sons/toast-erro.mp3',
      }
      const src = audioMap[toast.severity]
      if (src) {
        const audio = new Audio(src)
        audio.play().catch(() => {
          // ignora erro de áudio
        })
      }
    }
  }, [toast])

  // --------- Handlers de formulário ---------

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) =>
    setTabValue(newValue)

  const handleChange =
    (campo: keyof FormPerfil) => (event: React.ChangeEvent<HTMLInputElement>) => {
      let valor = event.target.value
      if (campo === 'cpf') valor = masks.cpf(valor)
      if (campo === 'celular') valor = masks.celular(valor)
      setForm(prev => (prev ? { ...prev, [campo]: valor } : prev))
    }

  // --------- Mutation: salvar perfil no Supabase ---------

  const mutation = useMutation({
    mutationFn: async (dados: FormPerfil) => {
      if (!usuario || !supabase) {
        throw new Error('Erro de conexão com Supabase.')
      }

      const payload = {
        ...dados,
        data_nascimento: dados.data_nascimento || null,
        sexo: dados.sexo || null,
        cpf: dados.cpf || null,
        rg: dados.rg || null,
        celular: dados.celular || null,
        logradouro: dados.logradouro || null,
        numero_endereco: dados.numero_endereco || null,
        bairro: dados.bairro || null,
        municipio: dados.municipio || null,
        ponto_referencia: dados.ponto_referencia || null,
        raca: dados.raca || null,
        foto_url: dados.foto_url || null,
        facebook_url: dados.facebook_url || null,
        instagram_url: dados.instagram_url || null,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('usuarios')
        .update(payload)
        .eq('id', usuario.id)
        .select('*') // retorna array

      if (error) {
        throw error
      }

      if (!data || data.length === 0) {
        throw new Error(
          `Nenhum registro foi atualizado na tabela "usuarios" para o id ${usuario.id}. ` +
            'Verifique se as policies de RLS permitem UPDATE.',
        )
      }

      return data[0] as UsuarioPerfil
    },
    onSuccess: data => {
      setForm({
        name: data.name ?? '',
        username: data.username ?? '',
        email: data.email ?? '',
        data_nascimento: data.data_nascimento ?? '',
        sexo: (data.sexo as string) ?? '',
        cpf: data.cpf ?? '',
        rg: data.rg ?? '',
        celular: data.celular ?? '',
        logradouro: data.logradouro ?? '',
        numero_endereco: data.numero_endereco ?? '',
        bairro: data.bairro ?? '',
        municipio: data.municipio ?? '',
        ponto_referencia: data.ponto_referencia ?? '',
        raca: data.raca ?? '',
        foto_url: data.foto_url ?? '',
        facebook_url: data.facebook_url ?? '',
        instagram_url: data.instagram_url ?? '',
      })

      showToast('success', 'Perfil atualizado com sucesso!')
      queryClient.invalidateQueries({
        queryKey: ['perfil-usuario', usuario?.id],
      })
    },
    onError: (error: any) => {
      console.error('[PerfilPage] erro ao salvar perfil', error)
      showToast(
        'error',
        error?.message ||
          'Erro ao salvar perfil. Verifique os dados e tente novamente.',
      )
    },
  })

  // --------- Lógica da câmera (simplificada com callback ref) ---------

  // Abre a câmera: pede o stream e só depois abre o diálogo
  const abrirCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      showToast('warning', 'Navegador sem suporte a câmera.')
      console.error(
        '[PerfilPage] navigator.mediaDevices.getUserMedia indisponível',
      )
      return
    }

    try {
      console.log('[PerfilPage] Solicitando acesso à câmera...')
      let stream: MediaStream

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
        })
      } catch (e) {
        console.warn(
          '[PerfilPage] Erro com facingMode:user, tentando vídeo genérico:',
          e,
        )
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
      }

      streamRef.current = stream
      setCameraAberta(true)
    } catch (e) {
      console.error('[PerfilPage] erro ao acessar câmera:', e)
      showToast(
        'error',
        'Erro ao acessar câmera. Verifique permissões, HTTPS/localhost e se outra aplicação não está usando a câmera.',
      )
    }
  }

  // Fecha diálogo e limpa stream
  const fecharCamera = () => {
    setCameraAberta(false)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      ;(videoRef.current as any).srcObject = null
    }
  }

  const capturarFotoDaCamera = () => {
    if (!videoRef.current || !form) return
    const video = videoRef.current

    const videoWidth = video.videoWidth || 0
    const videoHeight = video.videoHeight || 0

    if (!videoWidth || !videoHeight) {
      showToast(
        'warning',
        'A câmera ainda está iniciando. Aguarde 1–2 segundos antes de tirar a foto.',
      )
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = videoWidth
    canvas.height = videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      blob => {
        if (!blob) return
        uploadAvatar(
          new File([blob], 'foto-camera.jpg', { type: 'image/jpeg' }),
        )
        fecharCamera()
      },
      'image/jpeg',
      0.9,
    )
  }

  // --------- Upload de avatar ---------

  const uploadAvatar = async (file: File) => {
    if (!supabase || !usuario || !form) return

    setUploadingAvatar(true)

    try {
      if (file.size > 5 * 1024 * 1024) {
        showToast('warning', 'Tamanho máximo permitido para a foto é 5MB.')
        return
      }

      const bucket = 'avatars'
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const caminho = `${slugify(usuario.email || 'user')}/${Date.now()}.${ext}`

      const { data: uploadData, error: upErr } = await supabase.storage
        .from(bucket)
        .upload(caminho, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || `image/${ext}`,
        })

      if (upErr) {
        console.error('[uploadAvatar] erro Supabase Storage:', upErr)
        throw upErr
      }

      console.log('[uploadAvatar] upload OK:', uploadData)

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(caminho)

      const foto_url = publicUrlData.publicUrl
      const novoForm: FormPerfil = { ...form, foto_url }

      setForm(novoForm)
      mutation.mutate(novoForm)
      showToast('success', 'Foto de perfil atualizada!')
    } catch (e: any) {
      console.error('[uploadAvatar] erro geral:', e)
      const msg =
        e?.message ||
        e?.error_description ||
        'Erro ao enviar foto. Verifique as permissões do Storage.'
      showToast('error', msg)
    } finally {
      setUploadingAvatar(false)
    }
  }

  // --------- Alteração de senha ---------

  const handleAlterarSenha = async () => {
    if (!supabase || !usuario) return

    if (!senhaData.atual || !senhaData.nova || !senhaData.conf) {
      showToast('warning', 'Preencha todos os campos de senha.')
      return
    }

    if (senhaData.nova !== senhaData.conf) {
      showToast('warning', 'A confirmação da senha não confere.')
      return
    }

    if (senhaData.nova.length < 6) {
      showToast('warning', 'A nova senha deve ter pelo menos 6 caracteres.')
      return
    }

    setLoadingSenha(true)
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: usuario.email!,
        password: senhaData.atual,
      })
      if (loginError) throw new Error('Senha atual incorreta.')

      const { error: upError } = await supabase.auth.updateUser({
        password: senhaData.nova,
      })
      if (upError) throw upError

      showToast('success', 'Senha alterada com sucesso!')
      setSenhaData({ atual: '', nova: '', conf: '' })
    } catch (e: any) {
      showToast('error', e.message || 'Erro ao alterar a senha.')
    } finally {
      setLoadingSenha(false)
    }
  }

  // --------- Estados de carregamento / erro global ---------

  if (isLoading || !form || !perfil) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (isError) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <Alert severity="error">Erro ao carregar perfil.</Alert>
      </Box>
    )
  }

  // --------- Render ---------

  return (
    <Box
      sx={{
        maxWidth: 1000,
        mx: 'auto',
        pb: 5,
        px: { xs: 1.5, sm: 2, md: 0 },
      }}
    >
      {/* Toast flutuante */}
      {toast && toast.open && (
        <Snackbar
          open={true}
          autoHideDuration={4000}
          onClose={handleCloseToast}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseToast}
            severity={toast.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      )}

      {/* Header Visual */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          bgcolor: theme.palette.primary.main,
          color: 'white',
          borderRadius: 2,
        }}
      >
        <Avatar
          src={form.foto_url || undefined}
          sx={{
            width: 80,
            height: 80,
            border: '3px solid white',
            boxShadow: 2,
            bgcolor: theme.palette.primary.dark,
          }}
        >
          {form.name.charAt(0)}
        </Avatar>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="h6" fontWeight={700} noWrap>
            {form.name}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }} noWrap>
            {form.email}
          </Typography>
          <Chip
            label={mapTipoUsuario[perfil.id_tipo_usuario] || 'Usuário'}
            size="small"
            sx={{
              mt: 1,
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontWeight: 600,
            }}
          />
        </Box>
      </Paper>

      {/* Sistema de Abas */}
      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: theme.palette.background.default,
          }}
        >
          <Tab icon={<PersonIcon />} iconPosition="start" label="Dados Pessoais" />
          <Tab icon={<HomeIcon />} iconPosition="start" label="Endereço" />
          <Tab icon={<PhotoIcon />} iconPosition="start" label="Foto & Social" />
          <Tab icon={<SecurityIcon />} iconPosition="start" label="Segurança" />
        </Tabs>

        {/* --- ABA 1: DADOS PESSOAIS --- */}
        <TabPanel value={tabValue} index={0}>
          <Box
            component="form"
            onSubmit={e => {
              e.preventDefault()
              if (form) mutation.mutate(form)
            }}
            sx={{ px: { xs: 1, md: 2 } }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome Completo"
                  value={form.name}
                  onChange={handleChange('name')}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome de Usuário"
                  value={form.username}
                  onChange={handleChange('username')}
                  helperText="Como você será identificado no sistema."
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="E-mail"
                  value={form.email}
                  disabled
                  helperText="E-mail de login (não editável aqui)."
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="CPF"
                  value={form.cpf}
                  onChange={handleChange('cpf')}
                  placeholder="000.000.000-00"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="RG"
                  value={form.rg}
                  onChange={handleChange('rg')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Celular"
                  value={form.celular}
                  onChange={handleChange('celular')}
                  placeholder="(00) 00000-0000"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Nascimento"
                  value={form.data_nascimento}
                  onChange={handleChange('data_nascimento')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Sexo"
                  value={form.sexo}
                  onChange={handleChange('sexo')}
                  SelectProps={{ native: true }}
                >
                  <option value="">Selecione</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Raça"
                  value={form.raca}
                  onChange={handleChange('raca')}
                  SelectProps={{ native: true }}
                >
                  <option value="">Selecione</option>
                  <option value="Branca">Branca</option>
                  <option value="Preta">Preta</option>
                  <option value="Parda">Parda</option>
                  <option value="Amarela">Amarela</option>
                  <option value="Indígena">Indígena</option>
                </TextField>
              </Grid>
              <Grid item xs={12} sx={{ mt: 1 }}>
                <Button
                  variant="contained"
                  type="submit"
                  size="large"
                  fullWidth
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? 'Salvando...' : 'Salvar Dados Pessoais'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* --- ABA 2: ENDEREÇO --- */}
        <TabPanel value={tabValue} index={1}>
          <Box
            component="form"
            onSubmit={e => {
              e.preventDefault()
              if (form) mutation.mutate(form)
            }}
            sx={{ px: { xs: 1, md: 2 } }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Logradouro"
                  value={form.logradouro}
                  onChange={handleChange('logradouro')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label="Número"
                  value={form.numero_endereco}
                  onChange={handleChange('numero_endereco')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Bairro"
                  value={form.bairro}
                  onChange={handleChange('bairro')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Município"
                  value={form.municipio}
                  onChange={handleChange('municipio')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={8}>
                <TextField
                  fullWidth
                  label="Ponto de Referência"
                  value={form.ponto_referencia}
                  onChange={handleChange('ponto_referencia')}
                />
              </Grid>
              <Grid item xs={12} sx={{ mt: 1 }}>
                <Button
                  variant="contained"
                  type="submit"
                  size="large"
                  fullWidth
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? 'Salvando...' : 'Salvar Endereço'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* --- ABA 3: FOTO & SOCIAL --- */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ px: { xs: 1, md: 2 } }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Foto de Perfil
                </Typography>
                <Avatar
                  src={form.foto_url || undefined}
                  sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                />
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="center"
                  spacing={1}
                  sx={{ '& > button': { flex: 1 } }}
                >
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => fileInputGaleriaRef.current?.click()}
                    startIcon={<ImageIcon />}
                  >
                    Galeria
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={abrirCamera}
                    startIcon={<PhotoCamera />}
                  >
                    Câmera
                  </Button>
                </Stack>
                {uploadingAvatar && (
                  <Typography variant="caption">Enviando...</Typography>
                )}
                <input
                  ref={fileInputGaleriaRef}
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={e => {
                    if (e.target.files?.[0]) uploadAvatar(e.target.files[0])
                  }}
                />
              </Grid>
              <Grid item xs={12} md={8}>
                <Stack spacing={2}>
                  <TextField
                    label="Instagram"
                    value={form.instagram_url}
                    onChange={handleChange('instagram_url')}
                    fullWidth
                    placeholder="https://instagram.com/..."
                  />
                  <TextField
                    label="Facebook"
                    value={form.facebook_url}
                    onChange={handleChange('facebook_url')}
                    fullWidth
                    placeholder="https://facebook.com/..."
                  />
                  <Button
                    variant="contained"
                    onClick={() => form && mutation.mutate(form)}
                    sx={{ width: { xs: '100%', sm: 'fit-content' } }}
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending ? 'Salvando...' : 'Salvar Foto & Social'}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* --- ABA 4: SEGURANÇA --- */}
        <TabPanel value={tabValue} index={3}>
          <Box
            component="form"
            sx={{ maxWidth: 500, px: { xs: 1, md: 2 } }}
            onSubmit={e => {
              e.preventDefault()
              handleAlterarSenha()
            }}
          >
            {/* Campo oculto para autocomplete de username */}
            <input
              type="text"
              name="username"
              autoComplete="username"
              value={form.email}
              readOnly
              style={{ display: 'none' }}
            />

            <Alert severity="info" sx={{ mb: 3 }}>
              Para sua segurança, informe sua senha atual para definir uma nova.
            </Alert>
            <Stack spacing={2}>
              <TextField
                label="Senha Atual"
                type={mostrarSenhas.atual ? 'text' : 'password'}
                value={senhaData.atual}
                autoComplete="current-password"
                onChange={e =>
                  setSenhaData({ ...senhaData, atual: e.target.value })
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          setMostrarSenhas({
                            ...mostrarSenhas,
                            atual: !mostrarSenhas.atual,
                          })
                        }
                      >
                        {mostrarSenhas.atual ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Nova Senha"
                type={mostrarSenhas.nova ? 'text' : 'password'}
                value={senhaData.nova}
                autoComplete="new-password"
                onChange={e =>
                  setSenhaData({ ...senhaData, nova: e.target.value })
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          setMostrarSenhas({
                            ...mostrarSenhas,
                            nova: !mostrarSenhas.nova,
                          })
                        }
                      >
                        {mostrarSenhas.nova ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Confirmar Senha"
                type={mostrarSenhas.conf ? 'text' : 'password'}
                value={senhaData.conf}
                autoComplete="new-password"
                onChange={e =>
                  setSenhaData({ ...senhaData, conf: e.target.value })
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          setMostrarSenhas({
                            ...mostrarSenhas,
                            conf: !mostrarSenhas.conf,
                          })
                        }
                      >
                        {mostrarSenhas.conf ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                color="warning"
                type="submit"
                disabled={loadingSenha}
                sx={{ width: { xs: '100%', sm: 'fit-content' } }}
              >
                {loadingSenha ? 'Alterando...' : 'Alterar Senha'}
              </Button>
            </Stack>
          </Box>
        </TabPanel>
      </Paper>

      {/* Modal da câmera */}
      <Dialog
        open={cameraAberta}
        onClose={fecharCamera}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Usar câmera</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              mt: 1,
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: 'black',
              height: { xs: 260, sm: 320 },
            }}
          >
            <video
              ref={el => {
                videoRef.current = el
                if (el && streamRef.current) {
                  try {
                    ;(el as any).srcObject = streamRef.current
                    el
                      .play()
                      .catch(err =>
                        console.warn('[PerfilPage] video.play() falhou:', err),
                      )
                  } catch (e) {
                    console.error(
                      '[PerfilPage] erro ao associar stream ao vídeo:',
                      e,
                    )
                  }
                }
              }}
              autoPlay
              muted
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharCamera}>Cancelar</Button>
          <Button variant="contained" onClick={capturarFotoDaCamera}>
            Tirar foto
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export { PerfilPage }
export default PerfilPage
