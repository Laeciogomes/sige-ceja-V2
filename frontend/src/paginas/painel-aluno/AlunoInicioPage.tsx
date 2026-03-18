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
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PendingActionsIcon from '@mui/icons-material/PendingActions'
import QueryStatsIcon from '@mui/icons-material/QueryStats'
import SchoolIcon from '@mui/icons-material/School'
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
  isStatusMatriculaAtiva,
  nomeNivelEnsinoLongo,
  type AlunoBuscaOption,
  type AlunoPerfil,
  type MatriculaResumo,
  type ProgressoResumo,
  type SessaoAlunoResumo,
} from './utils'

function MetricCard(props: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  const { icon, label, value, hint } = props
  return (
    <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 3, height: '100%' }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
        {icon}
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Stack>
      <Typography variant="h4" fontWeight={900}>
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

export default function AlunoInicioPage() {
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
        carregarSessoesAluno(supabase, perfilAtual.id_aluno, 8),
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
      console.error('[AlunoInicioPage] erro ao carregar área do aluno', error)
      setErro('Não foi possível carregar a área do aluno.')
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

  const matriculasAtivas = useMemo(
    () => matriculas.filter(item => isStatusMatriculaAtiva(item.status_nome)),
    [matriculas],
  )

  const matriculaPrincipal = useMemo(
    () => matriculasAtivas[0] ?? matriculas[0] ?? null,
    [matriculas, matriculasAtivas],
  )

  const disciplinasAbertas = useMemo(
    () => progressos.filter(item => isStatusDisciplinaAberta(item.status_nome)),
    [progressos],
  )

  const disciplinasConcluidas = useMemo(
    () => progressos.filter(item => !isStatusDisciplinaAberta(item.status_nome)),
    [progressos],
  )

  const percentualConcluido = useMemo(
    () => calcularPercentualProgresso(disciplinasConcluidas.length, progressos.length),
    [disciplinasConcluidas.length, progressos.length],
  )

  const mediaFinal = useMemo(() => {
    const notas = progressos
      .map(item => item.nota_final)
      .filter((item): item is number => item != null && !Number.isNaN(item))
    if (!notas.length) return null
    return notas.reduce((acc, item) => acc + item, 0) / notas.length
  }, [progressos])

  const protocolosPendentes = useMemo(
    () => progressos.reduce((acc, item) => acc + Math.max(0, item.protocolos_total - item.protocolos_concluidos), 0),
    [progressos],
  )

  const ultimaSessao = sessoes[0] ?? null

  const urlMatriculas = useMemo(() => {
    if (modoGestor && perfil?.id_aluno) return `/alunos/matriculas?aluno=${perfil.id_aluno}`
    return '/alunos/matriculas'
  }, [modoGestor, perfil?.id_aluno])

  const urlProgresso = useMemo(() => {
    if (modoGestor && perfil?.id_aluno) return `/alunos/progresso?aluno=${perfil.id_aluno}`
    return '/alunos/progresso'
  }, [modoGestor, perfil?.id_aluno])

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h3" fontWeight={900}>
          Minha área
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          Painel somente de leitura com matrícula, disciplinas em aberto, notas lançadas e o que ainda falta concluir.
        </Typography>
      </Box>

      {modoGestor ? (
        <AlunoSeletorAdmin supabase={supabase} valor={selecionado} onChange={handleSelecionarAluno} />
      ) : null}

      {loading ? (
        <Paper variant="outlined" sx={{ p: 5, borderRadius: 3 }}>
          <Stack spacing={2} alignItems="center" justifyContent="center">
            <CircularProgress />
            <Typography color="text.secondary">Carregando área do aluno...</Typography>
          </Stack>
        </Paper>
      ) : null}

      {!loading && erro ? <Alert severity="warning">{erro}</Alert> : null}

      {!loading && !erro && !perfil ? (
        <Alert severity="info">
          {modoGestor
            ? 'Selecione um aluno para abrir a visão individual.'
            : 'Nenhuma informação acadêmica foi localizada para este usuário.'}
        </Alert>
      ) : null}

      {!loading && perfil ? (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', xl: '1.15fr 1fr' },
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
                  sx={{ width: 96, height: 96, fontSize: 30, fontWeight: 800 }}
                />

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1.05 }}>
                    {perfil.usuario.name}
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.25 }}>
                    <Chip size="small" label={`RA ${matriculaPrincipal?.numero_inscricao ?? '-'}`} />
                    <Chip
                      size="small"
                      color="primary"
                      label={
                        matriculaPrincipal?.nivel_nome ??
                        nomeNivelEnsinoLongo(matriculaPrincipal?.id_nivel_ensino ?? null)
                      }
                    />
                    <Chip size="small" color="success" label={`${percentualConcluido}% concluído`} />
                    {matriculaPrincipal?.status_nome ? (
                      <Chip size="small" color={corPorStatus(matriculaPrincipal.status_nome)} label={matriculaPrincipal.status_nome} />
                    ) : null}
                  </Stack>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25 }}>
                    {perfil.usuario.email || 'E-mail não informado'}
                    {perfil.usuario.celular ? ` • ${perfil.usuario.celular}` : ''}
                    {perfil.usuario.municipio ? ` • ${perfil.usuario.municipio}` : ''}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {matriculasAtivas.length
                      ? `${matriculasAtivas.length} matrícula(s) ativa(s) no momento.`
                      : 'Nenhuma matrícula ativa encontrada.'}
                    {matriculaPrincipal?.turma_nome ? ` Turma atual: ${matriculaPrincipal.turma_nome}.` : ''}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
              <Stack spacing={1.25}>
                <Typography variant="h6" fontWeight={900}>
                  O que falta para concluir
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  O sistema considera como pendentes as disciplinas ainda abertas e os protocolos não concluídos.
                </Typography>

                <Box sx={{ mt: 0.5 }}>
                  <LinearProgress variant="determinate" value={percentualConcluido} sx={{ height: 10, borderRadius: 999 }} />
                </Box>

                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  <Chip color="warning" label={`${disciplinasAbertas.length} disciplina(s) em aberto`} />
                  <Chip color="info" label={`${protocolosPendentes} protocolo(s) pendente(s)`} />
                  <Chip color="success" label={`${disciplinasConcluidas.length} disciplina(s) concluída(s)`} />
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ pt: 0.5 }}>
                  <Button component={RouterLink} to={urlProgresso} variant="contained">
                    Ver progresso completo
                  </Button>
                  <Button component={RouterLink} to={urlMatriculas} variant="outlined">
                    Ver matrículas
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' },
              gap: 2,
            }}
          >
            <MetricCard
              icon={<SchoolIcon fontSize="small" color="action" />}
              label="Matrículas ativas"
              value={String(matriculasAtivas.length)}
              hint="Vínculos escolares atualmente em andamento."
            />
            <MetricCard
              icon={<PendingActionsIcon fontSize="small" color="action" />}
              label="Disciplinas a cursar"
              value={String(disciplinasAbertas.length)}
              hint="Componentes curriculares ainda não finalizados."
            />
            <MetricCard
              icon={<CheckCircleIcon fontSize="small" color="action" />}
              label="Disciplinas concluídas"
              value={String(disciplinasConcluidas.length)}
              hint="Disciplinas já encerradas com status final."
            />
            <MetricCard
              icon={<QueryStatsIcon fontSize="small" color="action" />}
              label="Média geral"
              value={formatarNota(mediaFinal)}
              hint="Cálculo feito apenas com notas que já existem no banco."
            />
          </Box>

          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
              <Box>
                <Typography variant="h5" fontWeight={900}>
                  Disciplinas que ainda faltam
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Relação das disciplinas em aberto, com status, série/ano e andamento dos protocolos.
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stack spacing={1.5}>
              {disciplinasAbertas.length ? (
                disciplinasAbertas.map(item => {
                  const percentual = calcularPercentualProgresso(item.protocolos_concluidos, item.protocolos_total)
                  return (
                    <Paper key={item.id_progresso} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                      <Stack spacing={1.1}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
                          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                            <AutoStoriesIcon fontSize="small" color="action" />
                            <Typography fontWeight={800}>{item.disciplina_nome ?? 'Disciplina não identificada'}</Typography>
                            <Chip size="small" color={corPorStatus(item.status_nome)} label={item.status_nome ?? 'Sem status'} />
                          </Stack>
                          <Chip size="small" color="primary" label={`${percentual}% dos protocolos`} />
                        </Stack>

                        <Typography variant="body2" color="text.secondary">
                          Série/ano: {item.ano_nome ?? '-'} • Matrícula RA {item.numero_inscricao ?? '-'} • Nota atual: {formatarNota(item.nota_final)}
                        </Typography>

                        <LinearProgress variant="determinate" value={percentual} sx={{ height: 8, borderRadius: 999 }} />

                        <Typography variant="body2" color="text.secondary">
                          Protocolos concluídos: {item.protocolos_concluidos}/{item.protocolos_total}
                          {item.protocolos_avaliados ? ` • ${item.protocolos_avaliados} avaliados` : ''}
                        </Typography>

                        {item.observacoes?.trim() ? (
                          <Typography variant="body2" color="text.secondary">
                            Observações: {item.observacoes}
                          </Typography>
                        ) : null}
                      </Stack>
                    </Paper>
                  )
                })
              ) : (
                <Alert severity="success">Nenhuma disciplina pendente foi localizada para este aluno.</Alert>
              )}
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="h5" fontWeight={900}>
              Notas e resultados já lançados
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              Disciplinas já concluídas ou com resultado final registrado no sistema.
            </Typography>

            <Stack spacing={1.5}>
              {disciplinasConcluidas.length ? (
                disciplinasConcluidas.map(item => (
                  <Paper key={item.id_progresso} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
                      <Box>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                          <Typography fontWeight={800}>{item.disciplina_nome ?? 'Disciplina não identificada'}</Typography>
                          <Chip size="small" color={corPorStatus(item.status_nome)} label={item.status_nome ?? 'Sem status'} />
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                          Série/ano: {item.ano_nome ?? '-'} • RA {item.numero_inscricao ?? '-'}
                          {item.data_conclusao ? ` • Conclusão: ${formatarDataBR(item.data_conclusao)}` : ''}
                        </Typography>
                      </Box>

                      <Chip color="success" label={`Nota final ${formatarNota(item.nota_final)}`} />
                    </Stack>
                  </Paper>
                ))
              ) : (
                <Alert severity="info">Ainda não existem resultados finais lançados para este aluno.</Alert>
              )}
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="h5" fontWeight={900}>
              Últimos atendimentos
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              Resumo das sessões de atendimento já registradas, sem possibilidade de edição pelo aluno.
            </Typography>

            {ultimaSessao ? (
              <Box sx={{ mb: 2 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                    <ScheduleIcon fontSize="small" color="action" />
                    <Typography fontWeight={800}>Último atendimento registrado</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {ultimaSessao.disciplina_nome ?? 'Sem disciplina'} • Entrada: {formatarDataHoraBR(ultimaSessao.hora_entrada)}
                    {ultimaSessao.hora_saida
                      ? ` • Saída: ${formatarDataHoraBR(ultimaSessao.hora_saida)}`
                      : ` • Em aberto há ${formatarTempoDecorrido(ultimaSessao.hora_entrada)}`}
                  </Typography>
                </Paper>
              </Box>
            ) : null}

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
                          {sessao.hora_saida
                            ? ` • Saída: ${formatarDataHoraBR(sessao.hora_saida)}`
                            : ` • Em aberto há ${formatarTempoDecorrido(sessao.hora_entrada)}`}
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
