import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'

import RefreshIcon from '@mui/icons-material/Refresh'
import ClearIcon from '@mui/icons-material/Clear'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'
import DescriptionIcon from '@mui/icons-material/Description'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'

import { useSupabase } from '../../contextos/SupabaseContext'
import { useNotificacaoContext } from '../../contextos/NotificacaoContext'
import AvatarAlunoFicha from '../painel-professor/ficha-acompanhamento/components/AvatarAlunoFicha'
import { first } from '../painel-professor/ficha-acompanhamento/utils'
import RelatoriosAnalyticsSection from './relatorios-fichas/AnalyticsSection'
import {
  carregarAnaliticoRelatoriosFichas,
  type AnaliticoRelatoriosFichas,
  type PeriodoAnaliticoDias,
} from './relatorios-fichas/analytics'

type UsuarioJoin = {
  id?: string | null
  name?: string | null
  email?: string | null
  foto_url?: string | null
  cpf?: string | null
}

type MatriculaJoin = {
  numero_inscricao?: string | null
}

type AlunoOpcao = {
  id_aluno: number
  nome: string
  email?: string | null
  foto_url?: string | null
  cpf?: string | null
  numero_inscricao?: string | null
}

type DisciplinaRow = {
  id_disciplina: number
  nome_disciplina: string
}

const SecretariaRelatoriosFichasPage: React.FC = () => {
  const theme = useTheme()
  const { supabase } = useSupabase()
  const { sucesso, erro } = useNotificacaoContext()

  const [alunoSelecionado, setAlunoSelecionado] = useState<AlunoOpcao | null>(null)
  const [buscaAluno, setBuscaAluno] = useState('')
  const [opcoesAluno, setOpcoesAluno] = useState<AlunoOpcao[]>([])
  const [buscandoAluno, setBuscandoAluno] = useState(false)

  const [disciplinas, setDisciplinas] = useState<DisciplinaRow[]>([])
  const [disciplinaId, setDisciplinaId] = useState<number | ''>('')
  const [carregandoDisciplinas, setCarregandoDisciplinas] = useState(false)
  const [gerandoPdf, setGerandoPdf] = useState(false)

  const [periodoDias, setPeriodoDias] = useState<PeriodoAnaliticoDias>(30)
  const [analitico, setAnalitico] = useState<AnaliticoRelatoriosFichas | null>(null)
  const [carregandoAnalitico, setCarregandoAnalitico] = useState(false)
  const [erroAnalitico, setErroAnalitico] = useState<string | null>(null)

  const debounceRef = useRef<number | null>(null)

  const disciplinaSelecionada = useMemo(
    () => disciplinas.find((item) => item.id_disciplina === Number(disciplinaId)) ?? null,
    [disciplinas, disciplinaId],
  )

  const limpar = () => {
    setAlunoSelecionado(null)
    setBuscaAluno('')
    setOpcoesAluno([])
    setDisciplinaId('')
  }

  const buscarAlunos = async (termo: string) => {
    if (!supabase) return

    const valor = termo.trim()
    if (valor.length < 2) {
      setOpcoesAluno([])
      return
    }

    const somenteDigitos = valor.replace(/\D/g, '')
    const buscaNumerica = somenteDigitos.length >= 2
    const cpfFormatado =
      somenteDigitos.length === 11
        ? somenteDigitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
        : null

    setBuscandoAluno(true)
    try {
      const mapa = new Map<number, AlunoOpcao>()
      const matriculaPorAluno = new Map<number, string | null>()
      const usuarioPorId = new Map<string, UsuarioJoin>()
      const alunoPorId = new Map<number, { id_aluno: number; user_id?: string | null }>()

      const adicionarOpcao = (payload: {
        id_aluno: number
        nome?: string | null
        email?: string | null
        foto_url?: string | null
        cpf?: string | null
        numero_inscricao?: string | null
      }) => {
        const idAluno = Number(payload.id_aluno ?? 0)
        if (!idAluno) return

        mapa.set(idAluno, {
          id_aluno: idAluno,
          nome: String(payload.nome ?? `Aluno ${idAluno}`),
          email: payload.email ?? null,
          foto_url: payload.foto_url ?? null,
          cpf: payload.cpf ?? null,
          numero_inscricao: payload.numero_inscricao ?? null,
        })
      }

      const adicionarOpcaoPorJoin = (item: any) => {
        const usuario = first(item?.usuarios) as UsuarioJoin | null
        const matricula = first(item?.matriculas) as MatriculaJoin | null
        const idAluno = Number(item?.id_aluno ?? 0)
        if (!idAluno) return

        adicionarOpcao({
          id_aluno: idAluno,
          nome: usuario?.name ?? null,
          email: usuario?.email ?? null,
          foto_url: usuario?.foto_url ?? null,
          cpf: usuario?.cpf ?? null,
          numero_inscricao: matricula?.numero_inscricao ?? null,
        })
      }

      const materializar = (alunoIds: number[]) => {
        alunoIds.forEach((idAluno) => {
          const aluno = alunoPorId.get(idAluno)
          if (!aluno) return

          const usuario = usuarioPorId.get(String(aluno.user_id ?? ''))
          adicionarOpcao({
            id_aluno: idAluno,
            nome: usuario?.name ?? null,
            email: usuario?.email ?? null,
            foto_url: usuario?.foto_url ?? null,
            cpf: usuario?.cpf ?? null,
            numero_inscricao: matriculaPorAluno.get(idAluno) ?? null,
          })
        })
      }

      const { data: alunosPorNome, error: erroNome } = await supabase
        .from('alunos')
        .select(
          `
          id_aluno,
          usuarios!inner(
            id,
            name,
            email,
            foto_url,
            cpf
          ),
          matriculas(
            numero_inscricao
          )
        `,
        )
        .ilike('usuarios.name', `%${valor}%`)
        .order('id_aluno', { ascending: false })
        .limit(25)

      if (erroNome) throw erroNome
      ;(alunosPorNome ?? []).forEach(adicionarOpcaoPorJoin)

      if (buscaNumerica) {
        let usuariosQuery = supabase
          .from('usuarios')
          .select('id, name, email, foto_url, cpf')
          .limit(25)

        if (cpfFormatado) {
          usuariosQuery = usuariosQuery.or(`cpf.ilike.%${somenteDigitos}%,cpf.ilike.%${cpfFormatado}%`)
        } else {
          usuariosQuery = usuariosQuery.ilike('cpf', `%${somenteDigitos}%`)
        }

        const { data: usuariosCpf, error: erroCpf } = await usuariosQuery
        if (erroCpf) throw erroCpf

        const userIdsCpf = ((usuariosCpf ?? []) as UsuarioJoin[])
          .map((u: any) => String(u?.id ?? ''))
          .filter(Boolean)

        ;(usuariosCpf ?? []).forEach((u: any) => {
          usuarioPorId.set(String(u.id), u as UsuarioJoin)
        })

        if (userIdsCpf.length > 0) {
          const { data: alunosCpf, error: erroAlunosCpf } = await supabase
            .from('alunos')
            .select('id_aluno, user_id')
            .in('user_id', userIdsCpf)
            .limit(25)

          if (erroAlunosCpf) throw erroAlunosCpf

          const alunoIdsCpf = ((alunosCpf ?? []) as any[])
            .map((a) => Number(a.id_aluno))
            .filter((n) => Number.isFinite(n) && n > 0)

          ;(alunosCpf ?? []).forEach((a: any) => {
            alunoPorId.set(Number(a.id_aluno), { id_aluno: Number(a.id_aluno), user_id: a.user_id ?? null })
          })

          if (alunoIdsCpf.length > 0) {
            const { data: matsCpf, error: erroMatsCpf } = await supabase
              .from('matriculas')
              .select('id_aluno, numero_inscricao')
              .in('id_aluno', alunoIdsCpf)
              .limit(100)

            if (erroMatsCpf) throw erroMatsCpf

            ;(matsCpf ?? []).forEach((m: any) => {
              const idAluno = Number(m?.id_aluno ?? 0)
              if (idAluno && !matriculaPorAluno.has(idAluno)) {
                matriculaPorAluno.set(idAluno, m?.numero_inscricao ?? null)
              }
            })

            materializar(alunoIdsCpf)
          }
        }

        const { data: matsEncontradas, error: erroMatricula } = await supabase
          .from('matriculas')
          .select('id_aluno, numero_inscricao')
          .ilike('numero_inscricao', `%${somenteDigitos}%`)
          .limit(50)

        if (erroMatricula) throw erroMatricula

        const alunoIdsMat = ((matsEncontradas ?? []) as any[])
          .map((m) => Number(m?.id_aluno ?? 0))
          .filter((n) => Number.isFinite(n) && n > 0)

        ;(matsEncontradas ?? []).forEach((m: any) => {
          const idAluno = Number(m?.id_aluno ?? 0)
          if (idAluno && !matriculaPorAluno.has(idAluno)) {
            matriculaPorAluno.set(idAluno, m?.numero_inscricao ?? null)
          }
        })

        if (alunoIdsMat.length > 0) {
          const { data: alunosMat, error: erroAlunosMat } = await supabase
            .from('alunos')
            .select('id_aluno, user_id')
            .in('id_aluno', alunoIdsMat)
            .limit(50)

          if (erroAlunosMat) throw erroAlunosMat

          ;(alunosMat ?? []).forEach((a: any) => {
            alunoPorId.set(Number(a.id_aluno), { id_aluno: Number(a.id_aluno), user_id: a.user_id ?? null })
          })

          const userIdsMat = Array.from(
            new Set(
              ((alunosMat ?? []) as any[])
                .map((a) => String(a?.user_id ?? ''))
                .filter(Boolean),
            ),
          )

          if (userIdsMat.length > 0) {
            const { data: usuariosMat, error: erroUsuariosMat } = await supabase
              .from('usuarios')
              .select('id, name, email, foto_url, cpf')
              .in('id', userIdsMat)
              .limit(50)

            if (erroUsuariosMat) throw erroUsuariosMat

            ;(usuariosMat ?? []).forEach((u: any) => {
              usuarioPorId.set(String(u.id), u as UsuarioJoin)
            })
          }

          materializar(alunoIdsMat)
        }
      }

      setOpcoesAluno(Array.from(mapa.values()).slice(0, 25))
    } catch (searchError) {
      console.error(searchError)
      setOpcoesAluno([])
    } finally {
      setBuscandoAluno(false)
    }
  }

  const carregarDisciplinas = useCallback(async () => {
    if (!supabase) return

    setCarregandoDisciplinas(true)
    try {
      const { data, error: queryError } = await supabase
        .from('disciplinas')
        .select('id_disciplina,nome_disciplina')
        .order('nome_disciplina', { ascending: true })
        .limit(400)

      if (queryError) throw queryError
      setDisciplinas((data ?? []) as DisciplinaRow[])
    } catch (loadError) {
      console.error(loadError)
      erro('Falha ao carregar disciplinas.', 'Relatórios e fichas')
      setDisciplinas([])
    } finally {
      setCarregandoDisciplinas(false)
    }
  }, [supabase, erro])

  const carregarAnalitico = useCallback(
    async (silencioso = false) => {
      if (!supabase) return

      setCarregandoAnalitico(true)
      if (!silencioso) setErroAnalitico(null)

      try {
        const dados = await carregarAnaliticoRelatoriosFichas(supabase as any, periodoDias)
        setAnalitico(dados)
        setErroAnalitico(null)
      } catch (loadError: any) {
        console.error(loadError)
        const mensagem = loadError?.message || 'Falha ao montar o painel gerencial.'
        setErroAnalitico(mensagem)
        if (!silencioso) {
          erro(mensagem, 'Painel gerencial')
        }
      } finally {
        setCarregandoAnalitico(false)
      }
    },
    [supabase, periodoDias, erro],
  )

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      void buscarAlunos(buscaAluno)
    }, 350)

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscaAluno])

  useEffect(() => {
    if (!supabase) return
    void carregarDisciplinas()
  }, [supabase, carregarDisciplinas])

  useEffect(() => {
    if (!supabase) return
    void carregarAnalitico(true)

    const timer = window.setInterval(() => {
      void carregarAnalitico(true)
    }, 60000)

    return () => {
      window.clearInterval(timer)
    }
  }, [supabase, carregarAnalitico])

  const handleGerarPdf = async () => {
    if (!supabase) {
      erro('Supabase não configurado.', 'Relatórios e fichas')
      return
    }

    if (!alunoSelecionado) {
      erro('Selecione um aluno.', 'Relatórios e fichas')
      return
    }

    if (!disciplinaId) {
      erro('Selecione uma disciplina.', 'Relatórios e fichas')
      return
    }

    setGerandoPdf(true)
    try {
      const { gerarFichaAcompanhamentoCompartilhada } = await import('./relatorios-fichas/gerarFichaAcompanhamentoCompartilhada')
      const resultado = await gerarFichaAcompanhamentoCompartilhada({
        supabase,
        alunoId: alunoSelecionado.id_aluno,
        disciplinaId: Number(disciplinaId),
        disciplinaNomeFallback: disciplinaSelecionada?.nome_disciplina,
      })

      sucesso(
        `PDF gerado para ${resultado.alunoNome} • ${resultado.disciplinaNome}.`,
        'Ficha de acompanhamento',
      )
    } catch (generationError: any) {
      console.error(generationError)
      erro(
        generationError?.message || 'Falha ao gerar a ficha completa do aluno.',
        'Relatórios e fichas',
      )
    } finally {
      setGerandoPdf(false)
    }
  }

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={900}>
          Relatórios e Fichas
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gere a ficha completa do aluno e acompanhe o painel visual da escola com indicadores para Direção, Coordenação e Secretaria.
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2.5,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.default,
          mb: 2,
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
          <Chip
            icon={<DescriptionIcon sx={{ fontSize: 16 }} />}
            label="Ficha completa: foto, grade, histórico e observações"
            size="small"
            sx={{ fontWeight: 800 }}
          />
          <Chip
            icon={<DashboardRoundedIcon sx={{ fontSize: 16 }} />}
            label="Painel da direção: professor, sala, disciplina, volume e atendimentos ao vivo"
            size="small"
            sx={{ fontWeight: 800 }}
          />

          <Box sx={{ flex: 1 }} />

          <Tooltip title="Limpar seleção da ficha">
            <span>
              <IconButton onClick={limpar} disabled={!alunoSelecionado && !disciplinaId}>
                <ClearIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Recarregar disciplinas e painel">
            <span>
              <IconButton
                onClick={() => {
                  void carregarDisciplinas()
                  void carregarAnalitico(false)
                }}
                disabled={!supabase || carregandoDisciplinas || gerandoPdf || carregandoAnalitico}
              >
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 2.25,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Stack direction="row" spacing={2} alignItems="flex-start" mb={1.5}>
          <Box
            sx={{
              width: 46,
              height: 46,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 2.5,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              flexShrink: 0,
            }}
          >
            <AssignmentIndIcon />
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={900} sx={{ lineHeight: 1.15 }}>
              Ficha completa do aluno
            </Typography>
            <Typography variant="body2" color="text.secondary">
              A geração identifica automaticamente a matrícula mais relevante e monta o mesmo PDF completo usado em atendimentos.
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={gerandoPdf ? <CircularProgress size={18} color="inherit" /> : <PictureAsPdfIcon />}
            onClick={() => void handleGerarPdf()}
            disabled={!supabase || gerandoPdf || !alunoSelecionado || !disciplinaId}
            sx={{ textTransform: 'none', fontWeight: 900, minWidth: 148 }}
          >
            {gerandoPdf ? 'Gerando...' : 'Gerar PDF'}
          </Button>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
          <Autocomplete
            fullWidth
            options={opcoesAluno}
            loading={buscandoAluno}
            value={alunoSelecionado}
            onChange={(_event, novoValor) => setAlunoSelecionado(novoValor)}
            inputValue={buscaAluno}
            onInputChange={(_event, valor) => setBuscaAluno(valor)}
            getOptionLabel={(opcao) => {
              const extras = [
                opcao.numero_inscricao ? `RA ${opcao.numero_inscricao}` : null,
                opcao.cpf ? `CPF ${opcao.cpf}` : null,
              ].filter(Boolean)
              return extras.length > 0 ? `${opcao.nome} • ${extras.join(' • ')}` : `${opcao.nome} (ID: ${opcao.id_aluno})`
            }}
            isOptionEqualToValue={(opcao, valor) => opcao.id_aluno === valor.id_aluno}
            noOptionsText={
              buscaAluno.trim().length < 2 ? 'Digite pelo menos 2 caracteres...' : 'Nenhum aluno encontrado'
            }
            filterOptions={(x) => x}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label="Aluno"
                placeholder="Ex.: Maria, 123456 ou 000.000.000-00"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {buscandoAluno ? <CircularProgress size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          <FormControl size="small" sx={{ minWidth: 320 }}>
            <InputLabel>Disciplina</InputLabel>
            <Select
              label="Disciplina"
              value={disciplinaId}
              onChange={(event) => setDisciplinaId(Number(event.target.value))}
              disabled={!supabase || carregandoDisciplinas || gerandoPdf}
            >
              {disciplinas.map((disciplina) => (
                <MenuItem key={disciplina.id_disciplina} value={disciplina.id_disciplina}>
                  {disciplina.nome_disciplina}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {alunoSelecionado ? (
          <Paper
            elevation={0}
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 2.5,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: alpha(theme.palette.primary.main, 0.02),
            }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
              <AvatarAlunoFicha
                supabase={supabase as any}
                idAluno={alunoSelecionado.id_aluno}
                fotoUrl={alunoSelecionado.foto_url ?? null}
                nome={alunoSelecionado.nome}
                variant="rounded"
                sx={{ width: 72, height: 72, flexShrink: 0 }}
              />

              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="h6" fontWeight={900} sx={{ lineHeight: 1.15 }}>
                  {alunoSelecionado.nome}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ID do aluno: {alunoSelecionado.id_aluno}
                  {alunoSelecionado.numero_inscricao ? ` • RA ${alunoSelecionado.numero_inscricao}` : ''}
                  {alunoSelecionado.cpf ? ` • CPF ${alunoSelecionado.cpf}` : ''}
                </Typography>
                {alunoSelecionado.email ? (
                  <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                    {alunoSelecionado.email}
                  </Typography>
                ) : null}
              </Box>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip label="Ano letivo automático" size="small" color="primary" />
                <Chip
                  label={disciplinaSelecionada?.nome_disciplina || 'Selecione a disciplina'}
                  color={disciplinaSelecionada ? 'primary' : 'default'}
                  size="small"
                />
              </Stack>
            </Stack>
          </Paper>
        ) : null}

        <Alert severity="info" sx={{ mt: 2 }}>
          O PDF gerado aqui segue o mesmo padrão visual e o mesmo conteúdo da ficha emitida no módulo de atendimentos.
        </Alert>
      </Paper>

      <RelatoriosAnalyticsSection
        data={analitico}
        loading={carregandoAnalitico}
        error={erroAnalitico}
        periodoDias={periodoDias}
        onPeriodoDiasChange={setPeriodoDias}
        onRefresh={() => {
          void carregarAnalitico(false)
        }}
      />
    </Box>
  )
}

export default SecretariaRelatoriosFichasPage
