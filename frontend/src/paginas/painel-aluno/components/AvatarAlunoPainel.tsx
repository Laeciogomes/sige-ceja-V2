import { useEffect, useMemo, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

import { Avatar, type SxProps, type Theme } from '@mui/material'

import { obterIniciais, resolverFotoAlunoPainel } from '../utils'

type Props = {
  supabase: SupabaseClient | null
  idAluno?: number | null
  nome: string
  fotoUrl?: string | null
  sx?: SxProps<Theme>
}

const cacheFotos = new Map<string, string | null>()

export default function AvatarAlunoPainel({
  supabase,
  idAluno,
  nome,
  fotoUrl,
  sx,
}: Props) {
  const [src, setSrc] = useState<string | undefined>(undefined)
  const [tentouFallback, setTentouFallback] = useState(false)

  const iniciais = useMemo(() => obterIniciais(nome), [nome])
  const cacheKey = useMemo(
    () => `${idAluno ?? 'sem-id'}::${String(fotoUrl ?? '').trim()}`,
    [idAluno, fotoUrl],
  )

  useEffect(() => {
    let ativo = true
    const cached = cacheFotos.get(cacheKey)

    setTentouFallback(false)

    if (cached !== undefined) {
      setSrc(cached ?? undefined)
      return () => {
        ativo = false
      }
    }

    setSrc(undefined)
    void resolverFotoAlunoPainel(supabase, idAluno, fotoUrl).then(url => {
      if (!ativo) return
      cacheFotos.set(cacheKey, url ?? null)
      setSrc(url)
    })

    return () => {
      ativo = false
    }
  }, [cacheKey, fotoUrl, idAluno, supabase])

  const handleError = () => {
    if (tentouFallback) {
      cacheFotos.set(cacheKey, null)
      setSrc(undefined)
      return
    }

    setTentouFallback(true)

    void resolverFotoAlunoPainel(supabase, idAluno, null).then(url => {
      cacheFotos.set(cacheKey, url ?? null)
      setSrc(url)
    })
  }

  return (
    <Avatar
      src={src}
      alt={nome}
      imgProps={{
        loading: 'lazy',
        referrerPolicy: 'no-referrer',
        onError: handleError,
      }}
      sx={sx}
    >
      {iniciais}
    </Avatar>
  )
}
