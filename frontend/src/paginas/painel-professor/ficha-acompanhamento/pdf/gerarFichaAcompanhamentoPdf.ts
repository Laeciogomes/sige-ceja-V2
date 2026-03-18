import { jsPDF } from 'jspdf'

import {
  formatarDataBR,
  formatarEnderecoLinha,
  formatarHoraBR,
  formatarRegistroSessaoTexto,
  formatarTelefoneBR,
} from '../utils'

const PAGE_WIDTH = 297
const PAGE_HEIGHT = 210
const MARGIN_X = 12
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2

const COLORS = {
  pageBg: [248, 245, 240] as const,
  cardBg: [255, 255, 255] as const,
  border: [223, 228, 232] as const,
  text: [22, 28, 36] as const,
  muted: [98, 108, 123] as const,
  green: [56, 142, 101] as const,
  greenSoft: [232, 246, 239] as const,
  orange: [245, 158, 11] as const,
  orangeSoft: [255, 247, 237] as const,
  blue: [37, 99, 235] as const,
  blueSoft: [239, 246, 255] as const,
  red: [220, 38, 38] as const,
  graySoft: [244, 246, 248] as const,
  grayChip: [241, 245, 249] as const,
} satisfies Record<string, readonly [number, number, number]>

const FONT = 'helvetica'
const SCHOOL_LOGO_DATA_URL = 'data:image/png;base64,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'

type GradeDataLike = {
  headers: { serie: string; colspan: number }[]
  protocolos: number[]
  body: { etapa: string; notas: (number | null)[] }[]
  mediaFinal: number | null
} | null

type PdfHistoricoRow = {
  data: string
  entrada: string
  saida: string
  or: string
  at: string
  av: string
  re: string
  professor: string
  registro: string
}

type PdfFichaData = {
  numeroInscricao: string
  nivel: string
  disciplina: string
  inicio: string
  termino: string
  nome: string
  nomeSocial?: string
  telefone?: string
  dataNascimento?: string
  endereco?: string
  bairro?: string
  pontoReferencia?: string
  whatsapp?: string
  facebook?: string
  instagram?: string
  email?: string
  situacao?: 'ORIENT' | 'APROVEIT' | 'PROGR' | 'CLASSIF'
  gradeData: GradeDataLike
  historico: PdfHistoricoRow[]
  observacoes?: string
  assinaturaProfessor?: string
  fotoUrl?: string
  fotoDataUrl?: string
}

type TextOpts = {
  size?: number
  bold?: boolean
  color?: readonly [number, number, number]
  align?: 'left' | 'center' | 'right'
  maxWidth?: number
}

type BoxOpts = {
  fill?: readonly [number, number, number]
  stroke?: readonly [number, number, number]
  radius?: number
  lineWidth?: number
}

const imagemCache = new Map<string, Promise<string | null>>()

function setColor(doc: jsPDF, color: readonly [number, number, number]) {
  doc.setTextColor(color[0], color[1], color[2])
}

function setDrawColor(doc: jsPDF, color: readonly [number, number, number]) {
  doc.setDrawColor(color[0], color[1], color[2])
}

function setFillColor(doc: jsPDF, color: readonly [number, number, number]) {
  doc.setFillColor(color[0], color[1], color[2])
}

function drawRoundBox(doc: jsPDF, x: number, y: number, w: number, h: number, opts?: BoxOpts) {
  const radius = opts?.radius ?? 3
  const stroke = opts?.stroke ?? COLORS.border
  const fill = opts?.fill
  const lineWidth = opts?.lineWidth ?? 0.25

  doc.setLineWidth(lineWidth)
  setDrawColor(doc, stroke)

  if (fill) {
    setFillColor(doc, fill)
    doc.roundedRect(x, y, w, h, radius, radius, 'FD')
    return
  }

  doc.roundedRect(x, y, w, h, radius, radius, 'S')
}

function drawText(doc: jsPDF, text: string, x: number, y: number, opts?: TextOpts) {
  const valor = String(text ?? '').trim()
  if (!valor) return

  doc.setFont(FONT, opts?.bold ? 'bold' : 'normal')
  doc.setFontSize(opts?.size ?? 10)
  setColor(doc, opts?.color ?? COLORS.text)
  doc.text(valor, x, y, {
    align: opts?.align,
    maxWidth: opts?.maxWidth,
    baseline: 'alphabetic',
  })
}

function splitText(doc: jsPDF, text: string, width: number, size: number, bold = false): string[] {
  const valor = String(text ?? '').trim()
  if (!valor) return []
  doc.setFont(FONT, bold ? 'bold' : 'normal')
  doc.setFontSize(size)
  return doc.splitTextToSize(valor, width) as string[]
}

function fitTextLines(doc: jsPDF, text: string, width: number, size: number, maxLines: number, bold = false): string[] {
  const linhas = splitText(doc, text, width, size, bold)
  if (linhas.length <= maxLines) return linhas

  const resultado = linhas.slice(0, maxLines)
  let ultima = resultado[maxLines - 1] ?? ''
  doc.setFont(FONT, bold ? 'bold' : 'normal')
  doc.setFontSize(size)
  while (ultima.length > 2 && doc.getTextWidth(`${ultima}...`) > width) {
    ultima = ultima.slice(0, -1)
  }
  resultado[maxLines - 1] = `${ultima.trimEnd()}...`
  return resultado
}

function drawMultilineText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  width: number,
  opts?: TextOpts & { lineHeight?: number; maxLines?: number }
): number {
  const size = opts?.size ?? 10
  const lineHeight = opts?.lineHeight ?? size * 0.4 + 1.2
  const linhas = opts?.maxLines ? fitTextLines(doc, text, width, size, opts.maxLines, opts.bold) : splitText(doc, text, width, size, opts?.bold)
  if (!linhas.length) return 0

  doc.setFont(FONT, opts?.bold ? 'bold' : 'normal')
  doc.setFontSize(size)
  setColor(doc, opts?.color ?? COLORS.text)

  linhas.forEach((linha, index) => {
    doc.text(linha, x, y + index * lineHeight, { maxWidth: width, baseline: 'alphabetic' })
  })

  return linhas.length * lineHeight
}

function formatarNumero(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '-'
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',')
}

function formatarSituacao(situacao?: PdfFichaData['situacao']): string {
  switch (situacao) {
    case 'ORIENT':
      return 'Orientação'
    case 'APROVEIT':
      return 'Aproveitamento'
    case 'CLASSIF':
      return 'Classificado'
    case 'PROGR':
      return 'Em progresso'
    default:
      return 'Em acompanhamento'
  }
}

function sanitizarTextoLivre(valor?: string | null): string {
  return String(valor ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replace(/\b(?:sobre os autores|about the authors)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function addPageBackground(doc: jsPDF) {
  setFillColor(doc, COLORS.pageBg)
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F')
}

function addHeader(doc: jsPDF, title: string, subtitle: string) {
  const headerHeight = 20
  const leftBandWidth = 58

  setFillColor(doc, COLORS.green)
  doc.rect(0, 0, PAGE_WIDTH, headerHeight, 'F')
  setFillColor(doc, COLORS.orange)
  doc.rect(0, 0, leftBandWidth, headerHeight, 'F')

  try {
    doc.addImage(SCHOOL_LOGO_DATA_URL, 'PNG', 4.5, 2.2, 12.5, 13.2, undefined, 'FAST')
  } catch (error) {
    console.warn('[gerarFichaAcompanhamentoPdf] Falha ao desenhar logo da escola no cabeçalho.', error)
  }

  drawText(doc, 'SIGE-CEJA', 20, 8.1, { size: 15.4, bold: true, color: COLORS.cardBg })
  drawText(doc, 'Gestão Escolar Inteligente', 20, 13.8, { size: 8.3, bold: true, color: COLORS.cardBg })
  drawText(doc, title, 20, 18, { size: 7.8, color: COLORS.cardBg })

  drawText(doc, 'Ficha de acompanhamento', PAGE_WIDTH - 14, 8.2, {
    size: 13.2,
    bold: true,
    color: COLORS.cardBg,
    align: 'right',
  })
  drawText(doc, subtitle, PAGE_WIDTH - 14, 14.4, {
    size: 8.6,
    color: COLORS.cardBg,
    align: 'right',
    maxWidth: 106,
  })
}

function addFooter(doc: jsPDF, data: PdfFichaData) {
  const total = doc.getNumberOfPages()
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page)
    setDrawColor(doc, COLORS.border)
    doc.setLineWidth(0.25)
    doc.line(MARGIN_X, PAGE_HEIGHT - 8, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 8)
    drawText(doc, `Aluno: ${data.nome}`, MARGIN_X, PAGE_HEIGHT - 4.2, { size: 8.1, color: COLORS.muted })
    drawText(doc, `Gerado em ${new Date().toLocaleString('pt-BR')}`, PAGE_WIDTH / 2, PAGE_HEIGHT - 4.2, {
      size: 8.1,
      color: COLORS.muted,
      align: 'center',
    })
    drawText(doc, `Página ${page} de ${total}`, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 4.2, {
      size: 8.1,
      color: COLORS.muted,
      align: 'right',
    })
  }
}

function drawSectionTitle(doc: jsPDF, title: string, x: number, y: number) {
  drawText(doc, title, x, y, { size: 12.4, bold: true, color: COLORS.text })
  setDrawColor(doc, COLORS.orange)
  doc.setLineWidth(0.7)
  doc.line(x, y + 1.8, x + 18, y + 1.8)
}

function drawChip(doc: jsPDF, text: string, x: number, y: number, colors?: { bg?: readonly [number, number, number]; text?: readonly [number, number, number] }) {
  const size = 8.5
  doc.setFont(FONT, 'bold')
  doc.setFontSize(size)
  const paddingX = 3.2
  const width = doc.getTextWidth(text) + paddingX * 2
  const height = 7.6
  drawRoundBox(doc, x, y - 5.7, width, height, {
    fill: colors?.bg ?? COLORS.grayChip,
    stroke: colors?.bg ?? COLORS.grayChip,
    radius: 3,
    lineWidth: 0.2,
  })
  drawText(doc, text, x + width / 2, y - 0.55, { size, bold: true, color: colors?.text ?? COLORS.text, align: 'center' })
  return width
}

function drawMetricCard(doc: jsPDF, x: number, y: number, w: number, label: string, value: string, accent: readonly [number, number, number]) {
  drawRoundBox(doc, x, y, w, 16, { fill: COLORS.cardBg, stroke: COLORS.border, radius: 3.2 })
  setFillColor(doc, accent)
  doc.roundedRect(x + 2.5, y + 2.5, 2.6, 11, 1.3, 1.3, 'F')
  drawText(doc, label, x + 8, y + 6.4, { size: 8.1, color: COLORS.muted })
  drawText(doc, value, x + 8, y + 12.6, { size: 13.5, bold: true, color: COLORS.text })
}

function initialsFromName(nome: string): string {
  const partes = String(nome ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!partes.length) return 'A'
  const iniciais = [partes[0]?.[0] ?? '', partes[1]?.[0] ?? ''].join('').toUpperCase()
  return iniciais || partes[0].slice(0, 1).toUpperCase()
}

function inferImageFormat(dataUrl: string): 'PNG' | 'JPEG' | 'WEBP' {
  const normalizada = String(dataUrl || '').toLowerCase()
  if (normalizada.startsWith('data:image/png')) return 'PNG'
  if (normalizada.startsWith('data:image/webp')) return 'WEBP'
  return 'JPEG'
}

async function carregarImagemExterna(url?: string | null): Promise<string | null> {
  const raw = String(url ?? '').trim()
  if (!raw) return null

  const cached = imagemCache.get(raw)
  if (cached) return cached

  const promise = fetch(raw, { mode: 'cors', credentials: 'omit', cache: 'no-store' })
    .then(async (response) => {
      if (!response.ok) return null
      const blob = await response.blob()
      return await new Promise<string | null>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(String(reader.result || '') || null)
        reader.onerror = () => reject(new Error('Falha ao converter imagem para data URL.'))
        reader.readAsDataURL(blob)
      })
    })
    .catch((error) => {
      console.warn('[gerarFichaAcompanhamentoPdf] Falha ao carregar imagem externa.', error)
      return null
    })

  imagemCache.set(raw, promise)
  return await promise
}

function drawPhoto(doc: jsPDF, fotoDataUrl: string | null, nome: string, x: number, y: number, w: number, h: number) {
  drawRoundBox(doc, x, y, w, h, { fill: COLORS.graySoft, stroke: COLORS.border, radius: 4 })

  if (!fotoDataUrl) {
    setFillColor(doc, COLORS.orangeSoft)
    doc.circle(x + w / 2, y + h / 2 - 4, 9, 'F')
    drawText(doc, initialsFromName(nome), x + w / 2, y + h / 2 - 1.2, { size: 18, bold: true, align: 'center', color: COLORS.orange })
    drawText(doc, 'Sem foto', x + w / 2, y + h - 5.5, { size: 8.2, align: 'center', color: COLORS.muted })
    return
  }

  try {
    const props = doc.getImageProperties(fotoDataUrl)
    const ratio = props.width / props.height
    let renderW = w - 2.8
    let renderH = renderW / ratio
    if (renderH > h - 2.8) {
      renderH = h - 2.8
      renderW = renderH * ratio
    }
    const dx = x + (w - renderW) / 2
    const dy = y + (h - renderH) / 2
    doc.addImage(fotoDataUrl, inferImageFormat(fotoDataUrl), dx, dy, renderW, renderH, undefined, 'MEDIUM')
  } catch (error) {
    console.warn('[gerarFichaAcompanhamentoPdf] Falha ao desenhar foto do aluno.', error)
    drawText(doc, 'Foto indisponível', x + w / 2, y + h / 2, { size: 8.2, align: 'center', color: COLORS.muted })
  }
}

function drawStudentCard(doc: jsPDF, data: PdfFichaData, fotoDataUrl: string | null) {
  const x = MARGIN_X
  const y = 24
  const w = CONTENT_WIDTH
  const h = 50

  drawRoundBox(doc, x, y, w, h, { fill: COLORS.cardBg, stroke: COLORS.border, radius: 4 })
  drawPhoto(doc, fotoDataUrl, data.nome, x + 4, y + 4, 34, 42)

  const contentX = x + 42
  const contentW = w - 46

  const nomeLinhas = fitTextLines(doc, data.nome, contentW - 72, 18, 2, true)
  nomeLinhas.forEach((linha, index) => {
    drawText(doc, linha, contentX, y + 9 + index * 7, { size: 18, bold: true })
  })

  if (data.nomeSocial) {
    drawText(doc, `Nome social: ${data.nomeSocial}`, contentX, y + 22, { size: 8.6, color: COLORS.muted })
  }

  let chipX = contentX
  const chipY = y + 28.5
  chipX += drawChip(doc, `RA ${data.numeroInscricao || '-'}`, chipX, chipY, { bg: COLORS.grayChip, text: COLORS.text }) + 2
  chipX += drawChip(doc, data.disciplina || '-', chipX, chipY, { bg: COLORS.orangeSoft, text: COLORS.orange }) + 2
  chipX += drawChip(doc, data.nivel || '-', chipX, chipY, { bg: COLORS.blueSoft, text: COLORS.blue }) + 2
  drawChip(doc, formatarSituacao(data.situacao), chipX, chipY, { bg: COLORS.greenSoft, text: COLORS.green })

  const coluna1X = contentX
  const coluna2X = contentX + 88
  const coluna3X = contentX + 166
  const infoY = y + 36.5

  drawText(doc, `Telefone: ${data.telefone || data.whatsapp || '-'}`, coluna1X, infoY, { size: 8.8, color: COLORS.text })
  drawText(doc, `Nascimento: ${data.dataNascimento || '-'}`, coluna2X, infoY, { size: 8.8, color: COLORS.text })
  drawText(doc, `Início: ${data.inicio || '-'}  •  Término: ${data.termino || '-'}`, coluna3X, infoY, { size: 8.8, color: COLORS.text })

  const endereco = [data.endereco, data.bairro ? `Bairro: ${data.bairro}` : '', data.pontoReferencia ? `Ref.: ${data.pontoReferencia}` : '']
    .filter(Boolean)
    .join(' • ')
  drawMultilineText(doc, `Endereço: ${endereco || '-'}`, contentX, y + 43.5, contentW - 4, { size: 8.2, color: COLORS.muted, maxLines: 2, lineHeight: 3.5 })

  const contatoDireita = [data.email ? `E-mail: ${data.email}` : '', data.facebook ? `Facebook: ${data.facebook}` : '', data.instagram ? `Instagram: ${data.instagram}` : '']
    .filter(Boolean)
    .join('  •  ')
  if (contatoDireita) {
    drawText(doc, contatoDireita, x + w - 4, y + 7.5, { size: 7.8, color: COLORS.muted, align: 'right', maxWidth: 92 })
  }
}

function drawGradeTable(doc: jsPDF, gradeData: GradeDataLike, x: number, y: number, w: number) {
  drawSectionTitle(doc, 'Grade de notas', x, y)
  y += 6

  if (!gradeData || !gradeData.protocolos.length) {
    drawRoundBox(doc, x, y, w, 20, { fill: COLORS.cardBg, stroke: COLORS.border, radius: 4 })
    drawText(doc, 'Ainda não há protocolos ou notas lançadas para esta ficha.', x + w / 2, y + 12, {
      size: 10.2,
      align: 'center',
      color: COLORS.muted,
    })
    return 20
  }

  const headers = gradeData.headers?.length ? gradeData.headers : [{ serie: 'Protocolos', colspan: gradeData.protocolos.length }]
  const labelCol = 42
  const protocoloCount = Math.max(gradeData.protocolos.length, 1)
  const protocoloCol = (w - labelCol) / protocoloCount
  const hHeader1 = 8
  const hHeader2 = 7
  const hRow = 8
  const totalHeight = hHeader1 + hHeader2 + hRow * 3

  drawRoundBox(doc, x, y, w, totalHeight, { fill: COLORS.cardBg, stroke: COLORS.border, radius: 4 })

  let cursorX = x + labelCol
  headers.forEach((header, index) => {
    const width = protocoloCol * Number(header.colspan || 0)
    drawRoundBox(doc, cursorX, y, width, hHeader1, {
      fill: index % 2 === 0 ? COLORS.orangeSoft : COLORS.greenSoft,
      stroke: COLORS.border,
      radius: index === 0 ? 3.5 : 0.5,
      lineWidth: 0.18,
    })
    drawText(doc, header.serie, cursorX + width / 2, y + 5.3, { size: 8.1, bold: true, align: 'center' })
    cursorX += width
  })

  drawRoundBox(doc, x, y, labelCol, hHeader1 + hHeader2, { fill: COLORS.graySoft, stroke: COLORS.border, radius: 4, lineWidth: 0.18 })
  drawText(doc, 'Etapa / Série', x + 4, y + 8.8, { size: 8.6, bold: true })

  gradeData.protocolos.forEach((protocolo, index) => {
    const cellX = x + labelCol + index * protocoloCol
    drawRoundBox(doc, cellX, y + hHeader1, protocoloCol, hHeader2, { fill: COLORS.graySoft, stroke: COLORS.border, radius: 0.5, lineWidth: 0.18 })
    drawText(doc, String(protocolo), cellX + protocoloCol / 2, y + hHeader1 + 4.7, { size: 7.7, bold: true, align: 'center' })
  })

  const rows = [
    { label: 'Nota atividade', notas: gradeData.body.find((row) => row.etapa === 'NOTA ATIVIDADE')?.notas ?? [] },
    { label: 'Nota avaliação', notas: gradeData.body.find((row) => row.etapa === 'NOTA AVALIAÇÃO')?.notas ?? [] },
    { label: 'Média', notas: gradeData.body.find((row) => row.etapa === 'MÉDIA')?.notas ?? [] },
  ]

  rows.forEach((row, rowIndex) => {
    const rowY = y + hHeader1 + hHeader2 + rowIndex * hRow
    drawRoundBox(doc, x, rowY, labelCol, hRow, { fill: rowIndex === 2 ? COLORS.greenSoft : COLORS.cardBg, stroke: COLORS.border, radius: 0.5, lineWidth: 0.18 })
    drawText(doc, row.label, x + 3.5, rowY + 5.2, { size: 8.1, bold: rowIndex === 2 })

    gradeData.protocolos.forEach((_, index) => {
      const cellX = x + labelCol + index * protocoloCol
      drawRoundBox(doc, cellX, rowY, protocoloCol, hRow, {
        fill: rowIndex === 2 ? COLORS.greenSoft : COLORS.cardBg,
        stroke: COLORS.border,
        radius: 0.5,
        lineWidth: 0.18,
      })
      drawText(doc, formatarNumero(row.notas[index]), cellX + protocoloCol / 2, rowY + 5.2, {
        size: 7.8,
        bold: rowIndex === 2,
        align: 'center',
      })
    })
  })

  return totalHeight
}

function drawResumoPage(doc: jsPDF, data: PdfFichaData, fotoDataUrl: string | null) {
  addPageBackground(doc)
  addHeader(doc, 'Relatório pedagógico automatizado', `${data.disciplina || '-'} • ${data.nivel || '-'}`)
  drawStudentCard(doc, data, fotoDataUrl)

  const gradeY = 80
  const gradeHeight = drawGradeTable(doc, data.gradeData, MARGIN_X, gradeY, CONTENT_WIDTH)

  const metricsY = gradeY + gradeHeight + 10
  drawSectionTitle(doc, 'Resumo do acompanhamento', MARGIN_X, metricsY)

  const totalAtendimentos = data.historico.length
  const totalAT = data.historico.filter((item) => item.at === 'X').length
  const totalAV = data.historico.filter((item) => item.av === 'X').length
  const totalRE = data.historico.filter((item) => item.re === 'X').length
  const mediaFinal = formatarNumero(data.gradeData?.mediaFinal)

  const metricW = (CONTENT_WIDTH - 8) / 5
  const metricsTop = metricsY + 6
  drawMetricCard(doc, MARGIN_X, metricsTop, metricW, 'Atendimentos', String(totalAtendimentos), COLORS.orange)
  drawMetricCard(doc, MARGIN_X + metricW + 2, metricsTop, metricW, 'Atividades', String(totalAT), COLORS.blue)
  drawMetricCard(doc, MARGIN_X + (metricW + 2) * 2, metricsTop, metricW, 'Avaliações', String(totalAV), COLORS.green)
  drawMetricCard(doc, MARGIN_X + (metricW + 2) * 3, metricsTop, metricW, 'Recuperações', String(totalRE), COLORS.red)
  drawMetricCard(doc, MARGIN_X + (metricW + 2) * 4, metricsTop, metricW, 'Média final', mediaFinal, COLORS.green)

  const boxY = metricsTop + 20
  const leftW = 133
  const rightW = CONTENT_WIDTH - leftW - 4

  drawRoundBox(doc, MARGIN_X, boxY, leftW, 42, { fill: COLORS.cardBg, stroke: COLORS.border, radius: 4 })
  drawText(doc, 'Síntese acadêmica', MARGIN_X + 4, boxY + 7, { size: 10.8, bold: true })
  drawText(doc, `Período do acompanhamento: ${data.inicio || '-'} até ${data.termino || '-'}`, MARGIN_X + 4, boxY + 14.5, {
    size: 8.8,
    color: COLORS.text,
  })
  drawText(doc, `Situação atual: ${formatarSituacao(data.situacao)}`, MARGIN_X + 4, boxY + 21, { size: 8.8, color: COLORS.text })
  drawText(doc, `Professor do último atendimento: ${data.assinaturaProfessor || '-'}`, MARGIN_X + 4, boxY + 27.5, {
    size: 8.8,
    color: COLORS.text,
    maxWidth: leftW - 8,
  })
  drawText(doc, `Contato principal: ${data.telefone || data.whatsapp || '-'}  •  E-mail: ${data.email || '-'}`, MARGIN_X + 4, boxY + 34, {
    size: 8.2,
    color: COLORS.muted,
    maxWidth: leftW - 8,
  })

  drawRoundBox(doc, MARGIN_X + leftW + 4, boxY, rightW, 42, { fill: COLORS.cardBg, stroke: COLORS.border, radius: 4 })
  drawText(doc, 'Observações gerais', MARGIN_X + leftW + 8, boxY + 7, { size: 10.8, bold: true })
  const observacoes = sanitizarTextoLivre(data.observacoes) || 'Sem observações registradas até o momento.'
  const linhasObs = fitTextLines(doc, observacoes, rightW - 8, 8.5, 7, false)
  drawMultilineText(doc, linhasObs.join('\n'), MARGIN_X + leftW + 8, boxY + 14, rightW - 10, {
    size: 8.5,
    color: COLORS.text,
    lineHeight: 4,
  })
  if (splitText(doc, observacoes, rightW - 8, 8.5).length > linhasObs.length) {
    drawText(doc, 'Continua na última página.', MARGIN_X + leftW + rightW - 4, boxY + 37.2, {
      size: 8,
      color: COLORS.muted,
      align: 'right',
    })
  }
}

function drawHistoryTableHeader(doc: jsPDF, y: number) {
  const columns = [
    { key: 'data', label: 'Data', width: 22 },
    { key: 'horario', label: 'Horário', width: 24 },
    { key: 'or', label: 'OR', width: 8 },
    { key: 'at', label: 'AT', width: 8 },
    { key: 'av', label: 'AV', width: 8 },
    { key: 're', label: 'RE', width: 8 },
    { key: 'professor', label: 'Professor(a)', width: 44 },
    { key: 'registro', label: 'Registro do atendimento', width: CONTENT_WIDTH - (22 + 24 + 8 + 8 + 8 + 8 + 44) },
  ]

  let cursorX = MARGIN_X
  columns.forEach((column, index) => {
    drawRoundBox(doc, cursorX, y, column.width, 9, {
      fill: index < 6 ? COLORS.orangeSoft : COLORS.greenSoft,
      stroke: COLORS.border,
      radius: index === 0 || index === columns.length - 1 ? 3 : 0.4,
      lineWidth: 0.18,
    })
    drawText(doc, column.label, cursorX + column.width / 2, y + 5.7, { size: 8.2, bold: true, align: 'center' })
    cursorX += column.width
  })
}

function addHistoryPage(doc: jsPDF, data: PdfFichaData) {
  doc.addPage('a4', 'landscape')
  addPageBackground(doc)
  addHeader(doc, 'Histórico detalhado de atendimentos', `${data.nome} • RA ${data.numeroInscricao || '-'}`)
  drawSectionTitle(doc, 'Lançamentos registrados', MARGIN_X, 27)
  drawHistoryTableHeader(doc, 31)
}

function drawHistoryPages(doc: jsPDF, data: PdfFichaData) {
  addHistoryPage(doc, data)

  if (!data.historico.length) {
    drawRoundBox(doc, MARGIN_X, 44, CONTENT_WIDTH, 22, { fill: COLORS.cardBg, stroke: COLORS.border, radius: 4 })
    drawText(doc, 'Nenhum atendimento registrado para esta ficha.', PAGE_WIDTH / 2, 57, {
      size: 10.5,
      align: 'center',
      color: COLORS.muted,
    })
    return
  }

  const registroWidth = CONTENT_WIDTH - (22 + 24 + 8 + 8 + 8 + 8 + 44) - 6
  const professorWidth = 44 - 4
  let y = 40.5

  data.historico.forEach((item, index) => {
    const professorLinhas = fitTextLines(doc, item.professor || '-', professorWidth, 8.3, 3)
    const registroLinhas = fitTextLines(doc, item.registro || '-', registroWidth, 8.1, 5)
    const lines = Math.max(1, professorLinhas.length, registroLinhas.length)
    const rowHeight = Math.max(11, 4.6 + lines * 4)

    if (y + rowHeight > PAGE_HEIGHT - 16) {
      addHistoryPage(doc, data)
      y = 40.5
    }

    const fill = index % 2 === 0 ? COLORS.cardBg : COLORS.graySoft
    drawRoundBox(doc, MARGIN_X, y, CONTENT_WIDTH, rowHeight, { fill, stroke: COLORS.border, radius: 2.5, lineWidth: 0.16 })

    const horario = [item.entrada, item.saida].filter(Boolean).join(' - ') || '-'
    const marcadores = [item.or || '', item.at || '', item.av || '', item.re || '']
    const valoresBase = [item.data || '-', horario, ...marcadores]
    const widths = [22, 24, 8, 8, 8, 8]

    let cursorX = MARGIN_X
    valoresBase.forEach((valor, idx) => {
      drawText(doc, valor || '-', cursorX + widths[idx] / 2, y + rowHeight / 2 + 1.4, {
        size: idx >= 2 ? 8.6 : 8.1,
        bold: idx >= 2 && Boolean(valor),
        align: 'center',
        color: idx >= 2 && Boolean(valor) ? COLORS.text : COLORS.muted,
      })
      cursorX += widths[idx]
    })

    drawMultilineText(doc, professorLinhas.join('\n'), cursorX + 2, y + 5.8, professorWidth, {
      size: 8.3,
      color: COLORS.text,
      lineHeight: 3.6,
    })
    cursorX += 44

    drawMultilineText(doc, registroLinhas.join('\n'), cursorX + 2, y + 5.8, registroWidth, {
      size: 8.1,
      color: COLORS.text,
      lineHeight: 3.5,
    })

    y += rowHeight + 2
  })
}

function addObservacoesPage(doc: jsPDF, data: PdfFichaData, fotoDataUrl: string | null) {
  doc.addPage('a4', 'landscape')
  addPageBackground(doc)
  addHeader(doc, 'Fechamento e observações', `${data.nome} • ${data.disciplina || '-'}`)

  const cardTopY = 24
  const leftCardW = 84
  const rightCardX = MARGIN_X + leftCardW + 4
  const rightCardW = CONTENT_WIDTH - leftCardW - 4

  drawRoundBox(doc, MARGIN_X, cardTopY, leftCardW, 48, { fill: COLORS.cardBg, stroke: COLORS.border, radius: 4 })
  drawPhoto(doc, fotoDataUrl, data.nome, MARGIN_X + 4, cardTopY + 5, 24, 26)

  const resumoX = MARGIN_X + 32
  const resumoW = leftCardW - 36
  const nomeLinhas = fitTextLines(doc, data.nome, resumoW, 11.2, 3, true)
  nomeLinhas.forEach((linha, index) => {
    drawText(doc, linha, resumoX, cardTopY + 11 + index * 5.2, { size: 11.2, bold: true, maxWidth: resumoW })
  })

  drawText(doc, `RA: ${data.numeroInscricao || '-'}`, resumoX, cardTopY + 31.5, {
    size: 8.4,
    color: COLORS.muted,
    maxWidth: resumoW,
  })
  drawText(doc, `Situação: ${formatarSituacao(data.situacao)}`, resumoX, cardTopY + 38.3, {
    size: 8.4,
    color: COLORS.muted,
    maxWidth: resumoW,
  })
  drawText(doc, `Média final: ${formatarNumero(data.gradeData?.mediaFinal)}`, resumoX, cardTopY + 45, {
    size: 8.4,
    color: COLORS.muted,
    maxWidth: resumoW,
  })

  drawRoundBox(doc, rightCardX, cardTopY, rightCardW, 48, { fill: COLORS.cardBg, stroke: COLORS.border, radius: 4 })
  drawText(doc, 'Quadro final', rightCardX + 4, cardTopY + 7, { size: 11.4, bold: true })
  drawText(doc, `Disciplina: ${data.disciplina || '-'}`, rightCardX + 4, cardTopY + 15, { size: 8.8 })
  drawText(doc, `Nível: ${data.nivel || '-'}  •  Período: ${data.inicio || '-'} até ${data.termino || '-'}`, rightCardX + 4, cardTopY + 22, {
    size: 8.8,
    color: COLORS.text,
    maxWidth: rightCardW - 8,
  })
  drawText(doc, `Último professor responsável: ${data.assinaturaProfessor || '-'}`, rightCardX + 4, cardTopY + 29, {
    size: 8.8,
    color: COLORS.text,
    maxWidth: rightCardW - 8,
  })
  drawText(doc, `Contato: ${data.telefone || data.whatsapp || '-'}  •  E-mail: ${data.email || '-'}`, rightCardX + 4, cardTopY + 36, {
    size: 8.4,
    color: COLORS.muted,
    maxWidth: rightCardW - 8,
  })
  drawText(doc, `Endereço: ${[data.endereco, data.bairro].filter(Boolean).join(' • ') || '-'}`, rightCardX + 4, cardTopY + 43, {
    size: 8.2,
    color: COLORS.muted,
    maxWidth: rightCardW - 8,
  })

  let y = 82
  drawSectionTitle(doc, 'Observações completas', MARGIN_X, y)
  y += 6

  const observacoes = sanitizarTextoLivre(data.observacoes) || 'Sem observações registradas.'
  const largura = CONTENT_WIDTH - 8
  const lineHeight = 4.2
  let linhas = splitText(doc, observacoes, largura, 9)

  while (linhas.length) {
    const limiteLinhas = Math.floor((PAGE_HEIGHT - y - 18) / lineHeight)
    const bloco = linhas.slice(0, Math.max(1, limiteLinhas))
    const boxHeight = Math.max(20, bloco.length * lineHeight + 8)

    drawRoundBox(doc, MARGIN_X, y, CONTENT_WIDTH, boxHeight, { fill: COLORS.cardBg, stroke: COLORS.border, radius: 4 })
    drawMultilineText(doc, bloco.join('\n'), MARGIN_X + 4, y + 7, largura, { size: 9, lineHeight })

    linhas = linhas.slice(bloco.length)
    if (linhas.length) {
      doc.addPage('a4', 'landscape')
      addPageBackground(doc)
      addHeader(doc, 'Fechamento e observações', `${data.nome} • continuação`)
      y = 24
    }
  }
}

function situacaoPadrao(numeroInscricao: string, gradeData: GradeDataLike): PdfFichaData['situacao'] {
  if (gradeData?.mediaFinal !== null && gradeData?.mediaFinal !== undefined) return 'CLASSIF'
  if (numeroInscricao) return 'PROGR'
  return 'ORIENT'
}

export async function gerarFichaAcompanhamentoPdf(data: PdfFichaData): Promise<Blob> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true })
  doc.setProperties({
    title: `Ficha de acompanhamento - ${data.nome || 'Aluno'}`,
    subject: 'Relatório pedagógico automatizado',
    author: 'SIGE-CEJA',
    creator: 'SIGE-CEJA',
    keywords: 'sige ceja, ficha, acompanhamento, aluno',
  })
  const fotoDataUrl = data.fotoDataUrl || (await carregarImagemExterna(data.fotoUrl))
  const payload: PdfFichaData = {
    ...data,
    situacao: data.situacao ?? situacaoPadrao(data.numeroInscricao, data.gradeData),
  }

  drawResumoPage(doc, payload, fotoDataUrl)
  drawHistoryPages(doc, payload)
  addObservacoesPage(doc, payload, fotoDataUrl)
  addFooter(doc, payload)

  return doc.output('blob')
}

export async function baixarFichaAcompanhamentoPdf(data: PdfFichaData, fileName?: string): Promise<void> {
  const blob = await gerarFichaAcompanhamentoPdf({
    ...data,
    telefone: formatarTelefoneBR(data.telefone),
    dataNascimento: formatarDataBR(data.dataNascimento),
    endereco: data.endereco || '',
    bairro: data.bairro || '',
    pontoReferencia: data.pontoReferencia || '',
    whatsapp: data.whatsapp || data.telefone || '',
    email: data.email || '',
    facebook: data.facebook || '',
    instagram: data.instagram || '',
    historico: data.historico || [],
    gradeData: data.gradeData,
    inicio: data.inicio || '',
    termino: data.termino || '',
    nomeSocial: data.nomeSocial || '',
    assinaturaProfessor: data.assinaturaProfessor || '',
    numeroInscricao: data.numeroInscricao,
    nivel: data.nivel,
    disciplina: data.disciplina,
    nome: data.nome,
    fotoUrl: data.fotoUrl || '',
    fotoDataUrl: data.fotoDataUrl || '',
    situacao: data.situacao,
    observacoes: sanitizarTextoLivre(data.observacoes) || '',
  })

  const blobUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = blobUrl
  anchor.download = fileName || `ficha-acompanhamento-${data.numeroInscricao || 'aluno'}.pdf`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1500)
}

export function montarEnderecoPdf(input: {
  logradouro?: string | null
  numero_endereco?: string | null
  bairro?: string | null
  municipio?: string | null
  ponto_referencia?: string | null
}) {
  return formatarEnderecoLinha(input)
}

export function montarHistoricoPdfRows(
  input: Array<{
    hora_entrada?: string | null
    hora_saida?: string | null
    professor_nome?: string | null
    atividades?: unknown[] | null
    resumo_atividades?: string | null
    hasAT?: boolean
    hasAV?: boolean
    hasRE?: boolean
  }>
): PdfHistoricoRow[] {
  return input.map((sessao) => ({
    data: formatarDataBR(sessao.hora_entrada),
    entrada: formatarHoraBR(sessao.hora_entrada),
    saida: formatarHoraBR(sessao.hora_saida),
    or: 'X',
    at: sessao.hasAT ? 'X' : '',
    av: sessao.hasAV ? 'X' : '',
    re: sessao.hasRE ? 'X' : '',
    professor: String(sessao.professor_nome ?? ''),
    registro: formatarRegistroSessaoTexto(sessao as any),
  }))
}
