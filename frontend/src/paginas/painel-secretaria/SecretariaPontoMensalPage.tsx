import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import SearchIcon from '@mui/icons-material/Search'

import { useSupabase } from '../../contextos/SupabaseContext'
import { useNotificacaoContext } from '../../contextos/NotificacaoContext'
import {
  carregarFuncionariosPonto,
  carregarRegistrosPeriodo,
} from '../ponto/pontoService'
import type { EspelhoPontoDia, UsuarioPontoRow } from '../ponto/pontoTypes'
import {
  formatarData,
  gerarHtmlEspelhoPonto,
  montarEspelhoMensal,
  nomeMesReferencia,
} from '../ponto/pontoUtils'

const obterMesAtual = (): string => {
  const data = new Date()
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
}

const obterInicioEFimMes = (mesReferencia: string) => {
  const [ano, mes] = mesReferencia.split('-').map(Number)
  const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`
  const fimDate = new Date(ano, mes, 0)
  const fim = `${fimDate.getFullYear()}-${String(fimDate.getMonth() + 1).padStart(2, '0')}-${String(fimDate.getDate()).padStart(2, '0')}`
  return { inicio, fim }
}

const SecretariaPontoMensalPage = () => {
  const { supabase } = useSupabase()
  const supabaseClient = supabase
  const { erro, aviso } = useNotificacaoContext()

  const [carregando, setCarregando] = useState(true)
  const [consultando, setConsultando] = useState(false)
  const [funcionarios, setFuncionarios] = useState<UsuarioPontoRow[]>([])
  const [funcionarioId, setFuncionarioId] = useState('')
  const [mesReferencia, setMesReferencia] = useState(obterMesAtual())
  const [espelho, setEspelho] = useState<EspelhoPontoDia[]>([])

  const carregarFuncionarios = useCallback(async () => {
    if (!supabaseClient) {
      erro('Cliente do Supabase não está disponível.')
      setCarregando(false)
      return
    }

    setCarregando(true)
    try {
      const lista = await carregarFuncionariosPonto(supabaseClient)
      setFuncionarios(lista)
    } catch (error: any) {
      erro(error?.message ?? 'Não foi possível carregar os funcionários.')
    } finally {
      setCarregando(false)
    }
  }, [erro, supabaseClient])

  useEffect(() => {
    void carregarFuncionarios()
  }, [carregarFuncionarios])

  const funcionarioSelecionado = useMemo(
    () => funcionarios.find((item) => item.id === funcionarioId) ?? null,
    [funcionarioId, funcionarios],
  )

  const consultar = async () => {
    if (!funcionarioId) {
      aviso('Selecione o funcionário antes de consultar o espelho mensal.')
      return
    }

    setConsultando(true)
    try {
      const { inicio, fim } = obterInicioEFimMes(mesReferencia)
      if (!supabaseClient) {
        throw new Error('Cliente do Supabase não está disponível.')
      }

      const registros = await carregarRegistrosPeriodo(supabaseClient, {
        userId: funcionarioId,
        dataInicio: inicio,
        dataFim: fim,
      })
      setEspelho(montarEspelhoMensal(registros, mesReferencia))
    } catch (error: any) {
      erro(error?.message ?? 'Não foi possível gerar o espelho mensal.')
    } finally {
      setConsultando(false)
    }
  }

  const gerarPdf = () => {
    if (!funcionarioSelecionado) {
      aviso('Selecione um funcionário e gere o espelho antes de imprimir.')
      return
    }

    if (espelho.length === 0) {
      aviso('Consulte o espelho mensal antes de gerar o PDF.')
      return
    }

    const html = gerarHtmlEspelhoPonto({
      nomeFuncionario: funcionarioSelecionado.name,
      emailFuncionario: funcionarioSelecionado.email,
      mesReferencia,
      espelho,
    })

    const janela = window.open('', '_blank', 'width=1100,height=900')
    if (!janela) {
      aviso('O navegador bloqueou a abertura da janela de impressão.')
      return
    }

    janela.document.open()
    janela.document.write(html)
    janela.document.close()
    janela.focus()
    janela.print()
  }

  const resumo = useMemo(() => {
    return {
      completos: espelho.filter((item) => item.status === 'Completo').length,
      parciais: espelho.filter((item) => item.status === 'Parcial').length,
      semRegistro: espelho.filter((item) => item.status === 'Sem registro').length,
    }
  }, [espelho])

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

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h4" fontWeight={800}>
          Relatório mensal de ponto
        </Typography>
        <Typography color="text.secondary">
          Emita o espelho do mês para assinatura do funcionário.
        </Typography>
      </Paper>

      <Alert severity="info">
        O botão “Gerar PDF” abre a versão pronta para impressão. No navegador, escolha
        “Salvar como PDF”.
      </Alert>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <FormControl fullWidth>
            <InputLabel id="funcionario-ponto-label">Funcionário</InputLabel>
            <Select
              labelId="funcionario-ponto-label"
              label="Funcionário"
              value={funcionarioId}
              onChange={(event) => setFuncionarioId(event.target.value)}
            >
              {funcionarios.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Competência"
            type="month"
            value={mesReferencia}
            onChange={(event) => setMesReferencia(event.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 220 }}
          />

          <Button
            variant="contained"
            onClick={consultar}
            disabled={consultando}
            startIcon={<SearchIcon />}
            sx={{ minWidth: 180 }}
          >
            {consultando ? 'Consultando...' : 'Consultar'}
          </Button>

          <Button
            variant="outlined"
            onClick={gerarPdf}
            startIcon={<PictureAsPdfIcon />}
            sx={{ minWidth: 180 }}
          >
            Gerar PDF
          </Button>
        </Stack>
      </Paper>

      {funcionarioSelecionado && (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Chip label={`Funcionário: ${funcionarioSelecionado.name}`} />
          <Chip label={`Competência: ${nomeMesReferencia(mesReferencia)}`} />
          <Chip label={`Dias completos: ${resumo.completos}`} color="success" />
          <Chip label={`Parciais: ${resumo.parciais}`} color="warning" />
          <Chip label={`Sem registro: ${resumo.semRegistro}`} color="default" />
        </Stack>
      )}

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Espelho mensal
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Dia</TableCell>
                <TableCell>Entrada</TableCell>
                <TableCell>Saída</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Observações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {espelho.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Selecione um funcionário e clique em consultar.
                  </TableCell>
                </TableRow>
              ) : (
                espelho.map((linha) => (
                  <TableRow key={linha.data} hover>
                    <TableCell>{formatarData(linha.data)}</TableCell>
                    <TableCell>{linha.diaSemana}</TableCell>
                    <TableCell>{linha.entrada}</TableCell>
                    <TableCell>{linha.saida}</TableCell>
                    <TableCell>{linha.status}</TableCell>
                    <TableCell>{linha.observacao}</TableCell>
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

export default SecretariaPontoMensalPage
