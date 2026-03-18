import React from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'

import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import AutoGraphRoundedIcon from '@mui/icons-material/AutoGraphRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import TimerRoundedIcon from '@mui/icons-material/TimerRounded'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded'

import type {
  AnaliticoRelatoriosFichas,
  AtendimentoAbertoAgora,
  GraficoItem,
  PeriodoAnaliticoDias,
  TendenciaItem,
} from './analytics'

type Props = {
  data: AnaliticoRelatoriosFichas | null
  loading: boolean
  error: string | null
  periodoDias: PeriodoAnaliticoDias
  onPeriodoDiasChange: (value: PeriodoAnaliticoDias) => void
  onRefresh: () => void
}

const formatarNumero = (valor: number): string =>
  new Intl.NumberFormat('pt-BR').format(valor)

const formatarMedia = (valor: number | null | undefined, digits = 1): string => {
  if (valor == null || Number.isNaN(valor)) return '—'
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

const formatarPercentual = (valor: number | null | undefined): string => {
  if (valor == null || Number.isNaN(valor)) return '—'
  return `${Math.round(valor)}%`
}

const formatarMinutos = (valor: number | null | undefined): string => {
  if (valor == null || Number.isNaN(valor)) return '—'
  if (valor < 60) return `${Math.round(valor)} min`
  const horas = Math.floor(valor / 60)
  const minutos = Math.round(valor % 60)
  return `${horas}h ${String(minutos).padStart(2, '0')}min`
}

const formatarDataHora = (valor: string | null | undefined): string => {
  if (!valor) return '—'
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return '—'
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const cartesianPoints = (items: TendenciaItem[], width: number, height: number, padding = 14) => {
  const safeWidth = Math.max(1, width - padding * 2)
  const safeHeight = Math.max(1, height - padding * 2)
  const max = Math.max(...items.map((item) => item.value), 1)
  return items.map((item, index) => {
    const x = padding + (items.length === 1 ? safeWidth / 2 : (index / (items.length - 1)) * safeWidth)
    const y = padding + safeHeight - (item.value / max) * safeHeight
    return { x, y, label: item.label, value: item.value }
  })
}

const pathFromPoints = (points: Array<{ x: number; y: number }>): string => {
  if (!points.length) return ''
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ')
}

const areaPathFromPoints = (points: Array<{ x: number; y: number }>, height: number, padding = 14): string => {
  if (!points.length) return ''
  const inicio = points[0]
  const fim = points[points.length - 1]
  const baseY = height - padding
  return `${pathFromPoints(points)} L ${fim.x.toFixed(1)} ${baseY.toFixed(1)} L ${inicio.x.toFixed(1)} ${baseY.toFixed(1)} Z`
}

const MetricCard: React.FC<{
  title: string
  value: string
  caption: string
  icon: React.ReactNode
  gradient: string
}> = ({ title, value, caption, icon, gradient }) => {
  const theme = useTheme()
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.divider, 0.75)}`,
        background: `linear-gradient(135deg, ${alpha('#ffffff', 0.92)} 0%, ${alpha('#f8fafc', 0.98)} 100%), ${gradient}`,
        minHeight: 134,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Stack direction="row" justifyContent="space-between" spacing={1.5}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.1 }}>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={900} sx={{ mt: 0.8, lineHeight: 1 }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.2 }}>
            {caption}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2.5,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            bgcolor: alpha(theme.palette.common.white, 0.78),
            color: theme.palette.text.primary,
            boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.common.white, 0.52)}`,
          }}
        >
          {icon}
        </Box>
      </Stack>
    </Paper>
  )
}

const HorizontalRankingCard: React.FC<{
  title: string
  subtitle: string
  items: GraficoItem[]
  emptyLabel: string
}> = ({ title, subtitle, items, emptyLabel }) => {
  const theme = useTheme()
  const max = Math.max(...items.map((item) => item.value), 1)

  return (
    <Paper elevation={0} sx={{ p: 2.2, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
      <Typography variant="h6" fontWeight={900}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {subtitle}
      </Typography>

      {items.length === 0 ? (
        <Alert severity="info">{emptyLabel}</Alert>
      ) : (
        <Stack spacing={1.4}>
          {items.map((item, index) => {
            const percent = Math.max(10, Math.round((item.value / max) * 100))
            return (
              <Box key={`${item.label}-${index}`}>
                <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="center" sx={{ mb: 0.6 }}>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" fontWeight={800} noWrap>
                      {item.label}
                    </Typography>
                    {item.secondary ? (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
                        {item.secondary}
                      </Typography>
                    ) : null}
                  </Box>
                  <Chip
                    label={formatarNumero(item.value)}
                    size="small"
                    sx={{ fontWeight: 900, bgcolor: alpha(item.color ?? theme.palette.primary.main, 0.12), color: item.color ?? theme.palette.primary.main }}
                  />
                </Stack>
                <Box sx={{ height: 10, borderRadius: 999, bgcolor: alpha(theme.palette.primary.main, 0.08), overflow: 'hidden' }}>
                  <Box
                    sx={{
                      width: `${percent}%`,
                      height: '100%',
                      borderRadius: 999,
                      background: `linear-gradient(90deg, ${item.color ?? theme.palette.primary.main} 0%, ${alpha(item.color ?? theme.palette.primary.main, 0.45)} 100%)`,
                    }}
                  />
                </Box>
              </Box>
            )
          })}
        </Stack>
      )}
    </Paper>
  )
}

const LineChartCard: React.FC<{
  title: string
  subtitle: string
  items: TendenciaItem[]
}> = ({ title, subtitle, items }) => {
  const theme = useTheme()
  const width = 640
  const height = 220
  const points = cartesianPoints(items, width, height)
  const linePath = pathFromPoints(points)
  const areaPath = areaPathFromPoints(points, height)
  const max = Math.max(...items.map((item) => item.value), 0)
  const total = items.reduce((acc, item) => acc + item.value, 0)

  return (
    <Paper elevation={0} sx={{ p: 2.2, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5} sx={{ mb: 1.5 }}>
        <Box>
          <Typography variant="h6" fontWeight={900}>{title}</Typography>
          <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Chip label={`Pico: ${formatarNumero(max)}`} size="small" sx={{ fontWeight: 800 }} />
          <Chip label={`Total: ${formatarNumero(total)}`} size="small" sx={{ fontWeight: 800 }} />
        </Stack>
      </Stack>

      {items.length === 0 ? (
        <Alert severity="info">Ainda não há movimentação no período selecionado.</Alert>
      ) : (
        <>
          <Box sx={{ width: '100%', overflowX: 'auto', pb: 1 }}>
            <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="220" role="img" aria-label={title}>
              <defs>
                <linearGradient id="line-area-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={alpha(theme.palette.primary.main, 0.28)} />
                  <stop offset="100%" stopColor={alpha(theme.palette.primary.main, 0.02)} />
                </linearGradient>
              </defs>
              {[0, 1, 2, 3].map((step) => {
                const y = 18 + ((height - 36) / 3) * step
                return (
                  <line
                    key={step}
                    x1="14"
                    x2={String(width - 14)}
                    y1={String(y)}
                    y2={String(y)}
                    stroke={alpha(theme.palette.text.primary, 0.08)}
                    strokeDasharray="4 4"
                  />
                )
              })}
              <path d={areaPath} fill="url(#line-area-fill)" />
              <path d={linePath} fill="none" stroke={theme.palette.primary.main} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
              {points.map((point, index) => (
                <g key={index}>
                  <circle cx={point.x} cy={point.y} r="4.5" fill={theme.palette.background.paper} stroke={theme.palette.primary.main} strokeWidth="2.5" />
                </g>
              ))}
            </svg>
          </Box>

          <Stack direction="row" spacing={1} justifyContent="space-between" sx={{ pt: 0.5, overflowX: 'auto' }}>
            {items.map((item) => (
              <Box key={item.key} sx={{ minWidth: 48, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                <Typography variant="body2" fontWeight={800}>{item.value}</Typography>
              </Box>
            ))}
          </Stack>
        </>
      )}
    </Paper>
  )
}

const DonutStatusCard: React.FC<{
  title: string
  subtitle: string
  items: GraficoItem[]
}> = ({ title, subtitle, items }) => {
  const theme = useTheme()
  const total = items.reduce((acc, item) => acc + item.value, 0)

  const gradient = items.length
    ? `conic-gradient(${items
        .reduce<Array<string>>((acc, item, index) => {
          const somaAnterior = items.slice(0, index).reduce((sum, current) => sum + current.value, 0)
          const inicio = total ? (somaAnterior / total) * 100 : 0
          const fim = total ? ((somaAnterior + item.value) / total) * 100 : 0
          acc.push(`${item.color ?? '#2563eb'} ${inicio}% ${fim}%`)
          return acc
        }, [])
        .join(', ')})`
    : `conic-gradient(${alpha(theme.palette.primary.main, 0.14)} 0% 100%)`

  return (
    <Paper elevation={0} sx={{ p: 2.2, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
      <Typography variant="h6" fontWeight={900}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{subtitle}</Typography>

      {items.length === 0 ? (
        <Alert severity="info">Ainda não há protocolos/atividades suficientes no período.</Alert>
      ) : (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <Box
            sx={{
              width: 188,
              height: 188,
              borderRadius: '50%',
              background: gradient,
              position: 'relative',
              flexShrink: 0,
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 28,
                borderRadius: '50%',
                backgroundColor: theme.palette.background.paper,
                boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.divider, 0.8)}`,
              },
            }}
          >
            <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', zIndex: 1, textAlign: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>Total</Typography>
                <Typography variant="h4" fontWeight={900}>{formatarNumero(total)}</Typography>
              </Box>
            </Box>
          </Box>

          <Stack spacing={1.15} sx={{ flex: 1, width: '100%' }}>
            {items.map((item, index) => (
              <Stack key={`${item.label}-${index}`} direction="row" justifyContent="space-between" alignItems="center" spacing={1.5}>
                <Stack direction="row" alignItems="center" spacing={1.2} sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color ?? theme.palette.primary.main, flexShrink: 0 }} />
                  <Typography variant="body2" fontWeight={700} noWrap>{item.label}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" color="text.secondary">{formatarPercentual(total ? (item.value / total) * 100 : 0)}</Typography>
                  <Chip label={formatarNumero(item.value)} size="small" sx={{ fontWeight: 900 }} />
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Stack>
      )}
    </Paper>
  )
}

const AbertosAgoraCard: React.FC<{
  itens: AtendimentoAbertoAgora[]
}> = ({ itens }) => {
  const theme = useTheme()
  return (
    <Paper elevation={0} sx={{ p: 2.2, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
      <Typography variant="h6" fontWeight={900}>Atendimentos abertos agora</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        O diretor consegue ver quem está sendo atendido, com qual professor, em qual sala e há quanto tempo.
      </Typography>

      {itens.length === 0 ? (
        <Alert severity="success">Nenhum atendimento está aberto neste momento.</Alert>
      ) : (
        <Stack spacing={1.2}>
          {itens.map((item) => (
            <Paper
              key={item.idSessao}
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 2.5,
                border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                bgcolor: alpha(theme.palette.primary.main, 0.03),
              }}
            >
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body1" fontWeight={900} noWrap>
                    {item.alunoNome}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {item.disciplinaNome}
                  </Typography>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap flexWrap="wrap" justifyContent="flex-end">
                  <Chip label={`Professor: ${item.professorNome}`} size="small" />
                  <Chip label={`Sala: ${item.salaNome}`} size="small" />
                  <Chip label={`Entrada: ${formatarDataHora(item.horaEntrada)}`} size="small" />
                  <Chip label={`Aberto há ${formatarMinutos(item.minutosEmAberto)}`} size="small" color="warning" />
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Paper>
  )
}

const InsightsCard: React.FC<{ items: Array<{ titulo: string; descricao: string }> }> = ({ items }) => {
  const theme = useTheme()
  return (
    <Paper elevation={0} sx={{ p: 2.2, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <InsightsRoundedIcon color="primary" />
        <Typography variant="h6" fontWeight={900}>Leituras rápidas para a direção</Typography>
      </Stack>
      <Stack spacing={1.2}>
        {items.map((item, index) => (
          <Box key={`${item.titulo}-${index}`} sx={{ p: 1.4, borderRadius: 2.5, bgcolor: alpha(theme.palette.info.main, 0.06), border: `1px solid ${alpha(theme.palette.info.main, 0.12)}` }}>
            <Typography variant="body2" fontWeight={900}>{item.titulo}</Typography>
            <Typography variant="body2" color="text.secondary">{item.descricao}</Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  )
}

const RelatoriosAnalyticsSection: React.FC<Props> = ({
  data,
  loading,
  error,
  periodoDias,
  onPeriodoDiasChange,
  onRefresh,
}) => {
  const theme = useTheme()

  return (
    <Paper elevation={0} sx={{ p: 2.25, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, mt: 2 }}>
      <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" spacing={1.5} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={900}>Painel gerencial</Typography>
          <Typography variant="body2" color="text.secondary">
            Indicadores visuais para Direção, Coordenação e Secretaria acompanharem a escola sem precisar ir de sala em sala.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={periodoDias}
            onChange={(_event, value) => {
              if (value) onPeriodoDiasChange(value as PeriodoAnaliticoDias)
            }}
            color="primary"
          >
            <ToggleButton value={7}>7 dias</ToggleButton>
            <ToggleButton value={30}>30 dias</ToggleButton>
            <ToggleButton value={90}>90 dias</ToggleButton>
            <ToggleButton value={180}>180 dias</ToggleButton>
          </ToggleButtonGroup>

          <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={onRefresh} disabled={loading}>
            Atualizar
          </Button>
        </Stack>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 2 }} useFlexGap flexWrap="wrap">
        <Chip label="Atualização automática a cada 60s" size="small" sx={{ fontWeight: 800 }} />
        {data?.atualizadoEm ? (
          <Chip label={`Última leitura: ${formatarDataHora(data.atualizadoEm)}`} size="small" sx={{ fontWeight: 800 }} />
        ) : null}
      </Stack>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      {loading && !data ? (
        <Box sx={{ py: 8, display: 'grid', placeItems: 'center' }}>
          <Stack alignItems="center" spacing={1.5}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">Montando os gráficos da gestão escolar...</Typography>
          </Stack>
        </Box>
      ) : null}

      {data ? (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                xl: 'repeat(4, minmax(0, 1fr))',
              },
              gap: 1.5,
              mb: 2,
            }}
          >
            <MetricCard
              title="Atendimentos no período"
              value={formatarNumero(data.indicadores.atendimentosPeriodo)}
              caption={`${formatarNumero(data.indicadores.alunosAtendidosPeriodo)} aluno(s) atendido(s) no recorte atual.`}
              icon={<AutoGraphRoundedIcon />}
              gradient={`linear-gradient(135deg, ${alpha('#2563eb', 0.16)} 0%, ${alpha('#60a5fa', 0.08)} 100%)`}
            />
            <MetricCard
              title="Atendimentos abertos agora"
              value={formatarNumero(data.indicadores.atendimentosAbertosAgora)}
              caption={`${formatarNumero(data.indicadores.professoresEmAtendimentoAgora)} professor(es) e ${formatarNumero(data.indicadores.salasOcupadasAgora)} sala(s) em uso.`}
              icon={<SchoolRoundedIcon />}
              gradient={`linear-gradient(135deg, ${alpha('#7c3aed', 0.14)} 0%, ${alpha('#a78bfa', 0.08)} 100%)`}
            />
            <MetricCard
              title="Média das notas"
              value={formatarMedia(data.indicadores.mediaNotas)}
              caption={`Taxa de atividades concluídas: ${formatarPercentual(data.indicadores.taxaConclusaoAtividades)}.`}
              icon={<FactCheckRoundedIcon />}
              gradient={`linear-gradient(135deg, ${alpha('#0f766e', 0.15)} 0%, ${alpha('#5eead4', 0.08)} 100%)`}
            />
            <MetricCard
              title="Duração média do atendimento"
              value={formatarMinutos(data.indicadores.duracaoMediaMinutos)}
              caption="Tempo médio calculado com base nas sessões encerradas do período."
              icon={<TimerRoundedIcon />}
              gradient={`linear-gradient(135deg, ${alpha('#ea580c', 0.15)} 0%, ${alpha('#fdba74', 0.08)} 100%)`}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1.4fr 1fr' }, gap: 1.5, mb: 2 }}>
            <LineChartCard
              title="Tendência diária de atendimentos"
              subtitle="Permite identificar picos de demanda e comparar dias mais carregados."
              items={data.tendenciaDiaria}
            />
            <DonutStatusCard
              title="Status das atividades"
              subtitle="Distribuição dos registros de atendimento vinculados às sessões do período."
              items={data.statusAtividades}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr 1fr' }, gap: 1.5, mb: 2 }}>
            <HorizontalRankingCard
              title="Atendimentos por professor"
              subtitle="Quem mais atendeu alunos no período selecionado."
              items={data.porProfessor}
              emptyLabel="Ainda não há atendimentos suficientes para montar o ranking de professores."
            />
            <HorizontalRankingCard
              title="Atendimentos por disciplina"
              subtitle="Quais componentes curriculares mais concentraram demanda."
              items={data.porDisciplina}
              emptyLabel="Ainda não há atendimentos suficientes para montar o ranking de disciplinas."
            />
            <HorizontalRankingCard
              title="Atendimentos por sala"
              subtitle="Distribuição operacional por ambiente utilizado."
              items={data.porSala}
              emptyLabel="Ainda não há atendimentos suficientes para montar o ranking de salas."
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' }, gap: 1.5, mb: 2 }}>
            <HorizontalRankingCard
              title="Atendimentos abertos por professor"
              subtitle="Quem está com atendimento ativo neste exato momento."
              items={data.abertosPorProfessor}
              emptyLabel="Nenhum professor está com atendimento aberto agora."
            />
            <HorizontalRankingCard
              title="Atendimentos abertos por sala"
              subtitle="Concentração da operação ao vivo por espaço físico."
              items={data.abertosPorSala}
              emptyLabel="Nenhuma sala está com atendimento aberto agora."
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1.3fr 0.9fr' }, gap: 1.5 }}>
            <AbertosAgoraCard itens={data.atendimentosAbertosAgora} />
            <InsightsCard items={data.insights} />
          </Box>
        </>
      ) : null}

      {loading && data ? (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2, color: 'text.secondary' }}>
          <CircularProgress size={16} />
          <Typography variant="caption">Atualizando indicadores…</Typography>
        </Stack>
      ) : null}

      <Divider sx={{ my: 2 }} />
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} useFlexGap flexWrap="wrap">
        <Chip icon={<PersonRoundedIcon />} label="Professor" size="small" />
        <Chip icon={<MenuBookRoundedIcon />} label="Disciplina" size="small" />
        <Chip icon={<MeetingRoomRoundedIcon />} label="Sala" size="small" />
        <Chip icon={<GroupsRoundedIcon />} label="Alunos atendidos" size="small" />
        <Chip icon={<TimelineRoundedIcon />} label="Leitura executiva para direção" size="small" />
      </Stack>
    </Paper>
  )
}

export default RelatoriosAnalyticsSection
