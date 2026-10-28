import type { Paginated } from '@/types'

export function unwrap<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results
}

export function buildFormData(
  data: Record<string, unknown>,
  file?: File | null,
): FormData {
  const formData = new FormData()

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    formData.append(key, String(value))
  })

  if (file) formData.append('pictures', file)
  return formData
}
