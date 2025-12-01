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
  Grid,
} from '@mui/material'
import {
  Image as ImageIcon,
  PhotoCamera,
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Home as HomeIcon,
  Security as SecurityIcon,
  PhotoCameraFront as PhotoIcon
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '../../contextos/AuthContext'
import { useSupabase } from '../../contextos/SupabaseContext'

// --- Tipagens ---
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

// --- Helpers e Componentes Auxiliares ---
interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} {...other} style={{ width: '100%' }}>
      {value === index && <Box sx={{ py: 3, px: 1 }}>{children}</Box>}
    </div>
  )
}

const masks = {
  cpf: (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').substring(0, 14),
  celular: (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').substring(0, 15),
}

const mapTipoUsuario: Record<number, string> = {
  1: 'Diretor', 2: 'Professor', 3: 'Coordenador', 4: 'Secretário', 5: 'Aluno', 6: 'Administrador',
}

const slugify = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_')

const PerfilPage: React.FC = () => {
  const theme = useTheme()
  const { usuario } = useAuth()
  const { supabase } = useSupabase()
  const queryClient = useQueryClient()

  // States
  const [tabValue, setTabValue] = useState(0)
  const [form, setForm] = useState<FormPerfil | null>(null)
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null)
  const [mensagemErro, setMensagemErro] = useState<string | null>(null)

  // Camera & Upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputGaleriaRef = useRef<HTMLInputElement | null>(null)
  const [cameraAberta, setCameraAberta] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Senha
  const [senhaData, setSenhaData] = useState({ atual: '', nova: '', conf: '' })
  const [mostrarSenhas, setMostrarSenhas] = useState({ atual: false, nova: false, conf: false })
  const [loadingSenha, setLoadingSenha] = useState(false)

  // Query Data
  const { data: perfil, isLoading, isError, error } = useQuery({
    queryKey: ['perfil-usuario-editar', usuario?.id],
    enabled: !!usuario && !!supabase,
    queryFn: async (): Promise<UsuarioPerfil | null> => {
      if (!usuario || !supabase) return null
      const { data, error: err } = await supabase.from('usuarios').select('*').eq('id', usuario.id).maybeSingle()
      if (err) throw err
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

  // Handlers
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => setTabValue(newValue)

  const handleChange = (campo: keyof FormPerfil) => (event: React.ChangeEvent<HTMLInputElement>) => {
    let valor = event.target.value
    if (campo === 'cpf') valor = masks.cpf(valor)
    if (campo === 'celular') valor = masks.celular(valor)
    setForm(prev => (prev ? { ...prev, [campo]: valor } : prev))
  }

  // Mutation Update
  const mutation = useMutation({
    mutationFn: async (dados: FormPerfil) => {
      if (!usuario || !supabase) throw new Error('Erro conexão')
      const payload = {
        ...dados,
        cpf: dados.cpf || null,
        updated_at: new Date().toISOString()
      }
      const { error } = await supabase.from('usuarios').update(payload).eq('id', usuario.id)
      if (error) throw error
      return payload
    },
    onSuccess: () => {
      setMensagemSucesso('Perfil atualizado com sucesso!')
      setMensagemErro(null)
      queryClient.invalidateQueries({ queryKey: ['perfil-usuario'] })
    },
    onError: () => setMensagemErro('Erro ao salvar.')
  })

  // Camera Logic
  useEffect(() => {
    if (cameraAberta && videoRef.current && streamRef.current) {
      ;(videoRef.current as any).srcObject = streamRef.current
    }
  }, [cameraAberta])

  const abrirCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return setMensagemErro('Navegador sem suporte a câmera.')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      setCameraAberta(true)
    } catch { setMensagemErro('Erro ao acessar câmera.') }
  }

  const fecharCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraAberta(false)
  }

  const capturarFotoDaCamera = () => {
    if (!videoRef.current || !form) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(blob => {
      if (!blob) return
      uploadAvatar(new File([blob], 'foto-camera.jpg', { type: 'image/jpeg' }))
      fecharCamera()
    }, 'image/jpeg', 0.9)
  }

  // Upload Logic
  const uploadAvatar = async (file: File) => {
    if (!supabase || !usuario || !form) return
    setUploadingAvatar(true)
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('Máximo 5MB.')
      const bucket = 'avatars'
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const caminho = `${slugify(usuario.email || 'user')}/${Date.now()}.${ext}`
      
      const { error: upErr } = await supabase.storage.from(bucket).upload(caminho, file, { upsert: true })
      if (upErr) throw upErr
      
      const { data } = supabase.storage.from(bucket).getPublicUrl(caminho)
      const novoForm = { ...form, foto_url: data.publicUrl }
      setForm(novoForm)
      mutation.mutate(novoForm)
      setMensagemSucesso('Foto atualizada!')
    } catch (e) { setMensagemErro('Erro ao enviar foto.') }
    finally { setUploadingAvatar(false) }
  }

  // Senha Logic
  const handleAlterarSenha = async () => {
    if (!supabase || !usuario) return
    setMensagemErro(null); setMensagemSucesso(null);
    if (!senhaData.atual || !senhaData.nova || !senhaData.conf) return setMensagemErro('Preencha todos os campos.')
    if (senhaData.nova !== senhaData.conf) return setMensagemErro('Senhas não conferem.')
    if (senhaData.nova.length < 6) return setMensagemErro('Mínimo 6 caracteres.')

    setLoadingSenha(true)
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email: usuario.email!, password: senhaData.atual })
      if (loginError) throw new Error('Senha atual incorreta.')
      
      const { error: upError } = await supabase.auth.updateUser({ password: senhaData.nova })
      if (upError) throw upError

      setMensagemSucesso('Senha alterada com sucesso!')
      setSenhaData({ atual: '', nova: '', conf: '' })
    } catch (e: any) { setMensagemErro(e.message) }
    finally { setLoadingSenha(false) }
  }

  if (isLoading || !form || !perfil) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>
  if (isError) return <Alert severity="error">Erro ao carregar perfil.</Alert>

// FIM DA PARTE 1
return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', pb: 5 }}>
      {/* Header Visual */}
      <Paper 
        elevation={0} 
        sx={{ 
            p: 3, mb: 3, 
            display: 'flex', alignItems: 'center', gap: 2, 
            bgcolor: theme.palette.primary.main, color: 'white',
            borderRadius: 2
        }}
      >
        <Avatar
          src={form.foto_url || undefined}
          sx={{ width: 80, height: 80, border: '3px solid white', boxShadow: 2, bgcolor: theme.palette.primary.dark }}
        >
            {form.name.charAt(0)}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" fontWeight={700}>{form.name}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>{form.email}</Typography>
            <Chip 
                label={mapTipoUsuario[perfil.id_tipo_usuario] || 'Usuário'} 
                size="small" 
                sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }} 
            />
        </Box>
      </Paper>

      {/* Alertas */}
      <Stack spacing={2} sx={{ mb: 2 }}>
        {mensagemSucesso && <Alert severity="success" onClose={() => setMensagemSucesso(null)}>{mensagemSucesso}</Alert>}
        {mensagemErro && <Alert severity="error" onClose={() => setMensagemErro(null)}>{mensagemErro}</Alert>}
      </Stack>

      {/* Sistema de Abas */}
      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: theme.palette.background.default }}
        >
            <Tab icon={<PersonIcon />} iconPosition="start" label="Dados Pessoais" />
            <Tab icon={<HomeIcon />} iconPosition="start" label="Endereço" />
            <Tab icon={<PhotoIcon />} iconPosition="start" label="Foto & Social" />
            <Tab icon={<SecurityIcon />} iconPosition="start" label="Segurança" />
        </Tabs>

        {/* --- ABA 1: DADOS PESSOAIS --- */}
        <TabPanel value={tabValue} index={0}>
             <Box component="form" onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} sx={{ px: { xs: 0, md: 2 } }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Nome Completo" value={form.name} onChange={handleChange('name')} required />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField fullWidth label="E-mail" value={form.email} disabled helperText="E-mail de login." />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField fullWidth label="CPF" value={form.cpf} onChange={handleChange('cpf')} placeholder="000.000.000-00" />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField fullWidth label="RG" value={form.rg} onChange={handleChange('rg')} />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField fullWidth label="Celular" value={form.celular} onChange={handleChange('celular')} placeholder="(00) 00000-0000" />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField fullWidth type="date" label="Nascimento" value={form.data_nascimento} onChange={handleChange('data_nascimento')} InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid item xs={12} md={3}>
                         <TextField select fullWidth label="Sexo" value={form.sexo} onChange={handleChange('sexo')} SelectProps={{ native: true }}>
                             <option value="">Selecione</option>
                             <option value="Masculino">Masculino</option>
                             <option value="Feminino">Feminino</option>
                             <option value="Outro">Outro</option>
                         </TextField>
                    </Grid>
                    <Grid item xs={12} md={3}>
                         <TextField select fullWidth label="Raça" value={form.raca} onChange={handleChange('raca')} SelectProps={{ native: true }}>
                             <option value="">Selecione</option>
                             <option value="Branca">Branca</option>
                             <option value="Preta">Preta</option>
                             <option value="Parda">Parda</option>
                             <option value="Amarela">Amarela</option>
                             <option value="Indígena">Indígena</option>
                         </TextField>
                    </Grid>
                    <Grid item xs={12} sx={{ mt: 2 }}>
                        <Button variant="contained" type="submit" size="large" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Salvando...' : 'Salvar Dados Pessoais'}
                        </Button>
                    </Grid>
                </Grid>
             </Box>
        </TabPanel>

        {/* --- ABA 2: ENDEREÇO --- */}
        <TabPanel value={tabValue} index={1}>
            <Box component="form" onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} sx={{ px: { xs: 0, md: 2 } }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Logradouro" value={form.logradouro} onChange={handleChange('logradouro')} />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField fullWidth label="Número" value={form.numero_endereco} onChange={handleChange('numero_endereco')} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField fullWidth label="Bairro" value={form.bairro} onChange={handleChange('bairro')} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField fullWidth label="Município" value={form.municipio} onChange={handleChange('municipio')} />
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <TextField fullWidth label="Ponto de Referência" value={form.ponto_referencia} onChange={handleChange('ponto_referencia')} />
                    </Grid>
                    <Grid item xs={12} sx={{ mt: 2 }}>
                         <Button variant="contained" type="submit" size="large" disabled={mutation.isPending}>
                            Salvar Endereço
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        </TabPanel>
{/* FIM PARTE 2 */}
{/* --- ABA 3: FOTO E SOCIAL --- */}
        <TabPanel value={tabValue} index={2}>
             <Box sx={{ px: { xs: 0, md: 2 } }}>
                <Grid container spacing={4}>
                    <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                         <Typography variant="subtitle2" gutterBottom>Foto de Perfil</Typography>
                         <Avatar src={form.foto_url || undefined} sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }} />
                         <Stack direction="row" justifyContent="center" spacing={1}>
                             <Button variant="outlined" size="small" onClick={() => fileInputGaleriaRef.current?.click()} startIcon={<ImageIcon />}>
                                 Galeria
                             </Button>
                             <Button variant="outlined" size="small" onClick={abrirCamera} startIcon={<PhotoCamera />}>
                                 Câmera
                             </Button>
                         </Stack>
                         {uploadingAvatar && <Typography variant="caption">Enviando...</Typography>}
                         <input ref={fileInputGaleriaRef} type="file" hidden accept="image/*" onChange={(e) => { if(e.target.files?.[0]) uploadAvatar(e.target.files[0]) }} />
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <Stack spacing={3}>
                            <TextField label="Nome de Usuário (Username)" value={form.username} onChange={handleChange('username')} fullWidth helperText="Usado para identificação no sistema." />
                            <TextField label="Instagram" value={form.instagram_url} onChange={handleChange('instagram_url')} fullWidth placeholder="https://instagram.com/..." />
                            <TextField label="Facebook" value={form.facebook_url} onChange={handleChange('facebook_url')} fullWidth placeholder="https://facebook.com/..." />
                            <Button variant="contained" onClick={() => mutation.mutate(form)} sx={{ width: 'fit-content' }}>
                                Salvar Social
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>
             </Box>
        </TabPanel>

        {/* --- ABA 4: SEGURANÇA --- */}
        <TabPanel value={tabValue} index={3}>
            <Box component="form" sx={{ maxWidth: 500, px: { xs: 0, md: 2 } }}>
                <Alert severity="info" sx={{ mb: 3 }}>
                    Para sua segurança, informe sua senha atual para definir uma nova.
                </Alert>
                <Stack spacing={3}>
                    <TextField 
                        label="Senha Atual" 
                        type={mostrarSenhas.atual ? 'text' : 'password'}
                        value={senhaData.atual}
                        onChange={(e) => setSenhaData({...senhaData, atual: e.target.value})}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setMostrarSenhas({...mostrarSenhas, atual: !mostrarSenhas.atual})}>
                                        {mostrarSenhas.atual ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    <TextField 
                        label="Nova Senha" 
                        type={mostrarSenhas.nova ? 'text' : 'password'}
                        value={senhaData.nova}
                        onChange={(e) => setSenhaData({...senhaData, nova: e.target.value})}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setMostrarSenhas({...mostrarSenhas, nova: !mostrarSenhas.nova})}>
                                        {mostrarSenhas.nova ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                     <TextField 
                        label="Confirmar Senha" 
                        type={mostrarSenhas.conf ? 'text' : 'password'}
                        value={senhaData.conf}
                        onChange={(e) => setSenhaData({...senhaData, conf: e.target.value})}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setMostrarSenhas({...mostrarSenhas, conf: !mostrarSenhas.conf})}>
                                        {mostrarSenhas.conf ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    <Button variant="contained" color="warning" onClick={handleAlterarSenha} disabled={loadingSenha}>
                        {loadingSenha ? 'Alterando...' : 'Alterar Senha'}
                    </Button>
                </Stack>
            </Box>
        </TabPanel>
      </Paper>
      
      {/* Modal da câmera */}
      <Dialog open={cameraAberta} onClose={fecharCamera} fullWidth maxWidth="sm">
        <DialogTitle>Usar câmera</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, borderRadius: 2, overflow: 'hidden', bgcolor: 'black', height: 300 }}>
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharCamera}>Cancelar</Button>
          <Button variant="contained" onClick={capturarFotoDaCamera}>Tirar foto</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export { PerfilPage }
export default PerfilPage