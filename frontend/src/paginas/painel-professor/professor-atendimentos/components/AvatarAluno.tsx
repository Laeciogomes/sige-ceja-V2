import { useEffect, useMemo, useState, type SyntheticEvent } from 'react'
import { Avatar, type AvatarProps } from '@mui/material'

import { resolverFotoUrl, resolverFotoUrlComVersao } from '../utils'

type AvatarAlunoProps = Omit<AvatarProps, 'src' | 'alt'> & {
  nome?: string | null
  fotoUrl?: string | null
  fallbackUrl?: string | null
  usarVersao?: boolean
}

function extrairIniciais(nome?: string | null): string {
  const partes = String(nome ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 1).toUpperCase()
  return `${partes[0].slice(0, 1)}${partes[partes.length - 1].slice(0, 1)}`.toUpperCase()
}

export function AvatarAluno({
  nome,
  fotoUrl,
  fallbackUrl,
  usarVersao = true,
  children,
  imgProps,
  ...avatarProps
}: AvatarAlunoProps) {
  const srcPrincipal = useMemo(() => {
    if (!fotoUrl) return undefined
    return usarVersao ? resolverFotoUrlComVersao(fotoUrl) : resolverFotoUrl(fotoUrl)
  }, [fotoUrl, usarVersao])

  const srcFallback = useMemo(() => {
    if (!fallbackUrl) return undefined
    return usarVersao ? resolverFotoUrlComVersao(fallbackUrl) : resolverFotoUrl(fallbackUrl)
  }, [fallbackUrl, usarVersao])

  const [srcAtual, setSrcAtual] = useState<string | undefined>(srcPrincipal ?? srcFallback)

  useEffect(() => {
    setSrcAtual(srcPrincipal ?? srcFallback)
  }, [srcPrincipal, srcFallback])

  const iniciais = useMemo(() => extrairIniciais(nome), [nome])

  const handleError = (event: SyntheticEvent<HTMLImageElement, Event>) => {
    imgProps?.onError?.(event)

    const currentTarget = event.currentTarget
    const atual = currentTarget.currentSrc || currentTarget.src || srcAtual || ''

    if (srcFallback && atual !== srcFallback) {
      setSrcAtual(srcFallback)
      return
    }

    setSrcAtual(undefined)
  }

  return (
    <Avatar
      {...avatarProps}
      src={srcAtual}
      alt={nome ?? ''}
      imgProps={{
        referrerPolicy: 'no-referrer',
        ...imgProps,
        onError: handleError,
      }}
    >
      {children ?? iniciais}
    </Avatar>
  )
}
