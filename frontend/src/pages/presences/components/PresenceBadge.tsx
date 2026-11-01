import dayjs from 'dayjs'
import { Tag } from 'primereact/tag'
import type { ParticipantPresence } from '@/types'

export function PresenceBadge({
  participant,
}: {
  participant: ParticipantPresence
}) {
  return participant.present ? (
    <Tag
      severity="success"
      value={`Présent · ${dayjs(participant.horodatage).format('HH:mm')}`}
      icon="pi pi-check-circle"
    />
  ) : (
    <Tag severity="danger" value="Absent" icon="pi pi-times-circle" />
  )
}
