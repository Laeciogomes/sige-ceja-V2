import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PendingActionsIcon from '@mui/icons-material/PendingActions'
import QueryStatsIcon from '@mui/icons-material/QueryStats'
import ScheduleIcon from '@mui/icons-material/Schedule'

import { useAuth } from '../../contextos/AuthContext'
import { useSupabase } from '../../contextos/SupabaseContext'
import AvatarAlunoPainel from './components/AvatarAlunoPainel'
import AlunoSeletorAdmin from './components/AlunoSeletorAdmin'
import {
  calcularPercentualProgresso,
  carregarMatriculasAluno,
  carregarPerfilAlunoPorId,
  carregarPerfilAlunoPorUserId,
  carregarProgressosAluno,
  carregarSessoesAluno,
  corPorStatus,
  formatarDataBR,
  formatarDataHoraBR,
  formatarNota,
  formatarTempoDecorrido,
  isStatusDisciplinaAberta,
  nomeNivelEnsinoLongo,
  type AlunoBuscaOption,
  type AlunoPerfil,
  type MatriculaResumo,
  type ProgressoResumo,
  type SessaoAlunoResumo,
} from './utils'

function MetricCard(props: { label: string; value: string; hint?: string }) {
  const { label, value, hint } = props
  return (
    <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 3, height: '100%' }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h4" fontWeight={900} sx={{ mt: 0.5 }}>
        {value}
      </Typography>
      {hint ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          {hint}
        </Typography>
      ) : null}
    </Paper>
  )
}

function agruparPorMatricula(progressos: ProgressoResumo[], matriculas: MatriculaResumo[]) {
  const mapa = new Map<number, { matricula: MatriculaResumo | null; itens: ProgressoResumo[] }>()
  for (const progresso of progressos) {
    const atual = mapa.get(progresso.id_matricula) ?? {
      matricula: matriculas.find(item => item.id_matricula === progresso.id_matricula) ?? null,
      itens: [],
    }
    atual.itens.push(progresso)
    mapa.set(progresso.id_matricula, atual)
  }
  return [...mapa.values()].sort((a, b) => (b.matricula?.id_matricula ?? 0) - (a.matricula?.id_matricula ?? 0))
}

export default function AlunoProgressoPage() {
  const { usuario } = useAuth()
  const { supabase } = useSupabase()
  const [searchParams, setSearchParams] = useSearchParams()

  const modoGestor = usuario?.papel === 'ADMIN'
  const alunoIdSelecionado = Number(searchParams.get('aluno') ?? '') || null

  const [selecionado, setSelecionado] = useState<AlunoBuscaOption | null>(null)
  const [perfil, setPerfil] = useState<AlunoPerfil | null>(null)
  const [matriculas, setMatriculas] = useState<MatriculaResumo[]>([])
  const [progressos, setProgressos] = useState<ProgressoResumo[]>([])
  const [sessoes, setSessoes] = useState<SessaoAlunoResumo[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregarDados = useCallback(async () => {
    if (!supabase || !usuario) {
      setPerfil(null)
      setMatriculas([])
      setProgressos([])
      setSessoes([])
      setLoading(false)
      return
    }

    setLoading(true)
    setErro(null)

    try {
      let perfilAtual: AlunoPerfil | null = null
      if (modoGestor) {
        if (!alunoIdSelecionado) {
          setPerfil(null)
          setMatriculas([])
          setProgressos([])
          setSessoes([])
          setLoading(false)
          return
        }
        perfilAtual = await carregarPerfilAlunoPorId(supabase, alunoIdSelecionado)
      } else {
        perfilAtual = await carregarPerfilAlunoPorUserId(supabase, usuario.id)
      }

      if (!perfilAtual) {
        setPerfil(null)
        setMatriculas([])
        setProgressos([])
        setSessoes([])
        setErro(
          modoGestor
            ? 'Aluno não encontrado para a consulta informada.'
            : 'Seu usuário não possui vínculo com a tabela de alunos.',
        )
        setLoading(false)
        return
      }

      const matriculasAtual = await carregarMatriculasAluno(supabase, perfilAtual.id_aluno)
      const [progressosAtual, sessoesAtual] = await Promise.all([
        carregarProgressosAluno(supabase, matriculasAtual),
        carregarSessoesAluno(supabase, perfilAtual.id_aluno, 18),
      ])

      setPerfil(perfilAtual)
      setMatriculas(matriculasAtual)
      setProgressos(progressosAtual)
      setSessoes(sessoesAtual)
      setSelecionado(prev =>
        prev && prev.id_aluno === perfilAtual?.id_aluno
          ? prev
          : {
              id_aluno: perfilAtual.id_aluno,
              nome: perfilAtual.usuario.name,
              email: perfilAtual.usuario.email ?? null,
              foto_url: perfilAtual.usuario.foto_url ?? null,
              id_matricula: matriculasAtual[0]?.id_matricula ?? null,
              numero_inscricao: matriculasAtual[0]?.numero_inscricao ?? null,
              ano_letivo: matriculasAtual[0]?.ano_letivo ?? null,
              data_matricula: matriculasAtual[0]?.data_matricula ?? null,
              id_nivel_ensino: matriculasAtual[0]?.id_nivel_ensino ?? null,
            },
      )
    } catch (error) {
      console.error('[AlunoProgressoPage] erro ao carregar progresso do aluno', error)
      setErro('Não foi possível carregar o progresso do aluno.')
      setPerfil(null)
      setMatriculas([])
      setProgressos([])
      setSessoes([])
    } finally {
      setLoading(false)
    }
  }, [alunoIdSelecionado, modoGestor, supabase, usuario])

  useEffect(() => {
    void carregarDados()
  }, [carregarDados])

  const handleSelecionarAluno = useCallback(
    (value: AlunoBuscaOption | null) => {
      setSelecionado(value)
      const next = new URLSearchParams(searchParams)
      if (value?.id_aluno) {
        next.set('aluno', String(value.id_aluno))
      } else {
        next.delete('aluno')
      }
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const disciplinasAbertas = useMemo(
    () => progressos.filter(item => isStatusDisciplinaAberta(item.status_nome)),
    [progressos],
  )

  const disciplinasConcluidas = useMemo(
    () => progressos.filter(item => !isStatusDisciplinaAberta(item.status_nome)),
    [progressos],
  )

  const mediaFinal = useMemo(() => {
    const notas = progressos
      .map(item => item.nota_final)
      .filter((item): item is number => item != null && !Number.isNaN(item))
    if (!notas.length) return null
    return notas.reduce((acc, item) => acc + item, 0) / notas.length
  }, [progressos])

  const abertasAgora = useMemo(
    () => sessoes.filter(item => !item.hora_saida),
    [sessoes],
  )

  const agrupado = useMemo(
    () => agruparPorMatricula(progressos, matriculas),
    [matriculas, progressos],
  )

  const percentualConcluido = useMemo(
    () => calcularPercentualProgresso(disciplinasConcluidas.length, progressos.length),
    [disciplinasConcluidas.length, progressos.length],
  )

  const urlMatriculas = useMemo(() => {
    if (modoGestor && perfil?.id_aluno) return `/alunos/matriculas?aluno=${perfil.id_aluno}`
    return '/alunos/matriculas'
  }, [modoGestor, perfil?.id_aluno])

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h3" fontWeight={900}>
          Meu progresso
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          Acompanhe disciplinas em curso, resultados finais e atendimentos recentes.
        </Typography>
      </Box>

      {modoGestor ? (
        <AlunoSeletorAdmin supabase={supabase} valor={selecionado} onChange={handleSelecionarAluno} />
      ) : null}

      {loading ? (
        <Paper variant="outlined" sx={{ p: 5, borderRadius: 3 }}>
          <Stack spacing={2} alignItems="center" justifyContent="center">
            <CircularProgress />
            <Typography color="text.secondary">Carregando progresso acadêmico...</Typography>
          </Stack>
        </Paper>
      ) : null}

      {!loading && erro ? <Alert severity="warning">{erro}</Alert> : null}

      {!loading && !erro && !perfil ? (
        <Alert severity="info">
          {modoGestor
            ? 'Selecione um aluno para abrir a visão de progresso.'
            : 'Nenhuma informação de progresso foi localizada para o seu usuário.'}
        </Alert>
      ) : null}

      {!loading && perfil ? (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', xl: '1.1fr 1fr' },
              gap: 2,
            }}
          >
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                <AvatarAlunoPainel
                  supabase={supabase}
                  idAluno={perfil.id_aluno}
                  nome={perfil.usuario.name}
                  fotoUrl={perfil.usuario.foto_url}
                  sx={{ width: 92, height: 92, fontSize: 30, fontWeight: 800 }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1.05 }}>
                    {perfil.usuario.name}
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.25 }}>
                    <Chip size="small" label={`RA ${matriculas[0]?.numero_inscricao ?? '-'}`} />
                    <Chip size="small" color="primary" label={matriculas[0]?.nivel_nome ?? nomeNivelEnsinoLongo(matriculas[0]?.id_nivel_ensino ?? null)} />
                    <Chip size="small" color="success" label={`${percentualConcluido}% concluído`} />
                    {abertasAgora.length ? <Chip size="small" color="warning" label={`${abertasAgora.length} atendimento(s) aberto(s)`} /> : null}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25 }}>
                    {perfil.usuario.email || 'E-mail não informado'}
                    {perfil.usuario.municipio ? ` • ${perfil.usuario.municipio}` : ''}
                    {perfil.usuario.celular ? ` • ${perfil.usuario.celular}` : ''}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                gap: 2,
              }}
            >
              <MetricCard
                label="Disciplinas em curso"
                value={String(disciplinasAbertas.length)}
                hint="Componentes curriculares ainda em andamento."
              />
              <MetricCard
                label="Disciplinas concluídas"
                value={String(disciplinasConcluidas.length)}
                hint="Disciplinas finalizadas com resultado registrado."
              />
              <MetricCard
                label="Média final"
                value={formatarNota(mediaFinal)}
                hint="Média calculada apenas com notas lançadas."
              />
              <MetricCard
                label="Atendimentos recentes"
                value={String(sessoes.length)}
                hint={abertasAgora.length ? `${abertasAgora.length} ainda estão em aberto.` : 'Nenhuma sessão aberta no momento.'}
              />
            </Box>
          </Box>

          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1.5}
              alignItems={{ xs: 'flex-start', md: 'center' }}
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="h5" fontWeight={900}>
                  Visão consolidada do percurso
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Acompanhe o avanço geral do aluno no conjunto das matrículas.
                </Typography>
              </Box>

              <Button component={RouterLink} to={urlMatriculas} variant="outlined" startIcon={<ArrowBackIcon />}>
                Ver matrículas
              </Button>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' },
                gap: 2,
                mb: 2,
              }}
            >
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                  <QueryStatsIcon fontSize="small" color="action" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Progresso global
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight={900}>{percentualConcluido}%</Typography>
                <LinearProgress variant="determinate" value={percentualConcluido} sx={{ mt: 1.5, height: 9, borderRadius: 99 }} />
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                  <PendingActionsIcon fontSize="small" color="action" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Protocolos concluídos
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight={900}>
                  {progressos.reduce((acc, item) => acc + item.protocolos_concluidos, 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  de {progressos.reduce((acc, item) => acc + item.protocolos_total, 0)} previstos
                </Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                  <CheckCircleIcon fontSize="small" color="action" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Avaliações com nota
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight={900}>
                  {progressos.reduce((acc, item) => acc + item.protocolos_avaliados, 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Protocolos já avaliados no sistema.
                </Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                  <ScheduleIcon fontSize="small" color="action" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Último atendimento
                  </Typography>
                </Stack>
                <Typography variant="h6" fontWeight={900}>
                  {formatarDataHoraBR(sessoes[0]?.hora_entrada ?? null)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {sessoes[0]?.disciplina_nome ?? 'Sem registros recentes'}
                </Typography>
              </Paper>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="h5" fontWeight={900}>
              Disciplinas por matrícula
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              As disciplinas abaixo refletem exatamente o que está salvo no banco atual.
            </Typography>

            <Stack spacing={2}>
              {agrupado.length ? (
                agrupado.map(bloco => {
                  const concluidas = bloco.itens.filter(item => !isStatusDisciplinaAberta(item.status_nome)).length
                  const percentual = calcularPercentualProgresso(concluidas, bloco.itens.length)
                  return (
                    <Paper key={`matricula-${bloco.matricula?.id_matricula ?? 'sem'}`} variant="outlined" sx={{ p: 2.25, borderRadius: 3 }}>
                      <Stack spacing={1.5}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
                          <Box>
                            <Typography variant="h6" fontWeight={900}>
                              RA {bloco.matricula?.numero_inscricao ?? '-'} • {bloco.matricula?.nivel_nome ?? nomeNivelEnsinoLongo(bloco.matricula?.id_nivel_ensino ?? null)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
                              {bloco.matricula?.turma_nome ?? 'Sem turma'} • {bloco.matricula?.status_nome ?? 'Sem status'} • Ano letivo {bloco.matricula?.ano_letivo ?? '-'}
                            </Typography>
                          </Box>
                          <Chip color="primary" label={`${percentual}% concluído`} />
                        </Stack>

                        <LinearProgress variant="determinate" value={percentual} sx={{ height: 9, borderRadius: 99 }} />

                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
                            gap: 1.5,
                          }}
                        >
                          {bloco.itens.map(item => (
                            <Paper key={item.id_progresso} variant="outlined" sx={{ p: 1.75, borderRadius: 3 }}>
                              <Stack spacing={1}>
                                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                                  <AutoStoriesIcon fontSize="small" color="action" />
                                  <Typography fontWeight={800}>{item.disciplina_nome ?? 'Disciplina não identificada'}</Typography>
                                  <Chip size="small" color={corPorStatus(item.status_nome)} label={item.status_nome ?? 'Sem status'} />
                                </Stack>
                                <Typography variant="body2" color="text.secondary">
                                  Série/ano: {item.ano_nome ?? '-'} • Nota final: {formatarNota(item.nota_final)}
                                  {item.data_conclusao ? ` • Conclusão: ${formatarDataBR(item.data_conclusao)}` : ''}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Protocolos: {item.protocolos_concluidos}/{item.protocolos_total} concluídos • {item.protocolos_avaliados} avaliados
                                </Typography>
                                {item.observacoes?.trim() ? (
                                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    Observações: {item.observacoes}
                                  </Typography>
                                ) : null}
                              </Stack>
                            </Paper>
                          ))}
                        </Box>
                      </Stack>
                    </Paper>
                  )
                })
              ) : (
                <Alert severity="info">Ainda não há disciplinas registradas para este aluno.</Alert>
              )}
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="h5" fontWeight={900}>
              Atendimentos recentes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              Histórico mais recente de atendimento por sala, disciplina e professor.
            </Typography>

            <Stack spacing={1.5}>
              {sessoes.length ? (
                sessoes.map(sessao => (
                  <Paper key={sessao.id_sessao} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
                      <Box>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                          <Typography fontWeight={800}>{sessao.disciplina_nome ?? 'Atendimento sem disciplina vinculada'}</Typography>
                          <Chip size="small" color={sessao.hora_saida ? 'success' : 'warning'} label={sessao.hora_saida ? 'Encerrado' : 'Aberto'} />
                          {sessao.sala_nome ? <Chip size="small" label={sessao.sala_nome} /> : null}
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                          Professor: {sessao.professor_nome ?? '-'} • Entrada: {formatarDataHoraBR(sessao.hora_entrada)}
                          {sessao.hora_saida ? ` • Saída: ${formatarDataHoraBR(sessao.hora_saida)}` : ` • Em aberto há ${formatarTempoDecorrido(sessao.hora_entrada)}`}
                        </Typography>
                        {sessao.resumo_atividades?.trim() ? (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Resumo: {sessao.resumo_atividades}
                          </Typography>
                        ) : null}
                      </Box>
                    </Stack>
                  </Paper>
                ))
              ) : (
                <Alert severity="info">Nenhum atendimento foi localizado para este aluno.</Alert>
              )}
            </Stack>
          </Paper>
        </>
      ) : null}
    </Stack>
  )
}
