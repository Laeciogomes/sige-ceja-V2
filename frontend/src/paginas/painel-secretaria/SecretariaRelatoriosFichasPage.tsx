import React, { useEffect, useRef, useState } from 'react'

import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
  Autocomplete,
} from '@mui/material'

import RefreshIcon from '@mui/icons-material/Refresh'
import ClearIcon from '@mui/icons-material/Clear'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'

import { useSupabase } from '../../contextos/SupabaseContext'
import { useNotificacaoContext } from '../../contextos/NotificacaoContext'

type UsuarioJoin = {
  id?: string
  name?: string
  email?: string
  foto_url?: string | null
  celular?: string | null
  data_nascimento?: string | null
  logradouro?: string | null
  numero_endereco?: string | null
  bairro?: string | null
  municipio?: string | null
}

type AlunoJoin = {
  id_aluno: number
  usuarios?: UsuarioJoin | UsuarioJoin[] | null
}

type AlunoOpcao = {
  id_aluno: number
  nome: string
  email?: string | null
  foto_url?: string | null
}

type DisciplinaRow = {
  id_disciplina: number
  nome_disciplina: string
}

type ProfessorJoin = {
  usuarios?: UsuarioJoin | UsuarioJoin[] | null
}

type SessaoAtendimentoRow = {
  id_sessao: number
  hora_entrada: string
  hora_saida: string | null
  professores?: ProfessorJoin | null
  resumo_atividades?: string | null
}

type MatriculaRow = {
  id_matricula: number
  numero_inscricao: string
  data_matricula: string
  niveis_ensino?: { nome?: string | null } | null
}

// ===================== Helpers =====================

const obterPrimeiro = <T,>(valor?: T | T[] | null): T | null => {
  if (!valor) return null
  if (Array.isArray(valor)) return valor[0] ?? null
  return valor
}

const pad2 = (n: number) => String(n).padStart(2, '0')

const meses = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

const intervaloMesUTC = (ano: number, mes: number) => {
  // mes: 1..12
  const inicio = new Date(Date.UTC(ano, mes - 1, 1, 0, 0, 0, 0)).toISOString()
  const fim = new Date(Date.UTC(ano, mes, 1, 0, 0, 0, 0)).toISOString()
  return { inicio, fim }
}

const formatarData = (iso?: string | null) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('pt-BR')
  } catch {
    return iso
  }
}

const formatarHora = (iso?: string | null) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

const normalizarTexto = (v: string) => {
  try {
    return v
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim()
  } catch {
    return v.toLowerCase().trim()
  }
}

const loadJsPdf = async (): Promise<any> => {
  const mod = await import('jspdf')
  return (mod as any).jsPDF
}

/**
 * Converte uma imagem (URL) em DataURL base64 para o jsPDF.
 * Funciona para foto_url do Supabase (public) e imagens do /public (ex: /ceja/logo.png).
 */
const imageUrlToDataUrl = async (url: string): Promise<string | null> => {
  try {
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) return null
    const blob = await res.blob()
    const reader = new FileReader()
    const dataUrl: string = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    return dataUrl
  } catch {
    return null
  }
}

const guessImageType = (dataUrl: string): 'PNG' | 'JPEG' => {
  if (dataUrl.startsWith('data:image/jpeg')) return 'JPEG'
  return 'PNG'
}

const textoOuTraco = (v?: string | null) => (v && v.trim() ? v.trim() : '')

// ===================== PDF (modelo da ficha) =====================

type LinhaAtendimento = {
  data: string
  entrada: string
  saida: string
  tipo: string
  professor: string
  registro: string
}

type FichaPdfArgs = {
  aluno: {
    id_aluno: number
    nome: string
    foto_url?: string | null
    telefone?: string | null
    data_nasc?: string | null
    endereco?: string | null
    bairro?: string | null
    municipio?: string | null
  }
  matricula: {
    numero_inscricao: string
    nivel: string
    inicio: string // data_matricula
  }
  disciplina: {
    nome: string
  }
  periodo: {
    ano: number
    mes: number
  }
  linhas: LinhaAtendimento[]
  logoUrlOpcional?: string // se existir no /public
}

/**
 * Desenha retângulo com borda.
 */
const rect = (doc: any, x: number, y: number, w: number, h: number) => {
  doc.rect(x, y, w, h)
}

/**
 * Texto com quebra simples para caber em coluna (registro de atividade).
 */
const wrapText = (doc: any, text: string, maxWidth: number) => {
  const clean = text ?? ''
  return doc.splitTextToSize(clean, maxWidth)
}

/**
 * Gera PDF com layout “igual ao modelo” (linhas, caixas e tabela).
 */
const gerarPdfFichaModelo = async (args: FichaPdfArgs) => {
  const jsPDF = await loadJsPdf()
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // Página A4: 210 x 297
  const pageW = 210
  const margin = 10

  // Tentar carregar logo e foto (opcionais)
  const logoData = args.logoUrlOpcional
    ? await imageUrlToDataUrl(args.logoUrlOpcional)
    : null
  const fotoData = args.aluno.foto_url
    ? await imageUrlToDataUrl(args.aluno.foto_url)
    : null

  const drawHeader = () => {
    // área topo
    const topY = 8
    const logoBox = { x: margin, y: topY, w: 28, h: 28 }
    const rightBox = { x: pageW - margin - 62, y: topY, w: 62, h: 28 }

    // logo
    rect(doc, logoBox.x, logoBox.y, logoBox.w, logoBox.h)
    if (logoData) {
      const type = guessImageType(logoData)
      // encaixe mantendo margem interna
      doc.addImage(
        logoData,
        type,
        logoBox.x + 1,
        logoBox.y + 1,
        logoBox.w - 2,
        logoBox.h - 2,
      )
    } else {
      doc.setFontSize(8)
      doc.text('LOGO', logoBox.x + logoBox.w / 2, logoBox.y + logoBox.h / 2, {
        align: 'center',
      })
    }

    // texto central
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('CEJA - Frei José Ademir de Almeida.', pageW / 2, topY + 8, {
      align: 'center',
    })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(
      'Rua: Sitônio Monteiro, 320 — Centro — Canindé — CE.',
      pageW / 2,
      topY + 14,
      { align: 'center' },
    )
    doc.text(
      'Fone(85) 3343 6818 / E-mail: cejacaninde@escola.ce.gov.br',
      pageW / 2,
      topY + 19,
      { align: 'center' },
    )

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('FICHA DE ACOMPANHAMENTO DO ALUNO', pageW / 2, topY + 26, {
      align: 'center',
    })

    // bloco direita (inscrição + foto)
    rect(doc, rightBox.x, rightBox.y, rightBox.w, rightBox.h)

    // coluna da inscrição (lado esquerdo do box)
    const insW = 34
    rect(doc, rightBox.x, rightBox.y, insW, rightBox.h)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('NÚMERO', rightBox.x + insW / 2, rightBox.y + 6, {
      align: 'center',
    })
    doc.text('DE INSCRIÇÃO:', rightBox.x + insW / 2, rightBox.y + 11, {
      align: 'center',
    })

    doc.setFontSize(28)
    doc.text(
      String(args.matricula.numero_inscricao || '').padStart(2, '0'),
      rightBox.x + insW / 2,
      rightBox.y + 24,
      {
        align: 'center',
      },
    )

    // “linha” decorativa
    doc.setLineWidth(0.6)
    doc.line(
      rightBox.x + 4,
      rightBox.y + 26,
      rightBox.x + insW - 4,
      rightBox.y + 26,
    )
    doc.setLineWidth(0.2)

    // foto (lado direito do box)
    const fotoX = rightBox.x + insW
    const fotoW = rightBox.w - insW
    rect(doc, fotoX, rightBox.y, fotoW, rightBox.h)

    if (fotoData) {
      const type = guessImageType(fotoData)
      doc.addImage(
        fotoData,
        type,
        fotoX + 1,
        rightBox.y + 1,
        fotoW - 2,
        rightBox.h - 2,
      )
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.text('FOTO', fotoX + fotoW / 2, rightBox.y + rightBox.h / 2, {
        align: 'center',
      })
    }
  }

  const drawIdentificacao = (startY: number) => {
    const y = startY
    const lineH = 7

    // Linha 1: NIVEL / DISCIPLINA / INICIO / INICIO (modelo tem dois)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)

    const col1X = margin
    const col1W = 55
    const col2X = col1X + col1W + 5
    const col2W = 70
    const col3X = col2X + col2W + 5
    const col3W = 30
    const col4X = col3X + col3W + 5
    const col4W = pageW - margin - col4X

    doc.text('NIVEL:', col1X, y)
    doc.text('DISCIPLIA:', col2X, y) // mantendo grafia do modelo
    doc.text('INÍCIO:', col3X, y)
    doc.text('INÍCIO:', col4X, y)

    doc.setFont('helvetica', 'normal')
    doc.setLineWidth(0.2)
    doc.line(col1X + 12, y + 1, col1X + col1W, y + 1)
    doc.line(col2X + 18, y + 1, col2X + col2W, y + 1)
    doc.line(col3X + 14, y + 1, col3X + col3W, y + 1)
    doc.line(col4X + 14, y + 1, col4X + col4W, y + 1)

    doc.setFontSize(9)
    doc.text(textoOuTraco(args.matricula.nivel), col1X + 13, y + 0.2)
    doc.text(textoOuTraco(args.disciplina.nome), col2X + 19, y + 0.2)
    doc.text(formatarData(args.matricula.inicio), col3X + 15, y + 0.2)
    doc.text(formatarData(args.matricula.inicio), col4X + 15, y + 0.2)

    // Linha 2: NOME / TELEFONE
    const y2 = y + lineH
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('NOME:', margin, y2)
    doc.text('TELEFONE (   ):', pageW - margin - 70, y2)

    doc.setFont('helvetica', 'normal')
    doc.line(margin + 12, y2 + 1, pageW - margin - 75, y2 + 1)
    doc.line(pageW - margin - 35, y2 + 1, pageW - margin, y2 + 1)

    doc.setFontSize(9)
    doc.text(textoOuTraco(args.aluno.nome), margin + 13, y2 + 0.2)
    doc.text(textoOuTraco(args.aluno.telefone), pageW - margin - 34, y2 + 0.2)

    // Linha 3: NOME SOCIAL / DATA NASC
    const y3 = y2 + lineH
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('NOME SOCIAL:', margin, y3)
    doc.text('DATA NASC:', pageW - margin - 55, y3)

    doc.setFont('helvetica', 'normal')
    doc.line(margin + 26, y3 + 1, pageW - margin - 60, y3 + 1)
    doc.line(pageW - margin - 30, y3 + 1, pageW - margin, y3 + 1)

    // Nome social: não existe -> em branco
    doc.setFontSize(9)
    doc.text('', margin + 27, y3 + 0.2)

    doc.text(formatarData(args.aluno.data_nasc ?? ''), pageW - margin - 29, y3 + 0.2)

    // Linha 4: ENDEREÇO / BAIRRO / PONTO DE REF
    const y4 = y3 + lineH
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('ENDEREÇO:', margin, y4)
    doc.text('BAIRRO:', margin + 95, y4)
    doc.text('IPONTO DE REF.:', pageW - margin - 65, y4) // modelo escreve assim

    doc.setFont('helvetica', 'normal')
    doc.line(margin + 20, y4 + 1, margin + 92, y4 + 1) // endereco
    doc.line(margin + 112, y4 + 1, pageW - margin - 70, y4 + 1) // bairro
    doc.line(pageW - margin - 30, y4 + 1, pageW - margin, y4 + 1) // ref

    doc.setFontSize(9)
    doc.text(textoOuTraco(args.aluno.endereco), margin + 21, y4 + 0.2)
    doc.text(textoOuTraco(args.aluno.bairro), margin + 113, y4 + 0.2)
    // ponto de ref: em branco
    doc.text('', pageW - margin - 29, y4 + 0.2)

    return y4 + lineH + 1
  }

  const drawPactoDidatico = (startY: number) => {
    const y = startY + 2
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('PACTO DIDÁTICO', 105, y, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const texto =
      'Comprometo-me vir ao CEJA ______ vez (as) por semana e realizar atividades e avaliações de acordo com as orientações dos(as) professores(as).'
    doc.text(texto, margin, y + 6, { maxWidth: 190 })

    // Linha assinatura aluno / data / visto professor
    const y2 = y + 15
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('Assinatura do aluno:', margin, y2)
    doc.setFont('helvetica', 'normal')
    doc.line(margin + 40, y2 + 1, margin + 120, y2 + 1)

    doc.setFont('helvetica', 'bold')
    doc.text('Data:', margin + 125, y2)
    doc.setFont('helvetica', 'normal')
    doc.line(margin + 138, y2 + 1, margin + 160, y2 + 1)

    doc.setFont('helvetica', 'bold')
    doc.text('Visto do professor:', margin + 165, y2)
    doc.setFont('helvetica', 'normal')
    doc.line(margin + 205, y2 + 1, pageW - margin, y2 + 1)

    return y2 + 6
  }

  const drawGradeSituacao = (startY: number) => {
    // Desenhar a grade grande do topo (SITUAÇÃO/ETAPA/SÉRIE/MÉDIA/ASS PROFESSOR)
    const x = margin
    const y = startY
    const w = pageW - margin * 2
    const h = 42

    rect(doc, x, y, w, h)

    // colunas: SITUAÇÃO (35), ETAPA/SÉRIE (28), grade (w-35-28-25), MÉDIA (25)
    const cSit = 35
    const cEtp = 28
    const cMedia = 25
    const cGrid = w - cSit - cEtp - cMedia

    // linhas verticais
    doc.line(x + cSit, y, x + cSit, y + h)
    doc.line(x + cSit + cEtp, y, x + cSit + cEtp, y + h)
    doc.line(x + cSit + cEtp + cGrid, y, x + cSit + cEtp + cGrid, y + h)

    // cabeçalho (linha 1)
    const headH = 9
    doc.line(x, y + headH, x + w, y + headH)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('SITUAÇÃO', x + cSit / 2, y + 6, { align: 'center' })
    doc.text('ETAPA / SÉRIE', x + cSit + cEtp / 2, y + 6, {
      align: 'center',
    })
    doc.text(
      'MÉDIA',
      x + cSit + cEtp + cGrid + cMedia / 2,
      y + 6,
      { align: 'center' },
    )

    // subdivisão da grade central em 16 colunas (como no modelo)
    const nCols = 16
    const colW = cGrid / nCols
    for (let i = 1; i < nCols; i++) {
      doc.line(
        x + cSit + cEtp + colW * i,
        y,
        x + cSit + cEtp + colW * i,
        y + h,
      )
    }

    // linhas internas (4 linhas)
    const rowH = (h - headH) / 4
    for (let r = 1; r <= 3; r++) {
      doc.line(x, y + headH + rowH * r, x + w, y + headH + rowH * r)
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)

    const labelsLeft = [
      '( ) ORIENTAÇÃO',
      '( ) PROVEITAMENTO',
      '( ) PROGRESSÃO',
      '( ) CLASSIFICAÇÃO',
    ]
    const labelsEtapa = [
      'Nº AVALIAÇÃO',
      'NOTA ATIVIDADE',
      'NOTA AVALIAÇÃO',
      'MÉDIA',
    ]
    for (let r = 0; r < 4; r++) {
      const yy = y + headH + rowH * r + rowH / 2 + 3
      doc.text(labelsLeft[r], x + 2, yy)
      doc.text(labelsEtapa[r], x + cSit + 2, yy)
    }

    // célula ASS PROFESSOR (fica no bloco MÉDIA na 3ª linha do modelo)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(
      'ASS\nPROFESSOR.',
      x + cSit + cEtp + cGrid + cMedia / 2,
      y + headH + rowH * 2 + 8,
      {
        align: 'center',
      },
    )

    return y + h + 4
  }

  const drawTabelaAtendimentos = (
    startY: number,
    linhas: LinhaAtendimento[],
    opts: { firstPage: boolean; withObservacoes?: boolean },
  ) => {
    // Tabela igual ao modelo (com grade)
    const x = margin
    const w = pageW - margin * 2

    // Colunas (proporções bem próximas do modelo)
    const cData = 20
    const cEnt = 18
    const cSai = 18
    const cTipo = 34
    const cProf = 34
    const cReg = w - (cData + cEnt + cSai + cTipo + cProf)

    const headerH = 10
    const rowH = 10

    // Quantas linhas por página:
    // - 1ª página (modelo mostra poucas, por causa do topo): 4 linhas
    // - páginas seguintes: 14 linhas (para caber observações)
    const maxRows = opts.firstPage ? 4 : opts.withObservacoes ? 14 : 18

    const rowsToPrint = linhas.slice(0, maxRows)
    const tableH = headerH + rowH * maxRows

    // borda
    rect(doc, x, startY, w, tableH)

    // verticais
    let vx = x + cData
    doc.line(vx, startY, vx, startY + tableH)
    vx += cEnt
    doc.line(vx, startY, vx, startY + tableH)
    vx += cSai
    doc.line(vx, startY, vx, startY + tableH)
    vx += cTipo
    doc.line(vx, startY, vx, startY + tableH)
    vx += cProf
    doc.line(vx, startY, vx, startY + tableH)

    // linha header
    doc.line(x, startY + headerH, x + w, startY + headerH)

    // linhas horizontais
    for (let r = 1; r < maxRows; r++) {
      doc.line(x, startY + headerH + rowH * r, x + w, startY + headerH + rowH * r)
    }

    // títulos
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('DATA', x + cData / 2, startY + 7, { align: 'center' })
    doc.text('ENTRADA', x + cData + cEnt / 2, startY + 7, {
      align: 'center',
    })
    doc.text('SAÍDA', x + cData + cEnt + cSai / 2, startY + 7, {
      align: 'center',
    })
    doc.text(
      'TIPO DE\nATENDIMENTO',
      x + cData + cEnt + cSai + cTipo / 2,
      startY + 6,
      { align: 'center' },
    )
    doc.text(
      'PROFESSOR',
      x + cData + cEnt + cSai + cTipo + cProf / 2,
      startY + 7,
      { align: 'center' },
    )
    doc.text(
      'REGISTRO DE ATIVIDADE',
      x + cData + cEnt + cSai + cTipo + cProf + cReg / 2,
      startY + 7,
      { align: 'center' },
    )

    // conteúdo
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)

    for (let i = 0; i < maxRows; i++) {
      const rowY = startY + headerH + rowH * i
      const linha = rowsToPrint[i]

      // Se não tiver linha, deixa o primeiro campo com "__/__/__" como no modelo
      const d = linha?.data ? linha.data : '__/__/__'
      const ent = linha?.entrada ? linha.entrada : '__:__'
      const sai = linha?.saida ? linha.saida : '__:__'
      const tipo = linha?.tipo ?? ''
      const prof = linha?.professor ?? ''
      const reg = linha?.registro ?? ''

      // colunas (texto com pequenas margens)
      doc.text(String(d), x + 2, rowY + 6.7)
      doc.text(String(ent), x + cData + 2, rowY + 6.7)
      doc.text(String(sai), x + cData + cEnt + 2, rowY + 6.7)
      doc.text(
        String(tipo).slice(0, 22),
        x + cData + cEnt + cSai + 2,
        rowY + 6.7,
      )
      doc.text(
        String(prof).slice(0, 20),
        x + cData + cEnt + cSai + cTipo + 2,
        rowY + 6.7,
      )

      // registro pode quebrar (duas linhas)
      const regLines = wrapText(doc, String(reg), cReg - 4)
      if (regLines.length <= 1) {
        doc.text(
          regLines[0] ?? '',
          x + cData + cEnt + cSai + cTipo + cProf + 2,
          rowY + 6.7,
        )
      } else {
        doc.text(
          regLines[0] ?? '',
          x + cData + cEnt + cSai + cTipo + cProf + 2,
          rowY + 5.0,
        )
        doc.text(
          regLines[1] ?? '',
          x + cData + cEnt + cSai + cTipo + cProf + 2,
          rowY + 8.2,
        )
      }
    }

    return { used: maxRows, bottomY: startY + tableH }
  }

  const drawObservacoes = (startY: number) => {
    const x = margin
    const w = pageW - margin * 2
    const h = 55

    rect(doc, x, startY, w, h)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('OBSERVAÇÕES', pageW / 2, startY + 8, { align: 'center' })

    // linha separadora do título
    doc.line(x, startY + 12, x + w, startY + 12)
    return startY + h
  }

  // ===================== Renderização das páginas =====================

  // Cabeçalho (página 1)
  drawHeader()

  // Identificação
  let y = 42
  y = drawIdentificacao(y)

  // Pacto
  y = drawPactoDidatico(y)

  // Grade
  y = drawGradeSituacao(y)

  // Tabela (página 1 com poucas linhas)
  const linhas = args.linhas ?? []
  const firstTable = drawTabelaAtendimentos(y, linhas, { firstPage: true })
  let consumed = firstTable.used
  y = firstTable.bottomY + 6

  // Página 2 (tabela grande + observações)
  doc.addPage()

  // Na página 2, começa a tabela bem no topo com margem pequena, como o modelo
  let y2 = 14
  const restante = linhas.slice(consumed)
  const secondTable = drawTabelaAtendimentos(y2, restante, {
    firstPage: false,
    withObservacoes: true,
  })
  consumed += secondTable.used

  // Observações (sempre na página 2, abaixo da tabela)
  const obsY = secondTable.bottomY + 10
  drawObservacoes(obsY)

  // Se ainda sobrar linhas, cria páginas extras (sem observações; a última terá observações)
  let sobras = linhas.slice(consumed)
  while (sobras.length > 0) {
    doc.addPage()
    let yy = 14
    // se é a última página (cabem observações?), decide: quando sobras <= 14, faz com observações
    const lastWithObs = sobras.length <= 14
    const tbl = drawTabelaAtendimentos(yy, sobras, {
      firstPage: false,
      withObservacoes: lastWithObs,
    })
    consumed += tbl.used
    sobras = linhas.slice(consumed)

    if (lastWithObs) {
      const oy = tbl.bottomY + 10
      drawObservacoes(oy)
    }
  }

  // Nome do arquivo
  const safe = (s: string) =>
    (s || 'aluno')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^\w\d-_]+/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 60)

  const nomeArquivo = `ficha_acompanhamento_${safe(args.aluno.nome)}_${safe(args.disciplina.nome)}_${args.periodo.ano}_${pad2(args.periodo.mes)}.pdf`
  doc.save(nomeArquivo)
}

// ===================== Página (UI) =====================

const SecretariaRelatoriosFichasPage: React.FC = () => {
  const theme = useTheme()
  const { supabase } = useSupabase()
  const { sucesso, erro, aviso } = useNotificacaoContext()

  const anoAtual = new Date().getFullYear()
  const mesAtual = new Date().getMonth() + 1

  const [anoLetivo, setAnoLetivo] = useState<number>(anoAtual)
  const [mes, setMes] = useState<number>(mesAtual)

  const [alunoSelecionado, setAlunoSelecionado] = useState<AlunoOpcao | null>(
    null,
  )
  const [buscaAluno, setBuscaAluno] = useState('')
  const [opcoesAluno, setOpcoesAluno] = useState<AlunoOpcao[]>([])
  const [buscandoAluno, setBuscandoAluno] = useState(false)
  const debounceRef = useRef<number | null>(null)

  const [disciplinas, setDisciplinas] = useState<DisciplinaRow[]>([])
  const [disciplinaId, setDisciplinaId] = useState<number | ''>('')
  const [carregandoDisciplinas, setCarregandoDisciplinas] = useState(false)

  const [gerandoPdf, setGerandoPdf] = useState(false)

  // status matrícula ativa (cache)
  const statusAtivaIdRef = useRef<number | null>(null)
  const getStatusAtivaId = async () => {
    if (!supabase) return null
    if (statusAtivaIdRef.current) return statusAtivaIdRef.current

    const { data, error: e } = await supabase
      .from('status_matricula')
      .select('id_status_matricula,nome')
    if (e) {
      console.error(e)
      statusAtivaIdRef.current = null
      return null
    }

    const ativa = (data ?? []).find((s: any) =>
      normalizarTexto(String(s?.nome ?? '')).includes('ativa'),
    )
    statusAtivaIdRef.current = ativa?.id_status_matricula ?? null
    return statusAtivaIdRef.current
  }

  const buscarAlunos = async (termo: string) => {
    if (!supabase) return
    const t = termo.trim()
    if (t.length < 2) {
      setOpcoesAluno([])
      return
    }

    setBuscandoAluno(true)
    try {
      const isId = /^\d+$/.test(t)

      const base = supabase
        .from('alunos')
        .select(
          `
          id_aluno,
          usuarios!inner(
            name,
            email,
            foto_url
          )
        `,
        )
        .limit(25)
        .order('id_aluno', { ascending: false })

      const { data, error: e } = isId
        ? await base.eq('id_aluno', Number(t))
        : await base.ilike('usuarios.name', `%${t}%`)

      if (e) throw e

      const opcoes: AlunoOpcao[] = (data ?? []).map((a: any) => {
        const u = obterPrimeiro(a?.usuarios)
        return {
          id_aluno: a.id_aluno,
          nome: u?.name ?? `Aluno #${a.id_aluno}`,
          email: u?.email ?? null,
          foto_url: u?.foto_url ?? null,
        }
      })

      setOpcoesAluno(opcoes)
    } catch (e) {
      console.error(e)
      setOpcoesAluno([])
    } finally {
      setBuscandoAluno(false)
    }
  }

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(
      () => void buscarAlunos(buscaAluno),
      350,
    )

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscaAluno])

  const carregarDisciplinas = async () => {
    if (!supabase) return
    setCarregandoDisciplinas(true)
    try {
      const { data, error: e } = await supabase
        .from('disciplinas')
        .select('id_disciplina,nome_disciplina')
        .order('nome_disciplina', { ascending: true })
        .limit(400)
      if (e) throw e
      setDisciplinas((data ?? []) as DisciplinaRow[])
    } catch (e) {
      console.error(e)
      erro('Falha ao carregar disciplinas.', 'Erro')
      setDisciplinas([])
    } finally {
      setCarregandoDisciplinas(false)
    }
  }

  useEffect(() => {
    if (!supabase) return
    void carregarDisciplinas()
    void getStatusAtivaId()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase])

  const limpar = () => {
    setAlunoSelecionado(null)
    setBuscaAluno('')
    setOpcoesAluno([])
    setDisciplinaId('')
  }

  /**
   * Monta as linhas da tabela:
   * - filtra por aluno + período (ano/mês)
   * - filtra por disciplina via progresso_aluno (matrícula do ano)
   * - registros_atendimento fornecem: tipo/registro/status/nota; sessão fornece: entrada/saída/professor
   */
  const gerarFichaPdf = async () => {
    if (!supabase) {
      erro('Supabase não configurado.', 'Configuração')
      return
    }
    if (!alunoSelecionado) {
      aviso('Selecione um aluno.', 'Ficha')
      return
    }
    if (!disciplinaId) {
      aviso('Selecione uma disciplina.', 'Ficha')
      return
    }

    setGerandoPdf(true)
    try {
      const statusAtivaId = await getStatusAtivaId()
      const { inicio, fim } = intervaloMesUTC(anoLetivo, mes)

      // 1) Aluno + usuário (endereço/telefone/data nasc/foto)
      const { data: alunoRow, error: eAluno } = await supabase
        .from('alunos')
        .select(
          `
          id_aluno,
          usuarios!inner(
            name,
            foto_url,
            celular,
            data_nascimento,
            logradouro,
            numero_endereco,
            bairro,
            municipio
          )
        `,
        )
        .eq('id_aluno', alunoSelecionado.id_aluno)
        .maybeSingle()
      if (eAluno) throw eAluno

      const uAluno = obterPrimeiro((alunoRow as AlunoJoin | null)?.usuarios)
      const alunoNome = String(uAluno?.name ?? alunoSelecionado.nome)

      const endereco = [uAluno?.logradouro, uAluno?.numero_endereco]
        .filter(Boolean)
        .join(', ')
      const bairro = String(uAluno?.bairro ?? '')
      const municipio = String(uAluno?.municipio ?? '')

      // 2) Matrícula do ano (para número inscrição, nível, início)
      const qMat = supabase
        .from('matriculas')
        .select('id_matricula,numero_inscricao,data_matricula,niveis_ensino(nome)')
        .eq('id_aluno', alunoSelecionado.id_aluno)
        .eq('ano_letivo', anoLetivo)
        .order('data_matricula', { ascending: false })
        .limit(3)

      const { data: mats, error: eMat } = statusAtivaId
        ? await qMat.eq('id_status_matricula', statusAtivaId)
        : await qMat
      if (eMat) throw eMat
      const matricula = (mats ?? [])[0] as MatriculaRow | undefined
      if (!matricula) {
        aviso('Aluno não possui matrícula ativa no ano selecionado.', 'Ficha')
        return
      }

      const nivel = String(matricula.niveis_ensino?.nome ?? '')
      const numeroInscricao = String(matricula.numero_inscricao ?? '')

      // 3) Progresso da disciplina (id_progresso) vinculado à matrícula
      const idsMat = (mats ?? [])
        .map((m: any) => m.id_matricula)
        .filter((x: any) => Number.isFinite(Number(x)))
      const { data: prog, error: eProg } = await supabase
        .from('progresso_aluno')
        .select('id_progresso,id_matricula,id_disciplina')
        .in('id_matricula', idsMat)
        .eq('id_disciplina', Number(disciplinaId))
        .limit(5)
      if (eProg) throw eProg

      const idProgresso = (prog ?? [])[0]?.id_progresso
      if (!idProgresso) {
        aviso(
          'Não há progresso cadastrado para esta disciplina no ano/matrícula do aluno.',
          'Ficha',
        )
        return
      }

      // 4) Registros do mês (com sessão + professor + tipo protocolo)
      const { data: regs, error: eRegs } = await supabase
        .from('registros_atendimento')
        .select(
          `
          id_atividade,
          id_sessao,
          sintese,
          status,
          numero_protocolo,
          nota,
          tipos_protocolo(
            nome
          ),
          sessoes_atendimento!inner(
            id_sessao,
            hora_entrada,
            hora_saida,
            professores(
              usuarios(
                name
              )
            )
          )
        `,
        )
        .eq('id_progresso', idProgresso)
        .gte('created_at', inicio)
        .lt('created_at', fim)
        .order('created_at', { ascending: true })
        .limit(9000)

      if (eRegs) throw eRegs

      const registros = (regs ?? []) as any[]

      // 5) Caso não tenha registros, buscar sessões do aluno (para não gerar ficha vazia)
      // (o modelo da ficha aceita linhas vazias; aqui tentamos trazer sessões do mês)
      let sessoesBase: SessaoAtendimentoRow[] = []
      if (!registros.length) {
        const { data: sess, error: eSess } = await supabase
          .from('sessoes_atendimento')
          .select(
            `
            id_sessao,
            hora_entrada,
            hora_saida,
            resumo_atividades,
            professores(
              usuarios(
                name
              )
            )
          `,
          )
          .eq('id_aluno', alunoSelecionado.id_aluno)
          .gte('hora_entrada', inicio)
          .lt('hora_entrada', fim)
          .order('hora_entrada', { ascending: true })
          .limit(2000)

        if (eSess) throw eSess
        sessoesBase = (sess ?? []) as any[]
      }

      // 6) Montar linhas (agrupa por sessão)
      const mapSessao = new Map<
        number,
        { sessao: SessaoAtendimentoRow; textos: string[]; tipos: string[]; prof: string }
      >()
      for (const r of registros) {
        const sess = (r?.sessoes_atendimento ?? {}) as any
        const idSessao = Number(r?.id_sessao ?? sess?.id_sessao)
        if (!Number.isFinite(idSessao)) continue

        const prof = obterPrimeiro(sess?.professores?.usuarios)?.name ?? ''
        const tipo = r?.tipos_protocolo?.nome ?? ''
        const txt = r?.sintese ?? ''

        const atual = mapSessao.get(idSessao)
        if (!atual) {
          mapSessao.set(idSessao, {
            sessao: {
              id_sessao: idSessao,
              hora_entrada: sess?.hora_entrada,
              hora_saida: sess?.hora_saida ?? null,
              professores: sess?.professores ?? null,
              resumo_atividades: sess?.resumo_atividades ?? null,
            },
            textos: txt ? [String(txt)] : [],
            tipos: tipo ? [String(tipo)] : [],
            prof: String(prof),
          })
        } else {
          if (txt) atual.textos.push(String(txt))
          if (tipo) atual.tipos.push(String(tipo))
        }
      }

      // Se não havia registros, usa as sessões
      if (!mapSessao.size && sessoesBase.length) {
        for (const s of sessoesBase) {
          const prof = obterPrimeiro((s as any)?.professores?.usuarios)?.name ?? ''
          mapSessao.set(s.id_sessao, {
            sessao: s,
            textos: s.resumo_atividades ? [String(s.resumo_atividades)] : [],
            tipos: [],
            prof: String(prof),
          })
        }
      }

      const linhas: LinhaAtendimento[] = Array.from(mapSessao.values())
        .sort(
          (a, b) =>
            new Date(a.sessao.hora_entrada).getTime() -
            new Date(b.sessao.hora_entrada).getTime(),
        )
        .map((v) => {
          const s = v.sessao
          const tipo = v.tipos.length ? v.tipos[0] : '—'
          const registro = v.textos.length ? v.textos.join(' | ') : ''
          return {
            data: formatarData(s.hora_entrada),
            entrada: formatarHora(s.hora_entrada),
            saida: formatarHora(s.hora_saida),
            tipo,
            professor: v.prof || '—',
            registro,
          }
        })

      // 7) Disciplina nome
      const disc = disciplinas.find((d) => d.id_disciplina === Number(disciplinaId))
      const nomeDisciplina = disc?.nome_disciplina ?? `Disciplina #${disciplinaId}`

      // 8) Gerar PDF no modelo
      await gerarPdfFichaModelo({
        aluno: {
          id_aluno: alunoSelecionado.id_aluno,
          nome: alunoNome,
          foto_url: uAluno?.foto_url ?? alunoSelecionado.foto_url ?? null,
          telefone: uAluno?.celular ?? null,
          data_nasc: uAluno?.data_nascimento ?? null,
          endereco: endereco || '',
          bairro: bairro || '',
          municipio: municipio || '',
        },
        matricula: {
          numero_inscricao: numeroInscricao || '00',
          nivel: nivel || '',
          inicio: matricula.data_matricula,
        },
        disciplina: { nome: nomeDisciplina },
        periodo: { ano: anoLetivo, mes },
        linhas,
        // Ajuste aqui se você tiver um logo real em /public:
        // ex.: "/assets/ceja_logo.png"
        logoUrlOpcional: '/ceja_logo.png',
      })

      sucesso('Ficha (PDF) gerada com sucesso.', 'PDF')
    } catch (e: any) {
      console.error(e)
      erro(
        'Falha ao gerar PDF. Verifique RLS (permissões de SELECT) e se “jspdf” está instalado.',
        'Erro',
      )
    } finally {
      setGerandoPdf(false)
    }
  }

  const periodoLabel = `${meses[mes - 1]} / ${anoLetivo}`

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={900}>
          Fichas e Relatórios (PDF)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Geração da ficha no modelo oficial (igual ao formulário) com dados do banco.
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.default,
          mb: 2,
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          alignItems={{ md: 'center' }}
        >
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Ano</InputLabel>
            <Select
              label="Ano"
              value={anoLetivo}
              onChange={(e) => setAnoLetivo(Number(e.target.value))}
              disabled={!supabase}
            >
              {Array.from({ length: 8 }, (_, i) => anoAtual - i).map((a) => (
                <MenuItem key={a} value={a}>
                  {a}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Mês</InputLabel>
            <Select
              label="Mês"
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              disabled={!supabase}
            >
              {meses.map((m, idx) => (
                <MenuItem key={m} value={idx + 1}>
                  {m}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Chip label={`Período: ${periodoLabel}`} size="small" sx={{ fontWeight: 800 }} />

          <Box sx={{ flex: 1 }} />

          <Tooltip title="Limpar">
            <span>
              <IconButton onClick={limpar} disabled={!alunoSelecionado && !disciplinaId}>
                <ClearIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Recarregar disciplinas">
            <span>
              <IconButton
                onClick={() => void carregarDisciplinas()}
                disabled={!supabase || carregandoDisciplinas}
              >
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 2.25,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {gerandoPdf ? (
          <LinearProgress
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
            }}
          />
        ) : null}

        <Stack direction="row" spacing={2} alignItems="flex-start" mb={1.5}>
          <Avatar
            variant="rounded"
            sx={{
              bgcolor: alpha('#00BCD4', 0.12),
              color: '#00BCD4',
              width: 44,
              height: 44,
            }}
          >
            <AssignmentIndIcon />
          </Avatar>

          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={900} sx={{ lineHeight: 1.2 }}>
              Ficha de Acompanhamento do Aluno (modelo oficial)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gera PDF com o layout do formulário: cabeçalho, pacto didático, grades e tabela (2 páginas).
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={
              gerandoPdf ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <PictureAsPdfIcon />
              )
            }
            onClick={() => void gerarFichaPdf()}
            disabled={!supabase || gerandoPdf}
            sx={{ textTransform: 'none', fontWeight: 900 }}
          >
            {gerandoPdf ? 'Gerando...' : 'Gerar PDF'}
          </Button>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
          <Autocomplete
            fullWidth
            options={opcoesAluno}
            loading={buscandoAluno}
            value={alunoSelecionado}
            onChange={(_e, novo) => setAlunoSelecionado(novo)}
            inputValue={buscaAluno}
            onInputChange={(_e, v) => setBuscaAluno(v)}
            getOptionLabel={(opt) => `${opt.nome} (ID: ${opt.id_aluno})`}
            isOptionEqualToValue={(o, v) => o.id_aluno === v.id_aluno}
            noOptionsText={
              buscaAluno.trim().length < 2
                ? 'Digite pelo menos 2 caracteres...'
                : 'Nenhum aluno encontrado'
            }
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label="Aluno"
                placeholder="Ex: Maria / 123"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {buscandoAluno ? <CircularProgress size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          <FormControl size="small" sx={{ minWidth: 280 }}>
            <InputLabel>Disciplina</InputLabel>
            <Select
              label="Disciplina"
              value={disciplinaId}
              onChange={(e) => setDisciplinaId(Number(e.target.value))}
              disabled={!supabase || carregandoDisciplinas}
            >
              {disciplinas.map((d) => (
                <MenuItem key={d.id_disciplina} value={d.id_disciplina}>
                  {d.nome_disciplina}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.2 }}>
          Observação: campos <b>NOME SOCIAL</b> e <b>PONTO DE REF.</b> ficam em branco se não existirem no banco.
          O campo <b>INÍCIO</b> usa <b>matriculas.data_matricula</b>.
        </Typography>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.6 }}>
          Logo: tenta carregar <b>/ceja_logo.png</b> do <b>/public</b>. Se não existir, mostra “LOGO”.
        </Typography>
      </Paper>

      {!supabase ? (
        <Paper
          elevation={0}
          sx={{
            mt: 2,
            p: 2,
            borderRadius: 2,
            border: `1px dashed ${theme.palette.divider}`,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Supabase não configurado. Defina as variáveis do projeto para habilitar o PDF.
          </Typography>
        </Paper>
      ) : null}
    </Box>
  )
}

export default SecretariaRelatoriosFichasPage
