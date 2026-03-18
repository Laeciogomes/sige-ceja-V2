import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import ClassIcon from '@mui/icons-material/Class'
import SchoolIcon from '@mui/icons-material/School'

import { useAuth } from '../../contextos/AuthContext'
import { useSupabase } from '../../contextos/SupabaseContext'
import AvatarAlunoPainel from './components/AvatarAlunoPainel'
import AlunoSeletorAdmin from './components/AlunoSeletorAdmin'
import {
  carregarMatriculasAluno,
  carregarPerfilAlunoPorId,
  carregarPerfilAlunoPorUserId,
  corPorStatus,
  formatarDataBR,
  isStatusMatriculaAtiva,
  nomeNivelEnsinoLongo,
  type AlunoBuscaOption,
  type AlunoPerfil,
  type MatriculaResumo,
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

export default function AlunoMatriculasPage() {
  const { usuario } = useAuth()
  const { supabase } = useSupabase()
  const [searchParams, setSearchParams] = useSearchParams()

  const modoGestor = usuario?.papel === 'ADMIN'
  const alunoIdSelecionado = Number(searchParams.get('aluno') ?? '') || null

  const [selecionado, setSelecionado] = useState<AlunoBuscaOption | null>(null)
  const [perfil, setPerfil] = useState<AlunoPerfil | null>(null)
  const [matriculas, setMatriculas] = useState<MatriculaResumo[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregarDados = useCallback(async () => {
    if (!supabase || !usuario) {
      setPerfil(null)
      setMatriculas([])
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
        setErro(
          modoGestor
            ? 'Aluno não encontrado para a consulta informada.'
            : 'Seu usuário não possui vínculo com a tabela de alunos.',
        )
        setLoading(false)
        return
      }

      const matriculasAtual = await carregarMatriculasAluno(supabase, perfilAtual.id_aluno)
      setPerfil(perfilAtual)
      setMatriculas(matriculasAtual)

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
      console.error('[AlunoMatriculasPage] erro ao carregar painel do aluno', error)
      setErro('Não foi possível carregar as matrículas do aluno.')
      setPerfil(null)
      setMatriculas([])
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

  const matriculasConcluidas = useMemo(
    () =>
      matriculas.filter(item => {
        const status = String(item.status_nome ?? '').toLowerCase()
        return status.includes('conclu') || item.data_conclusao != null
      }),
    [matriculas],
  )

  const urlProgresso = useMemo(() => {
    if (modoGestor && perfil?.id_aluno) return `/alunos/progresso?aluno=${perfil.id_aluno}`
    return '/alunos/progresso'
  }, [modoGestor, perfil?.id_aluno])

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h3" fontWeight={900}>
          Minhas matrículas
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          Consulte seu vínculo escolar, turma atual e histórico de matrículas no CEJA.
        </Typography>
      </Box>

      {modoGestor ? (
        <AlunoSeletorAdmin supabase={supabase} valor={selecionado} onChange={handleSelecionarAluno} />
      ) : null}

      {loading ? (
        <Paper variant="outlined" sx={{ p: 5, borderRadius: 3 }}>
          <Stack spacing={2} alignItems="center" justifyContent="center">
            <CircularProgress />
            <Typography color="text.secondary">Carregando informações do aluno...</Typography>
          </Stack>
        </Paper>
      ) : null}

      {!loading && erro ? <Alert severity="warning">{erro}</Alert> : null}

      {!loading && !erro && !perfil ? (
        <Alert severity="info">
          {modoGestor
            ? 'Selecione um aluno para abrir a visão de matrículas.'
            : 'Nenhuma informação de matrícula foi localizada para o seu usuário.'}
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
                    <Chip size="small" label={`RA ${matriculaPrincipal?.numero_inscricao ?? '-'}`} />
                    <Chip size="small" color="primary" label={matriculaPrincipal?.nivel_nome ?? nomeNivelEnsinoLongo(matriculaPrincipal?.id_nivel_ensino ?? null)} />
                    <Chip size="small" color={corPorStatus(matriculaPrincipal?.status_nome)} label={matriculaPrincipal?.status_nome ?? 'Sem status'} />
                    {matriculaPrincipal?.turma_nome ? <Chip size="small" label={matriculaPrincipal.turma_nome} /> : null}
                  </Stack>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25 }}>
                    {perfil.usuario.email || 'E-mail não informado'}
                    {perfil.usuario.celular ? ` • ${perfil.usuario.celular}` : ''}
                    {perfil.usuario.municipio ? ` • ${perfil.usuario.municipio}` : ''}
                  </Typography>

                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
                    {perfil.possui_necessidade_especial ? (
                      <Chip size="small" color="warning" label={perfil.qual_necessidade_especial?.trim() || 'Necessidade especial'} />
                    ) : null}
                    {perfil.possui_beneficio_governo ? (
                      <Chip size="small" color="success" label={perfil.qual_beneficio_governo?.trim() || 'Benefício governamental'} />
                    ) : null}
                  </Stack>
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
                label="Matrículas registradas"
                value={String(matriculas.length)}
                hint={matriculas.length > 1 ? 'Inclui histórico anterior do aluno.' : 'Apenas uma matrícula localizada.'}
              />
              <MetricCard
                label="Matrículas ativas"
                value={String(matriculasAtivas.length)}
                hint={matriculasAtivas.length ? 'Vínculos em andamento no momento.' : 'Nenhum vínculo ativo identificado.'}
              />
              <MetricCard
                label="Concluídas"
                value={String(matriculasConcluidas.length)}
                hint="Histórico de matrículas finalizadas ou concluídas."
              />
              <MetricCard
                label="Turma atual"
                value={matriculaPrincipal?.turma_nome ?? '-'}
                hint={matriculaPrincipal?.turma_turno ? `Turno: ${matriculaPrincipal.turma_turno}` : 'Sem turma vinculada.'}
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
                  Matrícula principal atual
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Panorama rápido do vínculo mais relevante do aluno.
                </Typography>
              </Box>

              <Button
                component={RouterLink}
                to={urlProgresso}
                variant="contained"
                endIcon={<ArrowForwardIcon />}
              >
                Ver progresso acadêmico
              </Button>
            </Stack>

            <Divider sx={{ my: 2 }} />

            {matriculaPrincipal ? (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' },
                  gap: 2,
                }}
              >
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <AssignmentIndIcon fontSize="small" color="action" />
                    <Typography variant="subtitle2" color="text.secondary">
                      Dados da matrícula
                    </Typography>
                  </Stack>
                  <Typography fontWeight={800}>RA {matriculaPrincipal.numero_inscricao ?? '-'}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Status: {matriculaPrincipal.status_nome ?? '-'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Modalidade: {matriculaPrincipal.modalidade ?? '-'}
                  </Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <SchoolIcon fontSize="small" color="action" />
                    <Typography variant="subtitle2" color="text.secondary">
                      Nível de ensino
                    </Typography>
                  </Stack>
                  <Typography fontWeight={800}>{matriculaPrincipal.nivel_nome ?? nomeNivelEnsinoLongo(matriculaPrincipal.id_nivel_ensino)}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Ano letivo: {matriculaPrincipal.ano_letivo ?? '-'}
                  </Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <ClassIcon fontSize="small" color="action" />
                    <Typography variant="subtitle2" color="text.secondary">
                      Turma
                    </Typography>
                  </Stack>
                  <Typography fontWeight={800}>{matriculaPrincipal.turma_nome ?? 'Sem turma vinculada'}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {matriculaPrincipal.turma_codigo ? `Código: ${matriculaPrincipal.turma_codigo}` : 'Código não informado'}
                  </Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <CalendarMonthIcon fontSize="small" color="action" />
                    <Typography variant="subtitle2" color="text.secondary">
                      Datas
                    </Typography>
                  </Stack>
                  <Typography fontWeight={800}>Entrada: {formatarDataBR(matriculaPrincipal.data_matricula)}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Conclusão: {formatarDataBR(matriculaPrincipal.data_conclusao)}
                  </Typography>
                </Paper>
              </Box>
            ) : (
              <Alert severity="info">Nenhuma matrícula foi localizada para este aluno.</Alert>
            )}
          </Paper>

          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="h5" fontWeight={900}>
              Histórico de matrículas
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              Lista completa dos vínculos registrados no banco atual.
            </Typography>

            <Stack spacing={1.5}>
              {matriculas.length ? (
                matriculas.map(item => (
                  <Paper key={item.id_matricula} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                    <Stack
                      direction={{ xs: 'column', lg: 'row' }}
                      spacing={1.5}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', lg: 'center' }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                          <Typography variant="h6" fontWeight={900}>
                            RA {item.numero_inscricao ?? '-'}
                          </Typography>
                          <Chip size="small" color={corPorStatus(item.status_nome)} label={item.status_nome ?? 'Sem status'} />
                          <Chip size="small" label={item.nivel_nome ?? nomeNivelEnsinoLongo(item.id_nivel_ensino)} />
                          {item.turma_nome ? <Chip size="small" label={item.turma_nome} /> : null}
                        </Stack>

                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.85 }}>
                          Modalidade: {item.modalidade ?? '-'} • Ano letivo: {item.ano_letivo ?? '-'} • Início: {formatarDataBR(item.data_matricula)}
                          {item.data_conclusao ? ` • Conclusão: ${formatarDataBR(item.data_conclusao)}` : ''}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.turma_codigo ? `Código da turma: ${item.turma_codigo} • ` : ''}
                          {item.turma_turno ? `Turno: ${item.turma_turno}` : 'Turno não informado'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                ))
              ) : (
                <Alert severity="info">Este aluno ainda não possui matrículas registradas.</Alert>
              )}
            </Stack>
          </Paper>
        </>
      ) : null}
    </Stack>
  )
}
