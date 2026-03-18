import { useEffect, useMemo, useState } from 'react'
import type { SxProps, Theme } from '@mui/material/styles'
import { Avatar } from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'

import type { SupabaseLike } from '../utils'
import { resolverFotoAlunoUrl } from '../utils'

type AvatarAlunoFichaProps = {
  supabase: SupabaseLike
  idAluno?: number | null
  fotoUrl?: string | null
  nome?: string | null
  sx?: SxProps<Theme>
  variant?: 'circular' | 'rounded' | 'square'
}

function iniciaisNome(nome?: string | null): string {
  const partes = String(nome ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (partes.length === 0) return ''
  if (partes.length === 1) return partes[0].slice(0, 1).toUpperCase()
  return `${partes[0].slice(0, 1)}${partes[1].slice(0, 1)}`.toUpperCase()
}

export default function AvatarAlunoFicha({
  supabase,
  idAluno,
  fotoUrl,
  nome,
  sx,
  variant = 'rounded',
}: AvatarAlunoFichaProps) {
  const [src, setSrc] = useState<string | undefined>(undefined)
  const [tentouFallback, setTentouFallback] = useState(false)

  useEffect(() => {
    let active = true
    setSrc(undefined)
    setTentouFallback(false)

    void resolverFotoAlunoUrl(supabase, idAluno, fotoUrl).then((url) => {
      if (active) setSrc(url)
    })

    return () => {
      active = false
    }
  }, [supabase, idAluno, fotoUrl])

  const fallbackLabel = useMemo(() => iniciaisNome(nome), [nome])

  return (
    <Avatar
      sx={sx}
      src={src}
      variant={variant}
      imgProps={{
        crossOrigin: 'anonymous',
        referrerPolicy: 'no-referrer',
        onError: () => {
          if (tentouFallback) return
          setTentouFallback(true)
          void resolverFotoAlunoUrl(supabase, idAluno, null).then((url) => setSrc(url))
        },
      }}
    >
      {fallbackLabel || <PersonIcon sx={{ fontSize: 60 }} />}
    </Avatar>
  )
}
