import { useEffect, useState } from 'react'

/**
 * Crée une URL locale pour un fichier et la révoque proprement.
 * Le couple état + effet évite les URL révoquées par le double montage de
 * StrictMode en développement.
 */
export function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setUrl(null)
      return
    }

    const nextUrl = URL.createObjectURL(file)
    setUrl(nextUrl)
    return () => URL.revokeObjectURL(nextUrl)
  }, [file])

  return url
}
