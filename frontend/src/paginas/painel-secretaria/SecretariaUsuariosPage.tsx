// frontend/src/paginas/painel-secretaria/SecretariaUsuariosPage.tsx
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
  Checkbox,
  ListItemText,
  CircularProgress,
} from '@mui/material'
import { green } from '@mui/material/colors'

import PersonAddIcon from '@mui/icons-material/PersonAdd'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import LockResetIcon from '@mui/icons-material/LockReset'
import BlockIcon from '@mui/icons-material/Block'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

import { useSupabase } from '../../contextos/SupabaseContext'
import { useNotificacaoContext } from '../../contextos/NotificacaoContext'
import type { PapelUsuario } from '../../contextos/AuthContext'

const SENHA_PADRAO_NOVO_USUARIO = 'Ceja@2024'
const TIPO_USUARIO_PROFESSOR_ID = 2

type UsuarioStatus = 'ATIVO' | 'INATIVO' | 'PENDENTE'

interface UsuarioRow {
  id: string
  id_tipo_usuario: number | null
  name: string
  username: string | null
  email: string
  data_nascimento: string | null
  cpf: string | null
  rg: string | null
  celular: string | null
  logradouro: string | null
  numero_endereco: string | null
  bairro: string | null
  municipio: string | null
  ponto_referencia: string | null
  facebook_url: string | null
  instagram_url: string | null
  status: string | null
}

interface TipoUsuarioRow {
  id_tipo_usuario: number
  nome: string
}

interface SalaRow {
  id_sala: number
  nome: string
  is_ativa: boolean
}

interface ProfessorRow {
  id_professor: number
  user_id: string
  matricula_professor: string | null
}

interface ProfessorSalaRow {
  id_professor: number
  id_sala: number
  ativo: boolean
}

interface UsuarioLista {
  id: string
  nome: string
  username: string | null
  email: string
  id_tipo_usuario: number | null
  dataNascimento: string | null
  cpf: string | null
  rg: string | null
  celular: string | null
  logradouro: string | null
  numeroEndereco: string | null
  bairro: string | null
  municipio: string | null
  pontoReferencia: string | null
  facebookUrl: string | null
  instagramUrl: string | null
  papel?: PapelUsuario
  papelDescricao: string
  status: UsuarioStatus
  professorId?: number
  matriculaProfessor?: string | null
  salasProfessor?: SalaRow[]
}

const SecretariaUsuariosPage: FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const { supabase } = useSupabase()
  const { sucesso, aviso, erro } = useNotificacaoContext()

  const [usuarios, setUsuarios] = useState<UsuarioLista[]>([])
  const [tiposUsuario, setTiposUsuario] = useState<TipoUsuarioRow[]>([])
  const [salas, setSalas] = useState<SalaRow[]>([])
  const [, setProfessores] = useState<ProfessorRow[]>([])
  const [professoresSalas, setProfessoresSalas] = useState<ProfessorSalaRow[]>(
    [],
  )
  const [carregando, setCarregando] = useState<boolean>(true)
  const [salvando, setSalvando] = useState<boolean>(false)

  const [busca, setBusca] = useState<string>('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<UsuarioLista | null>(null)

  // Form – dados básicos
  const [formNome, setFormNome] = useState<string>('')
  const [formUsername, setFormUsername] = useState<string>('')
  const [formEmail, setFormEmail] = useState<string>('')
  const [formPapelId, setFormPapelId] = useState<string>('')

  // Form – dados pessoais/contato
  const [formDataNascimento, setFormDataNascimento] = useState<string>('')
  const [formCpf, setFormCpf] = useState<string>('')
  const [formRg, setFormRg] = useState<string>('')
  const [formCelular, setFormCelular] = useState<string>('')

  // Form – endereço
  const [formLogradouro, setFormLogradouro] = useState<string>('')
  const [formNumeroEndereco, setFormNumeroEndereco] = useState<string>('')
  const [formBairro, setFormBairro] = useState<string>('')
  const [formMunicipio, setFormMunicipio] = useState<string>('')
  const [formPontoReferencia, setFormPontoReferencia] = useState<string>('')

  // Form – redes sociais
  const [formFacebookUrl, setFormFacebookUrl] = useState<string>('')
  const [formInstagramUrl, setFormInstagramUrl] = useState<string>('')

  // Form – dados de professor
  const [formMatriculaProfessor, setFormMatriculaProfessor] =
    useState<string>('')
  const [formSalasProfessorIds, setFormSalasProfessorIds] = useState<number[]>(
    [],
  )

  // Exclusão
  const [dialogExcluirAberto, setDialogExcluirAberto] =
    useState<boolean>(false)
  const [usuarioParaExcluir, setUsuarioParaExcluir] =
    useState<UsuarioLista | null>(null)

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // ======= Helpers de mapeamento =======

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

  const isProfessorTipo = (idTipoUsuario: number | null | undefined): boolean =>
    idTipoUsuario === TIPO_USUARIO_PROFESSOR_ID

  const isProfessorForm = (): boolean =>
    formPapelId !== '' && Number(formPapelId) === TIPO_USUARIO_PROFESSOR_ID

  // ======= Carregamento de dados =======

  const carregarDados = async () => {
    if (!supabase) return

    try {
      setCarregando(true)

      const [
        { data: usuariosData, error: usuariosError },
        { data: tiposData, error: tiposError },
        { data: salasData, error: salasError },
        { data: professoresData, error: professoresError },
        { data: profSalasData, error: profSalasError },
      ] = await Promise.all([
        supabase
          .from('usuarios')
          .select(
            [
              'id',
              'id_tipo_usuario',
              'name',
              'username',
              'email',
              'data_nascimento',
              'cpf',
              'rg',
              'celular',
              'logradouro',
              'numero_endereco',
              'bairro',
              'municipio',
              'ponto_referencia',
              'facebook_url',
              'instagram_url',
              'status',
            ].join(','),
          )
          .order('name', { ascending: true }),
        supabase
          .from('tipos_usuario')
          .select('id_tipo_usuario, nome')
          .order('id_tipo_usuario', { ascending: true }),
        supabase
          .from('salas_atendimento')
          .select('id_sala, nome, is_ativa')
          .order('nome', { ascending: true }),
        supabase
          .from('professores')
          .select('id_professor, user_id, matricula_professor'),
        supabase
          .from('professores_salas')
          .select('id_professor, id_sala, ativo'),
      ])

      if (usuariosError) {
        console.error(usuariosError)
        erro('Erro ao carregar usuários.')
      }
      if (tiposError) {
        console.error(tiposError)
        erro('Erro ao carregar perfis de acesso.')
      }
      if (salasError) {
        console.error(salasError)
        erro('Erro ao carregar salas.')
      }
      if (professoresError) {
        console.error(professoresError)
        erro('Erro ao carregar dados de professores.')
      }
      if (profSalasError) {
        console.error(profSalasError)
        erro('Erro ao carregar vínculos de professores com salas.')
      }

      const tiposList = (tiposData || []) as TipoUsuarioRow[]
      const salasList = (salasData || []) as SalaRow[]
      const profList = (professoresData || []) as ProfessorRow[]
      const profSalasList = (profSalasData || []) as ProfessorSalaRow[]

      setTiposUsuario(tiposList)
      setSalas(salasList)
      setProfessores(profList)
      setProfessoresSalas(profSalasList)

      const profByUserId = new Map<string, ProfessorRow>()
      profList.forEach((p) => {
        profByUserId.set(p.user_id, p)
      })

      const salasPorProfessor = new Map<number, number[]>()
      profSalasList.forEach((ps) => {
        if (!ps.ativo) return
        const atual = salasPorProfessor.get(ps.id_professor) || []
        atual.push(ps.id_sala)
        salasPorProfessor.set(ps.id_professor, atual)
      })

      if (usuariosData) {
        const normalizados: UsuarioLista[] = (
          usuariosData as unknown as UsuarioRow[]
        ).map((u) => {
          const papel = normalizarPapelPorId(u.id_tipo_usuario)
          const papelDescricao =
            u.id_tipo_usuario != null
              ? tiposList.find(
                  (t) => t.id_tipo_usuario === u.id_tipo_usuario,
                )?.nome ?? ''
              : ''

          const prof = profByUserId.get(u.id)
          const salasIds =
            prof && salasPorProfessor.get(prof.id_professor)
              ? salasPorProfessor.get(prof.id_professor)
              : []

          const salasProfessor =
            prof && salasIds && salasIds.length > 0
              ? salasIds
                  .map((id) => salasList.find((s) => s.id_sala === id))
                  .filter(Boolean)
                  .map((s) => s as SalaRow)
              : []

          return {
            id: u.id,
            nome: u.name,
            username: u.username,
            email: u.email,
            id_tipo_usuario: u.id_tipo_usuario,
            dataNascimento: u.data_nascimento,
            cpf: u.cpf,
            rg: u.rg,
            celular: u.celular,
            logradouro: u.logradouro,
            numeroEndereco: u.numero_endereco,
            bairro: u.bairro,
            municipio: u.municipio,
            pontoReferencia: u.ponto_referencia,
            facebookUrl: u.facebook_url,
            instagramUrl: u.instagram_url,
            papel,
            papelDescricao,
            status: mapStatusDbToUi(u.status),
            professorId: prof?.id_professor,
            matriculaProfessor: prof?.matricula_professor ?? null,
            salasProfessor,
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
    setEditando(null)
    setFormNome('')
    setFormUsername('')
    setFormEmail('')
    setFormPapelId('')

    setFormDataNascimento('')
    setFormCpf('')
    setFormRg('')
    setFormCelular('')

    setFormLogradouro('')
    setFormNumeroEndereco('')
    setFormBairro('')
    setFormMunicipio('')
    setFormPontoReferencia('')

    setFormFacebookUrl('')
    setFormInstagramUrl('')

    setFormMatriculaProfessor('')
    setFormSalasProfessorIds([])
  }

  const handleOpenDialogCriar = () => {
    limparFormulario()
    setDialogOpen(true)
  }

  const handleOpenDialogEditar = (usuario: UsuarioLista) => {
    setEditando(usuario)
    setFormNome(usuario.nome)
    setFormUsername(usuario.username ?? '')
    setFormEmail(usuario.email)
    setFormPapelId(
      usuario.id_tipo_usuario ? String(usuario.id_tipo_usuario) : '',
    )

    setFormDataNascimento(
      usuario.dataNascimento ? usuario.dataNascimento.substring(0, 10) : '',
    )
    setFormCpf(usuario.cpf ?? '')
    setFormRg(usuario.rg ?? '')
    setFormCelular(usuario.celular ?? '')

    setFormLogradouro(usuario.logradouro ?? '')
    setFormNumeroEndereco(usuario.numeroEndereco ?? '')
    setFormBairro(usuario.bairro ?? '')
    setFormMunicipio(usuario.municipio ?? '')
    setFormPontoReferencia(usuario.pontoReferencia ?? '')

    setFormFacebookUrl(usuario.facebookUrl ?? '')
    setFormInstagramUrl(usuario.instagramUrl ?? '')

    setFormMatriculaProfessor(usuario.matriculaProfessor ?? '')

    if (isProfessorTipo(usuario.id_tipo_usuario)) {
      const salasIds =
        usuario.salasProfessor?.map((s) => s.id_sala) ?? []
      setFormSalasProfessorIds(salasIds)
    } else {
      setFormSalasProfessorIds([])
    }

    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    if (salvando) return
    setDialogOpen(false)
  }

  // ======= Salvar (criar/editar) =======

  const handleSalvarUsuario = async (event?: FormEvent) => {
    if (event) event.preventDefault()
    if (!supabase) return

    const nome = formNome.trim()
    const email = formEmail.trim()
    const username = formUsername.trim() || null
    const papelIdNumber = formPapelId ? Number.parseInt(formPapelId, 10) : NaN
    const ehProfessor = isProfessorForm()

    if (!nome || !email || !formPapelId || Number.isNaN(papelIdNumber)) {
      aviso('Preencha nome, e-mail e perfil de acesso.')
      return
    }

    const payloadBase = {
      name: nome,
      username,
      email,
      id_tipo_usuario: papelIdNumber,
      data_nascimento: formDataNascimento || null,
      cpf: formCpf.trim() || null,
      rg: formRg.trim() || null,
      celular: formCelular.trim() || null,
      logradouro: formLogradouro.trim() || null,
      numero_endereco: formNumeroEndereco.trim() || null,
      bairro: formBairro.trim() || null,
      municipio: formMunicipio.trim() || null,
      ponto_referencia: formPontoReferencia.trim() || null,
      facebook_url: formFacebookUrl.trim() || null,
      instagram_url: formInstagramUrl.trim() || null,
      updated_at: new Date().toISOString(),
    }

    try {
      setSalvando(true)

      if (editando) {
        // UPDATE usuário existente
        const { data, error } = await supabase
          .from('usuarios')
          .update(payloadBase)
          .eq('id', editando.id)
          .select(
            'id, id_tipo_usuario, name, username, email, data_nascimento, cpf, rg, celular, logradouro, numero_endereco, bairro, municipio, ponto_referencia, facebook_url, instagram_url, status',
          )
          .single<UsuarioRow>()

        if (error) {
          console.error(error)
          erro('Erro ao atualizar usuário.')
          return
        }

        // Professor e salas
        let professorId = editando.professorId
        if (ehProfessor) {
          if (!professorId) {
            const { data: profData, error: profError } = await supabase
              .from('professores')
              .insert({
                user_id: data.id,
                matricula_professor:
                  formMatriculaProfessor.trim() || null,
              })
              .select('id_professor, user_id, matricula_professor')
              .single<ProfessorRow>()

            if (profError) {
              console.error(profError)
              erro('Erro ao criar registro de professor.')
              return
            }

            professorId = profData.id_professor
            setProfessores((prev) => [...prev, profData])
          } else {
            const { data: profData, error: profError } = await supabase
              .from('professores')
              .update({
                matricula_professor:
                  formMatriculaProfessor.trim() || null,
              })
              .eq('id_professor', professorId)
              .select('id_professor, user_id, matricula_professor')
              .single<ProfessorRow>()

            if (profError) {
              console.error(profError)
              erro('Erro ao atualizar dados do professor.')
              return
            }

            setProfessores((prev) =>
              prev.map((p) =>
                p.id_professor === profData.id_professor ? profData : p,
              ),
            )
          }

          const atuais = professoresSalas.filter(
            (ps) => ps.id_professor === professorId,
          )
          const atuaisIds = new Set(
            atuais.filter((ps) => ps.ativo).map((ps) => ps.id_sala),
          )
          const alvoIds = new Set(formSalasProfessorIds)

          const idsParaAdicionar: number[] = []
          alvoIds.forEach((id) => {
            if (!atuaisIds.has(id)) idsParaAdicionar.push(id)
          })

          const idsParaRemover: number[] = []
          atuaisIds.forEach((id) => {
            if (!alvoIds.has(id)) idsParaRemover.push(id)
          })

          if (idsParaAdicionar.length > 0) {
            const registros = idsParaAdicionar.map((id_sala) => ({
              id_professor: professorId!,
              id_sala,
              ativo: true,
            }))
            const { error: psError } = await supabase
              .from('professores_salas')
              .insert(registros)

            if (psError) {
              console.error(psError)
              erro('Erro ao vincular salas ao professor.')
              return
            }

            setProfessoresSalas((prev) => [...prev, ...registros])
          }

          if (idsParaRemover.length > 0) {
            const { error: psError } = await supabase
              .from('professores_salas')
              .delete()
              .eq('id_professor', professorId!)
              .in('id_sala', idsParaRemover)

            if (psError) {
              console.error(psError)
              erro('Erro ao desvincular salas do professor.')
              return
            }

            setProfessoresSalas((prev) =>
              prev.filter(
                (ps) =>
                  !(
                    ps.id_professor === professorId &&
                    idsParaRemover.includes(ps.id_sala)
                  ),
              ),
            )
          }
        }

        await carregarDados()
        sucesso('Usuário atualizado com sucesso.')
      } else {
        // CRIAÇÃO de novo usuário
        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({
            email,
            password: SENHA_PADRAO_NOVO_USUARIO,
          })

        if (signUpError || !signUpData.user) {
          console.error(signUpError)
          erro('Erro ao criar usuário de autenticação.')
          return
        }

        const authUserId = signUpData.user.id

        const payloadInsert = {
          ...payloadBase,
          id: authUserId,
          status: mapStatusUiToDb('ATIVO'),
        }

        const { data: usuarioData, error: usuarioError } = await supabase
          .from('usuarios')
          .insert(payloadInsert)
          .select(
            'id, id_tipo_usuario, name, username, email, data_nascimento, cpf, rg, celular, logradouro, numero_endereco, bairro, municipio, ponto_referencia, facebook_url, instagram_url, status',
          )
          .single<UsuarioRow>()

        if (usuarioError) {
          console.error(usuarioError)
          erro('Erro ao criar registro de usuário.')
          return
        }

        if (ehProfessor) {
          const { data: profData, error: profError } = await supabase
            .from('professores')
            .insert({
              user_id: usuarioData.id,
              matricula_professor:
                formMatriculaProfessor.trim() || null,
            })
            .select('id_professor, user_id, matricula_professor')
            .single<ProfessorRow>()

          if (profError) {
            console.error(profError)
            erro('Erro ao criar registro de professor.')
            return
          }

          setProfessores((prev) => [...prev, profData])

          if (formSalasProfessorIds.length > 0) {
            const registros = formSalasProfessorIds.map((id_sala) => ({
              id_professor: profData.id_professor,
              id_sala,
              ativo: true,
            }))
            const { error: psError } = await supabase
              .from('professores_salas')
              .insert(registros)

            if (psError) {
              console.error(psError)
              erro('Erro ao vincular salas ao professor.')
              return
            }
            setProfessoresSalas((prev) => [...prev, ...registros])
          }
        }

        await carregarDados()
        sucesso(
          `Usuário criado com sucesso. Senha inicial: ${SENHA_PADRAO_NOVO_USUARIO}`,
        )
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

  // ======= Exclusão de usuário =======

  const abrirDialogExcluirUsuario = (usuario: UsuarioLista) => {
    setUsuarioParaExcluir(usuario)
    setDialogExcluirAberto(true)
  }

  const fecharDialogExcluirUsuario = () => {
    if (salvando) return
    setDialogExcluirAberto(false)
    setUsuarioParaExcluir(null)
  }

  const handleConfirmarExcluirUsuario = async () => {
    if (!supabase || !usuarioParaExcluir) return

    try {
      setSalvando(true)

      // Verifica se é aluno no sistema (tabela alunos.user_id)
      const { data: alunoData, error: alunoError } = await supabase
        .from('alunos')
        .select('id_aluno')
        .eq('user_id', usuarioParaExcluir.id)
        .maybeSingle()

      if (alunoError && alunoError.code !== 'PGRST116') {
        console.error(alunoError)
        erro('Erro ao verificar vínculos de aluno.')
        setSalvando(false)
        return
      }

      if (alunoData) {
        aviso(
          'Não é possível excluir este usuário porque está vinculado a um aluno. Utilize os fluxos de aluno para inativar.',
        )
        setSalvando(false)
        return
      }

      // Se for professor, remove vínculos e o registro de professor
      const { data: profRows, error: profFetchError } = await supabase
        .from('professores')
        .select('id_professor')
        .eq('user_id', usuarioParaExcluir.id)

      if (profFetchError) {
        console.error(profFetchError)
        erro('Erro ao verificar vínculos de professor.')
        setSalvando(false)
        return
      }

      if (profRows && profRows.length > 0) {
        const profIds = profRows.map((p: any) => p.id_professor)

        const { error: psError } = await supabase
          .from('professores_salas')
          .delete()
          .in('id_professor', profIds)

        if (psError) {
          console.error(psError)
          erro('Erro ao remover vínculos de salas do professor.')
          setSalvando(false)
          return
        }

        const { error: profDelError } = await supabase
          .from('professores')
          .delete()
          .in('id_professor', profIds)

        if (profDelError) {
          console.error(profDelError)
          erro('Erro ao remover registro de professor.')
          setSalvando(false)
          return
        }

        setProfessores((prev) =>
          prev.filter((p) => !profIds.includes(p.id_professor)),
        )
        setProfessoresSalas((prev) =>
          prev.filter((ps) => !profIds.includes(ps.id_professor)),
        )
      }

      const { error: usuarioDelError } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', usuarioParaExcluir.id)

      if (usuarioDelError) {
        console.error(usuarioDelError)
        erro('Erro ao excluir usuário.')
        setSalvando(false)
        return
      }

      setUsuarios((prev) =>
        prev.filter((u) => u.id !== usuarioParaExcluir.id),
      )
      sucesso('Usuário excluído com sucesso.')
      setDialogExcluirAberto(false)
      setUsuarioParaExcluir(null)
    } catch (e) {
      console.error(e)
      erro('Erro técnico ao excluir usuário.')
    } finally {
      setSalvando(false)
    }
  }

  // ======= Ações extras (status, reset senha) =======

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
          u.id === usuario.id
            ? { ...u, status: mapStatusDbToUi(data.status) }
            : u,
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
          (u.username ?? '').toLowerCase().includes(termo) ||
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
    () =>
      usuariosFiltrados.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage,
      ),
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

  const handleChangeSalasProfessor = (event: any) => {
    const rawValue = event.target.value as unknown
    let ids: number[] = []

    if (typeof rawValue === 'string') {
      ids = rawValue.split(',').map((v: string) => Number(v))
    } else if (Array.isArray(rawValue)) {
      ids = (rawValue as Array<string | number>).map((v) => Number(v))
    }

    setFormSalasProfessorIds(ids)
  }

  // ======= Render =======

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        width: '100%',
        maxWidth: '100vw',
        mx: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        overflowX: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Cabeçalho centralizado */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems="center"
        justifyContent="center"
        sx={{ textAlign: 'center' }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={700}>
            Usuários e acessos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie quem tem acesso ao sistema e seus níveis de permissão.
          </Typography>
        </Box>
        <Box>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={handleOpenDialogCriar}
            sx={{ fontWeight: 600, px: 3 }}
          >
            Novo usuário
          </Button>
        </Box>
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
          placeholder="Buscar por nome, usuário, e-mail ou perfil..."
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

      {/* Lista de usuários */}
      <TableContainer
        component={Paper}
        elevation={0}
        variant="outlined"
        sx={{ borderRadius: 3, overflow: 'hidden' }}
      >
        {carregando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {isMobile ? (
              // MOBILE: CARDS
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
                            {user.username && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Usuário: {user.username}
                              </Typography>
                            )}
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
                            sx={{
                              bgcolor:
                                user.status === 'ATIVO'
                                  ? alpha(theme.palette.success.main, 0.1)
                                  : alpha(theme.palette.text.disabled, 0.07),
                              color:
                                user.status === 'ATIVO'
                                  ? 'success.main'
                                  : 'text.secondary',
                              fontWeight: 600,
                            }}
                          />
                          {isProfessorTipo(user.id_tipo_usuario) &&
                            user.salasProfessor &&
                            user.salasProfessor.length > 0 && (
                              <Chip
                                icon={<MeetingRoomIcon fontSize="small" />}
                                label={`${user.salasProfessor.length} sala(s)`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                        </Stack>

                        {isProfessorTipo(user.id_tipo_usuario) &&
                          user.salasProfessor &&
                          user.salasProfessor.length > 0 && (
                            <Box sx={{ mt: 0.5 }}>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Salas:{' '}
                                {user.salasProfessor
                                  .map((s) => s.nome)
                                  .join(', ')}
                              </Typography>
                            </Box>
                          )}

                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="flex-end"
                          sx={{ pt: 1 }}
                        >
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => handleOpenDialogEditar(user)}
                            startIcon={<EditIcon fontSize="small" />}
                          >
                            Editar
                          </Button>
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => handleResetSenha(user)}
                            startIcon={<LockResetIcon fontSize="small" />}
                          >
                            Senha
                          </Button>
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
                          <Button
                            size="small"
                            variant="text"
                            color="error"
                            onClick={() => abrirDialogExcluirUsuario(user)}
                            startIcon={<DeleteOutlineIcon fontSize="small" />}
                            disabled={salvando}
                          >
                            Excluir
                          </Button>
                        </Stack>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            ) : (
              // DESKTOP: TABELA
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
                        Nome / E-mail / Usuário
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 'bold', color: headerTextColor }}
                      >
                        Perfil
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 'bold', color: headerTextColor }}
                      >
                        Salas (Professor)
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
                      const eProfessor = isProfessorTipo(
                        user.id_tipo_usuario,
                      )

                      return (
                        <TableRow
                          key={user.id}
                          hover
                          sx={{
                            bgcolor: isEven ? 'inherit' : zebraColor,
                            '&:hover': {
                              bgcolor: alpha(
                                theme.palette.primary.main,
                                0.08,
                              ),
                            },
                          }}
                        >
                          <TableCell>
                            <Avatar
                              sx={{
                                bgcolor: alpha(
                                  getAvatarColor(user.papel),
                                  0.9,
                                ),
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
                              display="block"
                            >
                              {user.email}
                            </Typography>
                            {user.username && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Usuário: {user.username}
                              </Typography>
                            )}
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
                            {eProfessor && user.salasProfessor && (
                              <Stack spacing={0.5}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {user.salasProfessor.length === 0
                                    ? 'Nenhuma sala vinculada'
                                    : user.salasProfessor
                                        .map((s) => s.nome)
                                        .join(', ')}
                                </Typography>
                              </Stack>
                            )}
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
                                    onClick={() =>
                                      handleOpenDialogEditar(user)
                                    }
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
                              <Tooltip title="Excluir usuário">
                                <span>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() =>
                                      abrirDialogExcluirUsuario(user)
                                    }
                                    disabled={salvando}
                                  >
                                    <DeleteOutlineIcon fontSize="small" />
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
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
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

      {/* Dialog Criar/Editar */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="md">
        <form onSubmit={handleSalvarUsuario}>
          <DialogTitle>
            {editando ? 'Editar usuário' : 'Novo usuário'}
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {/* Seção: Identificação */}
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  label="Nome completo"
                  fullWidth
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                />
                <TextField
                  label="Usuário (login interno)"
                  fullWidth
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                />
              </Stack>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  label="E-mail"
                  type="email"
                  fullWidth
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
                <FormControl fullWidth>
                  <InputLabel id="perfil-acesso-label">
                    Perfil de acesso
                  </InputLabel>
                  <Select
                    labelId="perfil-acesso-label"
                    value={formPapelId}
                    label="Perfil de acesso"
                    onChange={(e) => {
                      setFormPapelId(e.target.value as string)
                      if (
                        Number(e.target.value) !== TIPO_USUARIO_PROFESSOR_ID
                      ) {
                        setFormSalasProfessorIds([])
                        setFormMatriculaProfessor('')
                      }
                    }}
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

              {/* Seção: Dados pessoais */}
              <Typography variant="subtitle2" fontWeight={700}>
                Dados pessoais e contato
              </Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  label="Data de nascimento"
                  type="date"
                  fullWidth
                  value={formDataNascimento}
                  onChange={(e) => setFormDataNascimento(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="CPF"
                  fullWidth
                  value={formCpf}
                  onChange={(e) => setFormCpf(e.target.value)}
                />
                <TextField
                  label="RG"
                  fullWidth
                  value={formRg}
                  onChange={(e) => setFormRg(e.target.value)}
                />
              </Stack>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  label="Celular"
                  fullWidth
                  value={formCelular}
                  onChange={(e) => setFormCelular(e.target.value)}
                />
              </Stack>

              {/* Seção: Endereço */}
              <Typography variant="subtitle2" fontWeight={700}>
                Endereço
              </Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  label="Logradouro"
                  fullWidth
                  value={formLogradouro}
                  onChange={(e) => setFormLogradouro(e.target.value)}
                />
                <TextField
                  label="Número"
                  fullWidth
                  value={formNumeroEndereco}
                  onChange={(e) => setFormNumeroEndereco(e.target.value)}
                />
              </Stack>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  label="Bairro"
                  fullWidth
                  value={formBairro}
                  onChange={(e) => setFormBairro(e.target.value)}
                />
                <TextField
                  label="Município"
                  fullWidth
                  value={formMunicipio}
                  onChange={(e) => setFormMunicipio(e.target.value)}
                />
              </Stack>
              <TextField
                label="Ponto de referência"
                fullWidth
                value={formPontoReferencia}
                onChange={(e) => setFormPontoReferencia(e.target.value)}
              />

              {/* Seção: Redes sociais */}
              <Typography variant="subtitle2" fontWeight={700}>
                Redes sociais
              </Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  label="Facebook (URL)"
                  fullWidth
                  value={formFacebookUrl}
                  onChange={(e) => setFormFacebookUrl(e.target.value)}
                />
                <TextField
                  label="Instagram (URL)"
                  fullWidth
                  value={formInstagramUrl}
                  onChange={(e) => setFormInstagramUrl(e.target.value)}
                />
              </Stack>

              {/* Seção: Dados de professor */}
              {isProfessorForm() && (
                <>
                  <Typography variant="subtitle2" fontWeight={700}>
                    Dados de professor
                  </Typography>
                  <TextField
                    label="Matrícula do professor (opcional)"
                    fullWidth
                    value={formMatriculaProfessor}
                    onChange={(e) => setFormMatriculaProfessor(e.target.value)}
                  />

                  <FormControl fullWidth>
                    <InputLabel id="salas-professor-label">
                      Salas de atendimento
                    </InputLabel>
                    <Select
                      labelId="salas-professor-label"
                      multiple
                      value={formSalasProfessorIds}
                      label="Salas de atendimento"
                      onChange={handleChangeSalasProfessor}
                      renderValue={(selected) => {
                        const ids = selected as number[]
                        if (!ids.length) return 'Nenhuma sala selecionada'
                        return salas
                          .filter((s) => ids.includes(s.id_sala))
                          .map((s) => s.nome)
                          .join(', ')
                      }}
                    >
                      {salas.map((sala) => (
                        <MenuItem key={sala.id_sala} value={sala.id_sala}>
                          <Checkbox
                            size="small"
                            checked={formSalasProfessorIds.includes(
                              sala.id_sala,
                            )}
                          />
                          <MeetingRoomIcon
                            fontSize="small"
                            style={{ marginRight: 8 }}
                          />
                          <ListItemText
                            primary={sala.nome}
                            secondary={sala.is_ativa ? 'Ativa' : 'Inativa'}
                          />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </>
              )}
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

      {/* Modal de confirmação de exclusão */}
      <Dialog
        open={dialogExcluirAberto}
        onClose={fecharDialogExcluirUsuario}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ pb: 0 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.error.main, 0.12),
                color: theme.palette.error.main,
              }}
            >
              <WarningAmberIcon />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                Confirmar exclusão
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Esta ação não poderá ser desfeita.
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            Tem certeza de que deseja excluir o usuário{' '}
            <strong>{usuarioParaExcluir?.nome ?? 'selecionado'}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={fecharDialogExcluirUsuario} disabled={salvando}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmarExcluirUsuario}
            disabled={salvando}
          >
            {salvando ? 'Excluindo...' : 'Excluir usuário'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SecretariaUsuariosPage
