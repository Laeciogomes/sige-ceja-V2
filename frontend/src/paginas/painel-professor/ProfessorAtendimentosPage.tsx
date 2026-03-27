// src/paginas/painel-professor/ProfessorAtendimentosPage.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'

import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import RefreshIcon from '@mui/icons-material/Autorenew'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import SchoolIcon from '@mui/icons-material/School'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import DescriptionIcon from '@mui/icons-material/Description'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'

// Contextos
import { useSupabase } from '../../contextos/SupabaseContext'
import { useNotificacaoContext } from '../../contextos/NotificacaoContext'
import { useAuth } from '../../contextos/AuthContext'
import { otimizarImagemParaUpload } from '../../utils/imagem'

import { AtendimentoCard } from './professor-atendimentos/components/AtendimentoCard'
import { AvatarAlunoAtendimento } from './professor-atendimentos/components/AvatarAlunoAtendimento'
import { TransferenciaDialog } from './professor-atendimentos/components/TransferenciaDialog'
import type {
  AlunoBuscaOption,
  FaixaProtocolosAno,
  FluxoTipo,
  FormAlunoSessao,
  NivelEnsinoFiltro,
  ProfessorDestinoOption,
  ProgressoOption,
  RegistroView,
  SalaAtendimento,
  SalaDisciplinaNivelOption,
  SessaoView,
  StatusDisciplinaAluno,
  StatusMatricula,
  TipoProtocolo,
  TransferenciaContexto,
} from './professor-atendimentos/types'
import {
  agoraParaInputDateTimeLocal,
  agruparAbertasPorDisciplina,
  anoPorNumeroProtocolo,
  escolherProgressoPorDisciplina,
  extrairDigitos,
  first,
  formatarCPF,
  formatarDataHoraBR,
  formatarEnderecoAluno,
  hojeISODateLocal,
  isBuscaNumerica,
  isStatusDisciplinaAberta,
  nomeNivelEnsinoCurto,
  nomeNivelEnsinoLongo,
  normalizarTexto,
  renderNumeroInscricao,
  resolverFotoUrl,
  resumoFaixasProtocolos,
  statusChipProps,
} from './professor-atendimentos/utils'

export default function ProfessorAtendimentosPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const navigate = useNavigate()

  const { supabase } = useSupabase()
  const { usuario } = useAuth()
  const { sucesso, aviso, erro, info } = useNotificacaoContext()

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const nomeProfessorAtual = useMemo(() => {
    const n = (usuario as any)?.name || (usuario as any)?.nome || (usuario as any)?.email
    return n ? String(n) : 'Professor'
  }, [usuario])

  const abrirFichaAcompanhamento = useCallback(
    (idProgresso: number | null | undefined) => {
      if (!idProgresso) {
        aviso('Não foi possível abrir a ficha: sessão sem id_progresso.')
        return
      }
      navigate(`/fichas/${idProgresso}`)
    },
    [navigate, aviso]
  )

  // ======= estados base =======
  const [carregandoBase, setCarregandoBase] = useState(true)
  const [carregandoSessoes, setCarregandoSessoes] = useState(false)
  const [carregandoRegistros, setCarregandoRegistros] = useState(false)

  const [idProfessor, setIdProfessor] = useState<number | null>(null)
  const [minhasSalas, setMinhasSalas] = useState<SalaAtendimento[]>([])
  const [configsPorSala, setConfigsPorSala] = useState<Record<number, SalaDisciplinaNivelOption[]>>({})

  const [tiposProtocolo, setTiposProtocolo] = useState<TipoProtocolo[]>([])
  const [statusMatriculas, setStatusMatriculas] = useState<StatusMatricula[]>([])
  const [statusDisciplinas, setStatusDisciplinas] = useState<StatusDisciplinaAluno[]>([])

  const podeAbrirMaisQue3 = useMemo(() => {
    const p = String((usuario as any)?.papel ?? '').toUpperCase()
    return p === 'ADMIN' || p === 'DIRETOR' || p === 'COORDENACAO'
  }, [usuario])

  // ======= filtros/listagem =======
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>(hojeISODateLocal())
  const [filtroDataFim, setFiltroDataFim] = useState<string>(hojeISODateLocal())
  const [filtroTexto, setFiltroTexto] = useState<string>('')
  const [filtroSalaId, setFiltroSalaId] = useState<number | 'todas'>('todas')
  const [mostrarHistorico, setMostrarHistorico] = useState<boolean>(false)

  const [sessoes, setSessoes] = useState<SessaoView[]>([])
  const [resumoPorSessao, setResumoPorSessao] = useState<Record<number, string>>({})

  const sessoesFiltradas = useMemo(() => {
    const q = normalizarTexto(filtroTexto)
    return sessoes.filter((s) => {
      const matchTexto =
        q === '' ||
        normalizarTexto(s.aluno_nome ?? '').includes(q) ||
        normalizarTexto(s.disciplina_nome ?? '').includes(q) ||
        normalizarTexto(s.ano_nome ?? '').includes(q) ||
        normalizarTexto(s.sala_nome ?? '').includes(q) ||
        normalizarTexto(s.numero_inscricao ?? '').includes(q) ||
        normalizarTexto(nomeNivelEnsinoCurto(s.id_nivel_ensino)).includes(q)

      const matchSala = filtroSalaId === 'todas' || s.id_sala === filtroSalaId
      return matchTexto && matchSala
    })
  }, [sessoes, filtroTexto, filtroSalaId])

  const sessoesAbertas = useMemo(() => sessoesFiltradas.filter((s) => !s.hora_saida), [sessoesFiltradas])
  const sessoesHistorico = useMemo(() => sessoesFiltradas.filter((s) => Boolean(s.hora_saida)), [sessoesFiltradas])

  const transferenciaDisponivel = useMemo(() => {
    if (sessoesAbertas.length === 0) {
      return {
        disponivel: false,
        motivo: 'Não há atendimentos abertos para transferir.',
        contexto: null as TransferenciaContexto | null,
      }
    }

    if (filtroSalaId !== 'todas') {
      const salaId = Number(filtroSalaId)
      const salaNome =
        minhasSalas.find((s) => s.id_sala === salaId)?.nome ??
        sessoesAbertas.find((s) => s.id_sala === salaId)?.sala_nome ??
        `Sala #${salaId}`

      return {
        disponivel: true,
        motivo: '',
        contexto: { id_sala: salaId, sala_nome: salaNome },
      }
    }

    const salasUnicas = new Map<number, string>()
    sessoesAbertas.forEach((s) => {
      if (s.id_sala != null && !salasUnicas.has(s.id_sala)) {
        salasUnicas.set(s.id_sala, s.sala_nome ?? `Sala #${s.id_sala}`)
      }
    })

    if (salasUnicas.size === 1) {
      const [id_sala, sala_nome] = Array.from(salasUnicas.entries())[0]
      return {
        disponivel: true,
        motivo: '',
        contexto: { id_sala, sala_nome },
      }
    }

    return {
      disponivel: false,
      motivo: 'Selecione uma sala específica para transferir todos os atendimentos abertos dessa sala.',
      contexto: null as TransferenciaContexto | null,
    }
  }, [sessoesAbertas, filtroSalaId, minhasSalas])

  const cardGridSx = useMemo(
    () => ({
      display: 'grid',
      gap: 2,
      gridTemplateColumns: {
        xs: '1fr',
        sm: 'repeat(2, 1fr)',
        md: 'repeat(3, 1fr)',
      },
    }),
    []
  )

  // ======= dialogs =======
  const [dlgEscolherSala, setDlgEscolherSala] = useState(false)
  const [dlgNovoAtendimento, setDlgNovoAtendimento] = useState(false)

  const [fluxoTipo, setFluxoTipo] = useState<FluxoTipo>('normal')

  const [salaAtendimentoId, setSalaAtendimentoId] = useState<number | null>(null)

  const [nivelFiltroEnsino, setNivelFiltroEnsino] = useState<NivelEnsinoFiltro>('todos')

  const [alunoInput, setAlunoInput] = useState<string>('')
  const [buscandoAlunos, setBuscandoAlunos] = useState(false)
  const [opcoesAluno, setOpcoesAluno] = useState<AlunoBuscaOption[]>([])
  const [alunoSelecionado, setAlunoSelecionado] = useState<AlunoBuscaOption | null>(null)

  const nivelEfetivoDoAtendimento = useMemo<number | null>(() => {
    if (alunoSelecionado?.id_nivel_ensino != null) return Number(alunoSelecionado.id_nivel_ensino)
    if (nivelFiltroEnsino !== 'todos') return Number(nivelFiltroEnsino)
    return null
  }, [alunoSelecionado?.id_nivel_ensino, nivelFiltroEnsino])

  const [carregandoFichas, setCarregandoFichas] = useState(false)
  const [progressosAlunoTodos, setProgressosAlunoTodos] = useState<ProgressoOption[]>([])
  const [fichasAbertasNaSala, setFichasAbertasNaSala] = useState<ProgressoOption[]>([])
  const [qtdDisciplinasAbertas, setQtdDisciplinasAbertas] = useState<number | null>(null)

  const [usarFichaExistente, setUsarFichaExistente] = useState(true)
  const [progressoEscolhidoId, setProgressoEscolhidoId] = useState<number | null>(null)
  const [configSelecionada, setConfigSelecionada] = useState<SalaDisciplinaNivelOption | null>(null)

  const [novoHoraEntrada, setNovoHoraEntrada] = useState<string>(agoraParaInputDateTimeLocal())
  const [novoHoraSaida, setNovoHoraSaida] = useState<string>(agoraParaInputDateTimeLocal())
  const [novoResumo, setNovoResumo] = useState<string>('')
  const [salvandoNovoAtendimento, setSalvandoNovoAtendimento] = useState(false)

  const [dlgConfirmAbrirFicha, setDlgConfirmAbrirFicha] = useState(false)

  // sessão
  const [dlgSessao, setDlgSessao] = useState(false)
  const [sessaoAtual, setSessaoAtual] = useState<SessaoView | null>(null)
  const [registros, setRegistros] = useState<RegistroView[]>([])
  const [salvandoSessao, setSalvandoSessao] = useState(false)
  const [dlgEditarAluno, setDlgEditarAluno] = useState(false)
  const [formAlunoSessao, setFormAlunoSessao] = useState<FormAlunoSessao>({
    celular: '',
    logradouro: '',
    numero_endereco: '',
    bairro: '',
    municipio: '',
    ponto_referencia: '',
    foto_url: '',
  })
  const [salvandoAlunoSessao, setSalvandoAlunoSessao] = useState(false)
  const [uploadingFotoAlunoSessao, setUploadingFotoAlunoSessao] = useState(false)
  const fileInputFotoAlunoSessaoRef = useRef<HTMLInputElement | null>(null)

  // transferência
  const [dlgTransferir, setDlgTransferir] = useState(false)
  const [carregandoProfSala, setCarregandoProfSala] = useState(false)
  const [professoresSala, setProfessoresSala] = useState<ProfessorDestinoOption[]>([])
  const [professorDestino, setProfessorDestino] = useState<ProfessorDestinoOption | null>(null)
  const [transferindo, setTransferindo] = useState(false)
  const [qtdAtendimentosAbertosTransferencia, setQtdAtendimentosAbertosTransferencia] = useState(0)
  const [transferenciaContexto, setTransferenciaContexto] = useState<TransferenciaContexto | null>(null)

  // registro dialog
  const [dlgRegistro, setDlgRegistro] = useState(false)
  const [registroEditandoId, setRegistroEditandoId] = useState<number | null>(null)
  const [regNumero, setRegNumero] = useState<string>('')
  const [regTipoId, setRegTipoId] = useState<string>('')
  const [regStatus, setRegStatus] = useState<string>('A fazer')
  const [regNota, setRegNota] = useState<string>('')
  const [regAdaptada, setRegAdaptada] = useState<boolean>(false)
  const [regSintese, setRegSintese] = useState<string>('')
  const [salvandoRegistro, setSalvandoRegistro] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  // ======= faixas/limite da sessão atual =======
  const limiteProtocolosSessao = useMemo(() => {
    if (!sessaoAtual?.id_sala || !sessaoAtual?.id_disciplina || !sessaoAtual?.id_nivel_ensino) return null
    const cfg = (configsPorSala[sessaoAtual.id_sala] ?? []).find(
      (c) => c.id_disciplina === sessaoAtual.id_disciplina && c.id_nivel_ensino === sessaoAtual.id_nivel_ensino
    )
    return cfg?.total_protocolos ?? null
  }, [sessaoAtual?.id_sala, sessaoAtual?.id_disciplina, sessaoAtual?.id_nivel_ensino, configsPorSala])

  const faixasSessaoAtual = useMemo(() => {
    if (!sessaoAtual?.id_sala || !sessaoAtual?.id_disciplina || !sessaoAtual?.id_nivel_ensino) return [] as FaixaProtocolosAno[]
    const cfg = (configsPorSala[sessaoAtual.id_sala] ?? []).find(
      (c) => c.id_disciplina === sessaoAtual.id_disciplina && c.id_nivel_ensino === sessaoAtual.id_nivel_ensino
    )
    return cfg?.faixas ?? []
  }, [sessaoAtual?.id_sala, sessaoAtual?.id_disciplina, sessaoAtual?.id_nivel_ensino, configsPorSala])

  const resumoFaixasSessaoAtual = useMemo(() => resumoFaixasProtocolos(faixasSessaoAtual), [faixasSessaoAtual])

  const configsDaSalaSelecionada = useMemo(() => {
    if (!salaAtendimentoId) return []
    const lista = configsPorSala[salaAtendimentoId] ?? []
    if (!nivelEfetivoDoAtendimento) return lista
    return lista.filter((c) => Number(c.id_nivel_ensino) === Number(nivelEfetivoDoAtendimento))
  }, [configsPorSala, salaAtendimentoId, nivelEfetivoDoAtendimento])

  const idProgressoSelecionadoParaAbrirFicha = useMemo(() => {
    if (usarFichaExistente) return progressoEscolhidoId ?? null
    if (configSelecionada) {
      const ex = escolherProgressoPorDisciplina(progressosAlunoTodos, configSelecionada.id_disciplina)
      return ex?.id_progresso ?? null
    }
    return null
  }, [usarFichaExistente, progressoEscolhidoId, configSelecionada, progressosAlunoTodos])

  // ======= base load =======
  const carregarBase = useCallback(async () => {
    if (!supabase) return
    if (!usuario?.id) return

    setCarregandoBase(true)
    try {
      const { data: prof, error: errProf } = await supabase
        .from('professores')
        .select('id_professor')
        .eq('user_id', usuario.id)
        .maybeSingle()

      if (errProf) throw errProf
      if (!prof?.id_professor) {
        erro('Seu usuário não está vinculado a um Professor. Peça à Secretaria/Admin para vincular.')
        return
      }

      const professorId = Number(prof.id_professor)
      setIdProfessor(professorId)

      const { data: lotacoes, error: errLot } = await supabase
        .from('professores_salas')
        .select('id_sala, ativo, salas_atendimento ( id_sala, nome, tipo_sala, is_ativa )')
        .eq('id_professor', professorId)
        .eq('ativo', true)

      if (errLot) throw errLot

      const salas = (lotacoes ?? [])
        .map((r: any) => first(r?.salas_atendimento))
        .filter(Boolean)
        .map((s: any) => ({
          id_sala: Number(s.id_sala),
          nome: String(s.nome),
          tipo_sala: String(s.tipo_sala),
          is_ativa: Boolean(s.is_ativa),
        })) as SalaAtendimento[]

      const salasAtivas = salas.filter((s) => s.is_ativa)
      if (salasAtivas.length === 0) {
        erro('Você não está lotado(a) em nenhuma sala ativa. Peça ao Admin/Secretaria para configurar.')
        setMinhasSalas([])
        return
      }

      setMinhasSalas(salasAtivas)
      const salaIds = salasAtivas.map((s) => s.id_sala)

      const [tiposRes, statusMatRes, statusDiscRes, cfgSalaRes] = await Promise.all([
        supabase.from('tipos_protocolo').select('id_tipo_protocolo,nome').order('nome'),
        supabase.from('status_matricula').select('id_status_matricula,nome').order('id_status_matricula'),
        supabase.from('status_disciplina_aluno').select('id_status_disciplina,nome').order('id_status_disciplina'),
        supabase
          .from('salas_config_disciplina_ano')
          .select(
            `
            id_sala,
            id_config,
            config_disciplina_ano (
              id_config,
              id_disciplina,
              id_ano_escolar,
              quantidade_protocolos,
              disciplinas ( nome_disciplina ),
              anos_escolares ( nome_ano, id_nivel_ensino )
            )
          `
          )
          .in('id_sala', salaIds),
      ])

      if (tiposRes.error) throw tiposRes.error
      if (statusMatRes.error) throw statusMatRes.error
      if (statusDiscRes.error) throw statusDiscRes.error
      if (cfgSalaRes.error) throw cfgSalaRes.error

      setTiposProtocolo((tiposRes.data ?? []) as TipoProtocolo[])
      setStatusMatriculas((statusMatRes.data ?? []) as StatusMatricula[])
      setStatusDisciplinas((statusDiscRes.data ?? []) as StatusDisciplinaAluno[])

      // monta configs por sala (disciplina+nivel) com faixas por ano
      const tmp: Record<number, Map<string, SalaDisciplinaNivelOption>> = {}

      ;(cfgSalaRes.data ?? []).forEach((row: any) => {
        const salaId = Number(row.id_sala)
        const cfg = first(row?.config_disciplina_ano) as any
        if (!cfg?.id_config) return

        const disc = first(cfg?.disciplinas) as any
        const ano = first(cfg?.anos_escolares) as any

        const disciplinaNome = disc?.nome_disciplina ? String(disc.nome_disciplina) : `Disciplina #${cfg.id_disciplina}`
        const anoNome = ano?.nome_ano ? String(ano.nome_ano) : `Ano #${cfg.id_ano_escolar}`
        const nivelId = Number(ano?.id_nivel_ensino ?? 0)
        const qtd = Number(cfg.quantidade_protocolos ?? 0)
        if (!nivelId || qtd <= 0) return

        if (!tmp[salaId]) tmp[salaId] = new Map()

        const key = `${Number(cfg.id_disciplina)}-${nivelId}`
        const atual = tmp[salaId].get(key)

        if (!atual) {
          tmp[salaId].set(key, {
            id_disciplina: Number(cfg.id_disciplina),
            id_nivel_ensino: nivelId,
            disciplina_nome: disciplinaNome,
            total_protocolos: qtd,
            ano_representativo_id: Number(cfg.id_ano_escolar),
            ano_representativo_nome: anoNome,
            id_config_representativo: Number(cfg.id_config),
            faixas: [
              {
                id_config: Number(cfg.id_config),
                id_ano_escolar: Number(cfg.id_ano_escolar),
                ano_nome: anoNome,
                quantidade_protocolos: qtd,
                inicio: 0,
                fim: 0,
              },
            ],
            label: '',
          })
          return
        }

        const total = Number(atual.total_protocolos ?? 0) + qtd
        const faixas = [...(atual.faixas ?? [])]
        const idx = faixas.findIndex((f) => f.id_ano_escolar === Number(cfg.id_ano_escolar))

        if (idx >= 0) {
          faixas[idx] = {
            ...faixas[idx],
            id_config: Number(cfg.id_config),
            ano_nome: anoNome,
            quantidade_protocolos: Number(faixas[idx].quantidade_protocolos ?? 0) + qtd,
          }
        } else {
          faixas.push({
            id_config: Number(cfg.id_config),
            id_ano_escolar: Number(cfg.id_ano_escolar),
            ano_nome: anoNome,
            quantidade_protocolos: qtd,
            inicio: 0,
            fim: 0,
          })
        }

        const usarRepresentativo = Number(cfg.id_ano_escolar) > Number(atual.ano_representativo_id ?? 0)

        tmp[salaId].set(key, {
          ...atual,
          total_protocolos: total,
          faixas,
          ...(usarRepresentativo
            ? {
                ano_representativo_id: Number(cfg.id_ano_escolar),
                ano_representativo_nome: anoNome,
                id_config_representativo: Number(cfg.id_config),
              }
            : {}),
        })
      })

      const mapaFinal: Record<number, SalaDisciplinaNivelOption[]> = {}
      Object.entries(tmp).forEach(([salaIdStr, mapDiscNivel]) => {
        const salaId = Number(salaIdStr)
        const lista = Array.from(mapDiscNivel.values()).map((o) => {
          const faixasOrd = [...(o.faixas ?? [])].sort((a, b) => a.id_ano_escolar - b.id_ano_escolar)
          let acc = 0
          const faixasCalc = faixasOrd.map((f) => {
            const inicio = acc + 1
            const fim = acc + Number(f.quantidade_protocolos ?? 0)
            acc = fim
            return { ...f, inicio, fim }
          })

          const resumo = resumoFaixasProtocolos(faixasCalc)
          const label = `${nomeNivelEnsinoCurto(o.id_nivel_ensino)} • ${o.disciplina_nome} (prot: ${acc})${resumo ? ` • ${resumo}` : ''}`

          return { ...o, total_protocolos: acc, faixas: faixasCalc, label }
        })

        lista.sort((a, b) => a.label.localeCompare(b.label))
        mapaFinal[salaId] = lista
      })

      setConfigsPorSala(mapaFinal)
    } catch (e) {
      console.error(e)
      erro('Falha ao carregar dados-base do atendimento.')
    } finally {
      if (mountedRef.current) setCarregandoBase(false)
    }
  }, [supabase, usuario?.id, erro])

  // ======= sessões =======
  const carregarSessoes = useCallback(
    async (professorId: number, dataInicio: string, dataFim: string) => {
      if (!supabase) return

      setCarregandoSessoes(true)
      try {
        const dtIni = new Date(`${dataInicio}T00:00:00`)
        const dtFim = new Date(`${dataFim}T23:59:59`)

        const { data, error: err } = await supabase
          .from('sessoes_atendimento')
          .select(
            `
            id_sessao,
            id_aluno,
            id_professor,
            id_progresso,
            id_sala,
            hora_entrada,
            hora_saida,
            resumo_atividades,
            alunos (
              id_aluno,
              nis,
              possui_necessidade_especial,
              possui_beneficio_governo,
              usuarios ( id, name, foto_url, cpf, data_nascimento, celular, logradouro, numero_endereco, bairro, municipio, ponto_referencia )
            ),
            salas_atendimento (
              id_sala,
              nome,
              tipo_sala
            ),
            progresso_aluno (
              id_progresso,
              id_disciplina,
              id_ano_escolar,
              disciplinas ( nome_disciplina ),
              anos_escolares ( nome_ano, id_nivel_ensino ),
              matriculas ( numero_inscricao, id_nivel_ensino, data_matricula, ano_letivo )
            )
          `
          )
          .eq('id_professor', professorId)
          .gte('hora_entrada', dtIni.toISOString())
          .lte('hora_entrada', dtFim.toISOString())
          .order('hora_entrada', { ascending: false })

        if (err) throw err

        const lista: SessaoView[] = (data ?? []).map((s: any) => {
          const aluno = first(s?.alunos) as any
          const alunoUser = first(aluno?.usuarios) as any
          const sala = first(s?.salas_atendimento) as any
          const prog = first(s?.progresso_aluno) as any
          const disc = first(prog?.disciplinas) as any
          const ano = first(prog?.anos_escolares) as any
          const mat = first(prog?.matriculas) as any

          const nivelId =
            mat?.id_nivel_ensino != null
              ? Number(mat.id_nivel_ensino)
              : ano?.id_nivel_ensino != null
                ? Number(ano.id_nivel_ensino)
                : null

          return {
            id_sessao: Number(s.id_sessao),
            id_aluno: Number(s.id_aluno),
            id_professor: Number(s.id_professor),
            id_progresso: s.id_progresso != null ? Number(s.id_progresso) : null,
            id_sala: s.id_sala != null ? Number(s.id_sala) : null,
            hora_entrada: String(s.hora_entrada),
            hora_saida: s.hora_saida ? String(s.hora_saida) : null,
            resumo_atividades: s.resumo_atividades ?? null,

            aluno_user_id: alunoUser?.id ?? null,
            aluno_nome: alunoUser?.name ?? `Aluno #${s.id_aluno}`,
            aluno_foto_url: alunoUser?.foto_url ?? null,
            aluno_cpf: alunoUser?.cpf ?? null,
            aluno_data_nascimento: alunoUser?.data_nascimento ?? null,
            aluno_celular: alunoUser?.celular ?? null,
            aluno_logradouro: alunoUser?.logradouro ?? null,
            aluno_numero_endereco: alunoUser?.numero_endereco ?? null,
            aluno_bairro: alunoUser?.bairro ?? null,
            aluno_municipio: alunoUser?.municipio ?? null,
            aluno_ponto_referencia: alunoUser?.ponto_referencia ?? null,
            numero_inscricao: mat?.numero_inscricao ?? null,
            mat_data_matricula: mat?.data_matricula ?? null,
            mat_ano_letivo: mat?.ano_letivo != null ? Number(mat.ano_letivo) : null,

            id_nivel_ensino: nivelId,
            aluno_nis: aluno?.nis ?? null,
            aluno_possui_necessidade_especial: aluno?.possui_necessidade_especial ?? null,
            aluno_possui_beneficio_governo: aluno?.possui_beneficio_governo ?? null,

            sala_nome: sala?.nome ?? (s.id_sala ? `Sala #${s.id_sala}` : '-'),
            sala_tipo: sala?.tipo_sala ?? '-',

            disciplina_nome: disc?.nome_disciplina ?? '-',
            ano_nome: ano?.nome_ano ?? '-',

            id_disciplina: prog?.id_disciplina != null ? Number(prog.id_disciplina) : null,
            id_ano_escolar: prog?.id_ano_escolar != null ? Number(prog.id_ano_escolar) : null,
          }
        })

        setSessoes(lista)

        const r: Record<number, string> = {}
        lista.forEach((s) => {
          r[s.id_sessao] = s.resumo_atividades ?? ''
        })
        setResumoPorSessao(r)
      } catch (e) {
        console.error(e)
        erro('Erro ao carregar sessões de atendimento.')
      } finally {
        if (mountedRef.current) setCarregandoSessoes(false)
      }
    },
    [supabase, erro]
  )

  // ======= finalizar rápido =======
  const finalizarSessaoRapido = useCallback(
    async (sessao: SessaoView) => {
      if (!supabase) return
      if (!idProfessor) return
      if (sessao.hora_saida) return

      try {
        const agora = new Date().toISOString()
        const resumo = (resumoPorSessao[sessao.id_sessao] ?? '').trim()

        const { error: errUp } = await supabase
          .from('sessoes_atendimento')
          .update({
            hora_saida: agora,
            resumo_atividades: resumo ? resumo : null,
          })
          .eq('id_sessao', sessao.id_sessao)

        if (errUp) throw errUp

        sucesso('Atendimento finalizado.')
        setMostrarHistorico(true)
        await carregarSessoes(idProfessor, filtroDataInicio, filtroDataFim)
      } catch (e) {
        console.error(e)
        erro('Falha ao finalizar atendimento.')
      }
    },
    [supabase, idProfessor, resumoPorSessao, sucesso, erro, carregarSessoes, filtroDataInicio, filtroDataFim]
  )

  // ======= registros =======
  const carregarRegistrosDaSessao = useCallback(
    async (sessaoId: number) => {
      if (!supabase) return

      setCarregandoRegistros(true)
      try {
        const { data, error: err } = await supabase
          .from('registros_atendimento')
          .select(
            `
            id_atividade,
            id_sessao,
            id_progresso,
            numero_protocolo,
            id_tipo_protocolo,
            status,
            nota,
            is_adaptada,
            sintese,
            created_at,
            updated_at,
            tipos_protocolo ( nome )
          `
          )
          .eq('id_sessao', sessaoId)
          .order('numero_protocolo', { ascending: true })
          .order('created_at', { ascending: true })

        if (err) throw err

        const lista: RegistroView[] = (data ?? []).map((r: any) => {
          const tp = first(r?.tipos_protocolo) as any
          return {
            id_atividade: Number(r.id_atividade),
            id_sessao: Number(r.id_sessao),
            id_progresso: Number(r.id_progresso),
            numero_protocolo: Number(r.numero_protocolo),
            id_tipo_protocolo: Number(r.id_tipo_protocolo),
            status: String(r.status),
            nota: r.nota != null ? Number(r.nota) : null,
            is_adaptada: Boolean(r.is_adaptada),
            sintese: r.sintese ?? null,
            created_at: String(r.created_at),
            updated_at: String(r.updated_at),
            tipo_nome: tp?.nome ?? '-',
          }
        })

        setRegistros(lista)
      } catch (e) {
        console.error(e)
        erro('Erro ao carregar protocolos desta sessão.')
      } finally {
        if (mountedRef.current) setCarregandoRegistros(false)
      }
    },
    [supabase, erro]
  )

  const abrirSessao = useCallback(
    async (s: SessaoView) => {
      setSessaoAtual(s)
      setDlgSessao(true)
      await carregarRegistrosDaSessao(s.id_sessao)
    },
    [carregarRegistrosDaSessao]
  )

  const fecharSessaoDialog = useCallback(() => {
    setDlgSessao(false)
    setDlgEditarAluno(false)
    setSessaoAtual(null)
    setRegistros([])
  }, [])

  const aplicarAtualizacaoAlunoSessao = useCallback(
    (payload: Partial<FormAlunoSessao>) => {
      setSessaoAtual((old) => {
        if (!old) return old
        return {
          ...old,
          aluno_celular: payload.celular ?? old.aluno_celular ?? null,
          aluno_logradouro: payload.logradouro ?? old.aluno_logradouro ?? null,
          aluno_numero_endereco: payload.numero_endereco ?? old.aluno_numero_endereco ?? null,
          aluno_bairro: payload.bairro ?? old.aluno_bairro ?? null,
          aluno_municipio: payload.municipio ?? old.aluno_municipio ?? null,
          aluno_ponto_referencia: payload.ponto_referencia ?? old.aluno_ponto_referencia ?? null,
          aluno_foto_url: payload.foto_url ?? old.aluno_foto_url ?? null,
        }
      })

      setSessoes((old) =>
        old.map((sessao) => {
          if (!sessaoAtual || sessao.id_aluno !== sessaoAtual.id_aluno) return sessao
          return {
            ...sessao,
            aluno_celular: payload.celular ?? sessao.aluno_celular ?? null,
            aluno_logradouro: payload.logradouro ?? sessao.aluno_logradouro ?? null,
            aluno_numero_endereco: payload.numero_endereco ?? sessao.aluno_numero_endereco ?? null,
            aluno_bairro: payload.bairro ?? sessao.aluno_bairro ?? null,
            aluno_municipio: payload.municipio ?? sessao.aluno_municipio ?? null,
            aluno_ponto_referencia: payload.ponto_referencia ?? sessao.aluno_ponto_referencia ?? null,
            aluno_foto_url: payload.foto_url ?? sessao.aluno_foto_url ?? null,
          }
        })
      )
    },
    [sessaoAtual]
  )

  const abrirDialogEditarAluno = useCallback(() => {
    if (!sessaoAtual?.aluno_user_id) return erro('Este aluno não possui vínculo válido com a tabela de usuários.')

    setFormAlunoSessao({
      celular: sessaoAtual.aluno_celular ?? '',
      logradouro: sessaoAtual.aluno_logradouro ?? '',
      numero_endereco: sessaoAtual.aluno_numero_endereco ?? '',
      bairro: sessaoAtual.aluno_bairro ?? '',
      municipio: sessaoAtual.aluno_municipio ?? '',
      ponto_referencia: sessaoAtual.aluno_ponto_referencia ?? '',
      foto_url: sessaoAtual.aluno_foto_url ?? '',
    })
    setDlgEditarAluno(true)
  }, [sessaoAtual, erro])

  const salvarDadosAlunoSessao = useCallback(async () => {
    if (!supabase) return
    if (!sessaoAtual?.aluno_user_id) return erro('Não foi possível localizar o usuário do aluno.')

    setSalvandoAlunoSessao(true)
    try {
      const payload = {
        celular: formAlunoSessao.celular.trim() || null,
        logradouro: formAlunoSessao.logradouro.trim() || null,
        numero_endereco: formAlunoSessao.numero_endereco.trim() || null,
        bairro: formAlunoSessao.bairro.trim() || null,
        municipio: formAlunoSessao.municipio.trim() || null,
        ponto_referencia: formAlunoSessao.ponto_referencia.trim() || null,
        foto_url: formAlunoSessao.foto_url.trim() || null,
      }

      const { error: errUp } = await supabase
        .from('usuarios')
        .update(payload)
        .eq('id', sessaoAtual.aluno_user_id)

      if (errUp) throw errUp

      aplicarAtualizacaoAlunoSessao({
        celular: payload.celular ?? '',
        logradouro: payload.logradouro ?? '',
        numero_endereco: payload.numero_endereco ?? '',
        bairro: payload.bairro ?? '',
        municipio: payload.municipio ?? '',
        ponto_referencia: payload.ponto_referencia ?? '',
        foto_url: payload.foto_url ?? '',
      })
      setDlgEditarAluno(false)
      sucesso('Dados do aluno atualizados com sucesso.')
    } catch (e) {
      console.error(e)
      erro('Falha ao atualizar telefone/endereço do aluno.')
    } finally {
      if (mountedRef.current) setSalvandoAlunoSessao(false)
    }
  }, [supabase, sessaoAtual, formAlunoSessao, aplicarAtualizacaoAlunoSessao, sucesso, erro])

  const enviarFotoAlunoSessao = useCallback(
    async (file: File) => {
      if (!supabase) return
      if (!sessaoAtual?.aluno_user_id) return erro('Não foi possível localizar o usuário do aluno.')

      setUploadingFotoAlunoSessao(true)
      try {
        const arquivoOtimizado = await otimizarImagemParaUpload(file, {
          maxWidth: 1280,
          maxHeight: 1280,
          quality: 0.62,
          mimeType: 'image/jpeg',
          fileName: file.name,
        })

        if (arquivoOtimizado.size > 5 * 1024 * 1024) {
          aviso('Mesmo com a compressão automática, a foto ficou acima de 5MB.')
          return
        }

        const bucket = 'avatars'
        const caminho = `alunos/aluno-${sessaoAtual.id_aluno}-${Date.now()}.jpg`

        const { error: errStorage } = await supabase.storage.from(bucket).upload(caminho, arquivoOtimizado, {
          upsert: true,
          contentType: arquivoOtimizado.type || 'image/jpeg',
        })

        if (errStorage) throw errStorage

        const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(caminho)
        const fotoUrl = publicUrlData?.publicUrl

        if (!fotoUrl) throw new Error('Não foi possível gerar a URL pública da foto.')

        const { error: errUsuario } = await supabase
          .from('usuarios')
          .update({ foto_url: fotoUrl })
          .eq('id', sessaoAtual.aluno_user_id)

        if (errUsuario) throw errUsuario

        setFormAlunoSessao((old) => ({ ...old, foto_url: fotoUrl }))
        aplicarAtualizacaoAlunoSessao({ foto_url: fotoUrl })
        sucesso('Foto do aluno atualizada com compressão automática.')
      } catch (e) {
        console.error(e)
        erro('Falha ao salvar a foto do aluno.')
      } finally {
        if (mountedRef.current) setUploadingFotoAlunoSessao(false)
      }
    },
    [
      supabase,
      sessaoAtual,
      aplicarAtualizacaoAlunoSessao,
      sucesso,
      erro,
      aviso,
      idProfessor,
      carregarSessoes,
      filtroDataInicio,
      filtroDataFim,
    ]
  )

  const salvarResumoSessao = useCallback(async () => {
    if (!supabase) return
    if (!sessaoAtual) return

    setSalvandoSessao(true)
    try {
      const { error: errUp } = await supabase
        .from('sessoes_atendimento')
        .update({
          resumo_atividades: sessaoAtual.resumo_atividades?.trim() ? sessaoAtual.resumo_atividades.trim() : null,
        })
        .eq('id_sessao', sessaoAtual.id_sessao)

      if (errUp) throw errUp
      sucesso('Resumo da sessão salvo.')
    } catch (e) {
      console.error(e)
      erro('Falha ao salvar o resumo da sessão.')
    } finally {
      if (mountedRef.current) setSalvandoSessao(false)
    }
  }, [supabase, sessaoAtual, sucesso, erro])

  const encerrarSessaoAgora = useCallback(async () => {
    if (!supabase) return
    if (!sessaoAtual) return
    if (sessaoAtual.hora_saida) {
      info('Esta sessão já está encerrada.')
      return
    }

    setSalvandoSessao(true)
    try {
      const agora = new Date().toISOString()
      const { error: errUp } = await supabase
        .from('sessoes_atendimento')
        .update({
          hora_saida: agora,
          resumo_atividades: sessaoAtual.resumo_atividades?.trim() ? sessaoAtual.resumo_atividades.trim() : null,
        })
        .eq('id_sessao', sessaoAtual.id_sessao)

      if (errUp) throw errUp

      sucesso('Sessão encerrada com sucesso.')
      setMostrarHistorico(true)
      setSessaoAtual((old) => (old ? { ...old, hora_saida: agora } : old))
    } catch (e) {
      console.error(e)
      erro('Falha ao encerrar a sessão.')
    } finally {
      if (mountedRef.current) setSalvandoSessao(false)
    }
  }, [supabase, sessaoAtual, sucesso, erro, info])

  // ======= regras matricula/progresso =======
  const obterIdStatusMatriculaAtiva = useCallback((): number | null => {
    const ativa = statusMatriculas.find((s) => normalizarTexto(s.nome).includes('ativa'))
    return ativa ? Number(ativa.id_status_matricula) : null
  }, [statusMatriculas])

  const obterIdStatusDisciplinaDefault = useCallback((): number | null => {
    const cursando = statusDisciplinas.find((s) => normalizarTexto(s.nome).includes('cursando'))
    if (cursando) return Number(cursando.id_status_disciplina)
    const aCursar = statusDisciplinas.find((s) => normalizarTexto(s.nome).includes('a cursar'))
    if (aCursar) return Number(aCursar.id_status_disciplina)
    return statusDisciplinas[0]?.id_status_disciplina ? Number(statusDisciplinas[0].id_status_disciplina) : null
  }, [statusDisciplinas])

  const obterMatriculaPreferencial = useCallback(
    async (alunoId: number, idNivelEnsino?: number | null): Promise<number | null> => {
      if (!supabase) return null

      const ativaId = obterIdStatusMatriculaAtiva()
      let q = supabase
        .from('matriculas')
        .select('id_matricula,id_status_matricula,ano_letivo,data_matricula,numero_inscricao,id_nivel_ensino')
        .eq('id_aluno', alunoId)
        .order('ano_letivo', { ascending: false })
        .order('data_matricula', { ascending: false })

      if (idNivelEnsino != null) q = q.eq('id_nivel_ensino', idNivelEnsino)

      const { data, error: err } = await q
      if (err) throw err

      const lista = (data ?? []).map((m: any) => ({
        id_matricula: Number(m.id_matricula),
        id_status_matricula: Number(m.id_status_matricula),
      }))

      if (lista.length === 0) return null

      if (ativaId != null) {
        const ativa = lista.find((m) => m.id_status_matricula === ativaId)
        if (ativa) return ativa.id_matricula
      }
      return lista[0].id_matricula
    },
    [supabase, obterIdStatusMatriculaAtiva]
  )

  const garantirProgresso = useCallback(
    async (idMatricula: number, idDisciplina: number, idAnoEscolar: number): Promise<number> => {
      if (!supabase) throw new Error('Supabase indisponível.')

      const { data: existente, error: errSel } = await supabase
        .from('progresso_aluno')
        .select('id_progresso')
        .eq('id_matricula', idMatricula)
        .eq('id_disciplina', idDisciplina)
        .eq('id_ano_escolar', idAnoEscolar)
        .maybeSingle()

      if (errSel) throw errSel
      if (existente?.id_progresso) return Number(existente.id_progresso)

      const statusDefaultId = obterIdStatusDisciplinaDefault()
      if (!statusDefaultId) throw new Error('Tabela status_disciplina_aluno não possui valores para status inicial.')

      const { data: criado, error: errIns } = await supabase
        .from('progresso_aluno')
        .insert({
          id_matricula: idMatricula,
          id_disciplina: idDisciplina,
          id_ano_escolar: idAnoEscolar,
          id_status_disciplina: statusDefaultId,
        })
        .select('id_progresso')
        .single()

      if (errIns) throw errIns
      if (!criado?.id_progresso) throw new Error('Falha ao criar progresso (sem id_progresso).')
      return Number(criado.id_progresso)
    },
    [supabase, obterIdStatusDisciplinaDefault]
  )

  // ======= buscar alunos (nome / RA / CPF) =======
  const buscarAlunos = useCallback(
    async (termo: string) => {
      if (!supabase) return

      const t = termo.trim()
      if (t.length < 2) {
        setOpcoesAluno([])
        return
      }

      setBuscandoAlunos(true)

      try {
        const digitos = extrairDigitos(t)
        const temLetras = /[A-Za-zÀ-ÿ]/.test(t)
        const buscaNumerica = isBuscaNumerica(t)
        const optsMap = new Map<number, AlunoBuscaOption>()

        const adicionarOpcoesDoAluno = (aluno: any, usuario: any) => {
          const matsRaw = (aluno?.matriculas ?? []).map((m: any) => ({
            id_matricula: m?.id_matricula != null ? Number(m.id_matricula) : null,
            numero_inscricao: m?.numero_inscricao ? String(m.numero_inscricao) : null,
            ano_letivo: Number(m?.ano_letivo ?? 0),
            data_matricula: m?.data_matricula ? String(m.data_matricula) : '1900-01-01',
            id_nivel_ensino: m?.id_nivel_ensino != null ? Number(m.id_nivel_ensino) : null,
          }))

          const matsFiltradas =
            nivelFiltroEnsino === 'todos'
              ? matsRaw
              : matsRaw.filter((m: any) => Number(m.id_nivel_ensino) === Number(nivelFiltroEnsino))

          matsFiltradas.sort((x: any, y: any) => {
            if (y.ano_letivo !== x.ano_letivo) return y.ano_letivo - x.ano_letivo
            return new Date(y.data_matricula).getTime() - new Date(x.data_matricula).getTime()
          })

          matsFiltradas.forEach((m: any) => {
            if (!m.id_matricula) return

            optsMap.set(Number(m.id_matricula), {
              id_aluno: Number(aluno?.id_aluno),
              nome: usuario?.name ?? `Aluno #${aluno?.id_aluno}`,
              email: usuario?.email ?? null,
              foto_url: usuario?.foto_url ?? null,
              cpf: usuario?.cpf ?? null,
              data_nascimento: usuario?.data_nascimento ?? null,
              id_matricula: Number(m.id_matricula),
              numero_inscricao: m.numero_inscricao ?? null,
              id_nivel_ensino: m.id_nivel_ensino ?? null,
              nis: aluno?.nis ?? null,
              possui_necessidade_especial: aluno?.possui_necessidade_especial ?? null,
              possui_beneficio_governo: aluno?.possui_beneficio_governo ?? null,
            })
          })
        }

        const carregarAlunosPorUsuarios = async (usuariosRows: any[]) => {
          const idsUsuario = Array.from(
            new Set(
              (usuariosRows ?? [])
                .map((u: any) => String(u?.id ?? '').trim())
                .filter(Boolean)
            )
          )

          if (idsUsuario.length === 0) return

          const usuariosPorId = new Map<string, any>()
          ;(usuariosRows ?? []).forEach((u: any) => {
            const id = String(u?.id ?? '').trim()
            if (!id) return
            usuariosPorId.set(id, u)
          })

          const { data: alunosData, error: errAlunos } = await supabase
            .from('alunos')
            .select(
              `
              id_aluno,
              user_id,
              nis,
              possui_necessidade_especial,
              possui_beneficio_governo,
              matriculas ( id_matricula, numero_inscricao, ano_letivo, data_matricula, id_nivel_ensino )
            `
            )
            .in('user_id', idsUsuario)

          if (errAlunos) throw errAlunos

          ;(alunosData ?? []).forEach((a: any) => {
            const usuarioAluno = usuariosPorId.get(String(a?.user_id ?? ''))
            adicionarOpcoesDoAluno(a, usuarioAluno)
          })
        }

        const adicionarOpcoesPorMatriculas = async (matriculasRows: any[]) => {
          const alunosRaw = (matriculasRows ?? []).map((m: any) => first(m?.alunos)).filter(Boolean)
          const userIds = Array.from(
            new Set(
              alunosRaw
                .map((a: any) => String(a?.user_id ?? '').trim())
                .filter(Boolean)
            )
          )

          const usuariosPorId = new Map<string, any>()
          if (userIds.length > 0) {
            const { data: usuariosData, error: errUsuarios } = await supabase
              .from('usuarios')
              .select('id, name, email, foto_url, cpf, data_nascimento')
              .in('id', userIds)

            if (errUsuarios) throw errUsuarios

            ;(usuariosData ?? []).forEach((u: any) => {
              const id = String(u?.id ?? '').trim()
              if (!id) return
              usuariosPorId.set(id, u)
            })
          }

          ;(matriculasRows ?? []).forEach((m: any) => {
            const aluno = first(m?.alunos) as any
            const usuarioAluno = usuariosPorId.get(String(aluno?.user_id ?? ''))
            const idMat = Number(m?.id_matricula)

            if (!idMat || !aluno?.id_aluno) return

            optsMap.set(idMat, {
              id_aluno: Number(m?.id_aluno ?? aluno?.id_aluno),
              nome: usuarioAluno?.name ?? `Aluno #${m?.id_aluno ?? aluno?.id_aluno}`,
              email: usuarioAluno?.email ?? null,
              foto_url: usuarioAluno?.foto_url ?? null,
              cpf: usuarioAluno?.cpf ?? null,
              data_nascimento: usuarioAluno?.data_nascimento ?? null,
              id_matricula: idMat,
              numero_inscricao: m?.numero_inscricao ? String(m.numero_inscricao) : null,
              id_nivel_ensino: m?.id_nivel_ensino != null ? Number(m.id_nivel_ensino) : null,
              nis: aluno?.nis ?? null,
              possui_necessidade_especial: aluno?.possui_necessidade_especial ?? null,
              possui_beneficio_governo: aluno?.possui_beneficio_governo ?? null,
            })
          })
        }

        if (temLetras) {
          const { data: usuariosPorNome, error: errUsuariosNome } = await supabase
            .from('usuarios')
            .select('id, name, email, foto_url, cpf, data_nascimento')
            .eq('id_tipo_usuario', 5)
            .ilike('name', `%${t}%`)
            .limit(40)

          if (errUsuariosNome) throw errUsuariosNome

          let usuariosEncontrados = (usuariosPorNome ?? []) as any[]

          if (usuariosEncontrados.length === 0) {
            const termoNormalizado = normalizarTexto(t)
            const { data: usuariosFallback, error: errFallback } = await supabase
              .from('usuarios')
              .select('id, name, email, foto_url, cpf, data_nascimento')
              .eq('id_tipo_usuario', 5)
              .order('name', { ascending: true })
              .limit(500)

            if (errFallback) throw errFallback

            usuariosEncontrados = ((usuariosFallback ?? []) as any[])
              .filter((u: any) => normalizarTexto(String(u?.name ?? '')).includes(termoNormalizado))
              .slice(0, 40)
          }

          await carregarAlunosPorUsuarios(usuariosEncontrados)
        }

        if (buscaNumerica) {
          const termosRA = Array.from(
            new Set(
              [t, digitos]
                .map((valor) => String(valor ?? '').trim())
                .filter((valor) => valor.length >= 2)
            )
          )

          if (termosRA.length > 0) {
            let qRA = supabase
              .from('matriculas')
              .select(
                `
                id_matricula,
                id_aluno,
                numero_inscricao,
                ano_letivo,
                data_matricula,
                id_nivel_ensino,
                alunos!inner (
                  id_aluno,
                  user_id,
                  nis,
                  possui_necessidade_especial,
                  possui_beneficio_governo
                )
              `
              )
              .order('ano_letivo', { ascending: false })
              .limit(40)

            qRA =
              termosRA.length === 1
                ? qRA.ilike('numero_inscricao', `%${termosRA[0]}%`)
                : qRA.or(termosRA.map((valor) => `numero_inscricao.ilike.%${valor}%`).join(','))

            if (nivelFiltroEnsino !== 'todos') qRA = qRA.eq('id_nivel_ensino', nivelFiltroEnsino)

            const { data: matsDiretas, error: errMats } = await qRA
            if (errMats) throw errMats

            let matsEncontradas = (matsDiretas ?? []) as any[]

            if (matsEncontradas.length === 0 && digitos.length >= 2) {
              let qRAFallback = supabase
                .from('matriculas')
                .select(
                  `
                  id_matricula,
                  id_aluno,
                  numero_inscricao,
                  ano_letivo,
                  data_matricula,
                  id_nivel_ensino,
                  alunos!inner (
                    id_aluno,
                    user_id,
                    nis,
                    possui_necessidade_especial,
                    possui_beneficio_governo
                  )
                `
                )
                .order('ano_letivo', { ascending: false })
                .limit(1200)

              if (nivelFiltroEnsino !== 'todos') qRAFallback = qRAFallback.eq('id_nivel_ensino', nivelFiltroEnsino)

              const { data: matsFallback, error: errRAFallback } = await qRAFallback
              if (errRAFallback) throw errRAFallback

              matsEncontradas = ((matsFallback ?? []) as any[])
                .filter((m: any) => extrairDigitos(String(m?.numero_inscricao ?? '')).includes(digitos))
                .slice(0, 40)
            }

            await adicionarOpcoesPorMatriculas(matsEncontradas)
          }

          if (digitos.length >= 11) {
            const cpfFmt = formatarCPF(digitos)
            const termosCPF = Array.from(
              new Set(
                [t, digitos, cpfFmt]
                  .map((valor) => String(valor ?? '').trim())
                  .filter((valor) => valor.length >= 11)
              )
            )

            let qCPF = supabase
              .from('usuarios')
              .select('id, name, email, foto_url, cpf, data_nascimento')
              .eq('id_tipo_usuario', 5)
              .limit(40)

            qCPF =
              termosCPF.length === 1
                ? qCPF.ilike('cpf', `%${termosCPF[0]}%`)
                : qCPF.or(termosCPF.map((valor) => `cpf.ilike.%${valor}%`).join(','))

            const { data: usuariosCPF, error: errCPF } = await qCPF
            if (errCPF) throw errCPF

            await carregarAlunosPorUsuarios((usuariosCPF ?? []) as any[])
          }
        }

        const optsFinal = Array.from(optsMap.values())
          .sort((a, b) => a.nome.localeCompare(b.nome))
          .slice(0, 25)

        setOpcoesAluno(optsFinal)
      } catch (e) {
        console.error(e)
        erro('Falha ao buscar alunos.')
      } finally {
        if (mountedRef.current) setBuscandoAlunos(false)
      }
    },
    [supabase, erro, nivelFiltroEnsino]
  )

  // ======= fichas do aluno =======
  const carregarFichasDoAlunoNaSala = useCallback(
    async (aluno: AlunoBuscaOption, salaId: number) => {
      if (!supabase) return
      setCarregandoFichas(true)

      try {
        const nivelAluno = aluno.id_nivel_ensino != null ? Number(aluno.id_nivel_ensino) : null
        const idMatricula = aluno.id_matricula ?? (await obterMatriculaPreferencial(aluno.id_aluno, nivelAluno ?? undefined))

        if (!idMatricula) {
          setProgressosAlunoTodos([])
          setFichasAbertasNaSala([])
          setQtdDisciplinasAbertas(null)
          setProgressoEscolhidoId(null)
          setConfigSelecionada(null)
          setUsarFichaExistente(false)
          aviso('Este aluno não possui matrícula cadastrada.')
          return
        }

        const { data, error: err } = await supabase
          .from('progresso_aluno')
          .select(
            `
            id_progresso,
            id_disciplina,
            id_ano_escolar,
            id_status_disciplina,
            status_disciplina_aluno ( nome ),
            disciplinas ( nome_disciplina ),
            anos_escolares ( nome_ano, id_nivel_ensino )
          `
          )
          .eq('id_matricula', idMatricula)

        if (err) throw err

        const todos: ProgressoOption[] = (data ?? []).map((p: any) => {
          const st = first(p?.status_disciplina_aluno) as any
          const disc = first(p?.disciplinas) as any
          const ano = first(p?.anos_escolares) as any

          const disciplinaNome = disc?.nome_disciplina ? String(disc.nome_disciplina) : `Disciplina #${p.id_disciplina}`
          const anoNome = ano?.nome_ano ? String(ano.nome_ano) : `Ano #${p.id_ano_escolar}`
          const statusNome = st?.nome ? String(st.nome) : null
          const nivelId = ano?.id_nivel_ensino != null ? Number(ano.id_nivel_ensino) : null

          return {
            id_progresso: Number(p.id_progresso),
            id_disciplina: Number(p.id_disciplina),
            id_ano_escolar: Number(p.id_ano_escolar),
            id_nivel_ensino: nivelId,
            disciplina_nome: disciplinaNome,
            ano_nome: anoNome,
            status_nome: statusNome,
            label: `${disciplinaNome}${statusNome ? ` • ${statusNome}` : ''}`,
          }
        })

        setProgressosAlunoTodos(todos)

        const abertasRaw = todos.filter((p) => isStatusDisciplinaAberta(p.status_nome ?? ''))
        const qtdAbertasDisc = new Set(abertasRaw.map((p) => p.id_disciplina)).size
        setQtdDisciplinasAbertas(qtdAbertasDisc)

        const setDisciplinasSala = new Set(
          (configsPorSala[salaId] ?? [])
            .filter((c) => (nivelAluno != null ? Number(c.id_nivel_ensino) === Number(nivelAluno) : true))
            .map((c) => c.id_disciplina)
        )

        const abertasPorDisc = agruparAbertasPorDisciplina(abertasRaw)
        const abertasNaSala = abertasPorDisc.filter((p) => setDisciplinasSala.has(p.id_disciplina))

        setFichasAbertasNaSala(abertasNaSala)

        if (abertasNaSala.length > 0) {
          setUsarFichaExistente(true)
          setProgressoEscolhidoId(abertasNaSala[0].id_progresso)
          setConfigSelecionada(null)
        } else {
          setUsarFichaExistente(false)
          setProgressoEscolhidoId(null)
        }
      } catch (e) {
        console.error(e)
        erro('Falha ao verificar fichas do aluno.')
      } finally {
        if (mountedRef.current) setCarregandoFichas(false)
      }
    },
    [supabase, obterMatriculaPreferencial, configsPorSala, aviso, erro]
  )

  // ======= abrir fluxo =======
  const abrirFluxo = useCallback(
    (modo: FluxoTipo) => {
      if (carregandoBase) return
      if (!idProfessor) {
        aviso('Professor não identificado.')
        return
      }
      if (minhasSalas.length === 0) {
        aviso('Você não tem salas configuradas.')
        return
      }

      setFluxoTipo(modo)

      setAlunoInput('')
      setOpcoesAluno([])
      setAlunoSelecionado(null)
      setNivelFiltroEnsino('todos')

      setProgressosAlunoTodos([])
      setFichasAbertasNaSala([])
      setQtdDisciplinasAbertas(null)
      setUsarFichaExistente(true)
      setProgressoEscolhidoId(null)
      setConfigSelecionada(null)

      const agora = agoraParaInputDateTimeLocal()
      setNovoHoraEntrada(agora)
      setNovoHoraSaida(agora)
      setNovoResumo('')
      setDlgConfirmAbrirFicha(false)

      if (minhasSalas.length === 1) {
        setSalaAtendimentoId(minhasSalas[0].id_sala)
        setDlgNovoAtendimento(true)
      } else {
        setSalaAtendimentoId(null)
        setDlgEscolherSala(true)
      }
    },
    [carregandoBase, idProfessor, minhasSalas, aviso]
  )

  const abrirFluxoNovoAtendimento = useCallback(() => abrirFluxo('normal'), [abrirFluxo])
  const abrirFluxoLancamentoManual = useCallback(() => abrirFluxo('manual'), [abrirFluxo])

  const escolherSalaEContinuar = useCallback((idSala: number) => {
    setSalaAtendimentoId(idSala)
    setDlgEscolherSala(false)
    setDlgNovoAtendimento(true)
  }, [])

  // debounce busca aluno
  useEffect(() => {
    if (!dlgNovoAtendimento) return
    const t = alunoInput.trim()
    const h = setTimeout(() => {
      void buscarAlunos(t)
    }, 350)
    return () => clearTimeout(h)
  }, [alunoInput, dlgNovoAtendimento, buscarAlunos])

  // ao escolher aluno + sala carrega fichas
  useEffect(() => {
    if (!dlgNovoAtendimento) return
    if (!alunoSelecionado?.id_aluno) return
    if (!salaAtendimentoId) return
    void carregarFichasDoAlunoNaSala(alunoSelecionado, salaAtendimentoId)
  }, [dlgNovoAtendimento, alunoSelecionado?.id_aluno, salaAtendimentoId, carregarFichasDoAlunoNaSala])

  // ======= criar atendimento =======
  const podeAbrirNovaDisciplina = useMemo(() => {
    if (podeAbrirMaisQue3) return true
    if (qtdDisciplinasAbertas == null) return true
    return qtdDisciplinasAbertas < 3
  }, [podeAbrirMaisQue3, qtdDisciplinasAbertas])

  const criarAtendimento = useCallback(
    async (opts?: { confirmarCriacaoFicha?: boolean }) => {
      if (!supabase) return
      if (!usuario?.id) return
      if (!idProfessor) return

      if (!salaAtendimentoId) return aviso('Selecione a sala.')
      if (!alunoSelecionado?.id_aluno) return aviso('Selecione o aluno.')
      if (!novoHoraEntrada?.trim()) return aviso('Informe a hora de entrada.')

      if (fluxoTipo === 'manual' && !novoHoraSaida?.trim()) return aviso('No lançamento manual, informe a hora de saída.')

      const dtEntrada = new Date(novoHoraEntrada)
      if (Number.isNaN(dtEntrada.getTime())) return aviso('Hora de entrada inválida.')

      let dtSaida: Date | null = null
      if (fluxoTipo === 'manual') {
        dtSaida = new Date(novoHoraSaida)
        if (Number.isNaN(dtSaida.getTime())) return aviso('Hora de saída inválida.')
        if (dtSaida.getTime() < dtEntrada.getTime()) return aviso('Hora de saída não pode ser menor que a entrada.')
      }

      const nivelAluno = alunoSelecionado.id_nivel_ensino != null ? Number(alunoSelecionado.id_nivel_ensino) : null
      if (nivelAluno != null && nivelFiltroEnsino !== 'todos' && Number(nivelFiltroEnsino) !== Number(nivelAluno)) {
        return erro(`Nível incompatível: o aluno é ${nomeNivelEnsinoLongo(nivelAluno)}.`)
      }

      setSalvandoNovoAtendimento(true)
      try {
        const idMatricula =
          alunoSelecionado.id_matricula ??
          (await obterMatriculaPreferencial(alunoSelecionado.id_aluno, nivelAluno ?? nivelEfetivoDoAtendimento ?? undefined))

        if (!idMatricula) return aviso('Este aluno não possui matrícula cadastrada.')

        let idProgresso: number | null = null

        if (usarFichaExistente) {
          if (!progressoEscolhidoId) return aviso('Selecione uma ficha aberta da sala.')
          idProgresso = progressoEscolhidoId
        } else {
          if (!configSelecionada) return aviso('Selecione a disciplina para abrir ficha.')

          if (nivelAluno != null && Number(configSelecionada.id_nivel_ensino) !== Number(nivelAluno)) {
            return erro(
              `Disciplina de nível incorreto: aluno ${nomeNivelEnsinoLongo(nivelAluno)} vs disciplina ${nomeNivelEnsinoLongo(configSelecionada.id_nivel_ensino)}.`
            )
          }

          const existente = escolherProgressoPorDisciplina(progressosAlunoTodos, configSelecionada.id_disciplina)

          if (!existente && !opts?.confirmarCriacaoFicha) {
            if (!podeAbrirNovaDisciplina) {
              return erro('Aluno já possui 3+ disciplinas abertas. Apenas ADMIN/DIRETOR/COORDENAÇÃO pode abrir nova disciplina.')
            }
            setDlgConfirmAbrirFicha(true)
            return
          }

          if (!existente && !podeAbrirNovaDisciplina) {
            return erro('Aluno já possui 3+ disciplinas abertas. Apenas ADMIN/DIRETOR/COORDENAÇÃO pode abrir nova disciplina.')
          }

          idProgresso = existente
            ? existente.id_progresso
            : await garantirProgresso(idMatricula, configSelecionada.id_disciplina, configSelecionada.ano_representativo_id)
        }

        const horaEntradaISO = dtEntrada.toISOString()
        const horaSaidaISO = fluxoTipo === 'manual' && dtSaida ? dtSaida.toISOString() : null

        const agoraISO = new Date().toISOString()
        const marcadorManual = fluxoTipo === 'manual' ? `[LANÇAMENTO MANUAL] Lançado em ${formatarDataHoraBR(agoraISO)}.` : ''
        const resumoFinal = [marcadorManual, novoResumo.trim()].filter((x) => Boolean(String(x).trim())).join('\n')

        const { data: nova, error: errIns } = await supabase
          .from('sessoes_atendimento')
          .insert({
            id_aluno: alunoSelecionado.id_aluno,
            id_professor: idProfessor,
            id_sala: salaAtendimentoId,
            id_progresso: idProgresso,
            hora_entrada: horaEntradaISO,
            hora_saida: horaSaidaISO,
            resumo_atividades: resumoFinal ? resumoFinal : null,
          })
          .select(
            `
            id_sessao,
            id_aluno,
            id_professor,
            id_progresso,
            id_sala,
            hora_entrada,
            hora_saida,
            resumo_atividades,
            alunos ( nis, possui_necessidade_especial, possui_beneficio_governo, usuarios ( id, name, foto_url, cpf, data_nascimento, celular, logradouro, numero_endereco, bairro, municipio, ponto_referencia ) ),
            salas_atendimento ( nome, tipo_sala ),
            progresso_aluno (
              id_disciplina,
              id_ano_escolar,
              disciplinas ( nome_disciplina ),
              anos_escolares ( nome_ano, id_nivel_ensino ),
              matriculas ( numero_inscricao, id_nivel_ensino, data_matricula, ano_letivo )
            )
          `
          )
          .single()

        if (errIns) throw errIns

        sucesso(fluxoTipo === 'manual' ? 'Atendimento lançado manualmente.' : 'Atendimento iniciado.')
        if (fluxoTipo === 'manual') setMostrarHistorico(true)

        setDlgConfirmAbrirFicha(false)
        setDlgNovoAtendimento(false)

        await carregarSessoes(idProfessor, filtroDataInicio, filtroDataFim)

        // abre modal da sessão criada
        const aluno = first(nova?.alunos) as any
        const alunoUser = first(aluno?.usuarios) as any
        const sala = first(nova?.salas_atendimento) as any
        const prog = first(nova?.progresso_aluno) as any
        const disc = first(prog?.disciplinas) as any
        const ano = first(prog?.anos_escolares) as any
        const mat = first(prog?.matriculas) as any

        const nivelId =
          mat?.id_nivel_ensino != null
            ? Number(mat.id_nivel_ensino)
            : ano?.id_nivel_ensino != null
              ? Number(ano.id_nivel_ensino)
              : null

        const sessaoMontada: SessaoView = {
          id_sessao: Number(nova.id_sessao),
          id_aluno: Number(nova.id_aluno),
          id_professor: Number(nova.id_professor),
          id_progresso: nova.id_progresso != null ? Number(nova.id_progresso) : null,
          id_sala: nova.id_sala != null ? Number(nova.id_sala) : null,
          hora_entrada: String(nova.hora_entrada),
          hora_saida: nova.hora_saida ? String(nova.hora_saida) : null,
          resumo_atividades: nova.resumo_atividades ?? null,

          aluno_user_id: alunoUser?.id ?? null,
          aluno_nome: alunoUser?.name ?? alunoSelecionado.nome,
          aluno_foto_url: alunoUser?.foto_url ?? null,
          aluno_cpf: alunoUser?.cpf ?? null,
          aluno_data_nascimento: alunoUser?.data_nascimento ?? null,
          aluno_celular: alunoUser?.celular ?? null,
          aluno_logradouro: alunoUser?.logradouro ?? null,
          aluno_numero_endereco: alunoUser?.numero_endereco ?? null,
          aluno_bairro: alunoUser?.bairro ?? null,
          aluno_municipio: alunoUser?.municipio ?? null,
          aluno_ponto_referencia: alunoUser?.ponto_referencia ?? null,
          numero_inscricao: mat?.numero_inscricao ?? alunoSelecionado.numero_inscricao ?? null,
          mat_data_matricula: mat?.data_matricula ?? null,
          mat_ano_letivo: mat?.ano_letivo != null ? Number(mat.ano_letivo) : null,

          id_nivel_ensino: nivelId,
          aluno_nis: aluno?.nis ?? null,
          aluno_possui_necessidade_especial: aluno?.possui_necessidade_especial ?? null,
          aluno_possui_beneficio_governo: aluno?.possui_beneficio_governo ?? null,

          sala_nome: sala?.nome ?? '-',
          sala_tipo: sala?.tipo_sala ?? '-',
          disciplina_nome: disc?.nome_disciplina ?? '-',
          ano_nome: ano?.nome_ano ?? '-',
          id_disciplina: prog?.id_disciplina != null ? Number(prog.id_disciplina) : null,
          id_ano_escolar: prog?.id_ano_escolar != null ? Number(prog.id_ano_escolar) : null,
        }

        setSessaoAtual(sessaoMontada)
        setDlgSessao(true)
        await carregarRegistrosDaSessao(sessaoMontada.id_sessao)
      } catch (e: any) {
        console.error(e)
        erro(`Falha ao ${fluxoTipo === 'manual' ? 'lançar' : 'iniciar'} atendimento: ${e?.message || 'erro desconhecido'}`)
      } finally {
        if (mountedRef.current) setSalvandoNovoAtendimento(false)
      }
    },
    [
      supabase,
      usuario?.id,
      idProfessor,
      salaAtendimentoId,
      alunoSelecionado,
      novoHoraEntrada,
      novoHoraSaida,
      novoResumo,
      usarFichaExistente,
      progressoEscolhidoId,
      configSelecionada,
      progressosAlunoTodos,
      podeAbrirNovaDisciplina,
      obterMatriculaPreferencial,
      nivelEfetivoDoAtendimento,
      nivelFiltroEnsino,
      garantirProgresso,
      carregarSessoes,
      filtroDataInicio,
      filtroDataFim,
      carregarRegistrosDaSessao,
      sucesso,
      aviso,
      erro,
      fluxoTipo,
    ]
  )

  // ======= filtros =======
  const aplicarFiltros = useCallback(async () => {
    if (!idProfessor) return aviso('Professor não identificado.')

    const hoje = hojeISODateLocal()
    const isHoje = filtroDataInicio === hoje && filtroDataFim === hoje
    if (!isHoje) setMostrarHistorico(true)

    await carregarSessoes(idProfessor, filtroDataInicio, filtroDataFim)
  }, [idProfessor, filtroDataInicio, filtroDataFim, carregarSessoes, aviso])

  const resetarParaHoje = useCallback(async () => {
    const hoje = hojeISODateLocal()
    setFiltroDataInicio(hoje)
    setFiltroDataFim(hoje)
    setFiltroTexto('')
    setFiltroSalaId('todas')
    setMostrarHistorico(false)
    if (idProfessor) await carregarSessoes(idProfessor, hoje, hoje)
  }, [idProfessor, carregarSessoes])

  // ======= transferência =======
  const abrirDialogTransferencia = useCallback(async () => {
    if (!supabase) return
    if (!idProfessor) return

    const contexto = transferenciaDisponivel.contexto
    if (!contexto?.id_sala) {
      return aviso(transferenciaDisponivel.motivo || 'Selecione uma sala para transferir os atendimentos abertos.')
    }

    setTransferenciaContexto(contexto)
    setDlgTransferir(true)
    setCarregandoProfSala(true)
    setProfessorDestino(null)
    setProfessoresSala([])
    setQtdAtendimentosAbertosTransferencia(0)

    try {
      const { data: dataProfessores, error: errorProfessores } = await supabase
        .from('professores_salas')
        .select(
          `
          id_professor,
          ativo,
          professores (
            id_professor,
            user_id,
            usuarios ( name, foto_url, cpf, data_nascimento )
          )
        `
        )
        .eq('id_sala', contexto.id_sala)
        .eq('ativo', true)

      if (errorProfessores) throw errorProfessores

      const { count, error: errorQtd } = await supabase
        .from('sessoes_atendimento')
        .select('id_sessao', { count: 'exact', head: true })
        .eq('id_professor', idProfessor)
        .eq('id_sala', contexto.id_sala)
        .is('hora_saida', null)

      if (errorQtd) throw errorQtd

      setQtdAtendimentosAbertosTransferencia(count ?? 0)

      const lista: ProfessorDestinoOption[] = (dataProfessores ?? [])
        .map((r: any) => {
          const p = first(r?.professores) as any
          const u = first(p?.usuarios) as any
          return {
            id_professor: Number(r.id_professor),
            nome: u?.name ? String(u.name) : `Professor #${r.id_professor}`,
            foto_url: u?.foto_url ?? null,
          }
        })
        .filter((p: ProfessorDestinoOption) => p.id_professor !== idProfessor)
        .sort((a, b) => a.nome.localeCompare(b.nome))

      setProfessoresSala(lista)

      if (lista.length === 0) aviso('Não há outro professor ativo nesta sala para transferir.')
      if ((count ?? 0) === 0) aviso('Não há atendimentos abertos nesta sala para transferir.')
    } catch (e) {
      console.error(e)
      erro('Falha ao carregar dados da transferência.')
    } finally {
      if (mountedRef.current) setCarregandoProfSala(false)
    }
  }, [supabase, idProfessor, transferenciaDisponivel, aviso, erro])

  const confirmarTransferencia = useCallback(async () => {
    if (!supabase) return
    if (!idProfessor) return
    if (!transferenciaContexto?.id_sala) return aviso('Sala não definida para a transferência.')
    if (!professorDestino?.id_professor) return aviso('Selecione o professor de destino.')

    setTransferindo(true)
    try {
      const { data, error: errBusca } = await supabase
        .from('sessoes_atendimento')
        .select('id_sessao, id_aluno, id_progresso, resumo_atividades')
        .eq('id_professor', idProfessor)
        .eq('id_sala', transferenciaContexto.id_sala)
        .is('hora_saida', null)

      if (errBusca) throw errBusca

      const sessoesAbertasSala = (data ?? []) as Array<{
        id_sessao: number
        id_aluno: number
        id_progresso: number | null
        resumo_atividades: string | null
      }>

      if (sessoesAbertasSala.length === 0) {
        info('Não há atendimentos abertos para transferir.')
        setDlgTransferir(false)
        setTransferenciaContexto(null)
        return
      }

      const agoraISO = new Date().toISOString()
      const agoraBR = formatarDataHoraBR(agoraISO)

      const linhaFechamento = `[TRANSFERÊNCIA] Encerrado por transferência para ${professorDestino.nome} em ${agoraBR}.`
      const linhaAbertura = `[TRANSFERÊNCIA] Recebido por transferência de ${nomeProfessorAtual} em ${agoraBR}.`

      for (const sessao of sessoesAbertasSala) {
        const resumoFechamento = [sessao.resumo_atividades?.trim(), linhaFechamento].filter(Boolean).join('\n')

        const { error: errUp } = await supabase
          .from('sessoes_atendimento')
          .update({
            hora_saida: agoraISO,
            resumo_atividades: resumoFechamento,
          })
          .eq('id_sessao', sessao.id_sessao)

        if (errUp) throw errUp
      }

      const novasSessoes = sessoesAbertasSala.map((sessao) => ({
        id_aluno: sessao.id_aluno,
        id_professor: professorDestino.id_professor,
        id_sala: transferenciaContexto.id_sala,
        id_progresso: sessao.id_progresso ?? null,
        hora_entrada: agoraISO,
        hora_saida: null,
        resumo_atividades: linhaAbertura,
      }))

      const { error: errIns } = await supabase.from('sessoes_atendimento').insert(novasSessoes)

      if (errIns) throw errIns

      sucesso(`${sessoesAbertasSala.length} atendimento(s) aberto(s) transferido(s) com sucesso.`)
      setQtdAtendimentosAbertosTransferencia(0)
      setMostrarHistorico(true)

      setDlgTransferir(false)
      setTransferenciaContexto(null)

      if (sessaoAtual?.id_sala === transferenciaContexto.id_sala && !sessaoAtual?.hora_saida) {
        setDlgSessao(false)
        setSessaoAtual(null)
        setRegistros([])
      }

      await carregarSessoes(idProfessor, filtroDataInicio, filtroDataFim)
    } catch (e: any) {
      console.error(e)
      erro(`Falha ao transferir: ${e?.message || 'erro desconhecido'}`)
    } finally {
      if (mountedRef.current) setTransferindo(false)
    }
  }, [
    supabase,
    idProfessor,
    transferenciaContexto,
    professorDestino,
    nomeProfessorAtual,
    sessaoAtual,
    aviso,
    info,
    sucesso,
    erro,
    carregarSessoes,
    filtroDataInicio,
    filtroDataFim,
  ])

  // ======= registro dialog =======
  const abrirDialogNovoRegistro = useCallback(() => {
    if (!sessaoAtual) return

    const usados = new Set(registros.map((r) => r.numero_protocolo))
    let sugestao = 1
    const limite = limiteProtocolosSessao ?? 50
    while (usados.has(sugestao) && sugestao <= limite) sugestao += 1

    setRegistroEditandoId(null)
    setRegNumero(sugestao <= limite ? String(sugestao) : '')
    setRegTipoId('')
    setRegStatus('A fazer')
    setRegNota('')
    setRegAdaptada(false)
    setRegSintese('')
    setDlgRegistro(true)
  }, [sessaoAtual, registros, limiteProtocolosSessao])

  const abrirEdicaoRegistro = useCallback((r: RegistroView) => {
    setRegistroEditandoId(r.id_atividade)
    setRegNumero(String(r.numero_protocolo))
    setRegTipoId(String(r.id_tipo_protocolo))
    setRegStatus(r.status)
    setRegNota(r.nota != null ? String(r.nota) : '')
    setRegAdaptada(Boolean(r.is_adaptada))
    setRegSintese(r.sintese ?? '')
    setDlgRegistro(true)
  }, [])

  const fecharDialogRegistro = useCallback(() => {
    setDlgRegistro(false)
    setRegistroEditandoId(null)
    setConfirmDeleteId(null)
  }, [])

  const validarRegistro = useCallback((): { ok: boolean; msg?: string } => {
    if (!sessaoAtual) return { ok: false, msg: 'Sessão não selecionada.' }
    if (!sessaoAtual.id_progresso) return { ok: false, msg: 'Sessão sem progresso vinculado.' }
    if (!regNumero) return { ok: false, msg: 'Selecione o número do protocolo.' }
    if (!regTipoId) return { ok: false, msg: 'Selecione o tipo de protocolo.' }
    if (!regStatus.trim()) return { ok: false, msg: 'Selecione o status.' }

    const numero = Number(regNumero)
    if (Number.isNaN(numero) || numero < 1) return { ok: false, msg: 'Número de protocolo inválido.' }

    const limite = limiteProtocolosSessao ?? null
    if (limite != null && (numero < 1 || numero > limite)) return { ok: false, msg: `Permitido: 1 a ${limite}.` }

    const jaUsado = registros.some((x) => x.numero_protocolo === numero && x.id_atividade !== registroEditandoId)
    if (jaUsado) return { ok: false, msg: 'Já existe um registro com este número na sessão.' }

    return { ok: true }
  }, [sessaoAtual, regNumero, regTipoId, regStatus, limiteProtocolosSessao, registros, registroEditandoId])

  const salvarRegistro = useCallback(async () => {
    if (!supabase) return
    if (!sessaoAtual) return

    const v = validarRegistro()
    if (!v.ok) return aviso(v.msg || 'Validação falhou.')

    const numero = Number(regNumero)
    const tipoId = Number(regTipoId)
    const notaNum = regNota.trim() === '' ? null : Number(regNota)

    if (regNota.trim() !== '' && Number.isNaN(notaNum)) return aviso('Nota inválida (use número).')

    setSalvandoRegistro(true)
    try {
      if (!sessaoAtual.id_progresso) throw new Error('Sessão sem id_progresso.')

      if (registroEditandoId) {
        const { error: errUp } = await supabase
          .from('registros_atendimento')
          .update({
            numero_protocolo: numero,
            id_tipo_protocolo: tipoId,
            status: regStatus,
            nota: notaNum,
            is_adaptada: regAdaptada,
            sintese: regSintese.trim() ? regSintese.trim() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id_atividade', registroEditandoId)

        if (errUp) throw errUp
        sucesso('Protocolo atualizado.')
      } else {
        const { error: errIns } = await supabase.from('registros_atendimento').insert({
          id_sessao: sessaoAtual.id_sessao,
          id_progresso: sessaoAtual.id_progresso,
          numero_protocolo: numero,
          id_tipo_protocolo: tipoId,
          status: regStatus,
          nota: notaNum,
          is_adaptada: regAdaptada,
          sintese: regSintese.trim() ? regSintese.trim() : null,
        })

        if (errIns) throw errIns
        sucesso('Protocolo lançado.')
      }

      setDlgRegistro(false)
      await carregarRegistrosDaSessao(sessaoAtual.id_sessao)
    } catch (e) {
      console.error(e)
      erro('Falha ao salvar protocolo.')
    } finally {
      if (mountedRef.current) setSalvandoRegistro(false)
    }
  }, [
    supabase,
    sessaoAtual,
    validarRegistro,
    aviso,
    sucesso,
    erro,
    regNumero,
    regTipoId,
    regStatus,
    regNota,
    regAdaptada,
    regSintese,
    registroEditandoId,
    carregarRegistrosDaSessao,
  ])

  const pedirExcluirRegistro = useCallback(
    (r: RegistroView) => {
      abrirEdicaoRegistro(r)
      setConfirmDeleteId(r.id_atividade)
    },
    [abrirEdicaoRegistro]
  )
  const cancelarExcluirRegistro = useCallback(() => setConfirmDeleteId(null), [])

  const confirmarExcluirRegistro = useCallback(async () => {
    if (!supabase) return
    if (!sessaoAtual) return
    if (!confirmDeleteId) return

    setSalvandoRegistro(true)
    try {
      const { error: errDel } = await supabase.from('registros_atendimento').delete().eq('id_atividade', confirmDeleteId)
      if (errDel) throw errDel
      sucesso('Registro excluído.')
      setConfirmDeleteId(null)
      await carregarRegistrosDaSessao(sessaoAtual.id_sessao)
    } catch (e) {
      console.error(e)
      erro('Falha ao excluir registro.')
    } finally {
      if (mountedRef.current) setSalvandoRegistro(false)
    }
  }, [supabase, sessaoAtual, confirmDeleteId, sucesso, erro, carregarRegistrosDaSessao])

  // ======= effects =======
  useEffect(() => {
    void carregarBase()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.id, supabase])

  useEffect(() => {
    if (!carregandoBase && idProfessor) void carregarSessoes(idProfessor, filtroDataInicio, filtroDataFim)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregandoBase, idProfessor])

  // ======= UI =======
  return (
    <Box sx={{ p: 2, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
            Atendimentos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Inicie atendimentos por sala e lance protocolos.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={abrirFluxoNovoAtendimento}
            disabled={carregandoBase || !idProfessor}
          >
            Iniciar atendimento
          </Button>

          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={abrirFluxoLancamentoManual}
            disabled={carregandoBase || !idProfessor}
          >
            Lançamento manual
          </Button>

          <Tooltip title="Recarregar">
            <span>
              <IconButton
                onClick={async () => {
                  if (!idProfessor) return
                  await carregarSessoes(idProfessor, filtroDataInicio, filtroDataFim)
                }}
                disabled={carregandoBase || !idProfessor}
              >
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Filtros */}
      <Paper
        variant="outlined"
        sx={{
          mt: 2,
          p: 2,
          borderRadius: 2,
          borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.25 : 0.35),
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <TextField
            size="small"
            label="Data início"
            type="date"
            value={filtroDataInicio}
            onChange={(e) => setFiltroDataInicio(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: { xs: '100%', sm: 200 } }}
          />

          <TextField
            size="small"
            label="Data fim"
            type="date"
            value={filtroDataFim}
            onChange={(e) => setFiltroDataFim(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: { xs: '100%', sm: 200 } }}
          />

          <FormControl size="small" sx={{ width: { xs: '100%', sm: 260 } }}>
            <InputLabel id="filtro-sala-label">Sala</InputLabel>
            <Select
              labelId="filtro-sala-label"
              label="Sala"
              value={filtroSalaId as any}
              onChange={(e) => {
                const v = e.target.value as any
                setFiltroSalaId(v === 'todas' ? 'todas' : Number(v))
              }}
            >
              <MenuItem value="todas">
                <em>Todas</em>
              </MenuItem>
              {minhasSalas.map((s) => (
                <MenuItem key={s.id_sala} value={s.id_sala}>
                  {s.nome} ({s.tipo_sala})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="Buscar (aluno, RA, disciplina, sala...)"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            sx={{ flex: 1, minWidth: { xs: '100%', md: 340 } }}
          />

          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ width: { xs: '100%', md: 'auto' } }}>
            <Button variant="outlined" onClick={resetarParaHoje} startIcon={<WarningAmberIcon />}>
              Hoje
            </Button>
            <Button
              variant="contained"
              onClick={aplicarFiltros}
              startIcon={<CheckCircleOutlineIcon />}
              disabled={!idProfessor}
            >
              Aplicar
            </Button>
          </Stack>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" sx={{ mt: 1 }}>
          <FormControlLabel
            control={<Switch checked={mostrarHistorico} onChange={(e) => setMostrarHistorico(e.target.checked)} />}
            label="Mostrar histórico"
          />
          <Typography variant="caption" color="text.secondary">
            Por padrão, a tela mostra apenas atendimentos em andamento.
          </Typography>
        </Stack>

        {carregandoSessoes && <LinearProgress sx={{ mt: 2 }} />}

        <Divider sx={{ my: 2 }} />

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          {/* Abertos */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              justifyContent="space-between"
              spacing={1}
            >
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Alunos em Atendimento ({sessoesAbertas.length})
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <Tooltip title={transferenciaDisponivel.disponivel ? 'Transfere todos os atendimentos abertos da sala atual.' : transferenciaDisponivel.motivo}>
                  <span>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<SwapHorizIcon />}
                      disabled={!transferenciaDisponivel.disponivel}
                      onClick={() => void abrirDialogTransferencia()}
                    >
                      Transferir abertos
                    </Button>
                  </span>
                </Tooltip>
                <Chip size="small" label="Abertos" color="warning" />
              </Stack>
            </Stack>

            <Divider sx={{ my: 1.5 }} />

            {carregandoBase ? (
              <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
              </Box>
            ) : sessoesAbertas.length === 0 ? (
              <Alert severity="info">Nenhum atendimento em andamento no filtro atual.</Alert>
            ) : (
              <Box sx={cardGridSx}>
                {sessoesAbertas.map((s) => (
                  <AtendimentoCard
                    key={s.id_sessao}
                    sessao={s}
                    modo="aberta"
                    resumo={resumoPorSessao[s.id_sessao] ?? ''}
                    onResumoChange={(value) =>
                      setResumoPorSessao((old) => ({
                        ...old,
                        [s.id_sessao]: value,
                      }))
                    }
                    onAbrir={abrirSessao}
                    onAbrirFicha={abrirFichaAcompanhamento}
                    onFinalizar={finalizarSessaoRapido}
                  />
                ))}
              </Box>
            )}
          </Paper>

          {/* Histórico */}
          {mostrarHistorico ? (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  Histórico ({sessoesHistorico.length})
                </Typography>
                <Chip size="small" label="Encerrados" color="success" />
              </Stack>

              <Divider sx={{ my: 1.5 }} />

              {carregandoBase ? (
                <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress />
                </Box>
              ) : sessoesHistorico.length === 0 ? (
                <Alert severity="info">Nenhum atendimento encerrado no filtro atual.</Alert>
              ) : (
                <Box sx={cardGridSx}>
                  {sessoesHistorico.map((s) => (
                    <AtendimentoCard
                      key={s.id_sessao}
                      sessao={s}
                      modo="historico"
                      onAbrir={abrirSessao}
                      onAbrirFicha={abrirFichaAcompanhamento}
                    />
                  ))}
                </Box>
              )}
            </Paper>
          ) : null}
        </Stack>
      </Paper>

      {/* Dialog: escolher sala */}
      <Dialog
        open={dlgEscolherSala}
        onClose={() => setDlgEscolherSala(false)}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          Qual sala você vai atender?
          <IconButton onClick={() => setDlgEscolherSala(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            Você está lotado(a) em mais de uma sala. Selecione abaixo para continuar.
          </Alert>

          <Box sx={cardGridSx}>
            {minhasSalas.map((s) => (
              <Card
                key={s.id_sala}
                elevation={2}
                onClick={() => escolherSalaEContinuar(s.id_sala)}
                sx={{
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
                  border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.25 : 0.35)}`,
                }}
              >
                <CardContent>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <MeetingRoomIcon />
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900, overflowWrap: 'anywhere' }} title={s.nome}>
                        {s.nome}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tipo: {s.tipo_sala}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={() => setDlgEscolherSala(false)}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: iniciar atendimento / lançamento manual */}
      <Dialog
        open={dlgNovoAtendimento}
        onClose={() => setDlgNovoAtendimento(false)}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          {fluxoTipo === 'manual' ? 'Lançamento manual (offline)' : 'Iniciar atendimento'}
          <IconButton onClick={() => setDlgNovoAtendimento(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2}>
            {fluxoTipo === 'manual' ? (
              <Alert severity="warning">
                Use este modo para lançar depois um atendimento feito quando o sistema estava fora do ar.
                <br />
                Informe <b>entrada e saída</b>. O atendimento será criado <b>encerrado</b>.
              </Alert>
            ) : (
              <Alert severity="info">
                Busque o aluno por <strong>nome</strong>, <strong>RA</strong> ou <strong>CPF</strong>.
              </Alert>
            )}

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.25 : 0.35),
              }}
            >
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <SchoolIcon />
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 900 }}>Sala</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {minhasSalas.find((x) => x.id_sala === salaAtendimentoId)?.nome ?? '-'} •{' '}
                      {minhasSalas.find((x) => x.id_sala === salaAtendimentoId)?.tipo_sala ?? '-'}
                    </Typography>
                  </Box>
                </Stack>

                {minhasSalas.length > 1 ? (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setDlgNovoAtendimento(false)
                      setDlgEscolherSala(true)
                    }}
                  >
                    Trocar sala
                  </Button>
                ) : null}
              </Stack>
            </Paper>

            {/* seleção de nível */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
                <FormControl size="small" sx={{ width: { xs: '100%', md: 280 } }}>
                  <InputLabel id="nivel-filtro-label">Nível</InputLabel>
                  <Select
                    labelId="nivel-filtro-label"
                    label="Nível"
                    value={nivelFiltroEnsino as any}
                    disabled={Boolean(alunoSelecionado)}
                    onChange={(e) => {
                      const v = e.target.value as any
                      setNivelFiltroEnsino(v === 'todos' ? 'todos' : (Number(v) as 1 | 2))
                      setAlunoInput('')
                      setOpcoesAluno([])
                      setAlunoSelecionado(null)
                      setProgressosAlunoTodos([])
                      setFichasAbertasNaSala([])
                      setQtdDisciplinasAbertas(null)
                      setUsarFichaExistente(true)
                      setProgressoEscolhidoId(null)
                      setConfigSelecionada(null)
                    }}
                  >
                    <MenuItem value="todos">
                      <em>Fundamental + Médio</em>
                    </MenuItem>
                    <MenuItem value={1}>Ensino Fundamental</MenuItem>
                    <MenuItem value={2}>Ensino Médio</MenuItem>
                  </Select>
                </FormControl>

                <Typography variant="caption" color="text.secondary">
                  Selecione o nível antes de buscar. Após escolher o aluno, o nível fica travado pela matrícula.
                </Typography>
              </Stack>
            </Paper>

            <Autocomplete
              options={opcoesAluno}
              value={alunoSelecionado}
              inputValue={alunoInput}
              onInputChange={(_, v) => setAlunoInput(v)}
              onChange={(_, v) => setAlunoSelecionado(v)}
              loading={buscandoAlunos}
              filterOptions={(x) => x}
              isOptionEqualToValue={(a, b) => a.id_aluno === b.id_aluno && (a.id_matricula ?? null) === (b.id_matricula ?? null)}
              getOptionLabel={(o) => {
                const nivel = o?.id_nivel_ensino != null ? nomeNivelEnsinoCurto(o.id_nivel_ensino) : ''
                const ra = o?.numero_inscricao ? `RA: ${o.numero_inscricao}` : ''
                const extra = [nivel, ra].filter(Boolean).join(' • ')
                return `${o?.nome ?? ''}${extra ? ` (${extra})` : ''}`
              }}
              noOptionsText={alunoInput.trim().length < 2 ? 'Digite pelo menos 2 caracteres' : 'Nenhum aluno encontrado'}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={`${option.id_aluno}-${option.id_matricula ?? 'x'}`}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
                    <Avatar src={resolverFotoUrl(option.foto_url)} alt={option.nome} sx={{ width: 36, height: 36 }} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}>{option.nome}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {nomeNivelEnsinoCurto(option.id_nivel_ensino ?? null)} • {renderNumeroInscricao(option)}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Aluno (nome) / Matrícula (RA) / CPF"
                  placeholder="Ex.: Maria / 202500123 / 123.456.789-00"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {buscandoAlunos ? <CircularProgress size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                fullWidth
                size="small"
                label="Hora de entrada"
                type="datetime-local"
                value={novoHoraEntrada}
                onChange={(e) => setNovoHoraEntrada(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              {fluxoTipo === 'manual' ? (
                <TextField
                  fullWidth
                  size="small"
                  label="Hora de saída"
                  type="datetime-local"
                  value={novoHoraSaida}
                  onChange={(e) => setNovoHoraSaida(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              ) : null}

              <TextField fullWidth size="small" label="Resumo (opcional)" value={novoResumo} onChange={(e) => setNovoResumo(e.target.value)} />
            </Stack>

            {alunoSelecionado && salaAtendimentoId ? (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                    <Typography sx={{ fontWeight: 900 }}>Ficha / Disciplina</Typography>

                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      {qtdDisciplinasAbertas != null ? (
                        <Chip
                          size="small"
                          label={`Disciplinas abertas: ${qtdDisciplinasAbertas}`}
                          color={podeAbrirNovaDisciplina ? 'info' : 'warning'}
                          variant="outlined"
                        />
                      ) : null}

                      <Chip
                        size="small"
                        variant="outlined"
                        label={`Nível do aluno: ${nomeNivelEnsinoCurto(alunoSelecionado.id_nivel_ensino ?? null)}`}
                      />

                      {idProgressoSelecionadoParaAbrirFicha ? (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<DescriptionIcon />}
                          onClick={() => abrirFichaAcompanhamento(idProgressoSelecionadoParaAbrirFicha)}
                        >
                          Abrir Ficha
                        </Button>
                      ) : null}
                    </Stack>
                  </Stack>

                  {carregandoFichas ? <LinearProgress /> : null}

                  {!carregandoFichas && fichasAbertasNaSala.length === 0 ? (
                    <Alert severity="warning">
                      Nenhuma <strong>ficha aberta</strong> para este aluno nesta sala.
                      <br />
                      {podeAbrirNovaDisciplina || podeAbrirMaisQue3 ? <>Você pode abrir uma nova disciplina.</> : <>Bloqueado pela regra de 3 disciplinas.</>}
                    </Alert>
                  ) : null}

                  <FormControlLabel
                    control={
                      <Switch
                        checked={usarFichaExistente}
                        onChange={(e) => {
                          const checked = e.target.checked
                          setUsarFichaExistente(checked)
                          if (checked) {
                            setConfigSelecionada(null)
                            setProgressoEscolhidoId(fichasAbertasNaSala[0]?.id_progresso ?? null)
                          } else {
                            setProgressoEscolhidoId(null)
                          }
                        }}
                        disabled={fichasAbertasNaSala.length === 0}
                      />
                    }
                    label="Usar ficha aberta existente (na sala)"
                  />

                  {usarFichaExistente ? (
                    <Autocomplete
                      options={fichasAbertasNaSala}
                      value={fichasAbertasNaSala.find((x) => x.id_progresso === progressoEscolhidoId) ?? null}
                      onChange={(_, v) => setProgressoEscolhidoId(v?.id_progresso ?? null)}
                      getOptionLabel={(o) => o.label}
                      renderInput={(params) => <TextField {...params} label="Ficha aberta na sala" size="small" />}
                      noOptionsText="Nenhuma ficha aberta na sala"
                    />
                  ) : (
                    <>
                      <Alert severity="info">
                        Selecione a disciplina da sala para abrir.
                        <br />
                        Os protocolos já estão somados por ano (1º, 2º, 3º…) e aparecem como faixas.
                      </Alert>

                      <Autocomplete
                        options={configsDaSalaSelecionada}
                        value={configSelecionada}
                        onChange={(_, v) => setConfigSelecionada(v)}
                        getOptionLabel={(o) => o.label}
                        renderInput={(params) => <TextField {...params} label="Disciplina (da sala)" size="small" />}
                        noOptionsText="Nenhuma disciplina configurada para esta sala neste nível"
                      />

                      {!podeAbrirNovaDisciplina && !podeAbrirMaisQue3 ? (
                        <Alert severity="error">
                          Bloqueado: aluno com 3+ disciplinas abertas. Apenas ADMIN/DIRETOR/COORDENAÇÃO pode abrir nova disciplina.
                        </Alert>
                      ) : null}
                    </>
                  )}
                </Stack>
              </Paper>
            ) : null}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={() => setDlgNovoAtendimento(false)}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={() => void criarAtendimento()} disabled={salvandoNovoAtendimento}>
            {salvandoNovoAtendimento ? (fluxoTipo === 'manual' ? 'Lançando...' : 'Iniciando...') : fluxoTipo === 'manual' ? 'Lançar' : 'Iniciar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmar abertura de ficha */}
      <Dialog
        open={dlgConfirmAbrirFicha}
        onClose={() => setDlgConfirmAbrirFicha(false)}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          Confirmar abertura de ficha
          <IconButton onClick={() => setDlgConfirmAbrirFicha(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Esta disciplina ainda não possui ficha para este aluno.
            <br />
            Ao confirmar, o sistema vai criar a ficha (progresso) e {fluxoTipo === 'manual' ? 'lançar' : 'iniciar'} o atendimento.
          </Alert>

          <Stack spacing={1}>
            <Typography variant="body2">
              <strong>Aluno:</strong> {alunoSelecionado?.nome ?? '-'} ({renderNumeroInscricao(alunoSelecionado ?? {})})
            </Typography>
            <Typography variant="body2">
              <strong>Nível:</strong> {nomeNivelEnsinoCurto(alunoSelecionado?.id_nivel_ensino ?? null)}
            </Typography>
            <Typography variant="body2">
              <strong>Sala:</strong> {minhasSalas.find((x) => x.id_sala === salaAtendimentoId)?.nome ?? '-'}
            </Typography>
            <Typography variant="body2">
              <strong>Disciplina:</strong> {configSelecionada ? `${configSelecionada.disciplina_nome}` : '-'}
            </Typography>

            {!podeAbrirMaisQue3 ? (
              <Typography variant="caption" color="text.secondary">
                * Regra: professor só pode ter até 3 disciplinas abertas por aluno. (ADMIN/DIRETOR/COORDENAÇÃO ignora)
              </Typography>
            ) : null}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={() => setDlgConfirmAbrirFicha(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setDlgConfirmAbrirFicha(false)
              void criarAtendimento({ confirmarCriacaoFicha: true })
            }}
          >
            {fluxoTipo === 'manual' ? 'Abrir ficha e lançar' : 'Abrir ficha e iniciar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Sessão */}
      <Dialog open={dlgSessao} onClose={fecharSessaoDialog} fullWidth maxWidth="lg" fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 900 }}>
          Sessão de atendimento
          <IconButton onClick={fecharSessaoDialog} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {!sessaoAtual ? (
            <Alert severity="warning">Sessão não selecionada.</Alert>
          ) : (
            <Stack spacing={2}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.25 : 0.35),
                }}
              >
                <Stack spacing={1}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                    <AvatarAlunoAtendimento
                      idAluno={sessaoAtual.id_aluno}
                      fotoUrl={sessaoAtual.aluno_foto_url}
                      nome={sessaoAtual.aluno_nome}
                      sx={{ width: 58, height: 58 }}
                    />
                    <Stack spacing={1} sx={{ minWidth: 0, flex: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography variant="h6" sx={{ fontWeight: 900, overflowWrap: 'anywhere' }}>
                          {sessaoAtual.aluno_nome}
                        </Typography>
                        <Chip size="small" label={sessaoAtual.hora_saida ? 'Encerrada' : 'Aberta'} color={sessaoAtual.hora_saida ? 'success' : 'warning'} />
                        <Chip size="small" label={sessaoAtual.sala_nome ?? '-'} variant="outlined" />
                        <Chip size="small" label={`${sessaoAtual.disciplina_nome ?? '-'} — ${sessaoAtual.ano_nome ?? '-'}`} variant="outlined" />
                        <Chip size="small" variant="outlined" label={`Nível: ${nomeNivelEnsinoCurto(sessaoAtual.id_nivel_ensino)}`} />
                        {limiteProtocolosSessao != null ? (
                          <Tooltip title={resumoFaixasSessaoAtual || ''} disableHoverListener={!resumoFaixasSessaoAtual}>
                            <Chip size="small" label={`Protocolos: 1..${limiteProtocolosSessao}`} variant="outlined" />
                          </Tooltip>
                        ) : null}
                      </Stack>

                      <Typography variant="body2" color="text.secondary">
                        Entrada: {formatarDataHoraBR(sessaoAtual.hora_entrada)} • Saída: {formatarDataHoraBR(sessaoAtual.hora_saida)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Telefone: {sessaoAtual.aluno_celular?.trim() || '-'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                        Endereço: {formatarEnderecoAluno(sessaoAtual)}
                      </Typography>
                    </Stack>
                  </Stack>

                  <TextField
                    label="Resumo da sessão (salvar)"
                    value={sessaoAtual.resumo_atividades ?? ''}
                    onChange={(e) => setSessaoAtual((old) => (old ? { ...old, resumo_atividades: e.target.value } : old))}
                    minRows={2}
                    multiline
                  />

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="flex-end" flexWrap="wrap">
                    <Button
                      variant="contained"
                      startIcon={<EditIcon />}
                      onClick={abrirDialogEditarAluno}
                      disabled={!sessaoAtual.aluno_user_id || salvandoAlunoSessao || uploadingFotoAlunoSessao}
                    >
                      Atualizar contato/foto
                    </Button>

                    <Button
                      variant="outlined"
                      startIcon={<DescriptionIcon />}
                      disabled={!sessaoAtual.id_progresso}
                      onClick={() => abrirFichaAcompanhamento(sessaoAtual.id_progresso)}
                    >
                      Abrir ficha
                    </Button>

                    <Button variant="outlined" onClick={() => void salvarResumoSessao()} disabled={salvandoSessao}>
                      Salvar resumo
                    </Button>

                    <Button
                      variant="contained"
                      color="warning"
                      onClick={() => void encerrarSessaoAgora()}
                      disabled={salvandoSessao || Boolean(sessaoAtual.hora_saida)}
                    >
                      Encerrar sessão
                    </Button>
                  </Stack>
                </Stack>
              </Paper>

              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                  Protocolos / Atividades
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={abrirDialogNovoRegistro} disabled={!sessaoAtual.id_progresso}>
                  Adicionar protocolo
                </Button>
              </Stack>

              {carregandoRegistros ? <LinearProgress /> : null}

              {registros.length === 0 ? (
                <Alert severity="info">Nenhum protocolo lançado nesta sessão ainda.</Alert>
              ) : (
                <Stack spacing={1}>
                  {registros.map((r) => {
                    const chip = statusChipProps(r.status)
                    return (
                      <Paper key={r.id_atividade} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }} justifyContent="space-between">
                          <Box sx={{ minWidth: 0 }}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                              <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                                Protocolo {r.numero_protocolo}
                              </Typography>
                              <Chip size="small" label={r.tipo_nome ?? '-'} variant="outlined" />
                              <Chip size="small" label={chip.label} color={chip.color} />
                              {r.is_adaptada ? <Chip size="small" label="Adaptada" color="info" variant="outlined" /> : null}
                              {r.nota != null ? <Chip size="small" label={`Nota: ${r.nota}`} variant="outlined" /> : null}
                            </Stack>

                            {r.sintese ? (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                                {r.sintese}
                              </Typography>
                            ) : null}

                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              Criado: {formatarDataHoraBR(r.created_at)} • Atualizado: {formatarDataHoraBR(r.updated_at)}
                            </Typography>
                          </Box>

                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Editar">
                              <IconButton onClick={() => abrirEdicaoRegistro(r)}>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Excluir">
                              <IconButton onClick={() => pedirExcluirRegistro(r)}>
                                <DeleteOutlineIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Stack>
                      </Paper>
                    )
                  })}
                </Stack>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={fecharSessaoDialog}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Editar dados do aluno */}
      <Dialog open={dlgEditarAluno} onClose={() => setDlgEditarAluno(false)} fullWidth maxWidth="md" fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 900 }}>
          Atualizar telefone, endereço e foto do aluno
          <IconButton onClick={() => setDlgEditarAluno(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {!sessaoAtual ? (
            <Alert severity="warning">Sessão não selecionada.</Alert>
          ) : (
            <Stack spacing={2}>
              <Alert severity="info">
                A foto é comprimida automaticamente antes do upload para evitar erro por arquivo muito pesado.
              </Alert>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
                <AvatarAlunoAtendimento
                  idAluno={sessaoAtual.id_aluno}
                  fotoUrl={formAlunoSessao.foto_url || sessaoAtual.aluno_foto_url}
                  nome={sessaoAtual.aluno_nome}
                  sx={{ width: 88, height: 88 }}
                />
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<PhotoCameraIcon />}
                    disabled={uploadingFotoAlunoSessao || salvandoAlunoSessao}
                    onClick={() => fileInputFotoAlunoSessaoRef.current?.click()}
                  >
                    {uploadingFotoAlunoSessao ? 'Enviando foto...' : 'Trocar foto'}
                  </Button>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    JPG otimizado, largura máxima 1280px e qualidade reduzida automaticamente.
                  </Typography>
                  <input
                    ref={fileInputFotoAlunoSessaoRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) void enviarFotoAlunoSessao(file)
                      e.currentTarget.value = ''
                    }}
                  />
                </Box>
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Telefone / celular"
                  value={formAlunoSessao.celular}
                  onChange={(e) => setFormAlunoSessao((old) => ({ ...old, celular: e.target.value }))}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Município"
                  value={formAlunoSessao.municipio}
                  onChange={(e) => setFormAlunoSessao((old) => ({ ...old, municipio: e.target.value }))}
                />
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Logradouro"
                  value={formAlunoSessao.logradouro}
                  onChange={(e) => setFormAlunoSessao((old) => ({ ...old, logradouro: e.target.value }))}
                />
                <TextField
                  sx={{ width: { xs: '100%', md: 180 } }}
                  size="small"
                  label="Número"
                  value={formAlunoSessao.numero_endereco}
                  onChange={(e) => setFormAlunoSessao((old) => ({ ...old, numero_endereco: e.target.value }))}
                />
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Bairro"
                  value={formAlunoSessao.bairro}
                  onChange={(e) => setFormAlunoSessao((old) => ({ ...old, bairro: e.target.value }))}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Ponto de referência"
                  value={formAlunoSessao.ponto_referencia}
                  onChange={(e) => setFormAlunoSessao((old) => ({ ...old, ponto_referencia: e.target.value }))}
                />
              </Stack>
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={() => setDlgEditarAluno(false)} disabled={salvandoAlunoSessao}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={() => void salvarDadosAlunoSessao()} disabled={salvandoAlunoSessao || !sessaoAtual?.aluno_user_id}>
            {salvandoAlunoSessao ? 'Salvando...' : 'Salvar dados do aluno'}
          </Button>
        </DialogActions>
      </Dialog>

      <TransferenciaDialog
        open={dlgTransferir}
        isMobile={isMobile}
        transferenciaContexto={transferenciaContexto}
        qtdAtendimentosAbertosTransferencia={qtdAtendimentosAbertosTransferencia}
        carregandoProfSala={carregandoProfSala}
        professoresSala={professoresSala}
        professorDestino={professorDestino}
        transferindo={transferindo}
        onClose={() => {
          setDlgTransferir(false)
          setTransferenciaContexto(null)
        }}
        onProfessorDestinoChange={setProfessorDestino}
        onConfirmar={confirmarTransferencia}
      />

      {/* Dialog: Registro */}
      <Dialog open={dlgRegistro} onClose={fecharDialogRegistro} fullWidth maxWidth="md" fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 900 }}>
          {registroEditandoId ? 'Editar protocolo' : 'Adicionar protocolo'}
          <IconButton onClick={fecharDialogRegistro} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {!sessaoAtual ? (
            <Alert severity="warning">Sessão não selecionada.</Alert>
          ) : (
            <Stack spacing={2}>
              <Alert severity="info">
                Limite de protocolos: {limiteProtocolosSessao ?? '-'}.
                {resumoFaixasSessaoAtual ? (
                  <>
                    <br />
                    <strong>Faixas:</strong> {resumoFaixasSessaoAtual}
                  </>
                ) : null}
              </Alert>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel id="reg-numero-label">Nº do protocolo</InputLabel>
                  <Select labelId="reg-numero-label" label="Nº do protocolo" value={regNumero} onChange={(e) => setRegNumero(String(e.target.value))}>
                    <MenuItem value="">
                      <em>Selecione</em>
                    </MenuItem>
                    {(() => {
                      const limite = limiteProtocolosSessao ?? 50
                      const itens: number[] = []
                      for (let i = 1; i <= limite; i += 1) itens.push(i)
                      return itens.map((n) => {
                        const ano = anoPorNumeroProtocolo(faixasSessaoAtual, n)
                        return (
                          <MenuItem key={n} value={String(n)}>
                            {ano ? `${n} (${ano})` : n}
                          </MenuItem>
                        )
                      })
                    })()}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel id="reg-tipo-label">Tipo de protocolo</InputLabel>
                  <Select labelId="reg-tipo-label" label="Tipo de protocolo" value={regTipoId} onChange={(e) => setRegTipoId(String(e.target.value))}>
                    <MenuItem value="">
                      <em>Selecione</em>
                    </MenuItem>
                    {tiposProtocolo.map((t) => (
                      <MenuItem key={t.id_tipo_protocolo} value={String(t.id_tipo_protocolo)}>
                        {t.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel id="reg-status-label">Status</InputLabel>
                  <Select labelId="reg-status-label" label="Status" value={regStatus} onChange={(e) => setRegStatus(String(e.target.value))}>
                    <MenuItem value="A fazer">A fazer</MenuItem>
                    <MenuItem value="Em andamento">Em andamento</MenuItem>
                    <MenuItem value="Concluída">Concluída</MenuItem>
                  </Select>
                </FormControl>

                <TextField fullWidth size="small" label="Nota (opcional)" value={regNota} onChange={(e) => setRegNota(e.target.value)} placeholder="Ex.: 8.5" />
              </Stack>

              <FormControlLabel control={<Switch checked={regAdaptada} onChange={(e) => setRegAdaptada(e.target.checked)} />} label="Atividade adaptada" />

              <TextField label="Síntese / Observação" value={regSintese} onChange={(e) => setRegSintese(e.target.value)} minRows={3} multiline />

              {confirmDeleteId ? <Alert severity="warning">Confirma excluir o registro #{confirmDeleteId}?</Alert> : null}
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          {confirmDeleteId ? (
            <>
              <Button variant="outlined" onClick={cancelarExcluirRegistro}>
                Cancelar
              </Button>
              <Button variant="contained" color="error" onClick={() => void confirmarExcluirRegistro()} disabled={salvandoRegistro}>
                {salvandoRegistro ? 'Excluindo...' : 'Excluir'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outlined" onClick={fecharDialogRegistro}>
                Cancelar
              </Button>
              {registroEditandoId ? (
                <Button variant="outlined" color="error" onClick={() => setConfirmDeleteId(registroEditandoId)} startIcon={<DeleteOutlineIcon />}>
                  Excluir
                </Button>
              ) : null}
              <Button variant="contained" onClick={() => void salvarRegistro()} disabled={salvandoRegistro}>
                {salvandoRegistro ? 'Salvando...' : registroEditandoId ? 'Atualizar' : 'Salvar'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}
