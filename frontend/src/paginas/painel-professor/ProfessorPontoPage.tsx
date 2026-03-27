import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material'
import LoginIcon from '@mui/icons-material/Login'
import LogoutIcon from '@mui/icons-material/Logout'
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled'

import { useSupabase } from '../../contextos/SupabaseContext'
import { useAuth } from '../../contextos/AuthContext'
import { useNotificacaoContext } from '../../contextos/NotificacaoContext'

type RegistroPonto = {
  id_ponto: number
  data_referencia: string
  tipo_registro: 'Entrada' | 'Saida'
  registrado_em: string
  observacao?: string | null
}

function hojeISO() {
  const agora = new Date()
  const tzOffset = agora.getTimezoneOffset() * 60000
  return new Date(agora.getTime() - tzOffset).toISOString().slice(0, 10)
}

function formatarDataHora(valor?: string | null) {
  if (!valor) return '—'
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return '—'
  return data.toLocaleString('pt-BR')
}

export default function ProfessorPontoPage() {
  const { supabase } = useSupabase()
  const { usuario } = useAuth() as { usuario: any }
  const { sucesso, erro, aviso } = useNotificacaoContext()

  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [registrosHoje, setRegistrosHoje] = useState<RegistroPonto[]>([])

  const userId = String(usuario?.id ?? '').trim()
  const dataHoje = useMemo(() => hojeISO(), [])

  const carregar = useCallback(async () => {
    if (!supabase || !userId) return
    setCarregando(true)
    try {
      const { data, error } = await supabase
        .from('ponto_registros')
        .select('id_ponto, data_referencia, tipo_registro, registrado_em, observacao')
        .eq('user_id', userId)
        .eq('data_referencia', dataHoje)
        .order('registrado_em', { ascending: true })

      if (error) throw error
      setRegistrosHoje((data ?? []) as RegistroPonto[])
    } catch (e) {
      console.error(e)
      erro('Falha ao carregar os registros de ponto.')
    } finally {
      setCarregando(false)
    }
  }, [supabase, userId, dataHoje, erro])

  useEffect(() => {
    void carregar()
  }, [carregar])

  const ultimaMarcacao = registrosHoje[registrosHoje.length - 1] ?? null
  const podeRegistrarEntrada = !ultimaMarcacao || ultimaMarcacao.tipo_registro === 'Saida'
  const podeRegistrarSaida = !!ultimaMarcacao && ultimaMarcacao.tipo_registro === 'Entrada'

  const registrar = useCallback(
    async (tipo: 'Entrada' | 'Saida') => {
      if (!supabase || !userId) return

      if (tipo === 'Entrada' && !podeRegistrarEntrada) {
        aviso('Já existe uma entrada aberta para hoje.')
        return
      }

      if (tipo === 'Saida' && !podeRegistrarSaida) {
        aviso('Registre uma entrada antes de lançar a saída.')
        return
      }

      setSalvando(true)
      try {
        const payload = {
          user_id: userId,
          data_referencia: dataHoje,
          tipo_registro: tipo,
          origem: 'SIGE-CEJA Web',
        }

        const { error } = await supabase.from('ponto_registros').insert(payload)
        if (error) throw error

        sucesso(`${tipo} registrada com sucesso.`)
        await carregar()
      } catch (e) {
        console.error(e)
        erro(`Falha ao registrar ${tipo.toLowerCase()}.`)
      } finally {
        setSalvando(false)
      }
    },
    [supabase, userId, dataHoje, podeRegistrarEntrada, podeRegistrarSaida, aviso, sucesso, erro, carregar]
  )

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Box>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Bater ponto
        </Typography>
        <Typography color="text.secondary">
          Registre sua entrada e saída. Os lançamentos são gravados na tabela <strong>ponto_registros</strong>.
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <AccessTimeFilledIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Situação de hoje
                </Typography>
              </Stack>

              <Typography variant="body2" color="text.secondary">
                Data de referência: {new Date(`${dataHoje}T12:00:00`).toLocaleDateString('pt-BR')}
              </Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  color={podeRegistrarEntrada ? 'success' : 'default'}
                  label={podeRegistrarEntrada ? 'Pronto para entrada' : 'Entrada já registrada'}
                />
                <Chip
                  color={podeRegistrarSaida ? 'warning' : 'default'}
                  label={podeRegistrarSaida ? 'Pronto para saída' : 'Saída indisponível'}
                />
              </Stack>

              <Typography variant="body1">
                Última marcação: <strong>{ultimaMarcacao ? `${ultimaMarcacao.tipo_registro} em ${formatarDataHora(ultimaMarcacao.registrado_em)}` : 'nenhuma'}</strong>
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  startIcon={salvando ? <CircularProgress size={18} color="inherit" /> : <LoginIcon />}
                  disabled={salvando || !podeRegistrarEntrada}
                  onClick={() => void registrar('Entrada')}
                >
                  Registrar entrada
                </Button>
                <Button
                  variant="outlined"
                  startIcon={salvando ? <CircularProgress size={18} color="inherit" /> : <LogoutIcon />}
                  disabled={salvando || !podeRegistrarSaida}
                  onClick={() => void registrar('Saida')}
                >
                  Registrar saída
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Registros de hoje
            </Typography>

            {carregando ? (
              <Stack alignItems="center" py={4}>
                <CircularProgress />
              </Stack>
            ) : registrosHoje.length === 0 ? (
              <Alert severity="info">Nenhum registro encontrado para hoje.</Alert>
            ) : (
              <Stack spacing={1.5}>
                {registrosHoje.map((registro) => (
                  <Box
                    key={registro.id_ponto}
                    sx={{
                      p: 1.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                    }}
                  >
                    <Typography fontWeight={700}>{registro.tipo_registro}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatarDataHora(registro.registrado_em)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  )
}
