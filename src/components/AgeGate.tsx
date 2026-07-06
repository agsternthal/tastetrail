'use client'

import { useState, useEffect } from 'react'

const COOKIE = 'tt_agegate'

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1]
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date()
  expires.setDate(expires.getDate() + days)
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
}

export default function AgeGate() {
  const [visible, setVisible] = useState(false)
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('')
  const [day, setDay] = useState('')
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    if (getCookie(COOKIE) !== 'ok') {
      setVisible(true)
    }
  }, [])

  function confirm() {
    const y = parseInt(year, 10)
    const m = parseInt(month, 10)
    const d = parseInt(day, 10)
    if (!y || !m || !d) return

    const dob = new Date(y, m - 1, d)
    const now = new Date()
    let age = now.getFullYear() - dob.getFullYear()
    const monthDiff = now.getMonth() - dob.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age--

    if (age >= 21) {
      setCookie(COOKIE, 'ok', 365)
      setVisible(false)
    } else {
      setDenied(true)
    }
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <div className="text-4xl">🍷</div>
        <h2 className="mt-3 text-xl font-bold">Are you 21 or older?</h2>
        <p className="mt-1 text-sm text-stone-600">
          TasteTrail is for adults 21 and over. Please confirm your birthdate.
        </p>

        {denied ? (
          <div className="mt-6 rounded-xl bg-red-50 px-4 py-4 text-sm text-red-700">
            Sorry, you must be 21 or older to use TasteTrail. Please drink responsibly.
          </div>
        ) : (
          <>
            <div className="mt-5 flex gap-2">
              <input
                type="number"
                placeholder="MM"
                min={1}
                max={12}
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-1/4 rounded-xl border border-stone-300 px-3 py-2.5 text-center text-base outline-none focus:border-brand"
              />
              <input
                type="number"
                placeholder="DD"
                min={1}
                max={31}
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="w-1/4 rounded-xl border border-stone-300 px-3 py-2.5 text-center text-base outline-none focus:border-brand"
              />
              <input
                type="number"
                placeholder="YYYY"
                min={1900}
                max={new Date().getFullYear()}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-1/2 rounded-xl border border-stone-300 px-3 py-2.5 text-center text-base outline-none focus:border-brand"
              />
            </div>
            <button
              onClick={confirm}
              disabled={!year || !month || !day}
              className="mt-4 w-full rounded-xl bg-brand px-5 py-3.5 font-semibold text-white disabled:opacity-50"
            >
              I am 21 or older
            </button>
          </>
        )}

        <p className="mt-4 text-xs text-stone-400">
          By entering, you confirm you are of legal drinking age in your location.
        </p>
      </div>
    </div>
  )
}
