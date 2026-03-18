import { useEffect, useMemo, useState } from 'react'

import { Avatar } from '@mui/material'
import type { AvatarProps } from '@mui/material'

import { useSupabase } from '../../../../contextos/SupabaseContext'
import { resolverFotoAlunoUrl, resolverFotoUrlComVersao } from '../utils'

const cacheFotos = new Map<string, string | null>()

type AvatarAlunoAtendimentoProps = Omit<AvatarProps, 'src' | 'alt'> & {
  idAluno?: number | null
  fotoUrl?: string | null
  nome?: string | null
  bucket?: string
}

function obterIniciais(nome?: string | null): string {
  const partes = String(nome ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].charAt(0).toUpperCase()
  return `${partes[0].charAt(0)}${partes[1].charAt(0)}`.toUpperCase()
}

export function AvatarAlunoAtendimento({
  idAluno,
  fotoUrl,
  nome,
  bucket = 'avatars',
  imgProps,
  children,
  ...avatarProps
}: AvatarAlunoAtendimentoProps) {
  const { supabase } = useSupabase()

  const cacheKey = useMemo(() => `${bucket}::${idAluno ?? 'sem-id'}::${String(fotoUrl ?? '').trim()}`, [bucket, idAluno, fotoUrl])
  const srcDireta = useMemo(() => resolverFotoUrlComVersao(fotoUrl, bucket), [bucket, fotoUrl])
  const [src, setSrc] = useState<string | undefined>(srcDireta)
  const [tentandoFallback, setTentandoFallback] = useState(false)

  useEffect(() => {
    let ativo = true
    const cached = cacheFotos.get(cacheKey)
    if (cached !== undefined) {
      setSrc(cached ?? undefined)
      setTentandoFallback(false)
      return () => {
        ativo = false
      }
    }

    setSrc(srcDireta)
    setTentandoFallback(false)

    if (srcDireta) {
      cacheFotos.set(cacheKey, srcDireta)
      return () => {
        ativo = false
      }
    }

    ;(async () => {
      const fallback = await resolverFotoAlunoUrl(supabase as any, idAluno ?? null, null, bucket)
      if (!ativo) return
      cacheFotos.set(cacheKey, fallback ?? null)
      setSrc(fallback)
    })()

    return () => {
      ativo = false
    }
  }, [bucket, cacheKey, idAluno, srcDireta, supabase])

  const acionarFallback = () => {
    if (tentandoFallback) return
    setTentandoFallback(true)

    ;(async () => {
      const fallback = await resolverFotoAlunoUrl(supabase as any, idAluno ?? null, null, bucket)
      cacheFotos.set(cacheKey, fallback ?? null)
      setSrc(fallback)
    })()
  }

  return (
    <Avatar
      {...avatarProps}
      src={src}
      alt={nome ?? ''}
      imgProps={{
        loading: 'lazy',
        referrerPolicy: 'no-referrer',
        onError: acionarFallback,
        ...imgProps,
      }}
    >
      {children ?? obterIniciais(nome)}
    </Avatar>
  )
}
