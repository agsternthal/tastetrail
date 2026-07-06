'use client'

import { useMemo, useState } from 'react'
import type { Trail } from '@/types'
import TrailCard from './TrailCard'

export default function TrailsBrowser({
  trails,
  ownedIds,
}: {
  trails: Trail[]
  ownedIds: string[]
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const owned = new Set(ownedIds)

  const labels = useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const t of trails) {
      for (const tag of t.tags) {
        if (!seen.has(tag.label)) {
          seen.add(tag.label)
          out.push(tag.label)
        }
      }
    }
    return out
  }, [trails])

  const filtered = selected
    ? trails.filter((t) => t.tags.some((tag) => tag.label === selected))
    : trails

  const byRegion = filtered.reduce<Record<string, Trail[]>>((acc, t) => {
    ;(acc[t.region] ??= []).push(t)
    return acc
  }, {})

  return (
    <>
      {labels.length > 0 && (
        <div className="-mx-5 mb-5 flex gap-2 overflow-x-auto px-5 pb-1">
          <Chip active={selected === null} onClick={() => setSelected(null)}>
            All
          </Chip>
          {labels.map((label) => (
            <Chip
              key={label}
              active={selected === label}
              onClick={() => setSelected(selected === label ? null : label)}
            >
              {label}
            </Chip>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-stone-500">
          No trails match &quot;{selected}&quot;.
        </div>
      ) : (
        Object.entries(byRegion).map(([region, regionTrails]) => (
          <section key={region} className="mb-7">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
              {region}
            </h2>
            <div className="space-y-4">
              {regionTrails.map((t) => (
                <TrailCard key={t.id} trail={t} owned={owned.has(t.id)} />
              ))}
            </div>
          </section>
        ))
      )}
    </>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-none rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'border-brand bg-brand text-white'
          : 'border-stone-300 bg-white text-stone-600'
      }`}
    >
      {children}
    </button>
  )
}
