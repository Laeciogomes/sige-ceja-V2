import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import PrintIcon from '@mui/icons-material/Print'
import SaveIcon from '@mui/icons-material/Save'
import AddIcon from '@mui/icons-material/Add'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import { useSupabase } from '../../contextos/SupabaseContext'
import { useNotificacaoContext } from '../../contextos/NotificacaoContext'
import { dataLocal, formatarDataISO, formatarMesISO } from '../ponto/pontoConfig'
import logoCejaUrl from '../../assets/imagens/logo-ceja.png'

type UsuarioOpcao = {
  id: string
  name: string
  email: string | null
  id_tipo_usuario: number
  foto_url?: string | null
}

type DiaLetivoRow = {
  id_dia?: number
  data_referencia: string
  descricao: string | null
  is_letivo: boolean
}

type DiaCalendario = {
  data_referencia: string
  descricao: string
  is_letivo: boolean
  origemBanco: boolean
  fimDeSemana: boolean
}

type AtestadoRow = {
  id_atestado: number
  user_id: string
  created_by: string | null
  data_inicio: string
  data_fim: string
  motivo: string | null
  observacao: string | null
}

type RegistroPontoRow = {
  user_id: string
  data_referencia: string
  tipo_registro: string
  registrado_em: string
  observacao?: string | null
}

type RelatorioLinha = {
  id: string
  nome: string
  email: string | null
  entradas: number
  saidas: number
  diasComRegistro: number
  diasComAtestado: number
}

type DiaRelatorioIndividual = {
  data: string
  entradas: string[]
  saidas: string[]
  atestados: string[]
  status: string
}

const diasNoMes = (mesIso: string): number => {
  const [ano, mes] = mesIso.split('-').map(Number)
  if (!ano || !mes) return 30
  return new Date(ano, mes, 0).getDate()
}

const primeiroDiaMes = (mesIso: string): string => `${mesIso}-01`
const ultimoDiaMes = (mesIso: string): string =>
  `${mesIso}-${String(diasNoMes(mesIso)).padStart(2, '0')}`

const ehFimDeSemana = (dataIso: string): boolean => {
  const d = new Date(`${dataIso}T12:00:00`)
  const day = d.getDay()
  return day === 0 || day === 6
}

const formatarHora = (dateTimeIso: string): string => {
  if (!dateTimeIso) return '—'
  const d = new Date(dateTimeIso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const isDiaCobertoPorAtestado = (
  dataIso: string,
  atestado: AtestadoRow,
): boolean => dataIso >= atestado.data_inicio && dataIso <= atestado.data_fim

const montarCalendarioMes = (
  mesIso: string,
  existentes: DiaLetivoRow[],
): DiaCalendario[] => {
  const map = new Map<string, DiaLetivoRow>()
  existentes.forEach((item) => map.set(item.data_referencia, item))
  const total = diasNoMes(mesIso)

  return Array.from({ length: total }, (_, index) => {
    const data = `${mesIso}-${String(index + 1).padStart(2, '0')}`
    const banco = map.get(data)
    const fimDeSemana = ehFimDeSemana(data)
    return {
      data_referencia: data,
      descricao: banco?.descricao ?? '',
      is_letivo: banco ? Boolean(banco.is_letivo) : !fimDeSemana,
      origemBanco: Boolean(banco),
      fimDeSemana,
    }
  })
}

const imageUrlToDataUrl = async (url?: string | null): Promise<string> => {
  if (!url) return ''
  try {
    const response = await fetch(url)
    if (!response.ok) return ''
    const blob = await response.blob()
    return await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(String(reader.result ?? ''))
      reader.onerror = () => resolve('')
      reader.readAsDataURL(blob)
    })
  } catch {
    return ''
  }
}

const SecretariaPontoGestaoPage: React.FC = () => {
  const { supabase } = useSupabase()
  const { sucesso, erro, aviso } = useNotificacaoContext()

  const [aba, setAba] = useState<number>(0)

  const [mesDias, setMesDias] = useState<string>(formatarMesISO())
  const [diasCalendario, setDiasCalendario] = useState<DiaCalendario[]>([])
  const [loadingDias, setLoadingDias] = useState<boolean>(false)

  const [usuarios, setUsuarios] = useState<UsuarioOpcao[]>([])
  const [loadingUsuarios, setLoadingUsuarios] = useState<boolean>(false)

  const [usuarioAtestado, setUsuarioAtestado] = useState<UsuarioOpcao | null>(null)
  const [dataInicio, setDataInicio] = useState<string>(formatarDataISO())
  const [dataFim, setDataFim] = useState<string>(formatarDataISO())
  const [motivo, setMotivo] = useState<string>('Atestado médico')
  const [observacao, setObservacao] = useState<string>('')
  const [atestados, setAtestados] = useState<AtestadoRow[]>([])
  const [loadingAtestados, setLoadingAtestados] = useState<boolean>(false)

  const [mesRelatorio, setMesRelatorio] = useState<string>(formatarMesISO())
  const [usuarioRelatorio, setUsuarioRelatorio] = useState<UsuarioOpcao | null>(null)
  const [relatorio, setRelatorio] = useState<RelatorioLinha[]>([])
  const [registrosMes, setRegistrosMes] = useState<RegistroPontoRow[]>([])
  const [atestadosMes, setAtestadosMes] = useState<AtestadoRow[]>([])
  const [diasLetivosMes, setDiasLetivosMes] = useState<Set<string>>(new Set())
  const [loadingRelatorio, setLoadingRelatorio] = useState<boolean>(false)

  const [usuarioPontoManual, setUsuarioPontoManual] = useState<UsuarioOpcao | null>(null)
  const [dataPontoManual, setDataPontoManual] = useState<string>(formatarDataISO())
  const [horaPontoManual, setHoraPontoManual] = useState<string>('08:00')
  const [tipoPontoManual, setTipoPontoManual] = useState<'Entrada' | 'Saida'>('Entrada')
  const [observacaoPontoManual, setObservacaoPontoManual] = useState<string>('Registro manual pela secretaria')
  const [salvandoPontoManual, setSalvandoPontoManual] = useState<boolean>(false)

  const usuariosMap = useMemo(() => {
    const map = new Map<string, UsuarioOpcao>()
    usuarios.forEach((u) => map.set(u.id, u))
    return map
  }, [usuarios])

  const carregarUsuarios = useCallback(async () => {
    if (!supabase) return
    setLoadingUsuarios(true)
    try {
      const { data, error: queryError } = await supabase
        .from('usuarios')
        .select('id, name, email, id_tipo_usuario, foto_url')
        .neq('id_tipo_usuario', 5)
        .order('name', { ascending: true })

      if (queryError) throw queryError
      setUsuarios((data ?? []) as UsuarioOpcao[])
    } catch (e) {
      console.error(e)
      erro('Falha ao carregar usuários para o módulo de ponto.')
    } finally {
      setLoadingUsuarios(false)
    }
  }, [supabase, erro])

  const carregarDias = useCallback(async () => {
    if (!supabase) return
    setLoadingDias(true)
    try {
      const { data, error: queryError } = await supabase
        .from('dias_letivos')
        .select('id_dia, data_referencia, descricao, is_letivo')
        .gte('data_referencia', primeiroDiaMes(mesDias))
        .lte('data_referencia', ultimoDiaMes(mesDias))
        .order('data_referencia', { ascending: true })

      if (queryError) throw queryError
      setDiasCalendario(montarCalendarioMes(mesDias, (data ?? []) as DiaLetivoRow[]))
    } catch (e) {
      console.error(e)
      erro('Falha ao carregar dias letivos.')
      setDiasCalendario(montarCalendarioMes(mesDias, []))
    } finally {
      setLoadingDias(false)
    }
  }, [supabase, mesDias, erro])

  const salvarDiasMes = useCallback(async () => {
    if (!supabase) return
    try {
      const payload = diasCalendario.map((dia) => ({
        data_referencia: dia.data_referencia,
        descricao: dia.descricao.trim() || null,
        is_letivo: dia.is_letivo,
      }))

      const { error: upsertError } = await supabase
        .from('dias_letivos')
        .upsert(payload, { onConflict: 'data_referencia' })

      if (upsertError) throw upsertError
      sucesso('Dias do mês salvos com sucesso.')
      await carregarDias()
    } catch (e) {
      console.error(e)
      erro('Falha ao salvar os dias do mês.')
    }
  }, [supabase, diasCalendario, sucesso, erro, carregarDias])

  const carregarAtestados = useCallback(async () => {
    if (!supabase) return
    setLoadingAtestados(true)
    try {
      const { data, error: queryError } = await supabase
        .from('ponto_atestados')
        .select('id_atestado, user_id, created_by, data_inicio, data_fim, motivo, observacao')
        .order('data_inicio', { ascending: false })
        .limit(200)

      if (queryError) throw queryError
      setAtestados((data ?? []) as AtestadoRow[])
    } catch (e) {
      console.error(e)
      erro('Falha ao carregar atestados.')
    } finally {
      setLoadingAtestados(false)
    }
  }, [supabase, erro])

  const carregarRelatorio = useCallback(async () => {
    if (!supabase) return
    setLoadingRelatorio(true)
    try {
      const inicio = primeiroDiaMes(mesRelatorio)
      const fim = ultimoDiaMes(mesRelatorio)

      const { data: usersData, error: usersError } = await supabase
        .from('usuarios')
        .select('id, name, email, id_tipo_usuario, foto_url')
        .neq('id_tipo_usuario', 5)
        .order('name', { ascending: true })
      if (usersError) throw usersError

      const { data: registrosData, error: registrosError } = await supabase
        .from('ponto_registros')
        .select('user_id, data_referencia, tipo_registro, registrado_em, observacao')
        .gte('data_referencia', inicio)
        .lte('data_referencia', fim)
        .order('data_referencia', { ascending: true })
        .order('registrado_em', { ascending: true })
      if (registrosError) throw registrosError

      const { data: atestadosData, error: atestadosError } = await supabase
        .from('ponto_atestados')
        .select('id_atestado, user_id, created_by, data_inicio, data_fim, motivo, observacao')
        .lte('data_inicio', fim)
        .gte('data_fim', inicio)
        .order('data_inicio', { ascending: true })
      if (atestadosError) throw atestadosError

      const { data: diasData, error: diasError } = await supabase
        .from('dias_letivos')
        .select('data_referencia, is_letivo')
        .gte('data_referencia', inicio)
        .lte('data_referencia', fim)
      if (diasError) throw diasError

      const users = (usersData ?? []) as UsuarioOpcao[]
      const registros = (registrosData ?? []) as RegistroPontoRow[]
      const atestadosPeriodo = (atestadosData ?? []) as AtestadoRow[]
      const diasDataTipados = (diasData ?? []) as Array<{ data_referencia: string; is_letivo: boolean }>

      const diasLetivos = new Set<string>()
      if (diasDataTipados.length > 0) {
        diasDataTipados.forEach((d) => {
          if (d.is_letivo) diasLetivos.add(d.data_referencia)
        })
      } else {
        const total = diasNoMes(mesRelatorio)
        for (let i = 1; i <= total; i += 1) {
          const data = `${mesRelatorio}-${String(i).padStart(2, '0')}`
          if (!ehFimDeSemana(data)) diasLetivos.add(data)
        }
      }

      setDiasLetivosMes(diasLetivos)
      setRegistrosMes(registros)
      setAtestadosMes(atestadosPeriodo)
      setUsuarios(users)

      const map = new Map<string, RelatorioLinha>()
      users.forEach((u) => {
        map.set(u.id, {
          id: u.id,
          nome: u.name,
          email: u.email,
          entradas: 0,
          saidas: 0,
          diasComRegistro: 0,
          diasComAtestado: 0,
        })
      })

      const diasPorUsuario = new Map<string, Set<string>>()
      const diasAtestadoPorUsuario = new Map<string, Set<string>>()

      registros.forEach((r) => {
        const row = map.get(r.user_id)
        if (!row || !diasLetivos.has(r.data_referencia)) return
        if (r.tipo_registro === 'Entrada') row.entradas += 1
        if (r.tipo_registro === 'Saida') row.saidas += 1
        const set = diasPorUsuario.get(r.user_id) ?? new Set<string>()
        set.add(r.data_referencia)
        diasPorUsuario.set(r.user_id, set)
      })

      atestadosPeriodo.forEach((a) => {
        const row = map.get(a.user_id)
        if (!row) return
        const set = diasAtestadoPorUsuario.get(a.user_id) ?? new Set<string>()
        let cursor = new Date(`${a.data_inicio}T12:00:00`)
        const limite = new Date(`${a.data_fim}T12:00:00`)
        while (cursor <= limite) {
          const data = cursor.toISOString().slice(0, 10)
          if (data >= inicio && data <= fim && diasLetivos.has(data)) set.add(data)
          cursor.setDate(cursor.getDate() + 1)
        }
        diasAtestadoPorUsuario.set(a.user_id, set)
      })

      map.forEach((value, key) => {
        value.diasComRegistro = diasPorUsuario.get(key)?.size ?? 0
        value.diasComAtestado = diasAtestadoPorUsuario.get(key)?.size ?? 0
      })

      setRelatorio(Array.from(map.values()))
    } catch (e) {
      console.error(e)
      erro('Falha ao carregar relatório mensal do ponto.')
    } finally {
      setLoadingRelatorio(false)
    }
  }, [supabase, mesRelatorio, erro])

  const salvarAtestado = useCallback(async () => {
    if (!supabase) return
    if (!usuarioAtestado?.id) {
      aviso('Selecione o usuário do atestado.')
      return
    }
    if (!dataInicio || !dataFim) {
      aviso('Informe o período do atestado.')
      return
    }
    if (dataFim < dataInicio) {
      aviso('A data final não pode ser menor que a inicial.')
      return
    }

    try {
      const payload = {
        user_id: usuarioAtestado.id,
        data_inicio: dataInicio,
        data_fim: dataFim,
        motivo: motivo.trim() || 'Atestado médico',
        observacao: observacao.trim() || null,
      }

      const { error: insertError } = await supabase
        .from('ponto_atestados')
        .insert(payload)
      if (insertError) throw insertError

      sucesso('Atestado registrado com sucesso.')
      setObservacao('')
      await carregarAtestados()
      if (aba === 2) await carregarRelatorio()
    } catch (e) {
      console.error(e)
      erro('Falha ao salvar atestado.')
    }
  }, [
    supabase,
    usuarioAtestado,
    dataInicio,
    dataFim,
    motivo,
    observacao,
    aviso,
    sucesso,
    erro,
    carregarAtestados,
    carregarRelatorio,
    aba,
  ])

  const salvarPontoManual = useCallback(async () => {
    if (!supabase) return
    if (!usuarioPontoManual?.id) {
      aviso('Selecione o funcionário do lançamento manual.')
      return
    }
    if (!dataPontoManual || !horaPontoManual) {
      aviso('Informe a data e a hora do ponto manual.')
      return
    }

    setSalvandoPontoManual(true)
    try {
      const registradoEm = new Date(`${dataPontoManual}T${horaPontoManual}:00`)
      const { error: insertError } = await supabase.from('ponto_registros').insert({
        user_id: usuarioPontoManual.id,
        data_referencia: dataPontoManual,
        tipo_registro: tipoPontoManual,
        registrado_em: registradoEm.toISOString(),
        observacao: observacaoPontoManual.trim() || 'Registro manual pela secretaria',
      })
      if (insertError) throw insertError

      sucesso('Ponto manual lançado com sucesso.')
      if (aba === 2) await carregarRelatorio()
    } catch (e) {
      console.error(e)
      erro('Falha ao lançar ponto manual.')
    } finally {
      setSalvandoPontoManual(false)
    }
  }, [
    supabase,
    usuarioPontoManual,
    dataPontoManual,
    horaPontoManual,
    tipoPontoManual,
    observacaoPontoManual,
    sucesso,
    erro,
    aviso,
    carregarRelatorio,
    aba,
  ])

  useEffect(() => {
    void carregarUsuarios()
  }, [carregarUsuarios])

  useEffect(() => {
    if (aba === 0) void carregarDias()
    if (aba === 1) void carregarAtestados()
    if (aba === 2) void carregarRelatorio()
  }, [aba, carregarDias, carregarAtestados, carregarRelatorio])

  useEffect(() => {
    if (aba === 0) void carregarDias()
  }, [mesDias, aba, carregarDias])

  const resumoRelatorio = useMemo(
    () =>
      relatorio.reduce(
        (acc, item) => {
          acc.entradas += item.entradas
          acc.saidas += item.saidas
          acc.atestados += item.diasComAtestado
          return acc
        },
        { entradas: 0, saidas: 0, atestados: 0 },
      ),
    [relatorio],
  )

  const relatorioIndividual = useMemo((): DiaRelatorioIndividual[] => {
    if (!usuarioRelatorio) return []
    const diasOrdenados = Array.from(diasLetivosMes).sort((a, b) => a.localeCompare(b))

    return diasOrdenados.map((data) => {
      const registrosDia = registrosMes.filter(
        (r) => r.user_id === usuarioRelatorio.id && r.data_referencia === data,
      )
      const entradas = registrosDia
        .filter((r) => r.tipo_registro === 'Entrada')
        .map((r) => formatarHora(r.registrado_em))
      const saidas = registrosDia
        .filter((r) => r.tipo_registro === 'Saida')
        .map((r) => formatarHora(r.registrado_em))
      const atestadosDia = atestadosMes.filter(
        (a) => a.user_id === usuarioRelatorio.id && isDiaCobertoPorAtestado(data, a),
      )
      const atestadosFormatados = atestadosDia.map(
        (a) => `${a.motivo ?? 'Atestado'}${a.observacao ? ` (${a.observacao})` : ''}`,
      )

      let status = 'Sem registro'
      if (atestadosFormatados.length > 0) status = 'Com atestado'
      else if (entradas.length > 0 || saidas.length > 0) status = 'Com registros'

      return { data, entradas, saidas, atestados: atestadosFormatados, status }
    })
  }, [usuarioRelatorio, diasLetivosMes, registrosMes, atestadosMes])

  const atualizarDia = (data: string, patch: Partial<DiaCalendario>): void => {
    setDiasCalendario((prev) =>
      prev.map((dia) => (dia.data_referencia === data ? { ...dia, ...patch } : dia)),
    )
  }

  const marcarTodosUteisComoLetivos = (): void => {
    setDiasCalendario((prev) =>
      prev.map((dia) => ({ ...dia, is_letivo: dia.fimDeSemana ? dia.is_letivo : true })),
    )
  }

  const marcarSabadosDomingosComoNaoLetivos = (): void => {
    setDiasCalendario((prev) =>
      prev.map((dia) => ({ ...dia, is_letivo: dia.fimDeSemana ? false : dia.is_letivo })),
    )
  }

  const gerarPdfIndividual = async (): Promise<void> => {
    if (!usuarioRelatorio) {
      aviso('Selecione um funcionário para gerar o PDF individual.')
      return
    }

    const nome = usuarioRelatorio.name ?? 'Funcionário'
    const email = usuarioRelatorio.email ?? '—'

    const fotoDataUrl = usuarioRelatorio.foto_url
      ? await imageUrlToDataUrl(usuarioRelatorio.foto_url)
      : ''
    const logoDataUrl = await imageUrlToDataUrl(logoCejaUrl)

    const linhas = relatorioIndividual
      .map((dia) => {
        const entradas = dia.entradas.length > 0 ? dia.entradas.join(', ') : '—'
        const saidas = dia.saidas.length > 0 ? dia.saidas.join(', ') : '—'
        const atestadosTxt = dia.atestados.length > 0 ? dia.atestados.join('; ') : '—'
        return `
          <tr>
            <td>${dataLocal(dia.data)}</td>
            <td>${dia.status}</td>
            <td>${entradas}</td>
            <td>${saidas}</td>
            <td>${atestadosTxt}</td>
          </tr>
        `
      })
      .join('')

    const html = `
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Relatório de ponto - ${nome}</title>
          <style>
            @page { size: A4 landscape; margin: 10mm; }
            body { font-family: Arial, sans-serif; color: #1f2937; margin: 0; font-size: 11px; }
            .topo {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 16px;
              margin-bottom: 14px;
              border-bottom: 2px solid #1d4ed8;
              padding-bottom: 10px;
            }
            .topo-esquerda { display: flex; align-items: center; gap: 14px; }
            .foto-funcionario {
              width: 72px; height: 72px; border-radius: 10px; object-fit: cover;
              border: 1px solid #cbd5e1; background: #f8fafc;
            }
            .logo-escola { height: 52px; object-fit: contain; }
            h1 { margin: 0 0 4px; font-size: 20px; color: #0f172a; }
            .sub { font-size: 12px; color: #475569; line-height: 1.4; }
            .chips { margin: 10px 0 14px; }
            .chip {
              display: inline-block; padding: 5px 10px; margin-right: 6px; border-radius: 999px;
              background: #eff6ff; border: 1px solid #bfdbfe; font-size: 11px;
            }
            table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
            th, td { border: 1px solid #cbd5e1; padding: 5px 7px; vertical-align: top; }
            th { background: #eff6ff; color: #0f172a; text-align: left; }
            .assinatura { margin-top: 20px; display: flex; justify-content: flex-end; }
            .assinatura-box { width: 320px; text-align: center; font-size: 12px; color: #334155; }
            .linha { margin-top: 34px; border-top: 1px solid #334155; padding-top: 6px; }
          </style>
        </head>
        <body>
          <div class="topo">
            <div class="topo-esquerda">
              ${fotoDataUrl ? `<img src="${fotoDataUrl}" alt="Foto do funcionário" class="foto-funcionario" />` : ''}
              <div>
                <h1>Relatório individual de ponto</h1>
                <div class="sub">
                  Funcionário: ${nome}<br/>
                  E-mail: ${email}<br/>
                  Mês de referência: ${mesRelatorio}
                </div>
              </div>
            </div>
            <div>
              ${logoDataUrl ? `<img src="${logoDataUrl}" alt="Logo da escola" class="logo-escola" />` : ''}
            </div>
          </div>
          <div class="chips">
            <span class="chip">Entradas: ${relatorioIndividual.reduce((acc, item) => acc + item.entradas.length, 0)}</span>
            <span class="chip">Saídas: ${relatorioIndividual.reduce((acc, item) => acc + item.saidas.length, 0)}</span>
            <span class="chip">Dias com atestado: ${relatorioIndividual.filter((item) => item.atestados.length > 0).length}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Status</th>
                <th>Entradas</th>
                <th>Saídas</th>
                <th>Atestados</th>
              </tr>
            </thead>
            <tbody>${linhas}</tbody>
          </table>
          <div class="assinatura">
            <div class="assinatura-box">
              <div class="linha">Assinatura do funcionário</div>
            </div>
          </div>
        </body>
      </html>
    `

    const printWindow = window.open('', '_blank', 'width=1400,height=900')
    if (!printWindow) {
      aviso('Não foi possível abrir a janela de impressão.')
      return
    }

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" fontWeight={800}>
          Gestão do ponto
        </Typography>
        <Typography color="text.secondary">
          Dias não letivos por calendário mensal, atestados, lançamento manual e relatório mensal individual por funcionário.
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 3 }}>
        <Tabs value={aba} onChange={(_, v: number) => setAba(v)} variant="scrollable" scrollButtons="auto">
          <Tab icon={<EventAvailableIcon />} iconPosition="start" label="Dias letivos" />
          <Tab icon={<MedicalServicesIcon />} iconPosition="start" label="Atestados" />
          <Tab icon={<AddIcon />} iconPosition="start" label="Lançamento manual" />
          <Tab icon={<PrintIcon />} iconPosition="start" label="Relatório mensal" />
        </Tabs>
      </Card>

      {aba === 0 && (
        <Stack spacing={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
                <TextField
                  label="Mês"
                  type="month"
                  value={mesDias}
                  onChange={(e) => setMesDias(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <Button variant="outlined" onClick={marcarSabadosDomingosComoNaoLetivos}>
                  Marcar sábados e domingos como não letivos
                </Button>
                <Button variant="outlined" onClick={marcarTodosUteisComoLetivos}>
                  Marcar dias úteis como letivos
                </Button>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={() => void salvarDiasMes()}>
                  Salvar mês
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              {loadingDias ? (
                <CircularProgress />
              ) : (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      md: 'repeat(2, minmax(0, 1fr))',
                      lg: 'repeat(3, minmax(0, 1fr))',
                    },
                    gap: 2,
                  }}
                >
                  {diasCalendario.map((dia) => (
                    <Card key={dia.data_referencia} variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Stack spacing={1.5}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography fontWeight={700}>{dataLocal(dia.data_referencia)}</Typography>
                            <Chip
                              size="small"
                              label={dia.fimDeSemana ? 'Fim de semana' : dia.is_letivo ? 'Letivo' : 'Não letivo'}
                              color={dia.is_letivo ? 'success' : 'default'}
                            />
                          </Stack>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={dia.is_letivo}
                                onChange={(e) => atualizarDia(dia.data_referencia, { is_letivo: e.target.checked })}
                              />
                            }
                            label="Dia letivo"
                          />
                          <TextField
                            size="small"
                            label="Descrição"
                            value={dia.descricao}
                            onChange={(e) => atualizarDia(dia.data_referencia, { descricao: e.target.value })}
                            placeholder={dia.fimDeSemana ? 'Ex.: sábado letivo, evento, reposição' : 'Opcional'}
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Stack>
      )}

      {aba === 1 && (
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'minmax(320px, 5fr) minmax(420px, 7fr)' } }}>
          <Box>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack spacing={2}>
                  <Autocomplete
                    options={usuarios}
                    value={usuarioAtestado}
                    loading={loadingUsuarios}
                    onChange={(_, v) => setUsuarioAtestado(v)}
                    getOptionLabel={(o) => `${o.name}${o.email ? ` • ${o.email}` : ''}`}
                    renderInput={(params) => <TextField {...params} label="Usuário" />}
                  />
                  <TextField label="Início" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} InputLabelProps={{ shrink: true }} />
                  <TextField label="Fim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} InputLabelProps={{ shrink: true }} />
                  <TextField label="Motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
                  <TextField label="Observação" multiline minRows={3} value={observacao} onChange={(e) => setObservacao(e.target.value)} />
                  <Button variant="contained" startIcon={<AddIcon />} onClick={() => void salvarAtestado()}>
                    Lançar atestado
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Box>

          <Box>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                {loadingAtestados ? (
                  <CircularProgress />
                ) : atestados.length === 0 ? (
                  <Alert severity="info">Nenhum atestado cadastrado.</Alert>
                ) : (
                  <List>
                    {atestados.map((item) => {
                      const usuario = usuariosMap.get(item.user_id)
                      const criador = item.created_by ? usuariosMap.get(item.created_by) : null
                      return (
                        <ListItem key={item.id_atestado} divider alignItems="flex-start">
                          <ListItemText
                            primary={`${usuario?.name ?? item.user_id} • ${dataLocal(item.data_inicio)} até ${dataLocal(item.data_fim)}`}
                            secondary={[
                              item.motivo ?? 'Sem motivo',
                              item.observacao || null,
                              criador?.name ? `Lançado por: ${criador.name}` : null,
                            ].filter(Boolean).join(' • ')}
                          />
                        </ListItem>
                      )
                    })}
                  </List>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {aba === 2 && (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={700}>
                Lançamento manual de ponto
              </Typography>
              <Typography color="text.secondary">
                Use este formulário quando um funcionário esquecer de registrar entrada ou saída.
              </Typography>
              <Autocomplete
                options={usuarios}
                value={usuarioPontoManual}
                loading={loadingUsuarios}
                onChange={(_, v) => setUsuarioPontoManual(v)}
                getOptionLabel={(o) => `${o.name}${o.email ? ` • ${o.email}` : ''}`}
                renderInput={(params) => <TextField {...params} label="Funcionário" />}
              />
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField label="Data" type="date" value={dataPontoManual} onChange={(e) => setDataPontoManual(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
                <TextField label="Hora" type="time" value={horaPontoManual} onChange={(e) => setHoraPontoManual(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
                <TextField label="Tipo" select value={tipoPontoManual} onChange={(e) => setTipoPontoManual(e.target.value as 'Entrada' | 'Saida')} fullWidth SelectProps={{ native: true }}>
                  <option value="Entrada">Entrada</option>
                  <option value="Saida">Saída</option>
                </TextField>
              </Stack>
              <TextField
                label="Observação"
                value={observacaoPontoManual}
                onChange={(e) => setObservacaoPontoManual(e.target.value)}
                multiline
                minRows={2}
              />
              <Button variant="contained" startIcon={<SaveIcon />} onClick={() => void salvarPontoManual()} disabled={salvandoPontoManual}>
                {salvandoPontoManual ? 'Salvando...' : 'Salvar ponto manual'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {aba === 3 && (
        <Stack spacing={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
                <TextField label="Mês" type="month" value={mesRelatorio} onChange={(e) => setMesRelatorio(e.target.value)} InputLabelProps={{ shrink: true }} />
                <Autocomplete
                  sx={{ minWidth: 320 }}
                  options={usuarios}
                  value={usuarioRelatorio}
                  loading={loadingUsuarios}
                  onChange={(_, v) => setUsuarioRelatorio(v)}
                  getOptionLabel={(o) => `${o.name}${o.email ? ` • ${o.email}` : ''}`}
                  renderInput={(params) => <TextField {...params} label="Funcionário" />}
                />
                <Button variant="contained" onClick={() => void carregarRelatorio()}>
                  Atualizar relatório
                </Button>
                <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={() => void gerarPdfIndividual()}>
                  Gerar PDF individual
                </Button>
                <Chip label={`Entradas: ${resumoRelatorio.entradas}`} />
                <Chip label={`Saídas: ${resumoRelatorio.saidas}`} />
                <Chip label={`Dias com atestado: ${resumoRelatorio.atestados}`} />
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              {loadingRelatorio ? (
                <CircularProgress />
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Usuário</TableCell>
                        <TableCell>E-mail</TableCell>
                        <TableCell align="right">Entradas</TableCell>
                        <TableCell align="right">Saídas</TableCell>
                        <TableCell align="right">Dias com registro</TableCell>
                        <TableCell align="right">Dias com atestado</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {relatorio.map((item) => (
                        <TableRow key={item.id} hover>
                          <TableCell>{item.nome}</TableCell>
                          <TableCell>{item.email ?? '—'}</TableCell>
                          <TableCell align="right">{item.entradas}</TableCell>
                          <TableCell align="right">{item.saidas}</TableCell>
                          <TableCell align="right">{item.diasComRegistro}</TableCell>
                          <TableCell align="right">{item.diasComAtestado}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          {usuarioRelatorio && (
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Prévia do relatório individual — {usuarioRelatorio.name}
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Data</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Entradas</TableCell>
                        <TableCell>Saídas</TableCell>
                        <TableCell>Atestados</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {relatorioIndividual.map((item) => (
                        <TableRow key={item.data}>
                          <TableCell>{dataLocal(item.data)}</TableCell>
                          <TableCell>{item.status}</TableCell>
                          <TableCell>{item.entradas.length > 0 ? item.entradas.join(', ') : '—'}</TableCell>
                          <TableCell>{item.saidas.length > 0 ? item.saidas.join(', ') : '—'}</TableCell>
                          <TableCell>{item.atestados.length > 0 ? item.atestados.join('; ') : '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}

          <Alert severity="info">
            O PDF é gerado individualmente por funcionário, com foto, logo da escola, assinatura e apenas os dias letivos do mês selecionado.
          </Alert>
        </Stack>
      )}
    </Stack>
  )
}

export default SecretariaPontoGestaoPage
