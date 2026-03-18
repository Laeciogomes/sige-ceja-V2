import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Divider,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import DescriptionIcon from '@mui/icons-material/Description'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import VisibilityIcon from '@mui/icons-material/Visibility'

import type { SessaoView } from '../types'
import { AvatarAlunoAtendimento } from './AvatarAlunoAtendimento'
import {
  chipPeDeMeiaUI,
  formatarDataHoraBR,
  nomeNivelEnsinoCurto,
  renderNumeroInscricao,
} from '../utils'

type AtendimentoCardProps = {
  sessao: SessaoView
  modo: 'aberta' | 'historico'
  resumo?: string
  onResumoChange?: (value: string) => void
  onAbrir: (sessao: SessaoView) => void | Promise<void>
  onAbrirFicha: (idProgresso: number | null | undefined) => void
  onFinalizar?: (sessao: SessaoView) => void | Promise<void>
}

export function AtendimentoCard({
  sessao,
  modo,
  resumo = '',
  onResumoChange,
  onAbrir,
  onAbrirFicha,
  onFinalizar,
}: AtendimentoCardProps) {
  const pe =
    modo === 'aberta'
      ? chipPeDeMeiaUI({
          id_nivel_ensino: sessao.id_nivel_ensino ?? null,
          cpf: sessao.aluno_cpf ?? null,
          data_nascimento: sessao.aluno_data_nascimento ?? null,
          nis: sessao.aluno_nis ?? null,
          possui_beneficio_governo: sessao.aluno_possui_beneficio_governo ?? null,
          data_matricula: sessao.mat_data_matricula ?? null,
          ano_letivo: sessao.mat_ano_letivo ?? null,
        })
      : null

  const pcd = Boolean(sessao.aluno_possui_necessidade_especial)
  const hoverShadow = modo === 'aberta' ? 6 : 4
  const avatarSize = modo === 'aberta' ? 56 : 52

  return (
    <Card
      elevation={modo === 'aberta' ? 2 : 1}
      onClick={() => void onAbrir(sessao)}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: hoverShadow },
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: modo === 'aberta' ? 1 : 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
          <AvatarAlunoAtendimento
            idAluno={sessao.id_aluno}
            fotoUrl={sessao.aluno_foto_url}
            nome={sessao.aluno_nome}
            sx={{
              width: avatarSize,
              height: avatarSize,
              ...(modo === 'aberta'
                ? {
                    border: '2px solid',
                    borderColor: 'primary.main',
                  }
                : null),
            }}
          />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant={modo === 'aberta' ? 'h6' : 'subtitle1'}
              sx={{ fontWeight: modo === 'aberta' ? 700 : 800, overflowWrap: 'anywhere', lineHeight: 1.2 }}
            >
              {sessao.aluno_nome}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {renderNumeroInscricao({ numero_inscricao: sessao.numero_inscricao })}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
          <Chip label={sessao.disciplina_nome ?? '-'} color="primary" variant="outlined" size="small" />
          <Chip label={sessao.ano_nome ?? '-'} variant="outlined" size="small" />
          <Chip label={sessao.sala_nome ?? '-'} variant="outlined" size="small" icon={<MeetingRoomIcon />} />
          <Chip size="small" variant="outlined" label={`Nível: ${nomeNivelEnsinoCurto(sessao.id_nivel_ensino)}`} />
        </Stack>

        {modo === 'aberta' && pe ? (
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
            {pe.tooltip ? (
              <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{pe.tooltip}</span>} arrow>
                <Chip size="small" color={pe.color} variant={pe.variant} label={pe.label} />
              </Tooltip>
            ) : (
              <Chip size="small" color={pe.color} variant={pe.variant} label={pe.label} />
            )}
            <Chip
              size="small"
              color={pcd ? 'info' : 'default'}
              variant={pcd ? 'filled' : 'outlined'}
              label={pcd ? 'PCD: Sim' : 'PCD: Não'}
            />
          </Stack>
        ) : null}

        {modo === 'aberta' ? (
          <Typography variant="caption" color="text.secondary" display="block">
            Entrada: {formatarDataHoraBR(sessao.hora_entrada)}
          </Typography>
        ) : (
          <>
            <Typography variant="caption" color="text.secondary" display="block">
              {formatarDataHoraBR(sessao.hora_entrada)} → {formatarDataHoraBR(sessao.hora_saida)}
            </Typography>
            {sessao.resumo_atividades ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                {sessao.resumo_atividades}
              </Typography>
            ) : null}
          </>
        )}

        {modo === 'aberta' ? (
          <TextField
            label="Resumo (opcional)"
            fullWidth
            multiline
            minRows={2}
            size="small"
            value={resumo}
            onChange={(e) => onResumoChange?.(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            sx={{ mt: 1.2 }}
          />
        ) : null}
      </CardContent>

      <Divider />

      <CardActions sx={{ p: 1.2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: '100%' }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<VisibilityIcon />}
            sx={{ flex: 1 }}
            onClick={(e) => {
              e.stopPropagation()
              void onAbrir(sessao)
            }}
          >
            Abrir
          </Button>

          <Button
            size="small"
            variant="outlined"
            startIcon={<DescriptionIcon />}
            sx={{ flex: 1 }}
            disabled={!sessao.id_progresso}
            onClick={(e) => {
              e.stopPropagation()
              onAbrirFicha(sessao.id_progresso)
            }}
          >
            Abrir Ficha
          </Button>

          {modo === 'aberta' ? (
            <Button
              size="small"
              variant="contained"
              color="warning"
              startIcon={<CheckCircleOutlineIcon />}
              sx={{ flex: 1 }}
              onClick={(e) => {
                e.stopPropagation()
                void onFinalizar?.(sessao)
              }}
            >
              Finalizar
            </Button>
          ) : null}
        </Stack>
      </CardActions>
    </Card>
  )
}
