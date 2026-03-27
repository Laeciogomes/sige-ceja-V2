import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import LoginIcon from '@mui/icons-material/Login'
import LogoutIcon from '@mui/icons-material/Logout'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

import { useSupabase } from '../../contextos/SupabaseContext'
import { useNotificacaoContext } from '../../contextos/NotificacaoContext'
import {
  carregarRegistrosHoje,
  carregarUltimosRegistros,
  carregarUsuarioAtualPonto,
  registrarPontoFuncionario,
  usuarioEhFuncionario,
} from './pontoService'
import type { LocalizacaoPonto, PontoRegistroRow, UsuarioPontoRow } from './pontoTypes'
import {
  determinarProximoTipoRegistro,
  formatarData,
  formatarDataHora,
  formatarHora,
} from './pontoUtils'

const obterLocalizacao = (): Promise<LocalizacaoPonto> =>
  new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve({ latitude: null, longitude: null, precisao_metros: null })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          precisao_metros: position.coords.accuracy,
        })
      },
      () => {
        resolve({ latitude: null, longitude: null, precisao_metros: null })
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    )
  })

const PontoFuncionarioPage = () => {
  const { supabase } = useSupabase()
  const supabaseClient = supabase
  const { erro, sucesso, aviso } = useNotificacaoContext()

  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [usuarioAtual, setUsuarioAtual] = useState<UsuarioPontoRow | null>(null)
  const [registrosHoje, setRegistrosHoje] = useState<PontoRegistroRow[]>([])
  const [ultimosRegistros, setUltimosRegistros] = useState<PontoRegistroRow[]>([])
  const [observacao, setObservacao] = useState('')
  const [localizacaoAtual, setLocalizacaoAtual] = useState<LocalizacaoPonto | null>(null)

  const carregarDados = useCallback(async () => {
    if (!supabaseClient) {
      erro('Cliente do Supabase não está disponível.')
      setCarregando(false)
      return
    }

    setCarregando(true)
    try {
      const usuario = await carregarUsuarioAtualPonto(supabaseClient)
      setUsuarioAtual(usuario)

      if (!usuarioEhFuncionario(usuario.id_tipo_usuario)) {
        throw new Error('Somente funcionários podem registrar ponto.')
      }

      const [hoje, historico] = await Promise.all([
        carregarRegistrosHoje(supabaseClient, usuario.id),
        carregarUltimosRegistros(supabaseClient, usuario.id, 20),
      ])

      setRegistrosHoje(hoje)
      setUltimosRegistros(historico)
    } catch (error: any) {
      erro(error?.message ?? 'Não foi possível carregar o módulo de ponto.')
    } finally {
      setCarregando(false)
    }
  }, [erro, supabaseClient])

  useEffect(() => {
    void carregarDados()
  }, [carregarDados])

  const proximoTipo = useMemo(
    () => determinarProximoTipoRegistro(registrosHoje),
    [registrosHoje],
  )

  const entradaHoje = registrosHoje.find((item) => item.tipo_registro === 'Entrada')
  const saidaHoje = registrosHoje.find((item) => item.tipo_registro === 'Saida')

  const registrar = async () => {
    if (!usuarioAtual) return
    if (!supabaseClient) {
      erro('Cliente do Supabase não está disponível.')
      return
    }

    setSalvando(true)
    try {
      const localizacao = await obterLocalizacao()
      setLocalizacaoAtual(localizacao)

      const semGeo =
        localizacao.latitude === null ||
        localizacao.longitude === null ||
        localizacao.precisao_metros === null

      if (semGeo) {
        aviso('Não foi possível capturar a geolocalização. O ponto será salvo sem coordenadas.')
      }

      const registro = await registrarPontoFuncionario(supabaseClient, {
        userId: usuarioAtual.id,
        observacao,
        localizacao,
      })

      sucesso(`${registro.tipo_registro} registrada com sucesso.`)
      setObservacao('')
      await carregarDados()
    } catch (error: any) {
      erro(error?.message ?? 'Não foi possível registrar o ponto.')
    } finally {
      setSalvando(false)
    }
  }

  if (!supabaseClient) {
    return <Alert severity="error">Cliente do Supabase não está disponível.</Alert>
  }

  if (carregando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!usuarioAtual || !usuarioEhFuncionario(usuarioAtual.id_tipo_usuario)) {
    return (
      <Alert severity="warning">Este módulo é exclusivo para funcionários.</Alert>
    )
  }

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
        >
          <Box>
            <Typography variant="h4" fontWeight={800}>
              Ponto Digital
            </Typography>
            <Typography color="text.secondary">
              Registro simples de entrada e saída para funcionários.
            </Typography>
          </Box>

          <Chip
            icon={<AccessTimeIcon />}
            color={proximoTipo ? 'primary' : 'success'}
            label={proximoTipo ? `Próximo registro: ${proximoTipo}` : 'Ponto do dia completo'}
          />
        </Stack>
      </Paper>

      <Alert severity="info" icon={<InfoOutlinedIcon />}>
        Este módulo registra apenas entrada e saída. O relatório mensal para assinatura
        deve ser emitido pela secretaria.
      </Alert>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
        <Paper sx={{ p: 3, borderRadius: 3, flex: 1 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Registro de hoje
          </Typography>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Chip label={`Entrada: ${formatarHora(entradaHoje?.registrado_em)}`} />
              <Chip label={`Saída: ${formatarHora(saidaHoje?.registrado_em)}`} />
            </Stack>

            <TextField
              label="Observação opcional"
              value={observacao}
              onChange={(event) => setObservacao(event.target.value)}
              fullWidth
              multiline
              minRows={2}
              placeholder="Ex.: serviço externo, reunião, deslocamento..."
            />

            <Button
              variant="contained"
              size="large"
              disabled={!proximoTipo || salvando}
              onClick={registrar}
              startIcon={
                proximoTipo === 'Entrada' ? <LoginIcon /> : <LogoutIcon />
              }
              sx={{ alignSelf: 'flex-start', minWidth: 220 }}
            >
              {salvando
                ? 'Salvando...'
                : proximoTipo
                  ? `Registrar ${proximoTipo.toLowerCase()}`
                  : 'Dia finalizado'}
            </Button>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Chip
                icon={<MyLocationIcon />}
                variant="outlined"
                label={
                  localizacaoAtual?.latitude && localizacaoAtual.longitude
                    ? `Localização capturada (${Number(localizacaoAtual.precisao_metros ?? 0).toFixed(0)} m)`
                    : 'Localização será capturada no momento do registro'
                }
              />
              <Chip label={`Hoje: ${formatarData(new Date().toISOString().slice(0, 10))}`} />
            </Stack>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3, borderRadius: 3, minWidth: { lg: 320 } }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Situação atual
          </Typography>
          <Stack spacing={1.5}>
            <Typography><strong>Funcionário:</strong> {usuarioAtual.name}</Typography>
            <Typography><strong>E-mail:</strong> {usuarioAtual.email}</Typography>
            <Typography><strong>Status:</strong> {usuarioAtual.status}</Typography>
            <Divider sx={{ my: 1 }} />
            <Typography><strong>Primeiro registro de hoje:</strong> {formatarDataHora(entradaHoje?.registrado_em)}</Typography>
            <Typography><strong>Último registro de hoje:</strong> {formatarDataHora(saidaHoje?.registrado_em)}</Typography>
          </Stack>
        </Paper>
      </Stack>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Últimos registros
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Hora</TableCell>
                <TableCell>Observação</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ultimosRegistros.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    Nenhum ponto registrado até agora.
                  </TableCell>
                </TableRow>
              ) : (
                ultimosRegistros.map((registro) => (
                  <TableRow key={registro.id_ponto} hover>
                    <TableCell>{formatarData(registro.data_referencia)}</TableCell>
                    <TableCell>{registro.tipo_registro}</TableCell>
                    <TableCell>{formatarHora(registro.registrado_em)}</TableCell>
                    <TableCell>{registro.observacao || '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  )
}

export default PontoFuncionarioPage
