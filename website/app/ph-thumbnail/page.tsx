'use client'

import { useState } from 'react'

export default function PHThumbnail() {
  const [logoPos, setLogoPos] = useState({ x: 100, y: 100 })
  const [textPos, setTextPos] = useState({ x: 220, y: 120 })
  const [betaPos, setBetaPos] = useState({ x: 600, y: 100 })

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Controls */}
      <div className="fixed top-4 left-4 bg-card p-4 rounded-lg border border-border space-y-3 text-sm z-50">
        <div>
          <div className="font-semibold mb-2">Logo Position</div>
          <div className="flex gap-3">
            <div>
              <label className="block text-xs mb-1">X</label>
              <input
                type="number"
                value={logoPos.x}
                onChange={(e) => setLogoPos({...logoPos, x: Number(e.target.value)})}
                className="w-20 px-2 py-1 bg-background border border-border rounded text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs mb-1">Y</label>
              <input
                type="number"
                value={logoPos.y}
                onChange={(e) => setLogoPos({...logoPos, y: Number(e.target.value)})}
                className="w-20 px-2 py-1 bg-background border border-border rounded text-foreground"
              />
            </div>
          </div>
        </div>
        <div>
          <div className="font-semibold mb-2">Text Position</div>
          <div className="flex gap-3">
            <div>
              <label className="block text-xs mb-1">X</label>
              <input
                type="number"
                value={textPos.x}
                onChange={(e) => setTextPos({...textPos, x: Number(e.target.value)})}
                className="w-20 px-2 py-1 bg-background border border-border rounded text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs mb-1">Y</label>
              <input
                type="number"
                value={textPos.y}
                onChange={(e) => setTextPos({...textPos, y: Number(e.target.value)})}
                className="w-20 px-2 py-1 bg-background border border-border rounded text-foreground"
              />
            </div>
          </div>
        </div>
        <div>
          <div className="font-semibold mb-2">Beta Position</div>
          <div className="flex gap-3">
            <div>
              <label className="block text-xs mb-1">X</label>
              <input
                type="number"
                value={betaPos.x}
                onChange={(e) => setBetaPos({...betaPos, x: Number(e.target.value)})}
                className="w-20 px-2 py-1 bg-background border border-border rounded text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs mb-1">Y</label>
              <input
                type="number"
                value={betaPos.y}
                onChange={(e) => setBetaPos({...betaPos, y: Number(e.target.value)})}
                className="w-20 px-2 py-1 bg-background border border-border rounded text-foreground"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative w-full h-screen">
        {/* Logo */}
        <img
          src="/safeprompt-icon.webp"
          alt="SafePrompt"
          className="absolute w-24 h-24 cursor-move"
          style={{ left: `${logoPos.x}px`, top: `${logoPos.y}px` }}
          draggable
          onDragEnd={(e) => setLogoPos({ x: e.clientX - 48, y: e.clientY - 48 })}
        />

        {/* Text */}
        <h1
          className="absolute text-6xl font-bold cursor-move"
          style={{ left: `${textPos.x}px`, top: `${textPos.y}px` }}
          draggable
          onDragEnd={(e) => setTextPos({ x: e.clientX, y: e.clientY - 40 })}
        >
          afePrompt
        </h1>

        {/* Beta Badge */}
        <span
          className="absolute bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold border border-primary/20 cursor-move"
          style={{ left: `${betaPos.x}px`, top: `${betaPos.y}px` }}
          draggable
          onDragEnd={(e) => setBetaPos({ x: e.clientX, y: e.clientY })}
        >
          BETA
        </span>
      </div>
    </div>
  )
}
