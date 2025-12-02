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
} from '@mui/material'
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationCity as LocationCityIcon,
  Map as MapIcon,
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
import { useNotificacao } from '../../hooks/useNotificacao'
import { useSupabase } from '../../contextos/SupabaseContext'

type PerfilApiResponse = {
  id: string
  name: string
  email: string | null
  telefone?: string | null
  cidade?: string | null
  estado?: string | null
  endereco?: string | null
  papel?: string | null
  foto_url?: string | null
}

type AbaPerfil = 'dados' | 'seguranca' | 'foto'

const PerfilPage: React.FC = () => {
  const theme = useTheme()
  const { usuario } = useAuth()
  const { supabase } = useSupabase()
  const { sucesso: toastSucesso, erro: toastErro, info: toastInfo } =
    useNotificacao()
  const queryClient = useQueryClient()

  const [abaAtiva, setAbaAtiva] = useState<AbaPerfil>('dados')

  const [editando, setEditando] = useState(false)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [endereco, setEndereco] = useState('')
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('')
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false)
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false)
  const [mostrarConfirmacaoSenha, setMostrarConfirmacaoSenha] = useState(false)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [fotoArquivo, setFotoArquivo] = useState<File | null>(null)
  const [modalExcluirFotoAberto, setModalExcluirFotoAberto] = useState(false)

  const inputFotoRef = useRef<HTMLInputElement | null>(null)

  const userId = usuario?.id

  const {
    data: perfil,
    isLoading: carregandoPerfil,
    isError: erroPerfil,
  } = useQuery<PerfilApiResponse | null>({
    queryKey: ['perfil', userId],
    enabled: !!userId && !!supabase,
    queryFn: async () => {
      if (!supabase || !userId) return null

      const { data, error } = await supabase
        .from('usuarios')
        .select('id, name, email, telefone, cidade, estado, endereco, foto_url')
        .eq('id', userId)
        .maybeSingle<PerfilApiResponse>()

      if (error) {
        console.error('Erro ao carregar perfil:', error)
        throw error
      }

      return data
    },
  })

  useEffect(() => {
    if (perfil) {
      setNome(perfil.name || '')
      setTelefone(perfil.telefone || '')
      setCidade(perfil.cidade || '')
      setEstado(perfil.estado || '')
      setEndereco(perfil.endereco || '')
      setFotoPreview(perfil.foto_url || null)
    }
  }, [perfil])

  const atualizarPerfilMutation = useMutation({
    mutationFn: async (dados: Partial<PerfilApiResponse>) => {
      if (!supabase || !userId) {
        throw new Error('Sessão inválida. Faça login novamente.')
      }

      const { error } = await supabase
        .from('usuarios')
        .update({
          name: dados.name,
          telefone: dados.telefone,
          cidade: dados.cidade,
          estado: dados.estado,
          endereco: dados.endereco,
        })
        .eq('id', userId)

      if (error) {
        throw error
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['perfil', userId] })
      toastSucesso('Perfil atualizado com sucesso.')
      setEditando(false)
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar perfil:', error)
      toastErro(
        error?.message ||
          'Não foi possível atualizar seu perfil. Tente novamente mais tarde.',
      )
    },
  })

  const atualizarSenhaMutation = useMutation({
    mutationFn: async (dados: { senhaAtual: string; novaSenha: string }) => {
      if (!supabase) {
        throw new Error('Sessão inválida. Faça login novamente.')
      }

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession()

      if (sessionError || !sessionData.session || !sessionData.session.user) {
        throw new Error(
          'Sessão expirada. Faça login novamente para atualizar sua senha.',
        )
      }

      const { data: loginData, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: sessionData.session.user.email ?? '',
          password: dados.senhaAtual,
        })

      if (loginError || !loginData.session) {
        throw new Error('Senha atual incorreta.')
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: dados.novaSenha,
      })

      if (updateError) {
        throw updateError
      }
    },
    onSuccess: () => {
      toastSucesso('Senha atualizada com sucesso.')
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmacaoSenha('')
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar senha:', error)
      toastErro(
        error?.message ||
          'Não foi possível atualizar sua senha. Tente novamente mais tarde.',
      )
    },
  })

  const atualizarFotoMutation = useMutation({
    mutationFn: async (arquivo: File | null) => {
      if (!supabase || !userId) {
        throw new Error('Sessão inválida. Faça login novamente.')
      }

      if (!arquivo) {
        const { error: updateError } = await supabase
          .from('usuarios')
          .update({ foto_url: null })
          .eq('id', userId)

        if (updateError) {
          throw updateError
        }
        return null
      }

      if (arquivo.size > 2 * 1024 * 1024) {
        throw new Error('A foto deve ter no máximo 2MB.')
      }

      const extensao = arquivo.name.split('.').pop()
      const nomeArquivo = `avatar-${userId}.${extensao}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(nomeArquivo, arquivo, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        throw uploadError
      }

      const { data: publicURLData } = supabase.storage
        .from('avatars')
        .getPublicUrl(nomeArquivo)

      const novaFotoUrl = publicURLData.publicUrl

      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ foto_url: novaFotoUrl })
        .eq('id', userId)

      if (updateError) {
        throw updateError
      }

      return novaFotoUrl
    },
    onSuccess: async novaFotoUrl => {
      await queryClient.invalidateQueries({ queryKey: ['perfil', userId] })
      setFotoPreview(novaFotoUrl || null)
      setFotoArquivo(null)
      toastSucesso(
        novaFotoUrl
          ? 'Foto de perfil atualizada com sucesso.'
          : 'Foto de perfil removida com sucesso.',
      )
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar foto:', error)
      toastErro(
        error?.message ||
          'Não foi possível atualizar sua foto de perfil. Tente novamente mais tarde.',
      )
    },
  })

  const handleSalvarDados = () => {
    if (!perfil) return
    atualizarPerfilMutation.mutate({
      id: perfil.id,
      name: nome,
      telefone,
      cidade,
      estado,
      endereco,
    })
  }

  const handleSalvarSenha = () => {
    if (!senhaAtual || !novaSenha || !confirmacaoSenha) {
      toastInfo(
        'Preencha todos os campos de senha para continuar.',
        'Campos obrigatórios',
      )
      return
    }

    if (novaSenha !== confirmacaoSenha) {
      toastErro(
        'A nova senha e a confirmação não conferem.',
        'Verifique os campos de senha.',
      )
      return
    }

    if (novaSenha.length < 6) {
      toastErro(
        'A nova senha deve ter pelo menos 6 caracteres.',
        'Senha muito curta.',
      )
      return
    }

    atualizarSenhaMutation.mutate({
      senhaAtual,
      novaSenha,
    })
  }

  const handleSelecionarFoto = () => {
    inputFotoRef.current?.click()
  }

  const handleFotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toastErro(
        'Selecione um arquivo de imagem válido.',
        'Formato de arquivo inválido',
      )
      return
    }

    setFotoArquivo(file)
    const reader = new FileReader()
    reader.onload = e => {
      setFotoPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSalvarFoto = () => {
    if (fotoArquivo) {
      atualizarFotoMutation.mutate(fotoArquivo)
    }
  }

  const handleRemoverFoto = () => {
    setModalExcluirFotoAberto(true)
  }

  const confirmarRemoverFoto = () => {
    setModalExcluirFotoAberto(false)
    atualizarFotoMutation.mutate(null)
  }

  const avatarInicial = (perfil?.name || 'U').charAt(0).toUpperCase()

  if (!usuario) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Você precisa estar autenticado para acessar a página de perfil.
        </Alert>
      </Box>
    )
  }

  if (carregandoPerfil) {
    return (
      <Box
        sx={{
          p: 3,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (erroPerfil) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Não foi possível carregar seus dados de perfil. Tente novamente mais
          tarde.
        </Alert>
      </Box>
    )
  }

  if (!perfil) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Nenhum dado de perfil encontrado. Entre em contato com a Secretaria.
        </Alert>
      </Box>
    )
  }

  const bloqueado = atualizarPerfilMutation.isPending

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
        Meu perfil
      </Typography>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        {/* Cabeçalho com foto e nome */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          alignItems={{ xs: 'flex-start', md: 'center' }}
        >
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={fotoPreview || undefined}
              alt={perfil.name}
              sx={{
                width: 120,
                height: 120,
                bgcolor: theme.palette.primary.main,
                fontSize: 48,
              }}
            >
              {!fotoPreview && avatarInicial}
            </Avatar>

            <IconButton
              color="primary"
              size="small"
              onClick={handleSelecionarFoto}
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                bgcolor: 'background.paper',
                boxShadow: 1,
              }}
            >
              <PhotoCamera fontSize="small" />
            </IconButton>

            <input
              ref={inputFotoRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFotoChange}
            />
          </Box>

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {perfil.name}
            </Typography>

            <Stack direction="row" spacing={1} sx={{ my: 1, flexWrap: 'wrap' }}>
              <Chip
                icon={<PersonIcon />}
                label={usuario.papel ?? 'Usuário'}
                size="small"
                color="primary"
                variant="outlined"
              />

              {perfil.cidade && perfil.estado && (
                <Chip
                  icon={<LocationCityIcon />}
                  label={`${perfil.cidade} - ${perfil.estado}`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Stack>

            <Typography variant="body2" color="text.secondary">
              Aqui você pode atualizar suas informações pessoais, de contato e
              segurança da conta.
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Button
                variant={editando ? 'outlined' : 'contained'}
                startIcon={editando ? <CloseIcon /> : <EditIcon />}
                onClick={() => setEditando(prev => !prev)}
                size="small"
                sx={{ mr: 1 }}
              >
                {editando ? 'Cancelar edição' : 'Editar dados'}
              </Button>
              {editando && (
                <Button
                  variant="contained"
                  startIcon={
                    atualizarPerfilMutation.isPending ? (
                      <CircularProgress color="inherit" size={18} />
                    ) : (
                      <SaveIcon />
                    )
                  }
                  onClick={handleSalvarDados}
                  size="small"
                  disabled={atualizarPerfilMutation.isPending}
                >
                  {atualizarPerfilMutation.isPending
                    ? 'Salvando...'
                    : 'Salvar alterações'}
                </Button>
              )}
            </Box>
          </Box>
        </Stack>

        <Box sx={{ mt: 3 }}>
          <Tabs
            value={abaAtiva}
            onChange={(_e, v) => setAbaAtiva(v)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<PersonIcon />} label="Dados pessoais" value="dados" />
            <Tab icon={<SecurityIcon />} label="Segurança" value="seguranca" />
            <Tab icon={<ImageIcon />} label="Foto de perfil" value="foto" />
          </Tabs>

          {abaAtiva === 'dados' && (
            <Box sx={{ mt: 3 }}>
              <Stack spacing={2}>
                <TextField
                  label="Nome completo"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  fullWidth
                  disabled={!editando || bloqueado}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="E-mail"
                  value={perfil.email ?? ''}
                  fullWidth
                  disabled
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />

                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={2}
                >
                  <TextField
                    label="Telefone"
                    value={telefone}
                    onChange={e => setTelefone(e.target.value)}
                    fullWidth
                    disabled={!editando || bloqueado}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    label="Cidade"
                    value={cidade}
                    onChange={e => setCidade(e.target.value)}
                    fullWidth
                    disabled={!editando || bloqueado}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationCityIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    label="Estado"
                    value={estado}
                    onChange={e => setEstado(e.target.value)}
                    fullWidth
                    disabled={!editando || bloqueado}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MapIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Stack>

                <TextField
                  label="Endereço"
                  value={endereco}
                  onChange={e => setEndereco(e.target.value)}
                  fullWidth
                  disabled={!editando || bloqueado}
                  multiline
                  minRows={2}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <HomeIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Stack>
            </Box>
          )}

          {abaAtiva === 'seguranca' && (
            <Box sx={{ mt: 3 }}>
              <Stack spacing={2}>
                <Alert severity="info">
                  Por segurança, sua senha não é exibida. Para alterá-la,
                  preencha os campos abaixo.
                </Alert>

                <TextField
                  label="Senha atual"
                  type={mostrarSenhaAtual ? 'text' : 'password'}
                  value={senhaAtual}
                  onChange={e => setSenhaAtual(e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SecurityIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setMostrarSenhaAtual(prev => !prev)
                          }
                        >
                          {mostrarSenhaAtual ? (
                            <VisibilityOff fontSize="small" />
                          ) : (
                            <Visibility fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={2}
                >
                  <TextField
                    label="Nova senha"
                    type={mostrarNovaSenha ? 'text' : 'password'}
                    value={novaSenha}
                    onChange={e => setNovaSenha(e.target.value)}
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() =>
                              setMostrarNovaSenha(prev => !prev)
                            }
                          >
                            {mostrarNovaSenha ? (
                              <VisibilityOff fontSize="small" />
                            ) : (
                              <Visibility fontSize="small" />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    label="Confirmar nova senha"
                    type={mostrarConfirmacaoSenha ? 'text' : 'password'}
                    value={confirmacaoSenha}
                    onChange={e => setConfirmacaoSenha(e.target.value)}
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() =>
                              setMostrarConfirmacaoSenha(prev => !prev)
                            }
                          >
                            {mostrarConfirmacaoSenha ? (
                              <VisibilityOff fontSize="small" />
                            ) : (
                              <Visibility fontSize="small" />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Stack>

                <Box>
                  <Button
                    variant="contained"
                    startIcon={
                      atualizarSenhaMutation.isPending ? (
                        <CircularProgress color="inherit" size={18} />
                      ) : (
                        <SaveIcon />
                      )
                    }
                    onClick={handleSalvarSenha}
                    disabled={atualizarSenhaMutation.isPending}
                  >
                    {atualizarSenhaMutation.isPending
                      ? 'Atualizando senha...'
                      : 'Atualizar senha'}
                  </Button>
                </Box>
              </Stack>
            </Box>
          )}

          {abaAtiva === 'foto' && (
            <Box sx={{ mt: 3 }}>
              <Stack spacing={2}>
                <Alert severity="info">
                  Selecione uma foto com boa iluminação e enquadramento do
                  rosto. O tamanho máximo é de 2MB.
                </Alert>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Avatar
                    src={fotoPreview || undefined}
                    alt={perfil.name}
                    sx={{
                      width: 120,
                      height: 120,
                      bgcolor: theme.palette.primary.main,
                      fontSize: 48,
                    }}
                  >
                    {!fotoPreview && avatarInicial}
                  </Avatar>

                  <Stack spacing={1}>
                    <Button
                      variant="outlined"
                      startIcon={<PhotoIcon />}
                      onClick={handleSelecionarFoto}
                    >
                      Selecionar foto
                    </Button>
                    {fotoArquivo && (
                      <Typography variant="caption" color="text.secondary">
                        Arquivo selecionado: {fotoArquivo.name}
                      </Typography>
                    )}
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        startIcon={
                          atualizarFotoMutation.isPending ? (
                            <CircularProgress color="inherit" size={18} />
                          ) : (
                            <SaveIcon />
                          )
                        }
                        onClick={handleSalvarFoto}
                        disabled={
                          !fotoArquivo || atualizarFotoMutation.isPending
                        }
                      >
                        {atualizarFotoMutation.isPending
                          ? 'Salvando foto...'
                          : 'Salvar foto'}
                      </Button>
                      {fotoPreview && (
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<CameraswitchIcon />}
                          onClick={handleRemoverFoto}
                        >
                          Remover foto
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                </Box>
              </Stack>
            </Box>
          )}
        </Box>
      </Paper>

      <Dialog
        open={modalExcluirFotoAberto}
        onClose={() => setModalExcluirFotoAberto(false)}
      >
        <DialogTitle>Remover foto de perfil</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Tem certeza de que deseja remover sua foto de perfil? Você poderá
            adicionar outra foto mais tarde.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalExcluirFotoAberto(false)}>
            Cancelar
          </Button>
          <Button onClick={confirmarRemoverFoto} color="error">
            Remover
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PerfilPage
