import type { ReactNode } from 'react'

/* --------------------------------------------------------------------------
   Briques de base
   -------------------------------------------------------------------------- */

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />
}

export function SkeletonText({
  lines = 3,
  className = '',
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={`h-3 ${index === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  )
}

function SkeletonPage({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}

function SkeletonHeader({ withAction = true }: { withAction?: boolean }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-3.5 w-80 max-w-full" />
      </div>
      {withAction && <Skeleton className="h-12 w-48 rounded-full" />}
    </div>
  )
}

function SkeletonStatCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="w-full space-y-3">
              <Skeleton className="h-2.5 w-24" />
              <Skeleton className="h-7 w-28" />
            </div>
            <Skeleton className="h-11 w-11 shrink-0 rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

function SkeletonToolbar() {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-10 w-24 rounded-full" />
        <Skeleton className="h-10 w-28 rounded-full" />
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>
      <Skeleton className="h-11 w-full rounded-xl lg:w-72" />
    </div>
  )
}

function SkeletonTable({ rows = 7, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-6 border-b border-slate-100 bg-slate-50/80 px-6 py-4">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton
            key={index}
            className={`h-2.5 ${index === 0 ? 'w-28' : 'w-20'}`}
          />
        ))}
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="flex items-center gap-6 px-6 py-4">
            <div className="flex flex-1 items-center gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div className="w-full space-y-2">
                <Skeleton className="h-3 w-40 max-w-full" />
                <Skeleton className="h-2.5 w-28 max-w-full" />
              </div>
            </div>
            {Array.from({ length: columns - 1 }).map((_, column) => (
              <Skeleton
                key={column}
                className={`h-3 ${column === columns - 2 ? 'w-16' : 'w-20'}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function SkeletonPanel({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
          >
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-2.5 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  )
}

function SkeletonCardList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="w-full space-y-3">
              <Skeleton className="h-5 w-1/3" />
              <SkeletonText lines={2} />
            </div>
            <Skeleton className="h-8 w-24 shrink-0 rounded-full" />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Skeleton className="h-9 w-28 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="w-full space-y-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-2.5 w-1/3" />
            </div>
            <Skeleton className="h-8 w-20 shrink-0 rounded-full" />
          </div>
          <SkeletonText lines={2} />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-2.5 w-24" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* --------------------------------------------------------------------------
   Skeletons par page
   -------------------------------------------------------------------------- */

export function DashboardSkeleton() {
  return (
    <SkeletonPage label="Chargement du tableau de bord…">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div className="space-y-5">
            <Skeleton className="h-7 w-40 rounded-full" />
            <div className="space-y-3">
              <Skeleton className="h-9 w-3/4" />
              <Skeleton className="h-9 w-1/2" />
            </div>
            <SkeletonText lines={2} />
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-12 w-36 rounded-full" />
              <Skeleton className="h-12 w-44 rounded-full" />
            </div>
          </div>
          <div className="grid gap-3">
            <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
              <Skeleton className="h-2.5 w-28" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-2.5 w-24" />
            </div>
            <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
              <Skeleton className="h-2.5 w-32" />
              <div className="flex gap-4">
                <Skeleton className="h-8 w-10" />
                <Skeleton className="h-8 w-10" />
                <Skeleton className="h-8 w-10" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <SkeletonStatCards />

      <div className="grid gap-5 lg:grid-cols-2">
        <SkeletonPanel />
        <SkeletonPanel />
      </div>

      <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <Skeleton className="h-5 w-48" />
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-2.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    </SkeletonPage>
  )
}

export function MembersSkeleton() {
  return (
    <SkeletonPage label="Chargement des membres…">
      <SkeletonHeader />
      <SkeletonToolbar />
      <SkeletonTable rows={6} columns={5} />
    </SkeletonPage>
  )
}

export function FormateursSkeleton() {
  return (
    <SkeletonPage label="Chargement des formateurs…">
      <SkeletonHeader />
      <SkeletonTable rows={5} columns={6} />
    </SkeletonPage>
  )
}

export function FinanceSkeleton() {
  return (
    <SkeletonPage label="Chargement des données financières…">
      <SkeletonHeader />
      <SkeletonStatCards />
      <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <Skeleton className="h-10 w-44 rounded-full" />
        <Skeleton className="h-10 w-36 rounded-full" />
        <Skeleton className="h-10 w-40 rounded-full" />
      </div>
      <SkeletonTable rows={6} columns={6} />
    </SkeletonPage>
  )
}

export function AnnoncesSkeleton() {
  return (
    <SkeletonPage label="Chargement des annonces…">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-3.5 w-80 max-w-full" />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Skeleton className="h-11 w-64 rounded-xl" />
          <Skeleton className="h-12 w-44 rounded-full" />
        </div>
      </div>
      <SkeletonCardList count={3} />
    </SkeletonPage>
  )
}

export function DevoirsSkeleton() {
  return (
    <SkeletonPage label="Chargement des devoirs…">
      <SkeletonHeader />
      <SkeletonCardList count={3} />
    </SkeletonPage>
  )
}

export function PlanningSkeleton() {
  return (
    <SkeletonPage label="Chargement du planning…">
      <SkeletonHeader />
      <SkeletonGrid count={4} />
    </SkeletonPage>
  )
}

export function ModulesSkeleton() {
  return (
    <SkeletonPage label="Chargement des modules…">
      <SkeletonHeader />
      <SkeletonGrid count={3} />
    </SkeletonPage>
  )
}

export function PresencesSkeleton() {
  return (
    <SkeletonPage label="Chargement des présences…">
      <SkeletonHeader />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-56 w-56 rounded-3xl" />
          <Skeleton className="h-9 w-full rounded-full" />
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <SkeletonTable rows={6} columns={4} />
        </div>
      </div>
    </SkeletonPage>
  )
}

export function DefaultPageSkeleton() {
  return (
    <SkeletonPage label="Chargement de la page…">
      <SkeletonHeader />
      <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <Skeleton className="h-5 w-48" />
        <SkeletonText lines={4} />
      </div>
      <SkeletonPanel lines={2} />
    </SkeletonPage>
  )
}
