import { pad2 } from './format'

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export function fmtDateLong(d: Date = new Date()): string {
  return `${pad2(d.getUTCDate())} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export function fmtDateShort(d: Date = new Date()): string {
  const m = MONTHS[d.getUTCMonth()]
  return `${pad2(d.getUTCDate())} ${m.charAt(0)}${m.slice(1, 3).toLowerCase()}`
}

export function fmtDateCompact(d: Date = new Date()): string {
  return `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}`
}

export function fmtTimeUTC(d: Date = new Date()): string {
  return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())} UTC`
}