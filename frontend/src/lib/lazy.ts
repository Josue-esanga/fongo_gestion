import { lazy, type ComponentType } from 'react'

/**
 * Charge un composant exporté sous un nom précis sans répéter le `.then()`
 * dans chaque route ou dialogue.
 */
export function lazyNamed<T extends ComponentType<any>>(
  loader: () => Promise<Record<string, T>>,
  exportName: string,
) {
  return lazy(async () => {
    const module = await loader()
    return { default: module[exportName] as T }
  })
}
