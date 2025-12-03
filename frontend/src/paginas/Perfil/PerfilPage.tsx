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
  useMediaQuery,
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
  Cameraswitch as CameraswitchIcon,
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
      {value === index && (
        <Box sx={{ py: 3, width: '100%', boxSizing: 'border-box' }}>{children}</Box>
      )}
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

type ToastSeverity = 'success' | 'error' | 'warning'

// ---------------- Componente principal ----------------

const PerfilPage: React.FC = () => {
  const theme = useTheme()
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))

  const { usuario } = useAuth()
  const { supabase } = useSupabase()
  const queryClient = useQueryClient()

  const [tabValue, setTabValue] = useState(0)
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

  // Upload avatar
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputGaleriaRef = useRef<HTMLInputElement | null>(null)
  const fileInputCameraMobileRef = useRef<HTMLInputElement | null>(null)

  // Câmera desktop (WebRTC)
  const [cameraAberta, setCameraAberta] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraErro, setCameraErro] = useState<string | null>(null)
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null)

  // Senha
  const [senhaData, setSenhaData] = useState({ atual: '', nova: '', conf: '' })
  const [mostrarSenhas, setMostrarSenhas] = useState({
    atual: false,
    nova: false,
    conf: false,
  })
  const [loadingSenha, setLoadingSenha] = useState(false)

  // --------- Query perfil ---------

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
        audio.play().catch(() => {})
      }
    }
  }, [toast])

  // --------- Handlers formulário ---------

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) =>
    setTabValue(newValue)

  const handleChange =
    (campo: keyof FormPerfil) => (event: React.ChangeEvent<HTMLInputElement>) => {
      let valor = event.target.value
      if (campo === 'cpf') valor = masks.cpf(valor)
      if (campo === 'celular') valor = masks.celular(valor)
      setForm(prev => (prev ? { ...prev, [campo]: valor } : prev))
    }

  // --------- Mutation salvar perfil ---------

  const mutation = useMutation({
    mutationFn: async (dados: FormPerfil) => {
      if (!usuario || !supabase) throw new Error('Erro de conexão com Supabase.')

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
        .select('*')

      if (error) throw error
      if (!data || data.length === 0) {
        throw new Error(
          `Nenhum registro foi atualizado na tabela "usuarios" para o id ${usuario.id}.`,
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
      queryClient.invalidateQueries({ queryKey: ['perfil-usuario', usuario?.id] })
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

  // --------- Câmera desktop (WebRTC) ---------

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      ;(videoRef.current as any).srcObject = null
    }
  }

  const abrirCameraDesktop = () => {
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'

    if (!window.isSecureContext && !isLocalhost) {
      showToast(
        'warning',
        'Para usar a câmera, acesse o sistema via HTTPS ou em localhost.',
      )
      return
    }

    setCameraErro(null)
    setCameraAberta(true)
  }

  const fecharCamera = () => {
    setCameraAberta(false)
    setCameraErro(null)
    stopStream()
  }

  const alternarCamera = () => {
    if (videoDevices.length < 2) {
      showToast(
        'warning',
        'Não há outra câmera disponível neste dispositivo para alternar.',
      )
      return
    }

    const atualIndex = videoDevices.findIndex(d => d.deviceId === currentDeviceId)
    const proximoIndex =
      atualIndex === -1
        ? 1
        : (atualIndex + 1) % videoDevices.length

    setCurrentDeviceId(videoDevices[proximoIndex].deviceId)
  }

  useEffect(() => {
    const iniciarCamera = async () => {
      if (!cameraAberta || isSmall) return

      if (!navigator.mediaDevices?.getUserMedia) {
        const msg = 'Navegador sem suporte a câmera.'
        setCameraErro(msg)
        showToast('warning', msg)
        return
      }

      try {
        stopStream()

        const constraints: MediaStreamConstraints = currentDeviceId
          ? {
              video: {
                deviceId: { exact: currentDeviceId },
              } as any,
            }
          : { video: true }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        streamRef.current = stream

        if (!videoDevices.length) {
          const devices = await navigator.mediaDevices.enumerateDevices()
          const vids = devices.filter(d => d.kind === 'videoinput')
          setVideoDevices(vids)

          const track = stream.getVideoTracks()[0]
          const settings = track.getSettings()
          if (settings.deviceId) {
            setCurrentDeviceId(settings.deviceId)
          }
        }

        if (videoRef.current) {
          ;(videoRef.current as any).srcObject = stream
          try {
            await videoRef.current.play()
          } catch (err) {
            console.warn('[PerfilPage] video.play() falhou:', err)
          }
        }

        setCameraErro(null)
      } catch (e: any) {
        console.error('[PerfilPage] erro ao acessar câmera:', e)

        let msg = 'Erro ao acessar câmera.'
        const name = e?.name || e?.constructor?.name

        if (name === 'NotAllowedError' || name === 'SecurityError') {
          msg =
            'Permissão de câmera negada ou bloqueada. Verifique as permissões do navegador.'
        } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
          msg = 'Nenhuma câmera compatível foi encontrada neste dispositivo.'
        } else if (
          window.location.protocol !== 'https:' &&
          window.location.hostname !== 'localhost'
        ) {
          msg = 'A câmera exige HTTPS ou localhost. Verifique a URL de acesso.'
        }

        setCameraErro(msg)
        showToast('error', msg)
      }
    }

    iniciarCamera()

    return () => {
      if (!cameraAberta) {
        stopStream()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraAberta, currentDeviceId, isSmall])

  useEffect(() => {
    return () => {
      stopStream()
    }
  }, [])

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

  // --------- Upload avatar ---------

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

  const handleCliqueCamera = () => {
    if (isSmall) {
      fileInputCameraMobileRef.current?.click()
    } else {
      abrirCameraDesktop()
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

  // --------- Loading / erro global ---------

  const containerSx = {
    maxWidth: { xs: '100%', md: 720 }, // xs ocupa 100%, md+ mantém 720
    mx: 'auto',
    p: { xs: 0, md: 2 },               // sem padding lateral em xs
    minHeight: '60vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxSizing: 'border-box' as const,
  }

  if (isLoading || !form || !perfil) {
    return (
      <Box sx={containerSx}>
        <CircularProgress />
      </Box>
    )
  }

  if (isError) {
    return (
      <Box sx={containerSx}>
        <Alert severity="error" sx={{ width: '100%' }}>
          Erro ao carregar perfil.
        </Alert>
      </Box>
    )
  }

  // --------- Render ---------

  return (
    <Box
      sx={{
        maxWidth: { xs: '100%', md: 720 }, // xs ocupa toda a largura, md+ igual antes
        mx: 'auto',
        p: { xs: 0, md: 2 },
        pb: 8,
        boxSizing: 'border-box',
      }}
    >
      {/* Toast */}
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

      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          p: { xs: 0.75, sm: 1.5 },
          mb: 2,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          bgcolor: theme.palette.primary.main,
          color: 'white',
          borderRadius: 3,
          boxSizing: 'border-box',
        }}
      >
        <Avatar
          src={form.foto_url || undefined}
          sx={{
            width: 60,
            height: 60,
            border: '3px solid white',
            boxShadow: 2,
            bgcolor: theme.palette.primary.dark,
          }}
        >
          {form.name.charAt(0)}
        </Avatar>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{ wordBreak: 'break-word', fontSize: { xs: 15, sm: 17 } }}
          >
            {form.name}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              opacity: 0.9,
              wordBreak: 'break-all',
              fontSize: { xs: 11, sm: 13 },
            }}
          >
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

      {/* Card principal com abas e conteúdo */}
      <Paper
        variant="outlined"
        sx={{
          width: '100%',
          borderRadius: 3,
          boxSizing: 'border-box',
          // em telas grandes continua escondendo overflow,
          // em telas pequenas NÃO corta nada
          overflow: { xs: 'visible', md: 'hidden' },
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant={isSmall ? 'fullWidth' : 'scrollable'}
          scrollButtons={isSmall ? false : 'auto'}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: theme.palette.background.default,
          }}
        >
          <Tab
            wrapped
            icon={<PersonIcon />}
            iconPosition="start"
            label="Dados Pessoais"
            sx={{ fontSize: { xs: 11, sm: 13 }, minHeight: 40 }}
          />
          <Tab
            wrapped
            icon={<HomeIcon />}
            iconPosition="start"
            label="Endereço"
            sx={{ fontSize: { xs: 11, sm: 13 }, minHeight: 40 }}
          />
          <Tab
            wrapped
            icon={<PhotoIcon />}
            iconPosition="start"
            label="Foto / Social"
            sx={{ fontSize: { xs: 11, sm: 13 }, minHeight: 40 }}
          />
          <Tab
            wrapped
            icon={<SecurityIcon />}
            iconPosition="start"
            label="Segurança"
            sx={{ fontSize: { xs: 11, sm: 13 }, minHeight: 40 }}
          />
        </Tabs>

        {/* Dados Pessoais */}
        <TabPanel value={tabValue} index={0}>
          <Box
            component="form"
            onSubmit={e => {
              e.preventDefault()
              if (form) mutation.mutate(form)
            }}
            sx={{
              px: { xs: 1.5, md: 3 },
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <Grid container spacing={2} sx={{ width: '100%', m: 0 }}>
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

        {/* Endereço */}
        <TabPanel value={tabValue} index={1}>
          <Box
            component="form"
            onSubmit={e => {
              e.preventDefault()
              if (form) mutation.mutate(form)
            }}
            sx={{
              px: { xs: 1.5, md: 3 },
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <Grid container spacing={2} sx={{ width: '100%', m: 0 }}>
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

        {/* Foto & Social */}
        <TabPanel value={tabValue} index={2}>
          <Box
            sx={{
              px: { xs: 1.5, md: 3 },
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <Grid container spacing={3} sx={{ width: '100%', m: 0 }}>
              <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Foto de Perfil
                </Typography>
                <Avatar
                  src={form.foto_url || undefined}
                  sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }}
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
                    onClick={handleCliqueCamera}
                    startIcon={<PhotoCamera />}
                  >
                    Câmera
                  </Button>
                </Stack>
                {uploadingAvatar && (
                  <Typography variant="caption">Enviando...</Typography>
                )}

                {/* Galeria */}
                <input
                  ref={fileInputGaleriaRef}
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={e => {
                    if (e.target.files?.[0]) uploadAvatar(e.target.files[0])
                  }}
                />

                {/* Câmera nativa (mobile) */}
                <input
                  ref={fileInputCameraMobileRef}
                  type="file"
                  hidden
                  accept="image/*"
                  capture="environment"
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

        {/* Segurança */}
        <TabPanel value={tabValue} index={3}>
          <Box
            component="form"
            sx={{
              px: { xs: 1.5, md: 3 },
              pb: 2,
              width: '100%',
              maxWidth: 500,
              boxSizing: 'border-box',
            }}
            onSubmit={e => {
              e.preventDefault()
              handleAlterarSenha()
            }}
          >
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

      {/* Modal da câmera - apenas desktop */}
      {!isSmall && (
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
                position: 'relative',
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {cameraErro && (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: 2,
                    textAlign: 'center',
                    color: 'white',
                    bgcolor: 'rgba(0,0,0,0.6)',
                  }}
                >
                  <Typography variant="body2">{cameraErro}</Typography>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions
            sx={{
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1,
              px: 3,
              pb: 2,
            }}
          >
            <Button onClick={fecharCamera}>Cancelar</Button>

            <Button
              onClick={alternarCamera}
              startIcon={<CameraswitchIcon />}
              disabled={videoDevices.length < 2}
            >
              Trocar câmera
            </Button>

            <Button variant="contained" onClick={capturarFotoDaCamera}>
              Tirar foto
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  )
}

export { PerfilPage }
export default PerfilPage
