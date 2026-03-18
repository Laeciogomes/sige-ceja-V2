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
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'

import HistoryEduIcon from '@mui/icons-material/HistoryEdu'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import SchoolIcon from '@mui/icons-material/School'
import PendingActionsIcon from '@mui/icons-material/PendingActions'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'

import { useSupabase } from '../../contextos/SupabaseContext'
import { useNotificacaoContext } from '../../contextos/NotificacaoContext'
import { useAuth } from '../../contextos/AuthContext'

type UsuarioJoin = {
  id?: string
  name?: string | null
  email?: string | null
  cpf?: string | null
  foto_url?: string | null
}

type MatriculaJoin = {
  id_matricula: number
  numero_inscricao: string | null
  ano_letivo: number | null
  data_matricula: string | null
  id_nivel_ensino: number | null
  id_status_matricula?: number | null
}

type AlunoBuscaOption = {
  id_aluno: number
  nome: string
  email?: string | null
  cpf?: string | null
  foto_url?: string | null
  id_matricula: number | null
  numero_inscricao?: string | null
  ano_letivo?: number | null
  data_matricula?: string | null
  id_nivel_ensino?: number | null
}

type StatusDisciplinaRow = {
  id_status_disciplina: number
  nome: string
}

type StatusMatriculaRow = {
  id_status_matricula: number
  nome: string
}

type SalaRow = {
  id_sala: number
  nome: string
  tipo_sala: string
  is_ativa: boolean
}

type FaixaProtocolosAno = {
  id_config: number
  id_ano_escolar: number
  ano_nome: string
  quantidade_protocolos: number
  inicio: number
  fim: number
}

type SalaDisciplinaNivelOption = {
  id_disciplina: number
  id_nivel_ensino: number
  disciplina_nome: string
  total_protocolos: number
  ano_representativo_id: number
  ano_representativo_nome: string
  id_config_representativo: number
  faixas: FaixaProtocolosAno[]
  label: string
}

type ProgressoHistorico = {
  id_progresso: number
  id_matricula: number
  id_disciplina: number
  id_ano_escolar: number
  disciplina_nome: string
  ano_nome: string
  id_nivel_ensino: number | null
  status_nome: string | null
  nota_final: number | null
  data_conclusao: string | null
  observacoes: string | null
}

type SessaoAbertaAluno = {
  id_sessao: number
  id_progresso: number | null
  hora_entrada: string
  sala_nome: string | null
  professor_nome: string | null
  disciplina_nome: string | null
}

const SUPABASE_PUBLIC_STORAGE_BASE = (() => {
  const raw = String(import.meta.env.VITE_SUPABASE_URL ?? '')
    .trim()
    .replace(/\/+$/, '')
  return raw ? `${raw}/storage/v1/object/public` : ''
})()

function first<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

function normalizarTexto(valor: string): string {
  return (valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function extrairDigitos(input: string): string {
  return (input ?? '').replace(/\D/g, '')
}

function isBuscaNumerica(input: string): boolean {
  const t = input.trim()
  return t.length > 0 && /^[\d.\-\s]+$/.test(t)
}

function formatarCPF(digitos: string): string {
  const d = extrairDigitos(digitos).padStart(11, '0').slice(-11)
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`
}

function formatarDataBR(iso?: string | null): string {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleDateString('pt-BR')
  } catch {
    return iso
  }
}

function formatarDataHoraBR(iso?: string | null): string {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function nomeNivelEnsinoLongo(idNivel: number | null | undefined): string {
  if (idNivel === 1) return 'Ensino Fundamental'
  if (idNivel === 2) return 'Ensino Médio'
  return '-'
}

function nomeNivelEnsinoCurto(idNivel: number | null | undefined): string {
  if (idNivel === 1) return 'Fundamental'
  if (idNivel === 2) return 'Médio'
  return '-'
}

function isStatusDisciplinaAberta(statusNome: string): boolean {
  const s = normalizarTexto(statusNome)
  if (
    s.includes('aprov') ||
    s.includes('reprov') ||
    s.includes('conclu') ||
    s.includes('final') ||
    s.includes('encerr') ||
    s.includes('tranc') ||
    s.includes('cancel') ||
    s.includes('inativ')
  ) {
    return false
  }
  return true
}

function resumoFaixasProtocolos(faixas: FaixaProtocolosAno[]): string {
  if (!faixas?.length) return ''
  return faixas.map((f) => `${f.ano_nome}: ${f.inicio}-${f.fim}`).join(' • ')
}

function escolherProgressoPorDisciplina(lista: ProgressoHistorico[], idDisciplina: number): ProgressoHistorico | null {
  const candidatos = lista.filter((p) => p.id_disciplina === idDisciplina)
  if (candidatos.length === 0) return null

  const ordenado = [...candidatos].sort((a, b) => {
    const aAberta = isStatusDisciplinaAberta(a.status_nome ?? '') ? 1 : 0
    const bAberta = isStatusDisciplinaAberta(b.status_nome ?? '') ? 1 : 0
    if (bAberta !== aAberta) return bAberta - aAberta
    if (b.id_ano_escolar !== a.id_ano_escolar) return b.id_ano_escolar - a.id_ano_escolar
    return b.id_progresso - a.id_progresso
  })

  return ordenado[0] ?? null
}

function chipStatusDisciplina(statusNome?: string | null): {
  color: 'default' | 'success' | 'warning' | 'info' | 'error'
  variant: 'filled' | 'outlined'
  label: string
} {
  const status = statusNome?.trim() || 'Sem status'
  const s = normalizarTexto(status)
  if (s.includes('aprov') || s.includes('aproveit')) {
    return { label: status, color: 'success', variant: 'filled' }
  }
  if (s.includes('reprov')) {
    return { label: status, color: 'error', variant: 'outlined' }
  }
  if (isStatusDisciplinaAberta(status)) {
    return { label: status, color: 'warning', variant: 'filled' }
  }
  return { label: status, color: 'default', variant: 'outlined' }
}

function iniciais(nome: string): string {
  const partes = (nome ?? '').trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return `${partes[0][0] ?? ''}${partes[1][0] ?? ''}`.toUpperCase()
}

function normalizarCaminhoFoto(raw: string): string {
  const limpo = raw.trim()
  if (!limpo) return ''

  const semQuery = limpo.split('?')[0]?.split('#')[0] ?? ''
  const semDominio = semQuery.replace(/^https?:\/\/[^/]+/i, '')
  const semSlashInicial = semDominio.replace(/^\/+/, '')
  const semStorage = semSlashInicial
    .replace(/^storage\/v1\/object\/public\//i, '')
    .replace(/^object\/public\//i, '')
    .replace(/^public\//i, '')
    .replace(/^\/+/, '')

  if (semStorage.startsWith('avatars/')) return semStorage.replace(/^avatars\//, '')
  return semStorage
}

function resolverFotoUrl(
  supabase: ReturnType<typeof useSupabase>['supabase'] | null,
  fotoUrl?: string | null,
): string | null {
  if (!fotoUrl?.trim() || !supabase) return null
  const raw = fotoUrl.trim()

  if (/^(data:|blob:)/i.test(raw)) return raw
  if (/^https?:\/\//i.test(raw) && !/\/storage\/v1\/object\/public\//i.test(raw)) {
    return raw
  }

  const caminho = normalizarCaminhoFoto(raw)
  if (!caminho) return null

  const partes = caminho.split('/').filter(Boolean)
  if (partes.length === 0) return null

  let bucket = 'avatars'
  let pathNoBucket = caminho

  if (!['alunos', 'professores'].includes(partes[0] ?? '') && partes.length > 1) {
    bucket = partes[0] ?? 'avatars'
    pathNoBucket = partes.slice(1).join('/')
  }

  if (!pathNoBucket) return null

  if (SUPABASE_PUBLIC_STORAGE_BASE) {
    return `${SUPABASE_PUBLIC_STORAGE_BASE}/${bucket}/${pathNoBucket}`
  }

  return supabase.storage.from(bucket).getPublicUrl(pathNoBucket).data.publicUrl
}

function isNomeArquivoImagem(nome: string): boolean {
  return /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(nome)
}

const fotoAlunoFallbackCache = new Map<number, string | null>()
const fotoAlunoFallbackPromiseCache = new Map<number, Promise<string | null>>()

async function buscarFotoAlunoFallback(
  supabase: ReturnType<typeof useSupabase>['supabase'] | null,
  idAluno?: number | null,
): Promise<string | null> {
  const id = Number(idAluno ?? 0)
  if (!supabase || !id) return null

  if (fotoAlunoFallbackCache.has(id)) {
    return fotoAlunoFallbackCache.get(id) ?? null
  }

  const existente = fotoAlunoFallbackPromiseCache.get(id)
  if (existente) return existente

  const tarefa = (async () => {
    const prefixo = `aluno-${id}-`
    const bucket = 'avatars'

    const construirUrl = (pathNoBucket: string): string => {
      if (SUPABASE_PUBLIC_STORAGE_BASE) {
        return `${SUPABASE_PUBLIC_STORAGE_BASE}/${bucket}/${pathNoBucket}`
      }
      return supabase.storage.from(bucket).getPublicUrl(pathNoBucket).data.publicUrl
    }

    const procurarEmPasta = async (pasta: string): Promise<string | null> => {
      const { data } = await supabase.storage.from(bucket).list(pasta, {
        limit: 200,
        offset: 0,
        sortBy: { column: 'name', order: 'desc' },
      })

      const arquivo = (data ?? [])
        .filter((item: any) => {
          const nome = String(item?.name ?? '')
          return nome.startsWith(prefixo) && isNomeArquivoImagem(nome)
        })
        .sort((a: any, b: any) => String(b?.name ?? '').localeCompare(String(a?.name ?? '')))[0]

      if (!arquivo?.name) return null
      const pathNoBucket = pasta ? `${pasta}/${arquivo.name}` : arquivo.name
      return construirUrl(pathNoBucket)
    }

    const caminhosDiretos = ['', 'alunos', 'alunos/alunos']
    for (const pasta of caminhosDiretos) {
      const url = await procurarEmPasta(pasta)
      if (url) {
        fotoAlunoFallbackCache.set(id, url)
        return url
      }
    }

    const { data: raiz } = await supabase.storage.from(bucket).list('', {
      limit: 200,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' },
    })

    for (const item of raiz ?? []) {
      const nome = String((item as any)?.name ?? '').trim()
      if (!nome) continue

      if (nome.startsWith(prefixo) && isNomeArquivoImagem(nome)) {
        const url = construirUrl(nome)
        fotoAlunoFallbackCache.set(id, url)
        return url
      }

      if (isNomeArquivoImagem(nome)) continue

      for (const pasta of [nome, `${nome}/alunos`]) {
        const url = await procurarEmPasta(pasta)
        if (url) {
          fotoAlunoFallbackCache.set(id, url)
          return url
        }
      }
    }

    fotoAlunoFallbackCache.set(id, null)
    return null
  })()

  fotoAlunoFallbackPromiseCache.set(id, tarefa)

  try {
    return await tarefa
  } finally {
    fotoAlunoFallbackPromiseCache.delete(id)
  }
}

function AvatarAlunoHistorico({
  supabase,
  idAluno,
  nome,
  fotoUrl,
  sx,
}: {
  supabase: ReturnType<typeof useSupabase>['supabase'] | null
  idAluno?: number | null
  nome: string
  fotoUrl?: string | null
  sx?: any
}) {
  const [src, setSrc] = useState<string | undefined>(() => resolverFotoUrl(supabase, fotoUrl) ?? undefined)
  const tentouFallbackRef = useRef(false)

  useEffect(() => {
    let ativo = true
    const inicial = resolverFotoUrl(supabase, fotoUrl) ?? undefined
    setSrc(inicial)
    tentouFallbackRef.current = false

    if (!inicial && idAluno) {
      void buscarFotoAlunoFallback(supabase, idAluno).then((url) => {
        if (!ativo) return
        if (url) {
          tentouFallbackRef.current = true
          setSrc(url)
        }
      })
    }

    return () => {
      ativo = false
    }
  }, [supabase, idAluno, fotoUrl])

  const tentarFallback = useCallback(() => {
    if (tentouFallbackRef.current) {
      setSrc(undefined)
      return
    }

    tentouFallbackRef.current = true

    if (!idAluno) {
      setSrc(undefined)
      return
    }

    void buscarFotoAlunoFallback(supabase, idAluno).then((url) => {
      setSrc(url ?? undefined)
    })
  }, [supabase, idAluno])

  return (
    <Avatar src={src} imgProps={{ referrerPolicy: 'no-referrer' }} onError={tentarFallback} sx={sx}>
      {iniciais(nome)}
    </Avatar>
  )
}

const SecretariaHistoricoPage = () => {
  const { supabase } = useSupabase()
  const { usuario } = useAuth()
  const { sucesso, erro, aviso } = useNotificacaoContext()
  const navigate = useNavigate()
  const theme = useTheme()
  const mountedRef = useRef(true)

  const [carregandoBase, setCarregandoBase] = useState(true)
  const [carregandoBusca, setCarregandoBusca] = useState(false)
  const [carregandoAluno, setCarregandoAluno] = useState(false)
  const [abrindoFichaId, setAbrindoFichaId] = useState<number | null>(null)

  const [statusDisciplinas, setStatusDisciplinas] = useState<StatusDisciplinaRow[]>([])
  const [statusMatriculas, setStatusMatriculas] = useState<StatusMatriculaRow[]>([])
  const [salas, setSalas] = useState<SalaRow[]>([])
  const [configsPorSala, setConfigsPorSala] = useState<Record<number, SalaDisciplinaNivelOption[]>>({})

  const [buscaAluno, setBuscaAluno] = useState('')
  const [opcoesAluno, setOpcoesAluno] = useState<AlunoBuscaOption[]>([])
  const [alunoSelecionado, setAlunoSelecionado] = useState<AlunoBuscaOption | null>(null)
  const [salaSelecionadaId, setSalaSelecionadaId] = useState<number | ''>('')

  const [progressos, setProgressos] = useState<ProgressoHistorico[]>([])
  const [sessoesAbertas, setSessoesAbertas] = useState<SessaoAbertaAluno[]>([])

  const papelNormalizado = String((usuario as any)?.papel ?? '').toUpperCase()
  const podeIgnorarLimite = useMemo(
    () => ['ADMIN', 'DIRETOR', 'COORDENACAO', 'SECRETARIA'].includes(papelNormalizado),
    [papelNormalizado],
  )

  const obterIdStatusMatriculaAtiva = useCallback((): number | null => {
    const ativa = statusMatriculas.find((s) => normalizarTexto(s.nome).includes('ativa'))
    return ativa ? Number(ativa.id_status_matricula) : null
  }, [statusMatriculas])

  const obterIdStatusDisciplinaDefault = useCallback((): number | null => {
    const emCurso = statusDisciplinas.find((s) => normalizarTexto(s.nome).includes('em curso'))
    if (emCurso) return Number(emCurso.id_status_disciplina)
    const aCursar = statusDisciplinas.find((s) => normalizarTexto(s.nome).includes('a cursar'))
    if (aCursar) return Number(aCursar.id_status_disciplina)
    return statusDisciplinas[0]?.id_status_disciplina ? Number(statusDisciplinas[0].id_status_disciplina) : null
  }, [statusDisciplinas])

  const carregarBase = useCallback(async () => {
    if (!supabase) return

    setCarregandoBase(true)
    try {
      const [statusMatRes, statusDiscRes, salasRes] = await Promise.all([
        supabase.from('status_matricula').select('id_status_matricula,nome').order('id_status_matricula'),
        supabase.from('status_disciplina_aluno').select('id_status_disciplina,nome').order('id_status_disciplina'),
        supabase.from('salas_atendimento').select('id_sala,nome,tipo_sala,is_ativa').eq('is_ativa', true).order('nome'),
      ])

      if (statusMatRes.error) throw statusMatRes.error
      if (statusDiscRes.error) throw statusDiscRes.error
      if (salasRes.error) throw salasRes.error

      const salasAtivas = ((salasRes.data ?? []) as SalaRow[]).filter((s) => s.is_ativa)

      setStatusMatriculas((statusMatRes.data ?? []) as StatusMatriculaRow[])
      setStatusDisciplinas((statusDiscRes.data ?? []) as StatusDisciplinaRow[])
      setSalas(salasAtivas)

      if (salasAtivas.length === 0) {
        setConfigsPorSala({})
        return
      }

      const salaIds = salasAtivas.map((s) => s.id_sala)
      const { data: cfgData, error: cfgError } = await supabase
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
              disciplinas ( id_disciplina, nome_disciplina ),
              anos_escolares ( id_ano_escolar, nome_ano, id_nivel_ensino )
            )
          `,
        )
        .in('id_sala', salaIds)

      if (cfgError) throw cfgError

      const tmp: Record<number, Map<string, SalaDisciplinaNivelOption>> = {}

      ;(cfgData ?? []).forEach((row: any) => {
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
          const label = `${nomeNivelEnsinoCurto(o.id_nivel_ensino)} • ${o.disciplina_nome}${resumo ? ` • ${resumo}` : ''}`
          return { ...o, total_protocolos: acc, faixas: faixasCalc, label }
        })

        lista.sort((a, b) => a.label.localeCompare(b.label))
        mapaFinal[salaId] = lista
      })

      setConfigsPorSala(mapaFinal)
    } catch (e) {
      console.error(e)
      erro('Falha ao carregar a base do histórico acadêmico.')
    } finally {
      if (mountedRef.current) setCarregandoBase(false)
    }
  }, [supabase, erro])

  const buscarAlunos = useCallback(
    async (termo: string) => {
      if (!supabase) return

      const t = termo.trim()
      if (t.length < 2) {
        setOpcoesAluno([])
        return
      }

      setCarregandoBusca(true)
      try {
        const digitos = extrairDigitos(t)
        const buscaNumerica = isBuscaNumerica(t)
        const ativaId = obterIdStatusMatriculaAtiva()

        const opcoesMap = new Map<number, AlunoBuscaOption>()

        if (!buscaNumerica) {
          let query = supabase
            .from('alunos')
            .select(
              `
                id_aluno,
                usuarios!inner ( id, name, email, cpf, foto_url ),
                matriculas ( id_matricula, numero_inscricao, ano_letivo, data_matricula, id_nivel_ensino, id_status_matricula )
              `,
            )
            .ilike('usuarios.name', `%${t}%`)
            .limit(25)

          const { data, error } = await query
          if (error) throw error

          ;(data ?? []).forEach((a: any) => {
            const u = first(a?.usuarios) as UsuarioJoin | null
            const mats = ((a?.matriculas ?? []) as MatriculaJoin[])
              .filter((m) => (ativaId ? Number(m.id_status_matricula ?? 0) === ativaId : true))
              .sort((x, y) => {
                if (Number(y.ano_letivo ?? 0) !== Number(x.ano_letivo ?? 0)) {
                  return Number(y.ano_letivo ?? 0) - Number(x.ano_letivo ?? 0)
                }
                return new Date(String(y.data_matricula ?? '1900-01-01')).getTime() - new Date(String(x.data_matricula ?? '1900-01-01')).getTime()
              })

            mats.forEach((m) => {
              if (m.id_matricula == null) return
              opcoesMap.set(Number(m.id_matricula), {
                id_aluno: Number(a.id_aluno),
                nome: u?.name?.trim() || `Aluno #${a.id_aluno}`,
                email: u?.email ?? null,
                cpf: u?.cpf ?? null,
                foto_url: u?.foto_url ?? null,
                id_matricula: Number(m.id_matricula),
                numero_inscricao: m.numero_inscricao ?? null,
                ano_letivo: m.ano_letivo ?? null,
                data_matricula: m.data_matricula ?? null,
                id_nivel_ensino: m.id_nivel_ensino ?? null,
              })
            })
          })
        }

        if (buscaNumerica) {
          let q = supabase
            .from('matriculas')
            .select(
              `
                id_matricula,
                id_aluno,
                numero_inscricao,
                ano_letivo,
                data_matricula,
                id_nivel_ensino,
                id_status_matricula,
                alunos!inner (
                  id_aluno,
                  usuarios!inner ( id, name, email, cpf, foto_url )
                )
              `,
            )
            .ilike('numero_inscricao', `%${digitos}%`)
            .limit(25)
            .order('ano_letivo', { ascending: false })

          const { data, error } = await q
          if (error) throw error

          ;(data ?? []).forEach((m: any) => {
            if (ativaId && Number(m.id_status_matricula ?? 0) !== ativaId) return
            const aluno = first(m?.alunos) as any
            const u = first(aluno?.usuarios) as UsuarioJoin | null
            opcoesMap.set(Number(m.id_matricula), {
              id_aluno: Number(m.id_aluno ?? aluno?.id_aluno),
              nome: u?.name?.trim() || `Aluno #${m.id_aluno ?? aluno?.id_aluno}`,
              email: u?.email ?? null,
              cpf: u?.cpf ?? null,
              foto_url: u?.foto_url ?? null,
              id_matricula: Number(m.id_matricula),
              numero_inscricao: m.numero_inscricao ?? null,
              ano_letivo: m.ano_letivo ?? null,
              data_matricula: m.data_matricula ?? null,
              id_nivel_ensino: m.id_nivel_ensino ?? null,
            })
          })

          if (digitos.length >= 11) {
            const cpfFmt = formatarCPF(digitos)
            const { data: dataCPF, error: errCPF } = await supabase
              .from('alunos')
              .select(
                `
                  id_aluno,
                  usuarios!inner ( id, name, email, cpf, foto_url ),
                  matriculas ( id_matricula, numero_inscricao, ano_letivo, data_matricula, id_nivel_ensino, id_status_matricula )
                `,
              )
              .or([`cpf.ilike.%${digitos}%`, `cpf.ilike.%${cpfFmt}%`].join(','), { foreignTable: 'usuarios' })
              .limit(25)

            if (errCPF) throw errCPF

            ;(dataCPF ?? []).forEach((a: any) => {
              const u = first(a?.usuarios) as UsuarioJoin | null
              const mats = ((a?.matriculas ?? []) as MatriculaJoin[])
                .filter((m) => (ativaId ? Number(m.id_status_matricula ?? 0) === ativaId : true))
                .sort((x, y) => {
                  if (Number(y.ano_letivo ?? 0) !== Number(x.ano_letivo ?? 0)) {
                    return Number(y.ano_letivo ?? 0) - Number(x.ano_letivo ?? 0)
                  }
                  return new Date(String(y.data_matricula ?? '1900-01-01')).getTime() - new Date(String(x.data_matricula ?? '1900-01-01')).getTime()
                })

              mats.forEach((m) => {
                if (m.id_matricula == null || opcoesMap.has(Number(m.id_matricula))) return
                opcoesMap.set(Number(m.id_matricula), {
                  id_aluno: Number(a.id_aluno),
                  nome: u?.name?.trim() || `Aluno #${a.id_aluno}`,
                  email: u?.email ?? null,
                  cpf: u?.cpf ?? null,
                  foto_url: u?.foto_url ?? null,
                  id_matricula: Number(m.id_matricula),
                  numero_inscricao: m.numero_inscricao ?? null,
                  ano_letivo: m.ano_letivo ?? null,
                  data_matricula: m.data_matricula ?? null,
                  id_nivel_ensino: m.id_nivel_ensino ?? null,
                })
              })
            })
          }
        }

        const lista = Array.from(opcoesMap.values())
          .sort((a, b) => a.nome.localeCompare(b.nome))
          .slice(0, 25)
        setOpcoesAluno(lista)
      } catch (e) {
        console.error(e)
        erro('Falha ao pesquisar aluno.')
      } finally {
        if (mountedRef.current) setCarregandoBusca(false)
      }
    },
    [supabase, erro, obterIdStatusMatriculaAtiva],
  )

  const carregarHistoricoAluno = useCallback(
    async (aluno: AlunoBuscaOption | null) => {
      if (!supabase) return
      if (!aluno?.id_matricula) {
        setProgressos([])
        setSessoesAbertas([])
        return
      }

      setCarregandoAluno(true)
      try {
        const [progressosRes, sessoesRes] = await Promise.all([
          supabase
            .from('progresso_aluno')
            .select(
              `
                id_progresso,
                id_matricula,
                id_disciplina,
                id_ano_escolar,
                id_status_disciplina,
                nota_final,
                data_conclusao,
                observacoes,
                disciplinas ( id_disciplina, nome_disciplina ),
                anos_escolares ( id_ano_escolar, nome_ano, id_nivel_ensino ),
                status_disciplina_aluno ( id_status_disciplina, nome )
              `,
            )
            .eq('id_matricula', aluno.id_matricula)
            .order('id_progresso', { ascending: false }),
          supabase
            .from('sessoes_atendimento')
            .select(
              `
                id_sessao,
                id_progresso,
                hora_entrada,
                id_sala,
                salas_atendimento ( nome ),
                professores ( usuarios ( name ) ),
                progresso_aluno ( disciplinas ( nome_disciplina ) )
              `,
            )
            .eq('id_aluno', aluno.id_aluno)
            .is('hora_saida', null)
            .order('hora_entrada', { ascending: true }),
        ])

        if (progressosRes.error) throw progressosRes.error
        if (sessoesRes.error) throw sessoesRes.error

        const progressosNormalizados: ProgressoHistorico[] = ((progressosRes.data ?? []) as any[]).map((p: any) => {
          const disc = first(p?.disciplinas) as any
          const ano = first(p?.anos_escolares) as any
          const status = first(p?.status_disciplina_aluno) as any
          return {
            id_progresso: Number(p.id_progresso),
            id_matricula: Number(p.id_matricula),
            id_disciplina: Number(p.id_disciplina),
            id_ano_escolar: Number(p.id_ano_escolar),
            disciplina_nome: disc?.nome_disciplina ? String(disc.nome_disciplina) : `Disciplina #${p.id_disciplina}`,
            ano_nome: ano?.nome_ano ? String(ano.nome_ano) : `Ano #${p.id_ano_escolar}`,
            id_nivel_ensino: ano?.id_nivel_ensino != null ? Number(ano.id_nivel_ensino) : null,
            status_nome: status?.nome ? String(status.nome) : null,
            nota_final: p?.nota_final != null ? Number(p.nota_final) : null,
            data_conclusao: p?.data_conclusao ? String(p.data_conclusao) : null,
            observacoes: p?.observacoes ? String(p.observacoes) : null,
          }
        })

        const sessoesNormalizadas: SessaoAbertaAluno[] = ((sessoesRes.data ?? []) as any[]).map((s: any) => {
          const sala = first(s?.salas_atendimento) as any
          const prof = first(s?.professores) as any
          const profUser = first(prof?.usuarios) as any
          const prog = first(s?.progresso_aluno) as any
          const disc = first(prog?.disciplinas) as any
          return {
            id_sessao: Number(s.id_sessao),
            id_progresso: s?.id_progresso != null ? Number(s.id_progresso) : null,
            hora_entrada: String(s.hora_entrada),
            sala_nome: sala?.nome ? String(sala.nome) : null,
            professor_nome: profUser?.name ? String(profUser.name) : null,
            disciplina_nome: disc?.nome_disciplina ? String(disc.nome_disciplina) : null,
          }
        })

        setProgressos(progressosNormalizados)
        setSessoesAbertas(sessoesNormalizadas)
      } catch (e) {
        console.error(e)
        erro('Falha ao carregar o histórico do aluno.')
      } finally {
        if (mountedRef.current) setCarregandoAluno(false)
      }
    },
    [supabase, erro],
  )

  const disciplinasEmCurso = useMemo(
    () => progressos.filter((p) => isStatusDisciplinaAberta(p.status_nome ?? '')),
    [progressos],
  )

  const disciplinasConcluidas = useMemo(
    () => progressos.filter((p) => !isStatusDisciplinaAberta(p.status_nome ?? '')).sort((a, b) => a.disciplina_nome.localeCompare(b.disciplina_nome)),
    [progressos],
  )

  const qtdDisciplinasAbertas = useMemo(
    () => new Set(disciplinasEmCurso.map((p) => p.id_disciplina)).size,
    [disciplinasEmCurso],
  )

  const salaSelecionada = useMemo(
    () => salas.find((s) => s.id_sala === Number(salaSelecionadaId)) ?? null,
    [salas, salaSelecionadaId],
  )

  const disciplinasDisponiveisNaSala = useMemo(() => {
    if (!alunoSelecionado?.id_nivel_ensino || !salaSelecionada?.id_sala) return []
    return (configsPorSala[salaSelecionada.id_sala] ?? []).filter(
      (cfg) => Number(cfg.id_nivel_ensino) === Number(alunoSelecionado.id_nivel_ensino),
    )
  }, [configsPorSala, salaSelecionada?.id_sala, alunoSelecionado?.id_nivel_ensino])

  const refrescarAlunoSelecionado = useCallback(async () => {
    if (!alunoSelecionado) return
    await carregarHistoricoAluno(alunoSelecionado)
  }, [alunoSelecionado, carregarHistoricoAluno])

  const abrirOuCriarFicha = useCallback(
    async (cfg: SalaDisciplinaNivelOption) => {
      if (!supabase) return
      if (!alunoSelecionado?.id_matricula || !alunoSelecionado.id_aluno) {
        aviso('Selecione um aluno com matrícula ativa.')
        return
      }

      if (!podeIgnorarLimite && qtdDisciplinasAbertas >= 3) {
        erro('Professor só pode abrir nova ficha quando o aluno tiver no máximo 2 disciplinas abertas.')
        return
      }

      setAbrindoFichaId(cfg.id_disciplina)
      try {
        const existente = escolherProgressoPorDisciplina(progressos, cfg.id_disciplina)
        if (existente?.id_progresso) {
          navigate(`/fichas/${existente.id_progresso}`)
          return
        }

        const statusDefaultId = obterIdStatusDisciplinaDefault()
        if (!statusDefaultId) {
          erro('Status inicial da disciplina não configurado.')
          return
        }

        const { data: criado, error: errIns } = await supabase
          .from('progresso_aluno')
          .insert({
            id_matricula: alunoSelecionado.id_matricula,
            id_disciplina: cfg.id_disciplina,
            id_ano_escolar: cfg.ano_representativo_id,
            id_status_disciplina: statusDefaultId,
          })
          .select('id_progresso')
          .single()

        if (errIns) throw errIns

        const idProgresso = Number(criado?.id_progresso ?? 0)
        if (!idProgresso) {
          throw new Error('O progresso foi criado sem id_progresso válido.')
        }

        sucesso(`Ficha criada em ${cfg.disciplina_nome}${salaSelecionada ? ` pela configuração da sala ${salaSelecionada.nome}` : ''}.`)
        await carregarHistoricoAluno(alunoSelecionado)
        navigate(`/fichas/${idProgresso}`)
      } catch (e) {
        console.error(e)
        erro('Não foi possível abrir a ficha da disciplina.')
      } finally {
        if (mountedRef.current) setAbrindoFichaId(null)
      }
    },
    [
      supabase,
      alunoSelecionado,
      podeIgnorarLimite,
      qtdDisciplinasAbertas,
      progressos,
      obterIdStatusDisciplinaDefault,
      sucesso,
      erro,
      aviso,
      navigate,
      carregarHistoricoAluno,
      salaSelecionada,
    ],
  )

  useEffect(() => {
    mountedRef.current = true
    void carregarBase()
    return () => {
      mountedRef.current = false
    }
  }, [carregarBase])

  useEffect(() => {
    const termo = buscaAluno.trim()
    const timer = window.setTimeout(() => {
      void buscarAlunos(termo)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [buscaAluno, buscarAlunos])

  useEffect(() => {
    void carregarHistoricoAluno(alunoSelecionado)
  }, [alunoSelecionado, carregarHistoricoAluno])

  useEffect(() => {
    if (!alunoSelecionado?.id_nivel_ensino) {
      setSalaSelecionadaId('')
      return
    }
    if (!salaSelecionadaId && salas.length > 0) {
      setSalaSelecionadaId(salas[0]?.id_sala ?? '')
    }
  }, [alunoSelecionado?.id_nivel_ensino, salaSelecionadaId, salas])

  return (
    <Box sx={{ p: 2.5, maxWidth: 1500, mx: 'auto' }}>
      <Stack spacing={2.5}>
        <Box>
          <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} justifyContent="space-between" spacing={1.5}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 900, lineHeight: 1.05 }}>
                Histórico acadêmico
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                Pesquise o aluno por nome ou RA, acompanhe as disciplinas em curso e abra novas fichas em qualquer sala.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.2}>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => void carregarBase()}>
                Atualizar base
              </Button>
              <Button variant="contained" color="primary" startIcon={<HistoryEduIcon />} onClick={() => void refrescarAlunoSelecionado()} disabled={!alunoSelecionado || carregandoAluno}>
                Atualizar aluno
              </Button>
            </Stack>
          </Stack>
        </Box>

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 3,
            borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.2 : 0.35),
          }}
        >
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems={{ lg: 'center' }}>
            <Autocomplete
              fullWidth
              options={opcoesAluno}
              value={alunoSelecionado}
              onChange={(_, value) => setAlunoSelecionado(value)}
              inputValue={buscaAluno}
              onInputChange={(_, value) => setBuscaAluno(value)}
              loading={carregandoBusca}
              getOptionLabel={(option) => `${option.nome}${option.numero_inscricao ? ` • RA ${option.numero_inscricao}` : ''}`}
              isOptionEqualToValue={(option, value) => option.id_matricula === value.id_matricula}
              noOptionsText={buscaAluno.trim().length < 2 ? 'Digite pelo menos 2 caracteres.' : 'Nenhum aluno encontrado.'}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={`${option.id_matricula}-${option.id_aluno}`}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
                    <AvatarAlunoHistorico supabase={supabase} idAluno={option.id_aluno} nome={option.nome} fotoUrl={option.foto_url} sx={{ width: 38, height: 38 }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}>
                        {option.nome}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        RA: {option.numero_inscricao || '-'} • {nomeNivelEnsinoLongo(option.id_nivel_ensino)}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Aluno / matrícula (RA)"
                  placeholder="Ex.: Francisco / 6089"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    endAdornment: (
                      <>
                        {carregandoBusca ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />

            <FormControl sx={{ minWidth: { xs: '100%', lg: 260 } }}>
              <InputLabel id="historico-sala-label">Sala para abrir ficha</InputLabel>
              <Select
                labelId="historico-sala-label"
                label="Sala para abrir ficha"
                value={salaSelecionadaId === '' ? '' : String(salaSelecionadaId)}
                onChange={(e) => setSalaSelecionadaId(e.target.value ? Number(e.target.value) : '')}
              >
                {salas.map((s) => (
                  <MenuItem key={s.id_sala} value={String(s.id_sala)}>
                    {s.nome} • {s.tipo_sala}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.2 }}>
            A sala define o conjunto de disciplinas disponíveis para abrir a ficha. Secretaria, Coordenação, Direção e Admin podem abrir mais de 3 fichas para o mesmo aluno nesta tela.
          </Typography>

          {carregandoBase && <LinearProgress sx={{ mt: 2 }} />}
        </Paper>

        {!alunoSelecionado ? (
          <Alert severity="info">Selecione um aluno para visualizar o histórico e abrir novas fichas.</Alert>
        ) : (
          <>
            <Paper
              variant="outlined"
              sx={{
                p: 2.2,
                borderRadius: 3,
                borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.22 : 0.38),
              }}
            >
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
                <AvatarAlunoHistorico
                  supabase={supabase}
                  idAluno={alunoSelecionado.id_aluno}
                  nome={alunoSelecionado.nome}
                  fotoUrl={alunoSelecionado.foto_url}
                  sx={{ width: 88, height: 88, fontSize: 30, fontWeight: 900 }}
                />

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h5" sx={{ fontWeight: 900, overflowWrap: 'anywhere' }}>
                    {alunoSelecionado.nome}
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                    <Chip size="small" label={`RA: ${alunoSelecionado.numero_inscricao || '-'}`} />
                    <Chip size="small" label={nomeNivelEnsinoLongo(alunoSelecionado.id_nivel_ensino)} variant="outlined" />
                    {alunoSelecionado.ano_letivo ? <Chip size="small" label={`Ano letivo: ${alunoSelecionado.ano_letivo}`} variant="outlined" /> : null}
                    {alunoSelecionado.data_matricula ? <Chip size="small" label={`Matrícula: ${formatarDataBR(alunoSelecionado.data_matricula)}`} variant="outlined" /> : null}
                    {alunoSelecionado.email ? <Chip size="small" label={alunoSelecionado.email} variant="outlined" /> : null}
                  </Stack>
                </Box>

                <Stack direction={{ xs: 'row', md: 'column' }} spacing={1.2}>
                  <Chip color="warning" label={`${qtdDisciplinasAbertas} disciplina(s) aberta(s)`} />
                  <Chip color={sessoesAbertas.length > 0 ? 'info' : 'default'} label={`${sessoesAbertas.length} atendimento(s) aberto(s)`} variant={sessoesAbertas.length > 0 ? 'filled' : 'outlined'} />
                </Stack>
              </Stack>

              {carregandoAluno && <LinearProgress sx={{ mt: 2 }} />}
            </Paper>

            {qtdDisciplinasAbertas >= 3 ? (
              <Alert severity={podeIgnorarLimite ? 'info' : 'warning'}>
                Este aluno já possui <strong>{qtdDisciplinasAbertas}</strong> disciplinas abertas. {podeIgnorarLimite ? 'Nesta tela, o seu perfil de gestão pode abrir novas fichas além desse limite.' : 'Perfil de professor deve respeitar o limite de no máximo 2 disciplinas abertas antes de criar outra ficha.'}
              </Alert>
            ) : null}

            <Stack direction={{ xs: 'column', xl: 'row' }} spacing={2} alignItems="stretch">
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, flex: 1.15 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <PendingActionsIcon color="warning" />
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    Disciplinas em curso
                  </Typography>
                </Stack>
                <Divider sx={{ mb: 1.5 }} />

                {disciplinasEmCurso.length === 0 ? (
                  <Alert severity="success">Nenhuma disciplina aberta nesta matrícula no momento.</Alert>
                ) : (
                  <Stack spacing={1.2}>
                    {disciplinasEmCurso
                      .slice()
                      .sort((a, b) => a.disciplina_nome.localeCompare(b.disciplina_nome))
                      .map((prog) => {
                        const chip = chipStatusDisciplina(prog.status_nome)
                        const sessoesDaDisc = sessoesAbertas.filter((s) => s.id_progresso === prog.id_progresso)
                        return (
                          <Card key={prog.id_progresso} variant="outlined" sx={{ borderRadius: 2.5 }}>
                            <CardContent>
                              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.5}>
                                <Box>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                                    {prog.disciplina_nome}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {prog.ano_nome} • ID da ficha: {prog.id_progresso}
                                  </Typography>
                                </Box>

                                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                  <Chip size="small" color={chip.color} variant={chip.variant} label={chip.label} />
                                  {sessoesDaDisc.length > 0 ? <Chip size="small" color="info" label={`${sessoesDaDisc.length} atendimento(s) aberto(s)`} /> : null}
                                  <Button size="small" variant="outlined" startIcon={<OpenInNewIcon />} onClick={() => navigate(`/fichas/${prog.id_progresso}`)}>
                                    Abrir ficha
                                  </Button>
                                </Stack>
                              </Stack>

                              {sessoesDaDisc.length > 0 ? (
                                <Stack spacing={0.6} sx={{ mt: 1.4 }}>
                                  {sessoesDaDisc.map((sess) => (
                                    <Typography key={sess.id_sessao} variant="body2" color="text.secondary">
                                      • {sess.disciplina_nome || prog.disciplina_nome} • {sess.sala_nome || 'Sala não informada'} • {sess.professor_nome || 'Professor não informado'} • Entrada {formatarDataHoraBR(sess.hora_entrada)}
                                    </Typography>
                                  ))}
                                </Stack>
                              ) : null}
                            </CardContent>
                          </Card>
                        )
                      })}
                  </Stack>
                )}
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, flex: 0.85 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <MeetingRoomIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    Atendimentos abertos agora
                  </Typography>
                </Stack>
                <Divider sx={{ mb: 1.5 }} />

                {sessoesAbertas.length === 0 ? (
                  <Alert severity="info">Este aluno não possui atendimento em aberto no momento.</Alert>
                ) : (
                  <Stack spacing={1.1}>
                    {sessoesAbertas.map((sess) => (
                      <Paper key={sess.id_sessao} variant="outlined" sx={{ p: 1.25, borderRadius: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                          {sess.disciplina_nome || 'Disciplina não vinculada'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Sala: {sess.sala_nome || '-'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Professor: {sess.professor_nome || '-'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Entrada: {formatarDataHoraBR(sess.hora_entrada)}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Paper>
            </Stack>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.5} alignItems={{ md: 'center' }}>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <SchoolIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      Abrir ficha em qualquer sala
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6 }}>
                    Selecione a sala e use a grade configurada para abrir a disciplina desejada para este aluno.
                  </Typography>
                </Box>

                <Chip
                  color="primary"
                  variant="outlined"
                  label={salaSelecionada ? `${salaSelecionada.nome} • ${salaSelecionada.tipo_sala}` : 'Selecione uma sala'}
                />
              </Stack>

              <Divider sx={{ my: 1.6 }} />

              {!salaSelecionada ? (
                <Alert severity="info">Escolha uma sala para listar as disciplinas disponíveis.</Alert>
              ) : disciplinasDisponiveisNaSala.length === 0 ? (
                <Alert severity="warning">
                  Não há disciplinas configuradas para {nomeNivelEnsinoLongo(alunoSelecionado.id_nivel_ensino)} nesta sala.
                </Alert>
              ) : (
                <Stack spacing={1.2}>
                  {disciplinasDisponiveisNaSala.map((cfg) => {
                    const existente = escolherProgressoPorDisciplina(progressos, cfg.id_disciplina)
                    const chipExistente = existente ? chipStatusDisciplina(existente.status_nome) : null
                    const concluida = existente ? !isStatusDisciplinaAberta(existente.status_nome ?? '') : false
                    const resumo = resumoFaixasProtocolos(cfg.faixas)
                    const acaoLabel = existente
                      ? concluida
                        ? 'Ver ficha existente'
                        : 'Abrir ficha existente'
                      : 'Criar ficha'

                    return (
                      <Paper key={`${salaSelecionada.id_sala}-${cfg.id_disciplina}-${cfg.id_nivel_ensino}`} variant="outlined" sx={{ p: 1.4, borderRadius: 2.2 }}>
                        <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" spacing={1.5}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                              {cfg.disciplina_nome}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {nomeNivelEnsinoLongo(cfg.id_nivel_ensino)} • Protocolos: {cfg.total_protocolos}
                            </Typography>
                            {resumo ? (
                              <Typography variant="body2" color="text.secondary">
                                {resumo}
                              </Typography>
                            ) : null}
                          </Box>

                          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                            {existente ? (
                              <Tooltip title={`Ficha #${existente.id_progresso} • ${existente.ano_nome}`}>
                                <Chip size="small" color={chipExistente!.color} variant={chipExistente!.variant} label={chipExistente!.label} />
                              </Tooltip>
                            ) : (
                              <Chip size="small" variant="outlined" label="Sem ficha nesta disciplina" />
                            )}

                            <Button
                              size="small"
                              variant={existente ? 'outlined' : 'contained'}
                              color="primary"
                              startIcon={existente ? <OpenInNewIcon /> : <AddCircleOutlineIcon />}
                              onClick={() => void abrirOuCriarFicha(cfg)}
                              disabled={abrindoFichaId === cfg.id_disciplina}
                            >
                              {abrindoFichaId === cfg.id_disciplina ? 'Processando...' : acaoLabel}
                            </Button>
                          </Stack>
                        </Stack>
                      </Paper>
                    )
                  })}
                </Stack>
              )}
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <AutoStoriesIcon color="success" />
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  Histórico da matrícula
                </Typography>
              </Stack>
              <Divider sx={{ mb: 1.5 }} />

              {progressos.length === 0 ? (
                <Alert severity="info">Nenhuma ficha encontrada para a matrícula selecionada.</Alert>
              ) : (
                <Stack spacing={1.2}>
                  {progressos
                    .slice()
                    .sort((a, b) => a.disciplina_nome.localeCompare(b.disciplina_nome))
                    .map((prog) => {
                      const chip = chipStatusDisciplina(prog.status_nome)
                      return (
                        <Card key={prog.id_progresso} variant="outlined" sx={{ borderRadius: 2.3 }}>
                          <CardContent>
                            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.5}>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                                  {prog.disciplina_nome}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {prog.ano_nome} • Ficha #{prog.id_progresso}
                                </Typography>
                                {prog.data_conclusao ? (
                                  <Typography variant="body2" color="text.secondary">
                                    Conclusão: {formatarDataBR(prog.data_conclusao)}
                                  </Typography>
                                ) : null}
                              </Box>

                              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                                <Chip size="small" color={chip.color} variant={chip.variant} label={chip.label} />
                                {prog.nota_final != null ? <Chip size="small" color="success" variant="outlined" label={`Nota final: ${String(prog.nota_final).replace('.', ',')}`} /> : null}
                                <Button size="small" variant="outlined" startIcon={<OpenInNewIcon />} onClick={() => navigate(`/fichas/${prog.id_progresso}`)}>
                                  Abrir ficha
                                </Button>
                              </Stack>
                            </Stack>
                          </CardContent>
                        </Card>
                      )
                    })}
                </Stack>
              )}

              {disciplinasConcluidas.length > 0 ? (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.2 }}>
                  Concluídas nesta matrícula: {disciplinasConcluidas.map((d) => d.disciplina_nome).join(', ')}.
                </Typography>
              ) : null}
            </Paper>
          </>
        )}
      </Stack>
    </Box>
  )
}

export default SecretariaHistoricoPage
