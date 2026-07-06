'use client'

import { useState } from 'react'
import type { ContentBlock } from '@/types'

export default function StopContent({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="space-y-3">
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  )
}

function Block({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'heading':
      return <h3 className="font-semibold">{block.text}</h3>

    case 'text':
      return <p className="text-sm leading-relaxed text-stone-700">{block.text}</p>

    case 'image':
      return (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.url}
            alt={block.caption ?? ''}
            loading="lazy"
            className="h-40 w-full rounded-xl object-cover"
          />
          {block.caption && (
            <figcaption className="mt-1 text-xs text-stone-400">{block.caption}</figcaption>
          )}
        </figure>
      )

    case 'video':
      return (
        <figure>
          <video src={block.url} poster={block.poster} controls playsInline className="w-full rounded-xl" />
          {block.caption && (
            <figcaption className="mt-1 text-xs text-stone-400">{block.caption}</figcaption>
          )}
        </figure>
      )

    case 'gallery':
      return (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {block.images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={img.url}
              alt={img.caption ?? ''}
              title={img.caption}
              loading="lazy"
              className="h-28 w-40 flex-none rounded-lg object-cover"
            />
          ))}
        </div>
      )

    case 'challenge':
      return <ChallengeBlock block={block} />

    case 'pour':
      return <PourBlock block={block} />

    default:
      return null
  }
}

function ChallengeBlock({
  block,
}: {
  block: Extract<ContentBlock, { type: 'challenge' }>
}) {
  const [picked, setPicked] = useState<number | null>(null)
  const answered = picked !== null
  const correct = picked === block.answerIndex

  return (
    <div className="rounded-xl border border-brand/30 bg-brand/5 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-brand">Tasting challenge</div>
      <p className="mt-1 text-sm font-medium text-stone-800">{block.prompt}</p>
      <div className="mt-2 space-y-1.5">
        {block.options.map((opt, i) => {
          const state = !answered
            ? 'border-stone-300'
            : i === block.answerIndex
              ? 'border-green-500 bg-green-50'
              : i === picked
                ? 'border-red-400 bg-red-50'
                : 'border-stone-200 opacity-60'
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => setPicked(i)}
              className={`block w-full rounded-lg border px-3 py-2 text-left text-sm ${state}`}
            >
              {opt}
            </button>
          )
        })}
      </div>
      {answered && (
        <p className="mt-2 text-sm font-medium">
          {correct ? '✅ Nailed it. ' : '❌ Not quite. '}
          <span className="font-normal text-stone-600">{block.reveal}</span>
        </p>
      )}
    </div>
  )
}

function PourBlock({
  block,
}: {
  block: Extract<ContentBlock, { type: 'pour' }>
}) {
  return (
    <div className="rounded-xl border border-brand/20 bg-brand/5 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-brand">Pour</div>
      <div className="mt-1 font-semibold text-stone-900">{block.varietal}</div>
      {block.style && <div className="text-xs text-stone-500">{block.style}</div>}
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-stone-600">
        {block.producer && <span>Producer: {block.producer}</span>}
        {block.abv && <span>ABV: {block.abv}</span>}
      </div>
      {block.tasting_notes && (
        <p className="mt-2 text-sm text-stone-700">{block.tasting_notes}</p>
      )}
    </div>
  )
}
