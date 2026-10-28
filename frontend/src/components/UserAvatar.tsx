import { useEffect, useState } from 'react'
import { initials } from '@/lib/format'

type AvatarUser = {
  username?: string
  first_name?: string
  last_name?: string
  pictures?: string | null
}

const SIZES = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
  '2xl': 'h-24 w-24 text-2xl',
} as const

export function UserAvatar({
  user,
  size = 'md',
}: {
  user?: AvatarUser | null
  size?: keyof typeof SIZES
}) {
  const [failed, setFailed] = useState(false)
  const label = initials(user?.first_name, user?.last_name, user?.username ?? 'U')

  useEffect(() => {
    setFailed(false)
  }, [user?.pictures])

  const showImage = Boolean(user?.pictures) && !failed

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-fongo-100 font-bold text-fongo-900 ring-2 ring-white ${SIZES[size]}`}
    >
      {showImage ? (
        <img
          src={user?.pictures ?? ''}
          alt={user?.username ?? 'Photo de profil'}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        label
      )}
    </span>
  )
}
