import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import RefreshIcon from '@mui/icons-material/Refresh'
import LoginIcon from '@mui/icons-material/Login'
import LogoutIcon from '@mui/icons-material/Logout'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import { useSupabase } from '../../contextos/SupabaseContext'
import { useAuth } from '../../contextos/AuthContext'
import { useNotificacaoContext } from '../../contextos/NotificacaoContext'
import {
  PONTO_GEOFENCE,
  dataHoraLocal,
  formatarDataISO,
  formatarDistancia,
  haversineMetros,
  type TipoRegistroPonto,
} from './pontoConfig'

type PontoRegistroRow = {
  id_ponto: number
  user_id: string
  data_referencia: string
  tipo_registro: TipoRegistroPonto
  registrado_em: string
  latitude: number | string | null
  longitude: number | string | null
  precisao_metros: number | string | null
  observacao: string | null
  origem: string | null
}

type GeoState = {
  latitude: number
  longitude: number
  accuracy: number | null
  distanciaMetros: number
  dentroDaArea: boolean
}

const PontoDigitalPage: React.FC = () => {
  const { supabase } = useSupabase()
  const { usuario } = useAuth()
  const { sucesso, erro, aviso, info } = useNotificacaoContext()

  const [geo, setGeo] = useState<GeoState | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [registrosHoje, setRegistrosHoje] = useState<PontoRegistroRow[]>([])
  const [carregandoRegistros, setCarregandoRegistros] = useState(false)
  const [salvando, setSalvando] = useState<TipoRegistroPonto | null>(null)

  const hojeIso = useMemo(() => formatarDataISO(new Date()), [])

  const carregarLocalizacao = useCallback(async () => {
    if (!navigator.geolocation) {
      erro('Este navegador não suporta geolocalização.')
      return
    }

    setGeoLoading(true)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        })
      })

      const latitude = pos.coords.latitude
      const longitude = pos.coords.longitude
      const accuracy = Number.isFinite(pos.coords.accuracy)
        ? pos.coords.accuracy
        : null
      const distanciaMetros = haversineMetros(
        latitude,
        longitude,
        PONTO_GEOFENCE.latitude,
        PONTO_GEOFENCE.longitude,
      )

      setGeo({
        latitude,
        longitude,
        accuracy,
        distanciaMetros,
        dentroDaArea: distanciaMetros <= PONTO_GEOFENCE.raioMetros,
      })
    } catch (e: any) {
      console.error(e)
      erro('Não foi possível obter sua localização atual.')
    } finally {
      setGeoLoading(false)
    }
  }, [erro])

  const carregarRegistrosHoje = useCallback(async () => {
    if (!supabase || !usuario?.id) return
    setCarregandoRegistros(true)
    try {
      const { data, error } = await supabase
        .from('ponto_registros')
        .select(
          'id_ponto, user_id, data_referencia, tipo_registro, registrado_em, latitude, longitude, precisao_metros, observacao, origem',
        )
        .eq('user_id', usuario.id)
        .eq('data_referencia', hojeIso)
        .order('registrado_em', { ascending: true })

      if (error) throw error
      setRegistrosHoje((data ?? []) as PontoRegistroRow[])
    } catch (e) {
      console.error(e)
      erro('Falha ao carregar seus registros de ponto de hoje.')
    } finally {
      setCarregandoRegistros(false)
    }
  }, [supabase, usuario?.id, hojeIso, erro])

  useEffect(() => {
    void carregarLocalizacao()
    void carregarRegistrosHoje()
  }, [carregarLocalizacao, carregarRegistrosHoje])

  const jaTemTipo = useCallback(
    (tipo: TipoRegistroPonto) =>
      registrosHoje.some((item) => String(item.tipo_registro) === tipo),
    [registrosHoje],
  )

  const registrar = useCallback(
    async (tipo: TipoRegistroPonto) => {
      if (!supabase || !usuario?.id) return
      if (!geo) {
        aviso('Atualize a localização antes de bater o ponto.')
        return
      }
      if (!geo.dentroDaArea) {
        erro(
          `Registro bloqueado. Você está a ${formatarDistancia(
            geo.distanciaMetros,
          )} do ponto autorizado. O limite é ${PONTO_GEOFENCE.raioMetros} m.`,
        )
        return
      }
      if (jaTemTipo(tipo)) {
        info(`Você já registrou ${tipo.toLowerCase()} hoje.`)
        return
      }

      setSalvando(tipo)
      try {
        const payload = {
          user_id: usuario.id,
          data_referencia: hojeIso,
          tipo_registro: tipo,
          latitude: geo.latitude,
          longitude: geo.longitude,
          precisao_metros: geo.accuracy,
          observacao: `Registro dentro do raio de ${PONTO_GEOFENCE.raioMetros} m`,
          origem: 'SIGE-CEJA Web',
        }

        const { error } = await supabase.from('ponto_registros').insert(payload)
        if (error) throw error

        sucesso(`${tipo} registrada com sucesso.`)
        await carregarRegistrosHoje()
      } catch (e: any) {
        console.error(e)
        erro(e?.message || `Falha ao registrar ${tipo.toLowerCase()}.`)
      } finally {
        setSalvando(null)
      }
    },
    [supabase, usuario?.id, geo, jaTemTipo, hojeIso, carregarRegistrosHoje, aviso, erro, info, sucesso],
  )

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" fontWeight={800}>
          Ponto digital
        </Typography>
        <Typography color="text.secondary">
          O registro só é permitido dentro de {PONTO_GEOFENCE.raioMetros} metros do ponto autorizado em {PONTO_GEOFENCE.latitude.toFixed(6)},{' '}
          {PONTO_GEOFENCE.longitude.toFixed(6)}.
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        <Box>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LocationOnIcon color="warning" />
                    <Typography variant="h6" fontWeight={700}>
                      Validação da localização
                    </Typography>
                  </Stack>
                  <Button
                    startIcon={geoLoading ? <CircularProgress size={18} /> : <RefreshIcon />}
                    onClick={() => void carregarLocalizacao()}
                    disabled={geoLoading}
                  >
                    Atualizar
                  </Button>
                </Stack>

                {!geo ? (
                  <Alert severity="info">Carregue sua localização para validar o raio do ponto.</Alert>
                ) : (
                  <>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip
                        color={geo.dentroDaArea ? 'success' : 'error'}
                        label={geo.dentroDaArea ? 'Dentro da área permitida' : 'Fora da área permitida'}
                      />
                      <Chip label={`Distância: ${formatarDistancia(geo.distanciaMetros)}`} />
                      <Chip label={`Precisão: ${formatarDistancia(geo.accuracy)}`} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Sua posição atual: {geo.latitude.toFixed(6)}, {geo.longitude.toFixed(6)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ponto autorizado: {PONTO_GEOFENCE.latitude.toFixed(6)}, {PONTO_GEOFENCE.longitude.toFixed(6)}
                    </Typography>
                  </>
                )}

                <Divider />

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button
                    fullWidth
                    size="large"
                    variant="contained"
                    color="success"
                    startIcon={<LoginIcon />}
                    disabled={!geo?.dentroDaArea || salvando !== null || jaTemTipo('Entrada')}
                    onClick={() => void registrar('Entrada')}
                  >
                    {salvando === 'Entrada' ? 'Registrando...' : jaTemTipo('Entrada') ? 'Entrada já registrada' : 'Bater entrada'}
                  </Button>
                  <Button
                    fullWidth
                    size="large"
                    variant="contained"
                    color="warning"
                    startIcon={<LogoutIcon />}
                    disabled={!geo?.dentroDaArea || salvando !== null || jaTemTipo('Saida')}
                    onClick={() => void registrar('Saida')}
                  >
                    {salvando === 'Saida' ? 'Registrando...' : jaTemTipo('Saida') ? 'Saída já registrada' : 'Bater saída'}
                  </Button>
                </Stack>

                {!geo?.dentroDaArea ? (
                  <Alert severity="warning">
                    Fora do raio permitido. O sistema aceita registro apenas neste local e dentro de {PONTO_GEOFENCE.raioMetros} metros.
                  </Alert>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <AccessTimeFilledIcon color="warning" />
                  <Typography variant="h6" fontWeight={700}>
                    Meus registros de hoje
                  </Typography>
                </Stack>

                {carregandoRegistros ? (
                  <Box py={4} textAlign="center">
                    <CircularProgress />
                  </Box>
                ) : registrosHoje.length === 0 ? (
                  <Alert severity="info">Nenhum registro encontrado para hoje.</Alert>
                ) : (
                  <List disablePadding>
                    {registrosHoje.map((registro) => (
                      <ListItem key={registro.id_ponto} divider>
                        <ListItemText
                          primary={registro.tipo_registro}
                          secondary={`Registrado em ${dataHoraLocal(registro.registrado_em)} • precisão ${formatarDistancia(Number(registro.precisao_metros ?? 0))}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Alert severity="info" icon={<MyLocationIcon fontSize="inherit" />}>
        O ponto digital fica visível para todos os perfis internos, exceto alunos. A gravação é feita na tabela <strong>ponto_registros</strong>.
      </Alert>
    </Stack>
  )
}

export default PontoDigitalPage
