export type OtimizarImagemOptions = {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  mimeType?: string
  fileName?: string
}

function normalizarNomeArquivo(fileName: string): string {
  const semAcento = fileName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')

  const base = semAcento.replace(/\.[^.]+$/, '') || 'imagem'
  return `${base}.jpg`
}

async function carregarImagem(file: File): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(file)

  return await new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Não foi possível carregar a imagem para otimização.'))
    }
    img.src = objectUrl
  })
}

export async function otimizarImagemParaUpload(
  file: File,
  options: OtimizarImagemOptions = {}
): Promise<File> {
  if (!file.type.startsWith('image/')) return file

  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.62,
    mimeType = 'image/jpeg',
    fileName = file.name,
  } = options

  try {
    const img = await carregarImagem(file)

    const escala = Math.min(1, maxWidth / img.width || 1, maxHeight / img.height || 1)
    const width = Math.max(1, Math.round(img.width * escala))
    const height = Math.max(1, Math.round(img.height * escala))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) return file

    ctx.drawImage(img, 0, 0, width, height)

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, mimeType, quality)
    })

    if (!blob) return file

    return new File([blob], normalizarNomeArquivo(fileName), {
      type: mimeType,
      lastModified: Date.now(),
    })
  } catch (error) {
    console.warn('[otimizarImagemParaUpload] Falha ao otimizar imagem, enviando original.', error)
    return file
  }
}