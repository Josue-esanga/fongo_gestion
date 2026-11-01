import css3 from '@/assets/modules/css3-original.svg'
import database from '@/assets/modules/database.svg'
import django from '@/assets/modules/django-plain.svg'
import html5 from '@/assets/modules/html5-original.svg'
import javascript from '@/assets/modules/javascript-original.svg'
import poo from '@/assets/modules/poo.svg'
import python from '@/assets/modules/python-original.svg'

/**
 * Logos officiels des langages du programme (Devicon) et pictogrammes
 * internes pour les sujets sans logo (bases de données, POO).
 */
const ICONS: Record<string, string> = {
  html5,
  css3,
  javascript,
  python,
  django,
  'base de donnees': database,
  'programmation orientee objet': poo,
}

/**
 * Minuscules, sans accents et sans parenthèses :
 * « Programmation orientée objet (POO) » → « programmation orientee objet ».
 */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Renvoie l'image du sujet, ou `null` si aucun logo n'est connu. */
export function subjectIcon(subject: string): string | null {
  return ICONS[normalize(subject)] ?? null
}
