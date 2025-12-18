// src/paginas/painel-coordenacao/SaspPage.tsx
// Página SASP: busca de aluno (Nome/RA/CPF) + formulário completo (formulario_sasp)

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'


import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  InputAdornment,
  Paper,
  Stack,
  Switch,
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
  Chip,
} from '@mui/material'

import { alpha } from '@mui/material/styles'

import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import SearchIcon from '@mui/icons-material/Search'
import SaveIcon from '@mui/icons-material/Save'
import RefreshIcon from '@mui/icons-material/Autorenew'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import DescriptionIcon from '@mui/icons-material/Description'
import WorkIcon from '@mui/icons-material/Work'
import SchoolIcon from '@mui/icons-material/School'
import PsychologyIcon from '@mui/icons-material/Psychology'
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom'

import { useSupabase } from '../../contextos/SupabaseContext'
import { useNotificacaoContext } from '../../contextos/NotificacaoContext'

// ===================== Helpers =====================

function first<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null
  return Array.isArray(v) ? v[0] ?? null : v
}

function normalizarTexto(valor: string): string {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function extrairDigitos(input: string): string {
  return String(input ?? '').replace(/\D/g, '')
}

function formatarCPF(digitos: string): string {
  const d = extrairDigitos(digitos).padStart(11, '0').slice(-11)
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`
}

function formatarDataBR(iso?: string | null): string {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('pt-BR')
}

function hojeISODate(): string {
  // YYYY-MM-DD
  return new Date().toISOString().slice(0, 10)
}

// ===================== Types =====================

type SearchMode = 'nome' | 'matricula' | 'cpf'

type NivelRow = { id_nivel_ensino: number; nome: string }
type StatusMatRow = { id_status_matricula: number; nome: string }

type MatriculaMini = {
  id_matricula: number
  numero_inscricao: string | null
  ano_letivo: number | null
  data_matricula: string | null
  id_nivel_ensino: number | null
  id_status_matricula: number | null
}

type AlunoResultado = {
  id_aluno: number
  nome: string
  cpf: string | null
  email: string | null
  celular: string | null
  foto_url: string | null
  nis: string | null
  matricula: MatriculaMini | null
  // “status rápido” do SASP
  sasp_id: number | null
  sasp_data_entrevista: string | null
}

type SaspFormState = {
  data_entrevista: string
  escola_origem: string
  cidade_escola_origem: string
  disciplinas_indicadas_aproveitamento: string
  motivo_retorno_estudos: string

  trabalha: boolean
  local_trabalho: string
  funcao_trabalho: string

  repetiu_ano: boolean
  desistiu_estudar: boolean
  motivos_desistencia: string
  escolas_desistiu: string

  materias_dificuldade: string
  relacao_tecnologia: string

  curso_superior_desejado: string
  atividade_cultural_interesse: string
  esporte_interesse: string

  pessoas_residencia: string
  parentes_moradia: string
  responsavel_pelos_estudos: string

  tem_filhos: boolean
  quantos_filhos: string

  como_conheceu_ceja: string
  observacoes_sasp: string
}

const FORM_DEFAULT: SaspFormState = {
  data_entrevista: hojeISODate(),
  escola_origem: '',
  cidade_escola_origem: '',
  disciplinas_indicadas_aproveitamento: '',
  motivo_retorno_estudos: '',

  trabalha: false,
  local_trabalho: '',
  funcao_trabalho: '',

  repetiu_ano: false,
  desistiu_estudar: false,
  motivos_desistencia: '',
  escolas_desistiu: '',

  materias_dificuldade: '',
  relacao_tecnologia: '',

  curso_superior_desejado: '',
  atividade_cultural_interesse: '',
  esporte_interesse: '',

  pessoas_residencia: '',
  parentes_moradia: '',
  responsavel_pelos_estudos: '',

  tem_filhos: false,
  quantos_filhos: '',

  como_conheceu_ceja: '',
  observacoes_sasp: '',
}

// ===================== Page =====================

export default function SaspPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const { supabase } = useSupabase()
  const { sucesso, aviso, erro, info } = useNotificacaoContext()

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // ======= apoio (níveis/status) =======
  const [niveisEnsino, setNiveisEnsino] = useState<NivelRow[]>([])
  const [statusMatriculas, setStatusMatriculas] = useState<StatusMatRow[]>([])
  const [carregandoApoio, setCarregandoApoio] = useState(false)

  useEffect(() => {
    if (!supabase) return

    const run = async () => {
      setCarregandoApoio(true)
      try {
        const [niv, st] = await Promise.all([
          supabase.from('niveis_ensino').select('id_nivel_ensino, nome').order('id_nivel_ensino'),
          supabase.from('status_matricula').select('id_status_matricula, nome').order('id_status_matricula'),
        ])

        if (niv.error) throw niv.error
        if (st.error) throw st.error

        setNiveisEnsino(
          (niv.data ?? []).map((n: any) => ({
            id_nivel_ensino: Number(n.id_nivel_ensino),
            nome: String(n.nome ?? ''),
          })),
        )
        setStatusMatriculas(
          (st.data ?? []).map((s: any) => ({
            id_status_matricula: Number(s.id_status_matricula),
            nome: String(s.nome ?? ''),
          })),
        )
      } catch (e) {
        console.error(e)
        erro('Falha ao carregar tabelas de apoio (níveis/status).')
      } finally {
        if (mountedRef.current) setCarregandoApoio(false)
      }
    }

    void run()
  }, [supabase, erro])

  const mapaNivel = useMemo(() => {
    const m = new Map<number, string>()
    niveisEnsino.forEach((n) => m.set(Number(n.id_nivel_ensino), n.nome))
    return m
  }, [niveisEnsino])

  const mapaStatus = useMemo(() => {
    const m = new Map<number, string>()
    statusMatriculas.forEach((s) => m.set(Number(s.id_status_matricula), s.nome))
    return m
  }, [statusMatriculas])

  const idStatusAtiva = useMemo(() => {
    const ativa = statusMatriculas.find((s) => normalizarTexto(s.nome).includes('ativa'))
    return ativa ? Number(ativa.id_status_matricula) : null
  }, [statusMatriculas])

  // ======= busca =======
  const [termoBusca, setTermoBusca] = useState('')
  const [modosBusca, setModosBusca] = useState<SearchMode[]>(['nome', 'matricula', 'cpf'])
  const [somenteAtivas, setSomenteAtivas] = useState(true)

  const [buscando, setBuscando] = useState(false)
  const [resultados, setResultados] = useState<AlunoResultado[]>([])

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const resetPaginacao = () => {
    setPage(0)
  }

  const escolherMelhorMatricula = useCallback(
    (a: MatriculaMini | null, b: MatriculaMini | null): MatriculaMini | null => {
      if (!a) return b
      if (!b) return a

      const ativaA = idStatusAtiva != null && Number(a.id_status_matricula) === Number(idStatusAtiva)
      const ativaB = idStatusAtiva != null && Number(b.id_status_matricula) === Number(idStatusAtiva)

      // Se estiver em “Somente ativas”, não tem sentido comparar ativa vs não ativa.
      // Mas mantemos a regra geral (ativa primeiro) para quando o toggle estiver desligado.
      if (!somenteAtivas && ativaA !== ativaB) {
        return ativaB ? b : a
      }

      const anoA = Number(a.ano_letivo ?? 0)
      const anoB = Number(b.ano_letivo ?? 0)
      if (anoA !== anoB) return anoB > anoA ? b : a

      const dtA = a.data_matricula ? new Date(a.data_matricula).getTime() : 0
      const dtB = b.data_matricula ? new Date(b.data_matricula).getTime() : 0
      if (dtA !== dtB) return dtB > dtA ? b : a

      return Number(b.id_matricula) > Number(a.id_matricula) ? b : a
    },
    [idStatusAtiva, somenteAtivas],
  )

  const escolherMatriculaPreferencial = useCallback(
    (mats: any[]): MatriculaMini | null => {
      if (!Array.isArray(mats) || mats.length === 0) return null

      const lista: MatriculaMini[] = mats
        .map((m: any) => ({
          id_matricula: Number(m?.id_matricula),
          numero_inscricao: m?.numero_inscricao ? String(m.numero_inscricao) : null,
          ano_letivo: m?.ano_letivo != null ? Number(m.ano_letivo) : null,
          data_matricula: m?.data_matricula ? String(m.data_matricula) : null,
          id_nivel_ensino: m?.id_nivel_ensino != null ? Number(m.id_nivel_ensino) : null,
          id_status_matricula: m?.id_status_matricula != null ? Number(m.id_status_matricula) : null,
        }))
        .filter((x) => Number.isFinite(Number(x.id_matricula)))

      const listaFiltrada =
        somenteAtivas && idStatusAtiva != null
          ? lista.filter((m) => Number(m.id_status_matricula) === Number(idStatusAtiva))
          : lista

      if (listaFiltrada.length === 0) return null

      const ordenada = [...listaFiltrada].sort((x, y) => {
        const anoX = Number(x.ano_letivo ?? 0)
        const anoY = Number(y.ano_letivo ?? 0)
        if (anoY !== anoX) return anoY - anoX
        const dtX = x.data_matricula ? new Date(x.data_matricula).getTime() : 0
        const dtY = y.data_matricula ? new Date(y.data_matricula).getTime() : 0
        return dtY - dtX
      })

      return ordenada[0] ?? null
    },
    [somenteAtivas, idStatusAtiva],
  )

  const buscarAlunos = useCallback(async () => {
    if (!supabase) {
      aviso('Supabase indisponível. Configure as variáveis de ambiente e o SupabaseContext.')
      return
    }

    const t = termoBusca.trim()
    if (t.length < 2) {
      aviso('Digite pelo menos 2 caracteres para buscar.')
      return
    }

    if (modosBusca.length === 0) {
      aviso('Marque pelo menos um tipo de busca (Nome, Matrícula, CPF).')
      return
    }

    setBuscando(true)
    resetPaginacao()

    try {
      const mapa = new Map<number, AlunoResultado>()
      const digitos = extrairDigitos(t)
      const cpfFmt = digitos.length >= 11 ? formatarCPF(digitos) : null

      const upsertAluno = (novo: AlunoResultado) => {
        const existente = mapa.get(novo.id_aluno)
        if (!existente) {
          mapa.set(novo.id_aluno, novo)
          return
        }

        mapa.set(novo.id_aluno, {
          ...existente,
          // se vier informação melhor, sobrescreve
          nome: novo.nome || existente.nome,
          cpf: novo.cpf ?? existente.cpf,
          email: novo.email ?? existente.email,
          celular: novo.celular ?? existente.celular,
          foto_url: novo.foto_url ?? existente.foto_url,
          nis: novo.nis ?? existente.nis,
          sasp_id: novo.sasp_id ?? existente.sasp_id,
          sasp_data_entrevista: novo.sasp_data_entrevista ?? existente.sasp_data_entrevista,
          matricula: escolherMelhorMatricula(existente.matricula, novo.matricula),
        })
      }

      // 1) Nome
      if (modosBusca.includes('nome')) {
        const { data, error } = await supabase
          .from('alunos')
          .select(
            `
            id_aluno,
            nis,
            usuarios!inner ( id, name, email, cpf, celular, foto_url ),
            matriculas ( id_matricula, numero_inscricao, ano_letivo, data_matricula, id_nivel_ensino, id_status_matricula ),
            formulario_sasp ( id_sasp, data_entrevista )
          `,
          )
          .ilike('usuarios.name', `%${t}%`)
          .limit(40)

        if (error) throw error

        ;(data ?? []).forEach((a: any) => {
          const u = first(a?.usuarios) as any
          const sasp = first(a?.formulario_sasp) as any
          const mat = escolherMatriculaPreferencial(a?.matriculas ?? [])
          if (somenteAtivas && !mat) return

          upsertAluno({
            id_aluno: Number(a.id_aluno),
            nome: u?.name ? String(u.name) : `Aluno #${a.id_aluno}`,
            cpf: u?.cpf ? String(u.cpf) : null,
            email: u?.email ? String(u.email) : null,
            celular: u?.celular ? String(u.celular) : null,
            foto_url: u?.foto_url ? String(u.foto_url) : null,
            nis: a?.nis ? String(a.nis) : null,
            matricula: mat,
            sasp_id: sasp?.id_sasp != null ? Number(sasp.id_sasp) : null,
            sasp_data_entrevista: sasp?.data_entrevista ? String(sasp.data_entrevista) : null,
          })
        })
      }

      // 2) CPF
      if (modosBusca.includes('cpf')) {
        // CPF costuma precisar de pelo menos alguns dígitos
        if (digitos.length >= 3) {
          const orParts = [
            `usuarios.cpf.ilike.%${t}%`,
            digitos ? `usuarios.cpf.ilike.%${digitos}%` : null,
            cpfFmt ? `usuarios.cpf.ilike.%${cpfFmt}%` : null,
          ].filter(Boolean)

          const { data, error } = await supabase
            .from('alunos')
            .select(
              `
              id_aluno,
              nis,
              usuarios!inner ( id, name, email, cpf, celular, foto_url ),
              matriculas ( id_matricula, numero_inscricao, ano_letivo, data_matricula, id_nivel_ensino, id_status_matricula ),
              formulario_sasp ( id_sasp, data_entrevista )
            `,
            )
            .or(orParts.join(','))
            .limit(40)

          if (error) throw error

          ;(data ?? []).forEach((a: any) => {
            const u = first(a?.usuarios) as any
            const sasp = first(a?.formulario_sasp) as any
            const mat = escolherMatriculaPreferencial(a?.matriculas ?? [])
            if (somenteAtivas && !mat) return

            upsertAluno({
              id_aluno: Number(a.id_aluno),
              nome: u?.name ? String(u.name) : `Aluno #${a.id_aluno}`,
              cpf: u?.cpf ? String(u.cpf) : null,
              email: u?.email ? String(u.email) : null,
              celular: u?.celular ? String(u.celular) : null,
              foto_url: u?.foto_url ? String(u.foto_url) : null,
              nis: a?.nis ? String(a.nis) : null,
              matricula: mat,
              sasp_id: sasp?.id_sasp != null ? Number(sasp.id_sasp) : null,
              sasp_data_entrevista: sasp?.data_entrevista ? String(sasp.data_entrevista) : null,
            })
          })
        }
      }

      // 3) Matrícula/RA
      if (modosBusca.includes('matricula')) {
        const termoRA = digitos || t
        if (termoRA.length >= 2) {
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
                nis,
                usuarios!inner ( id, name, email, cpf, celular, foto_url ),
                formulario_sasp ( id_sasp, data_entrevista )
              )
            `,
            )
            .ilike('numero_inscricao', `%${termoRA}%`)
            .order('ano_letivo', { ascending: false })
            .order('data_matricula', { ascending: false })
            .limit(50)

          if (somenteAtivas && idStatusAtiva != null) {
            q = q.eq('id_status_matricula', idStatusAtiva)
          }

          const { data, error } = await q
          if (error) throw error

          ;(data ?? []).forEach((m: any) => {
            const aluno = first(m?.alunos) as any
            const u = first(aluno?.usuarios) as any
            const sasp = first(aluno?.formulario_sasp) as any

            const mat: MatriculaMini = {
              id_matricula: Number(m.id_matricula),
              numero_inscricao: m?.numero_inscricao ? String(m.numero_inscricao) : null,
              ano_letivo: m?.ano_letivo != null ? Number(m.ano_letivo) : null,
              data_matricula: m?.data_matricula ? String(m.data_matricula) : null,
              id_nivel_ensino: m?.id_nivel_ensino != null ? Number(m.id_nivel_ensino) : null,
              id_status_matricula: m?.id_status_matricula != null ? Number(m.id_status_matricula) : null,
            }

            upsertAluno({
              id_aluno: Number(m.id_aluno ?? aluno?.id_aluno),
              nome: u?.name ? String(u.name) : `Aluno #${m.id_aluno ?? aluno?.id_aluno}`,
              cpf: u?.cpf ? String(u.cpf) : null,
              email: u?.email ? String(u.email) : null,
              celular: u?.celular ? String(u.celular) : null,
              foto_url: u?.foto_url ? String(u.foto_url) : null,
              nis: aluno?.nis ? String(aluno.nis) : null,
              matricula: mat,
              sasp_id: sasp?.id_sasp != null ? Number(sasp.id_sasp) : null,
              sasp_data_entrevista: sasp?.data_entrevista ? String(sasp.data_entrevista) : null,
            })
          })
        }
      }

      const lista = Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome))
      setResultados(lista)

      if (lista.length === 0) {
        info('Nenhum aluno encontrado para essa busca.')
      }
    } catch (e) {
      console.error(e)
      erro('Falha ao buscar alunos. Verifique conexão e tente novamente.')
    } finally {
      if (mountedRef.current) setBuscando(false)
    }
  }, [
    supabase,
    aviso,
    erro,
    info,
    termoBusca,
    modosBusca,
    somenteAtivas,
    idStatusAtiva,
    escolherMatriculaPreferencial,
    escolherMelhorMatricula,
  ])

  const limparBusca = () => {
    setTermoBusca('')
    setResultados([])
    resetPaginacao()
  }

  // ======= seleção + SASP =======
  const [alunoSelecionado, setAlunoSelecionado] = useState<AlunoResultado | null>(null)
  const [carregandoSasp, setCarregandoSasp] = useState(false)
  const [salvandoSasp, setSalvandoSasp] = useState(false)
  const [saspIdAtual, setSaspIdAtual] = useState<number | null>(null)
  const [form, setForm] = useState<SaspFormState>({ ...FORM_DEFAULT })

  const preencherFormComRow = (row: any | null) => {
    if (!row) {
      setSaspIdAtual(null)
      setForm({ ...FORM_DEFAULT, data_entrevista: hojeISODate() })
      return
    }

    setSaspIdAtual(row?.id_sasp != null ? Number(row.id_sasp) : null)
    setForm({
      data_entrevista: row?.data_entrevista ? String(row.data_entrevista) : hojeISODate(),
      escola_origem: row?.escola_origem ? String(row.escola_origem) : '',
      cidade_escola_origem: row?.cidade_escola_origem ? String(row.cidade_escola_origem) : '',
      disciplinas_indicadas_aproveitamento: row?.disciplinas_indicadas_aproveitamento ? String(row.disciplinas_indicadas_aproveitamento) : '',
      motivo_retorno_estudos: row?.motivo_retorno_estudos ? String(row.motivo_retorno_estudos) : '',

      trabalha: Boolean(row?.trabalha),
      local_trabalho: row?.local_trabalho ? String(row.local_trabalho) : '',
      funcao_trabalho: row?.funcao_trabalho ? String(row.funcao_trabalho) : '',

      repetiu_ano: Boolean(row?.repetiu_ano),
      desistiu_estudar: Boolean(row?.desistiu_estudar),
      motivos_desistencia: row?.motivos_desistencia ? String(row.motivos_desistencia) : '',
      escolas_desistiu: row?.escolas_desistiu ? String(row.escolas_desistiu) : '',

      materias_dificuldade: row?.materias_dificuldade ? String(row.materias_dificuldade) : '',
      relacao_tecnologia: row?.relacao_tecnologia ? String(row.relacao_tecnologia) : '',

      curso_superior_desejado: row?.curso_superior_desejado ? String(row.curso_superior_desejado) : '',
      atividade_cultural_interesse: row?.atividade_cultural_interesse ? String(row.atividade_cultural_interesse) : '',
      esporte_interesse: row?.esporte_interesse ? String(row.esporte_interesse) : '',

      pessoas_residencia: row?.pessoas_residencia != null ? String(row.pessoas_residencia) : '',
      parentes_moradia: row?.parentes_moradia ? String(row.parentes_moradia) : '',
      responsavel_pelos_estudos: row?.responsavel_pelos_estudos ? String(row.responsavel_pelos_estudos) : '',

      tem_filhos: Boolean(row?.tem_filhos),
      quantos_filhos: row?.quantos_filhos != null ? String(row.quantos_filhos) : '',

      como_conheceu_ceja: row?.como_conheceu_ceja ? String(row.como_conheceu_ceja) : '',
      observacoes_sasp: row?.observacoes_sasp ? String(row.observacoes_sasp) : '',
    })
  }

  const carregarSaspDoAluno = useCallback(
    async (idAluno: number) => {
      if (!supabase) return
      setCarregandoSasp(true)

      try {
        const { data, error } = await supabase
          .from('formulario_sasp')
          .select('*')
          .eq('id_aluno', idAluno)
          .order('data_entrevista', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) throw error
        preencherFormComRow(data ?? null)

        if (!data) {
          info('Este aluno ainda não tem SASP cadastrado. Preencha e clique em Salvar.')
        }
      } catch (e) {
        console.error(e)
        erro('Falha ao carregar SASP do aluno.')
      } finally {
        if (mountedRef.current) setCarregandoSasp(false)
      }
    },
    [supabase, erro, info],
  )

  const selecionarAluno = useCallback(
    async (aluno: AlunoResultado) => {
      setAlunoSelecionado(aluno)
      await carregarSaspDoAluno(aluno.id_aluno)
    },
    [carregarSaspDoAluno],
  )

  const salvarSasp = useCallback(async () => {
    if (!supabase) {
      aviso('Supabase indisponível. Configure as variáveis de ambiente e o SupabaseContext.')
      return
    }
    if (!alunoSelecionado) {
      aviso('Selecione um aluno antes de salvar o SASP.')
      return
    }
    if (!form.data_entrevista) {
      aviso('Informe a data da entrevista.')
      return
    }

    const pessoasResid = form.pessoas_residencia.trim()
    const filhos = form.quantos_filhos.trim()

    const payload: any = {
      id_aluno: alunoSelecionado.id_aluno,
      data_entrevista: form.data_entrevista,
      escola_origem: form.escola_origem.trim() ? form.escola_origem.trim() : null,
      cidade_escola_origem: form.cidade_escola_origem.trim() ? form.cidade_escola_origem.trim() : null,
      disciplinas_indicadas_aproveitamento: form.disciplinas_indicadas_aproveitamento.trim()
        ? form.disciplinas_indicadas_aproveitamento.trim()
        : null,
      motivo_retorno_estudos: form.motivo_retorno_estudos.trim() ? form.motivo_retorno_estudos.trim() : null,
      trabalha: Boolean(form.trabalha),
      local_trabalho: form.trabalha && form.local_trabalho.trim() ? form.local_trabalho.trim() : null,
      funcao_trabalho: form.trabalha && form.funcao_trabalho.trim() ? form.funcao_trabalho.trim() : null,
      repetiu_ano: Boolean(form.repetiu_ano),
      desistiu_estudar: Boolean(form.desistiu_estudar),
      motivos_desistencia: form.desistiu_estudar && form.motivos_desistencia.trim() ? form.motivos_desistencia.trim() : null,
      escolas_desistiu: form.desistiu_estudar && form.escolas_desistiu.trim() ? form.escolas_desistiu.trim() : null,
      materias_dificuldade: form.materias_dificuldade.trim() ? form.materias_dificuldade.trim() : null,
      relacao_tecnologia: form.relacao_tecnologia.trim() ? form.relacao_tecnologia.trim() : null,
      curso_superior_desejado: form.curso_superior_desejado.trim() ? form.curso_superior_desejado.trim() : null,
      atividade_cultural_interesse: form.atividade_cultural_interesse.trim() ? form.atividade_cultural_interesse.trim() : null,
      esporte_interesse: form.esporte_interesse.trim() ? form.esporte_interesse.trim() : null,
      pessoas_residencia: pessoasResid ? Number(pessoasResid) : null,
      parentes_moradia: form.parentes_moradia.trim() ? form.parentes_moradia.trim() : null,
      responsavel_pelos_estudos: form.responsavel_pelos_estudos.trim() ? form.responsavel_pelos_estudos.trim() : null,
      tem_filhos: Boolean(form.tem_filhos),
      quantos_filhos: form.tem_filhos && filhos ? Number(filhos) : null,
      como_conheceu_ceja: form.como_conheceu_ceja.trim() ? form.como_conheceu_ceja.trim() : null,
      observacoes_sasp: form.observacoes_sasp.trim() ? form.observacoes_sasp.trim() : null,
    }

    if (pessoasResid && Number.isNaN(Number(pessoasResid))) {
      aviso('“Pessoas na residência” precisa ser um número.')
      return
    }
    if (form.tem_filhos && filhos && Number.isNaN(Number(filhos))) {
      aviso('“Quantos filhos” precisa ser um número.')
      return
    }

    setSalvandoSasp(true)
    try {
      let saspIdFinal: number | null = saspIdAtual
      if (saspIdAtual != null) {
        const { error } = await supabase
          .from('formulario_sasp')
          .update(payload)
          .eq('id_sasp', saspIdAtual)
        if (error) throw error
        sucesso('SASP atualizado com sucesso.')
      } else {
        const { data, error } = await supabase
          .from('formulario_sasp')
          .insert(payload)
          .select('id_sasp')
          .single()

        if (error) throw error
        const novoId = data?.id_sasp != null ? Number(data.id_sasp) : null
        saspIdFinal = novoId
        setSaspIdAtual(novoId)
        sucesso('SASP cadastrado com sucesso.')
      }

      // atualiza “status rápido” no card do aluno selecionado (sem re-buscar lista inteira)
      setAlunoSelecionado((prev) =>
        prev
          ? {
              ...prev,
              sasp_id: saspIdFinal,
              sasp_data_entrevista: form.data_entrevista,
            }
          : prev,
      )
    } catch (e) {
      console.error(e)
      erro('Falha ao salvar SASP.')
    } finally {
      if (mountedRef.current) setSalvandoSasp(false)
    }
  }, [
    supabase,
    alunoSelecionado,
    form,
    saspIdAtual,
    aviso,
    sucesso,
    erro,
  ])

  // ======= UI helpers =======
  const bgSelectedRow = useMemo(() => alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.18 : 0.10), [theme])

  const resultadosPaginados = useMemo(() => {
    const start = page * rowsPerPage
    const end = start + rowsPerPage
    return resultados.slice(start, end)
  }, [resultados, page, rowsPerPage])

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        width: '100%',
        maxWidth: 1600,
        mx: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        overflowX: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Cabeçalho */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ textAlign: { xs: 'center', sm: 'left' } }}
      >
        <Box>
          <Typography variant="h5" fontWeight={800}>
            SASP — Pesquisa e Formulário do Aluno
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pesquise por <b>Nome</b>, <b>RA/Matrícula</b> ou <b>CPF</b> e preencha o SASP do aluno.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} justifyContent="center">
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            disabled={!alunoSelecionado || carregandoSasp || salvandoSasp}
            onClick={() => alunoSelecionado && void carregarSaspDoAluno(alunoSelecionado.id_aluno)}
          >
            Recarregar
          </Button>
          <Button
            variant="contained"
            startIcon={salvandoSasp ? <CircularProgress size={18} /> : <SaveIcon />}
            disabled={!alunoSelecionado || carregandoSasp || salvandoSasp}
            onClick={() => void salvarSasp()}
            sx={{ fontWeight: 700, px: 3 }}
          >
            Salvar
          </Button>
        </Stack>
      </Stack>

      {!supabase ? (
        <Alert severity="warning">
          Supabase não está disponível. Configure o projeto (variáveis de ambiente e SupabaseContext) para usar esta tela.
        </Alert>
      ) : null}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="stretch">
        {/* Coluna ESQUERDA: Busca */}
        <Box sx={{ width: { xs: '100%', md: 520 }, flexShrink: 0 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <PersonSearchIcon color="action" />
              <Typography variant="subtitle1" fontWeight={800}>
                Buscar aluno
              </Typography>
              {carregandoApoio ? (
                <Chip size="small" label="Carregando..." />
              ) : null}
            </Stack>

            <TextField
              fullWidth
              size="small"
              placeholder="Digite o nome, RA (matrícula) ou CPF..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void buscarAlunos()
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 86 }}>
                Buscar por:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={modosBusca.includes('nome')}
                      onChange={(e) => {
                        setModosBusca((prev) =>
                          e.target.checked ? Array.from(new Set([...prev, 'nome'])) : prev.filter((x) => x !== 'nome'),
                        )
                      }}
                    />
                  }
                  label="Nome"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={modosBusca.includes('matricula')}
                      onChange={(e) => {
                        setModosBusca((prev) =>
                          e.target.checked
                            ? Array.from(new Set([...prev, 'matricula']))
                            : prev.filter((x) => x !== 'matricula'),
                        )
                      }}
                    />
                  }
                  label="Matrícula (RA)"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={modosBusca.includes('cpf')}
                      onChange={(e) => {
                        setModosBusca((prev) =>
                          e.target.checked ? Array.from(new Set([...prev, 'cpf'])) : prev.filter((x) => x !== 'cpf'),
                        )
                      }}
                    />
                  }
                  label="CPF"
                />
              </Stack>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
              <FormControlLabel
                control={<Switch checked={somenteAtivas} onChange={(e) => setSomenteAtivas(e.target.checked)} />}
                label="Somente matrículas ativas"
              />
              {somenteAtivas && idStatusAtiva == null ? (
                <Tooltip title="Não encontrei um status contendo 'Ativa' na tabela status_matricula.">
                  <Chip size="small" color="warning" label="Status 'Ativa' não detectado" />
                </Tooltip>
              ) : null}
            </Stack>

            <Stack direction="row" spacing={1}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => void buscarAlunos()}
                disabled={buscando || !supabase}
                sx={{ fontWeight: 700 }}
              >
                {buscando ? <CircularProgress size={18} /> : 'Pesquisar'}
              </Button>
              <Button fullWidth variant="outlined" onClick={limparBusca} disabled={buscando}>
                Limpar
              </Button>
            </Stack>
          </Paper>

          <Box sx={{ mt: 2 }}>
            <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Box
                sx={{
                  px: 2,
                  py: 1.25,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <Typography variant="subtitle2" fontWeight={800}>
                  Resultados ({resultados.length})
                </Typography>
                {buscando ? <CircularProgress size={18} /> : null}
              </Box>

              {resultados.length === 0 && !buscando ? (
                <Box sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Faça uma busca para listar alunos.
                  </Typography>
                </Box>
              ) : (
                <>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Aluno</TableCell>
                        {!isMobile ? <TableCell>CPF</TableCell> : null}
                        <TableCell>RA</TableCell>
                        {!isMobile ? <TableCell>Nível</TableCell> : null}
                        {!isMobile ? <TableCell>Status</TableCell> : null}
                        <TableCell align="right">Ação</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {resultadosPaginados.map((r) => {
                        const selecionado = alunoSelecionado?.id_aluno === r.id_aluno
                        const nomeNivel = r.matricula?.id_nivel_ensino != null ? mapaNivel.get(Number(r.matricula.id_nivel_ensino)) : null
                        const nomeStatus =
                          r.matricula?.id_status_matricula != null ? mapaStatus.get(Number(r.matricula.id_status_matricula)) : null

                        return (
                          <TableRow
                            key={r.id_aluno}
                            hover
                            sx={{
                              cursor: 'pointer',
                              backgroundColor: selecionado ? bgSelectedRow : undefined,
                            }}
                            onClick={() => void selecionarAluno(r)}
                          >
                            <TableCell>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Avatar src={r.foto_url ?? undefined} sx={{ width: 28, height: 28 }}>
                                  {r.nome?.[0]?.toUpperCase() ?? 'A'}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight={700} noWrap sx={{ maxWidth: 220 }}>
                                    {r.nome}
                                  </Typography>
                                  <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                                    {r.sasp_id ? (
                                      <Chip size="small" color="success" label={`SASP: ${formatarDataBR(r.sasp_data_entrevista)}`} />
                                    ) : (
                                      <Chip size="small" color="warning" label="Sem SASP" />
                                    )}
                                  </Stack>
                                </Box>
                              </Stack>
                            </TableCell>

                            {!isMobile ? <TableCell>{r.cpf ?? '-'}</TableCell> : null}
                            <TableCell>{r.matricula?.numero_inscricao ?? '-'}</TableCell>
                            {!isMobile ? <TableCell>{nomeNivel ?? '-'}</TableCell> : null}
                            {!isMobile ? <TableCell>{nomeStatus ?? '-'}</TableCell> : null}
                            <TableCell align="right">
                              <Button size="small" variant={selecionado ? 'contained' : 'outlined'} onClick={() => void selecionarAluno(r)}>
                                {selecionado ? 'Selecionado' : 'Abrir'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>

                  <TablePagination
                    component="div"
                    count={resultados.length}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                      setRowsPerPage(parseInt(e.target.value, 10))
                      setPage(0)
                    }}
                    rowsPerPageOptions={[5, 10, 20]}
                    labelRowsPerPage="Linhas"
                  />
                </>
              )}
            </TableContainer>
          </Box>
        </Box>

        {/* Coluna DIREITA: Formulário */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              minHeight: 420,
            }}
          >
            {!alunoSelecionado ? (
              <Box sx={{ p: 1 }}>
                <Typography variant="subtitle1" fontWeight={800}>
                  Selecione um aluno
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Use a busca ao lado para encontrar o aluno e abrir o formulário SASP.
                </Typography>
              </Box>
            ) : (
              <>
                {/* Cabeçalho do aluno */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                  <Avatar src={alunoSelecionado.foto_url ?? undefined} sx={{ width: 56, height: 56 }}>
                    {alunoSelecionado.nome?.[0]?.toUpperCase() ?? 'A'}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" fontWeight={900} noWrap>
                      {alunoSelecionado.nome}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                      <Chip size="small" label={`CPF: ${alunoSelecionado.cpf ?? '-'}`} />
                      <Chip size="small" label={`RA: ${alunoSelecionado.matricula?.numero_inscricao ?? '-'}`} />
                      {alunoSelecionado.matricula?.id_nivel_ensino != null ? (
                        <Chip size="small" label={`Nível: ${mapaNivel.get(Number(alunoSelecionado.matricula.id_nivel_ensino)) ?? '-'}`} />
                      ) : null}
                      {alunoSelecionado.matricula?.id_status_matricula != null ? (
                        <Chip size="small" label={`Status: ${mapaStatus.get(Number(alunoSelecionado.matricula.id_status_matricula)) ?? '-'}`} />
                      ) : null}
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {alunoSelecionado.email ? `E-mail: ${alunoSelecionado.email}` : ''}
                      {alunoSelecionado.email && alunoSelecionado.celular ? ' • ' : ''}
                      {alunoSelecionado.celular ? `Celular: ${alunoSelecionado.celular}` : ''}
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ my: 2 }} />

                {carregandoSasp ? (
                  <Box sx={{ py: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    {/* Seções */}
                    <Accordion defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <DescriptionIcon color="action" />
                          <Typography fontWeight={800}>Entrevista</Typography>
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={2}>
                          <TextField
                            label="Data da entrevista"
                            type="date"
                            value={form.data_entrevista}
                            onChange={(e) => setForm((p) => ({ ...p, data_entrevista: e.target.value }))}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                          />

                          <TextField
                            label="Escola de origem"
                            value={form.escola_origem}
                            onChange={(e) => setForm((p) => ({ ...p, escola_origem: e.target.value }))}
                            fullWidth
                          />

                          <TextField
                            label="Cidade da escola de origem"
                            value={form.cidade_escola_origem}
                            onChange={(e) => setForm((p) => ({ ...p, cidade_escola_origem: e.target.value }))}
                            fullWidth
                          />

                          <TextField
                            label="Como conheceu o CEJA"
                            value={form.como_conheceu_ceja}
                            onChange={(e) => setForm((p) => ({ ...p, como_conheceu_ceja: e.target.value }))}
                            fullWidth
                            multiline
                            minRows={2}
                          />

                          <TextField
                            label="Observações"
                            value={form.observacoes_sasp}
                            onChange={(e) => setForm((p) => ({ ...p, observacoes_sasp: e.target.value }))}
                            fullWidth
                            multiline
                            minRows={3}
                          />
                        </Stack>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <SchoolIcon color="action" />
                          <Typography fontWeight={800}>Histórico e Motivações</Typography>
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={2}>
                          <TextField
                            label="Motivo do retorno aos estudos"
                            value={form.motivo_retorno_estudos}
                            onChange={(e) => setForm((p) => ({ ...p, motivo_retorno_estudos: e.target.value }))}
                            fullWidth
                            multiline
                            minRows={2}
                          />

                          <TextField
                            label="Disciplinas indicadas para aproveitamento"
                            value={form.disciplinas_indicadas_aproveitamento}
                            onChange={(e) => setForm((p) => ({ ...p, disciplinas_indicadas_aproveitamento: e.target.value }))}
                            fullWidth
                            multiline
                            minRows={2}
                            placeholder="Ex.: Matemática, Português, ..."
                          />

                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <FormControlLabel
                              control={<Switch checked={form.repetiu_ano} onChange={(e) => setForm((p) => ({ ...p, repetiu_ano: e.target.checked }))} />}
                              label="Já repetiu ano?"
                            />
                            <FormControlLabel
                              control={<Switch checked={form.desistiu_estudar} onChange={(e) => setForm((p) => ({ ...p, desistiu_estudar: e.target.checked }))} />}
                              label="Já desistiu de estudar?"
                            />
                          </Stack>

                          {form.desistiu_estudar ? (
                            <>
                              <TextField
                                label="Motivos da desistência"
                                value={form.motivos_desistencia}
                                onChange={(e) => setForm((p) => ({ ...p, motivos_desistencia: e.target.value }))}
                                fullWidth
                                multiline
                                minRows={2}
                              />
                              <TextField
                                label="Escolas / séries em que desistiu"
                                value={form.escolas_desistiu}
                                onChange={(e) => setForm((p) => ({ ...p, escolas_desistiu: e.target.value }))}
                                fullWidth
                                multiline
                                minRows={2}
                              />
                            </>
                          ) : null}
                        </Stack>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <WorkIcon color="action" />
                          <Typography fontWeight={800}>Trabalho</Typography>
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={2}>
                          <FormControlLabel
                            control={<Switch checked={form.trabalha} onChange={(e) => setForm((p) => ({ ...p, trabalha: e.target.checked }))} />}
                            label="Trabalha atualmente?"
                          />

                          {form.trabalha ? (
                            <Stack spacing={2}>
                              <TextField
                                label="Local de trabalho"
                                value={form.local_trabalho}
                                onChange={(e) => setForm((p) => ({ ...p, local_trabalho: e.target.value }))}
                                fullWidth
                              />
                              <TextField
                                label="Função / cargo"
                                value={form.funcao_trabalho}
                                onChange={(e) => setForm((p) => ({ ...p, funcao_trabalho: e.target.value }))}
                                fullWidth
                              />
                            </Stack>
                          ) : null}
                        </Stack>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <PsychologyIcon color="action" />
                          <Typography fontWeight={800}>Dificuldades e Tecnologia</Typography>
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={2}>
                          <TextField
                            label="Matérias em que tem mais dificuldade"
                            value={form.materias_dificuldade}
                            onChange={(e) => setForm((p) => ({ ...p, materias_dificuldade: e.target.value }))}
                            fullWidth
                            multiline
                            minRows={2}
                          />
                          <TextField
                            label="Relação/uso de tecnologia"
                            value={form.relacao_tecnologia}
                            onChange={(e) => setForm((p) => ({ ...p, relacao_tecnologia: e.target.value }))}
                            fullWidth
                            multiline
                            minRows={2}
                            placeholder="Ex.: usa celular, WhatsApp, computador, internet..."
                          />
                        </Stack>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <FamilyRestroomIcon color="action" />
                          <Typography fontWeight={800}>Família e Rotina</Typography>
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={2}>
                          <TextField
                            label="Pessoas na residência"
                            value={form.pessoas_residencia}
                            onChange={(e) => setForm((p) => ({ ...p, pessoas_residencia: e.target.value }))}
                            type="number"
                            fullWidth
                            inputProps={{ min: 0 }}
                          />
                          <TextField
                            label="Com quem mora (parentes / composição)"
                            value={form.parentes_moradia}
                            onChange={(e) => setForm((p) => ({ ...p, parentes_moradia: e.target.value }))}
                            fullWidth
                            multiline
                            minRows={2}
                          />
                          <TextField
                            label="Quem é responsável pelos estudos"
                            value={form.responsavel_pelos_estudos}
                            onChange={(e) => setForm((p) => ({ ...p, responsavel_pelos_estudos: e.target.value }))}
                            fullWidth
                          />

                          <FormControlLabel
                            control={<Switch checked={form.tem_filhos} onChange={(e) => setForm((p) => ({ ...p, tem_filhos: e.target.checked }))} />}
                            label="Tem filhos?"
                          />
                          {form.tem_filhos ? (
                            <TextField
                              label="Quantos filhos"
                              value={form.quantos_filhos}
                              onChange={(e) => setForm((p) => ({ ...p, quantos_filhos: e.target.value }))}
                              type="number"
                              fullWidth
                              inputProps={{ min: 0 }}
                            />
                          ) : null}
                        </Stack>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <DescriptionIcon color="action" />
                          <Typography fontWeight={800}>Interesses</Typography>
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={2}>
                          <TextField
                            label="Curso superior desejado"
                            value={form.curso_superior_desejado}
                            onChange={(e) => setForm((p) => ({ ...p, curso_superior_desejado: e.target.value }))}
                            fullWidth
                          />
                          <TextField
                            label="Atividades culturais de interesse"
                            value={form.atividade_cultural_interesse}
                            onChange={(e) => setForm((p) => ({ ...p, atividade_cultural_interesse: e.target.value }))}
                            fullWidth
                            multiline
                            minRows={2}
                          />
                          <TextField
                            label="Esportes de interesse"
                            value={form.esporte_interesse}
                            onChange={(e) => setForm((p) => ({ ...p, esporte_interesse: e.target.value }))}
                            fullWidth
                          />
                        </Stack>
                      </AccordionDetails>
                    </Accordion>

                    <Divider sx={{ my: 2 }} />

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="flex-end">
                      <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        disabled={carregandoSasp || salvandoSasp}
                        onClick={() => alunoSelecionado && void carregarSaspDoAluno(alunoSelecionado.id_aluno)}
                      >
                        Recarregar
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={salvandoSasp ? <CircularProgress size={18} /> : <SaveIcon />}
                        disabled={carregandoSasp || salvandoSasp}
                        onClick={() => void salvarSasp()}
                        sx={{ fontWeight: 800 }}
                      >
                        Salvar SASP
                      </Button>
                    </Stack>
                  </>
                )}
              </>
            )}
          </Paper>
        </Box>
      </Stack>
    </Box>
  )
}
