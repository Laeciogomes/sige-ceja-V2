import { Alert, Box, Button, Card, CardContent, Stack, Typography } from '@mui/material'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import { useMemo, useState } from 'react'

function agoraLocal() {
  const d = new Date()
  return d.toLocaleString('pt-BR')
}

export default function ProfessorPontoPage() {
  const [ultimoRegistro, setUltimoRegistro] = useState<string | null>(null)
  const agora = useMemo(() => agoraLocal(), [])

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Bater ponto
        </Typography>
        <Typography color="text.secondary">
          Área preparada no menu lateral. O registro definitivo depende da tabela e das regras de ponto no banco.
        </Typography>
      </Box>

      <Alert severity="warning">
        Este módulo ainda não tinha estrutura de banco nem rotas no projeto enviado. Eu deixei a entrada acessível no menu e uma tela inicial pronta para evolução.
      </Alert>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="body1">
              Horário atual: <strong>{agora}</strong>
            </Typography>
            <Button
              variant="contained"
              startIcon={<AccessTimeIcon />}
              onClick={() => setUltimoRegistro(agoraLocal())}
              sx={{ alignSelf: 'flex-start' }}
            >
              Registrar marcação local
            </Button>
            <Typography variant="body2" color="text.secondary">
              {ultimoRegistro ? `Última marcação local: ${ultimoRegistro}` : 'Nenhuma marcação local nesta sessão.'}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}
