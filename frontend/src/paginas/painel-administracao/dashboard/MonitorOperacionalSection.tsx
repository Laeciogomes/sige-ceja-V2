import React from 'react'
import {
  Alert,
  Box,
  Chip,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'

import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import Groups2RoundedIcon from '@mui/icons-material/Groups2Rounded'
import AssignmentIndRoundedIcon from '@mui/icons-material/AssignmentIndRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'

import type {
  MonitorOperacionalData,
  MonitorOperacionalRankingItem,
} from './monitorOperacional'

type Props = {
  data: MonitorOperacionalData
}

type ResumoCardProps = {
  titulo: string
  valor: string
  apoio: string
  icone: React.ReactNode
  cor: string
}

const ResumoCard: React.FC<ResumoCardProps> = ({
  titulo,
  valor,
  apoio,
  icone,
  cor,
}) => {
  const theme = useTheme()

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        p: 2,
        height: '100%',
      }}
    >
      <Stack direction="row" justifyContent="space-between" spacing={2}>
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            {titulo}
          </Typography>
          <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
            {valor}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {apoio}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(cor, 0.1),
            color: cor,
            flexShrink: 0,
          }}
        >
          {icone}
        </Box>
      </Stack>
    </Paper>
  )
}

const RankingCard: React.FC<{
  titulo: string
  subtitulo: string
  itens: MonitorOperacionalRankingItem[]
  vazio: string
}> = ({ titulo, subtitulo, itens, vazio }) => {
  const theme = useTheme()

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
        height: '100%',
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="subtitle1" fontWeight={800}>
          {titulo}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {subtitulo}
        </Typography>
      </Box>

      {itens.length ? (
        <Stack spacing={0}>
          {itens.map((item, index) => (
            <Box
              key={`${titulo}-${item.label}-${index}`}
              sx={{
                px: 2.5,
                py: 1.5,
                borderBottom:
                  index < itens.length - 1
                    ? `1px solid ${theme.palette.divider}`
                    : 'none',
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={2}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={700} noWrap>
                    {item.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.detail}
                  </Typography>
                </Box>
                <Chip
                  label={String(item.count)}
                  size="small"
                  sx={{ fontWeight: 800, borderRadius: 1.5 }}
                  color="warning"
                />
              </Stack>
            </Box>
          ))}
        </Stack>
      ) : (
        <Box sx={{ px: 2.5, py: 3 }}>
          <Typography variant="body2" color="text.secondary">
            {vazio}
          </Typography>
        </Box>
      )}
    </Paper>
  )
}

const SessaoAoVivoCard: React.FC<{ data: MonitorOperacionalData }> = ({ data }) => {
  const theme = useTheme()

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={1}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight={800}>
              Atendimentos abertos agora
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Leitura automática em tempo quase real do que está acontecendo na escola.
            </Typography>
          </Box>
          <Chip
            label={`Atualizado às ${data.atualizadoEmLabel}`}
            size="small"
            sx={{ fontWeight: 700, borderRadius: 1.5 }}
            color="success"
            variant="outlined"
          />
        </Stack>
      </Box>

      {data.sessoes.length ? (
        <Stack spacing={0}>
          {data.sessoes.map((sessao, index) => (
            <Box
              key={sessao.id}
              sx={{
                px: 2.5,
                py: 1.75,
                borderBottom:
                  index < data.sessoes.length - 1
                    ? `1px solid ${theme.palette.divider}`
                    : 'none',
              }}
            >
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', md: 'center' }}
                spacing={1.5}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={800}>
                    {sessao.alunoNome}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Sala: {sessao.salaNome} • Disciplina: {sessao.disciplinaNome} • Professor: {sessao.professorNome}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label={`Entrada ${sessao.entradaLabel}`} size="small" />
                  <Chip
                    label={`Aberto há ${sessao.duracaoLabel}`}
                    size="small"
                    color={sessao.duracaoMinutos >= 120 ? 'warning' : 'default'}
                    variant={sessao.duracaoMinutos >= 120 ? 'filled' : 'outlined'}
                  />
                </Stack>
              </Stack>
            </Box>
          ))}
        </Stack>
      ) : (
        <Box sx={{ px: 2.5, py: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Nenhum atendimento está aberto neste momento.
          </Typography>
        </Box>
      )}
    </Paper>
  )
}

const MonitorOperacionalSection: React.FC<Props> = ({ data }) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h6" fontWeight={800}>
            Monitor operacional ao vivo
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Distribuição dos atendimentos em aberto por sala, disciplina e professor.
          </Typography>
        </Box>
        <Chip
          label={`${data.totalAbertos} atendimento(s) aberto(s)`}
          color={data.totalAbertos ? 'warning' : 'success'}
          variant={data.totalAbertos ? 'filled' : 'outlined'}
          sx={{ fontWeight: 800, borderRadius: 1.5 }}
        />
      </Stack>

      {data.alertas.length ? (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          <Stack spacing={0.25}>
            {data.alertas.map((alerta, index) => (
              <Typography key={`alerta-live-${index}`} variant="body2">
                {alerta}
              </Typography>
            ))}
          </Stack>
        </Alert>
      ) : null}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 1fr',
            lg: 'repeat(6, 1fr)',
          },
          gap: 2,
          mb: 2,
        }}
      >
        <ResumoCard
          titulo="Em aberto agora"
          valor={String(data.totalAbertos)}
          apoio="Sessões simultâneas"
          icone={<MeetingRoomIcon />}
          cor="#F7941D"
        />
        <ResumoCard
          titulo="Alunos em atendimento"
          valor={String(data.totalAlunos)}
          apoio="Alunos distintos"
          icone={<SchoolRoundedIcon />}
          cor="#1976D2"
        />
        <ResumoCard
          titulo="Salas ocupadas"
          valor={String(data.salasOcupadas)}
          apoio="Salas em uso"
          icone={<Groups2RoundedIcon />}
          cor="#2E7D32"
        />
        <ResumoCard
          titulo="Professores ativos"
          valor={String(data.professoresAtivos)}
          apoio="Docentes com sessão aberta"
          icone={<AssignmentIndRoundedIcon />}
          cor="#6A1B9A"
        />
        <ResumoCard
          titulo="Disciplinas em andamento"
          valor={String(data.disciplinasAtivas)}
          apoio="Frentes pedagógicas"
          icone={<MenuBookRoundedIcon />}
          cor="#00838F"
        />
        <ResumoCard
          titulo="Maior tempo em aberto"
          valor={data.maiorTempoAbertoLabel}
          apoio={`Média atual ${data.tempoMedioAbertoLabel}`}
          icone={<AccessTimeRoundedIcon />}
          cor="#EF6C00"
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 2,
        }}
      >
        <RankingCard
          titulo="Por sala"
          subtitulo="Onde os atendimentos estão concentrados agora"
          itens={data.porSala}
          vazio="Sem salas com atendimento em aberto."
        />
        <RankingCard
          titulo="Por disciplina"
          subtitulo="Distribuição por componente curricular"
          itens={data.porDisciplina}
          vazio="Sem disciplinas com atendimento em aberto."
        />
        <RankingCard
          titulo="Por professor"
          subtitulo="Carga de atendimento simultâneo por docente"
          itens={data.porProfessor}
          vazio="Nenhum professor com atendimento aberto agora."
        />
      </Box>

      <SessaoAoVivoCard data={data} />
    </Box>
  )
}

export default MonitorOperacionalSection
