import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import CloseIcon from '@mui/icons-material/Close'

import type { ProfessorDestinoOption, TransferenciaContexto } from '../types'
import { resolverFotoUrl } from '../utils'

type TransferenciaDialogProps = {
  open: boolean
  isMobile: boolean
  transferenciaContexto: TransferenciaContexto | null
  qtdAtendimentosAbertosTransferencia: number
  carregandoProfSala: boolean
  professoresSala: ProfessorDestinoOption[]
  professorDestino: ProfessorDestinoOption | null
  transferindo: boolean
  onClose: () => void
  onProfessorDestinoChange: (value: ProfessorDestinoOption | null) => void
  onConfirmar: () => void | Promise<void>
}

export function TransferenciaDialog({
  open,
  isMobile,
  transferenciaContexto,
  qtdAtendimentosAbertosTransferencia,
  carregandoProfSala,
  professoresSala,
  professorDestino,
  transferindo,
  onClose,
  onProfessorDestinoChange,
  onConfirmar,
}: TransferenciaDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
      <DialogTitle sx={{ fontWeight: 900 }}>
        Transferir todos os atendimentos abertos
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {!transferenciaContexto ? (
          <Alert severity="warning">Sala não selecionada para a transferência.</Alert>
        ) : (
          <Stack spacing={2}>
            <Alert severity="info">
              O sistema vai encerrar todos os atendimentos abertos da sala{' '}
              <strong>{transferenciaContexto.sala_nome}</strong> para você e reabrir todos para o professor escolhido.
            </Alert>

            <Alert severity={qtdAtendimentosAbertosTransferencia > 0 ? 'warning' : 'error'}>
              Quantidade de atendimentos abertos da sala que serão transferidos agora:{' '}
              <strong>{qtdAtendimentosAbertosTransferencia}</strong>
            </Alert>

            {carregandoProfSala ? <LinearProgress /> : null}

            <Autocomplete
              options={professoresSala}
              value={professorDestino}
              onChange={(_, v) => onProfessorDestinoChange(v)}
              getOptionLabel={(o) => o?.nome ?? ''}
              noOptionsText={carregandoProfSala ? 'Carregando...' : 'Nenhum professor disponível na sala'}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option.id_professor}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
                    <Avatar src={resolverFotoUrl(option.foto_url)} alt={option.nome} sx={{ width: 34, height: 34 }} />
                    <Typography sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}>{option.nome}</Typography>
                  </Stack>
                </Box>
              )}
              renderInput={(params) => (
                <TextField {...params} label={`Professor destino (${transferenciaContexto.sala_nome})`} />
              )}
            />
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" onClick={onClose} disabled={transferindo}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={() => void onConfirmar()}
          disabled={transferindo || !professorDestino || qtdAtendimentosAbertosTransferencia < 1}
        >
          {transferindo ? 'Transferindo...' : 'Confirmar transferência'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
