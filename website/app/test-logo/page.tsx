'use client'

import { useState } from 'react'

export default function TestLogoPage() {
  const [verticalOffset, setVerticalOffset] = useState(0)
  const [horizontalGap, setHorizontalGap] = useState(8)
  const [iconScale, setIconScale] = useState(1.0)

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl mb-8">Logo Alignment Test Page</h1>

      {/* Controls */}
      <div className="bg-gray-900 p-4 rounded mb-8 max-w-2xl">
        <h2 className="text-lg mb-4">Alignment Controls</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2">
              Vertical Offset: {verticalOffset}px
            </label>
            <input
              type="range"
              min="-20"
              max="20"
              value={verticalOffset}
              onChange={(e) => setVerticalOffset(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">
              Horizontal Gap: {horizontalGap}px
            </label>
            <input
              type="range"
              min="-10"
              max="30"
              value={horizontalGap}
              onChange={(e) => setHorizontalGap(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">
              Icon Scale: {iconScale.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={iconScale}
              onChange={(e) => setIconScale(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Test Different Sizes */}
      <div className="space-y-8">
        {/* Small Size (24px) */}
        <div className="bg-gray-900 p-6 rounded">
          <h3 className="text-sm text-gray-400 mb-4">Small (24px font)</h3>
          <div className="flex items-baseline">
            <div
              className="inline-flex items-center"
              style={{ gap: `${horizontalGap}px` }}
            >
              <img
                src="/safeprompt-icon.webp"
                alt="Shield S"
                className="border border-red-500"
                style={{
                  height: `${24 * iconScale}px`,
                  width: `${24 * iconScale}px`,
                  transform: `translateY(${verticalOffset}px)`,
                  display: 'block'
                }}
              />
              <span className="text-2xl font-bold text-primary">afePrompt</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Icon: {Math.round(24 * iconScale)}px × {Math.round(24 * iconScale)}px
          </div>
        </div>

        {/* Medium Size (36px) */}
        <div className="bg-gray-900 p-6 rounded">
          <h3 className="text-sm text-gray-400 mb-4">Medium (36px font)</h3>
          <div className="flex items-baseline">
            <div
              className="inline-flex items-center"
              style={{ gap: `${horizontalGap * 1.5}px` }}
            >
              <img
                src="/safeprompt-icon.webp"
                alt="Shield S"
                className="border border-red-500"
                style={{
                  height: `${36 * iconScale}px`,
                  width: `${36 * iconScale}px`,
                  transform: `translateY(${verticalOffset * 1.5}px)`,
                  display: 'block'
                }}
              />
              <span className="text-4xl font-bold text-primary">afePrompt</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Icon: {Math.round(36 * iconScale)}px × {Math.round(36 * iconScale)}px
          </div>
        </div>

        {/* Large Size (48px) */}
        <div className="bg-gray-900 p-6 rounded">
          <h3 className="text-sm text-gray-400 mb-4">Large (48px font)</h3>
          <div className="flex items-baseline">
            <div
              className="inline-flex items-center"
              style={{ gap: `${horizontalGap * 2}px` }}
            >
              <img
                src="/safeprompt-icon.webp"
                alt="Shield S"
                className="border border-red-500"
                style={{
                  height: `${48 * iconScale}px`,
                  width: `${48 * iconScale}px`,
                  transform: `translateY(${verticalOffset * 2}px)`,
                  display: 'block'
                }}
              />
              <span className="text-5xl font-bold text-primary">afePrompt</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Icon: {Math.round(48 * iconScale)}px × {Math.round(48 * iconScale)}px
          </div>
        </div>

        {/* Extra Large Size (64px) */}
        <div className="bg-gray-900 p-6 rounded">
          <h3 className="text-sm text-gray-400 mb-4">Extra Large (64px font)</h3>
          <div className="flex items-baseline">
            <div
              className="inline-flex items-center"
              style={{ gap: `${horizontalGap * 2.5}px` }}
            >
              <img
                src="/safeprompt-icon.webp"
                alt="Shield S"
                className="border border-red-500"
                style={{
                  height: `${64 * iconScale}px`,
                  width: `${64 * iconScale}px`,
                  transform: `translateY(${verticalOffset * 2.5}px)`,
                  display: 'block'
                }}
              />
              <span className="text-6xl font-bold text-primary">afePrompt</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Icon: {Math.round(64 * iconScale)}px × {Math.round(64 * iconScale)}px
          </div>
        </div>

        {/* Reference Lines */}
        <div className="bg-gray-900 p-6 rounded">
          <h3 className="text-sm text-gray-400 mb-4">With Alignment Guides (48px)</h3>
          <div className="relative">
            {/* Baseline guide */}
            <div className="absolute w-full h-px bg-green-500 opacity-50" style={{ top: '48px' }}></div>
            {/* Cap height guide */}
            <div className="absolute w-full h-px bg-yellow-500 opacity-50" style={{ top: '16px' }}></div>
            {/* X-height guide */}
            <div className="absolute w-full h-px bg-purple-500 opacity-50" style={{ top: '32px' }}></div>

            <div className="flex items-baseline relative">
              <div
                className="inline-flex items-center"
                style={{ gap: `${horizontalGap * 2}px` }}
              >
                <img
                  src="/safeprompt-icon.webp"
                  alt="Shield S"
                  className="border border-red-500"
                  style={{
                    height: `${48 * iconScale}px`,
                    width: `${48 * iconScale}px`,
                    transform: `translateY(${verticalOffset * 2}px)`,
                    display: 'block'
                  }}
                />
                <span className="text-5xl font-bold text-primary">afePrompt</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-px bg-green-500"></div>
                <span>Baseline</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-px bg-yellow-500"></div>
                <span>Cap height</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-px bg-purple-500"></div>
                <span>X-height</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final Values */}
      <div className="mt-12 bg-blue-900 p-4 rounded max-w-2xl">
        <h3 className="text-lg mb-2">Current Configuration</h3>
        <code className="block bg-black p-4 rounded text-sm">
          {`{
  verticalOffset: ${verticalOffset},
  horizontalGap: ${horizontalGap},
  iconScale: ${iconScale.toFixed(2)}
}`}
        </code>
        <p className="text-sm mt-4 text-gray-300">
          These values can be abstracted as ratios of the font size for any scale.
        </p>
      </div>
    </main>
  )
}