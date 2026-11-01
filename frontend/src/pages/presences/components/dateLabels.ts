import dayjs from 'dayjs'

/** Libellé d'un jour : « Aujourd'hui », « Hier », sinon « jeudi 29 octobre ». */
export function libelleJour(dateIso: string): string {
  const jour = dayjs(dateIso).startOf('day')
  const ecart = jour.diff(dayjs().startOf('day'), 'day')
  if (ecart === 0) return "Aujourd'hui"
  if (ecart === -1) return 'Hier'
  return jour
    .format('dddd D MMMM')
    .replace(/^./, (lettre) => lettre.toUpperCase())
}
