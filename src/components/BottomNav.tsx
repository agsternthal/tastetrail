'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/trails', label: 'Trails', icon: '🗺️' },
  { href: '/account', label: 'My trails', icon: '🎟️' },
]

export default function BottomNav() {
  const pathname = usePathname()

  if (pathname?.startsWith('/trails/') && pathname?.includes('/follow')) return null
  if (pathname?.startsWith('/redeem')) return null

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-[480px] items-stretch justify-around">
        {TABS.map((tab) => {
          const active =
            pathname === tab.href || (tab.href !== '/trails' && pathname?.startsWith(tab.href))
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                active ? 'text-brand' : 'text-stone-500'
              }`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
