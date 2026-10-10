'use client'

import React from 'react'

export default function ConfirmLoader({
  subtext = 'Verifying payment & securing order details...',
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-4">
      <div className="confirm-loader mx-auto" />
      {subtext && (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 border border-gray-200/80 text-gray-600 text-xs font-medium mt-4">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{subtext}</span>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .confirm-loader {
          width: fit-content;
          font-weight: 700;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          white-space: pre;
          font-size: 26px;
          line-height: 1.2em;
          height: 1.2em;
          overflow: hidden;
          letter-spacing: 0.05em;
          color: #0a0a0a;
        }

        @media (min-width: 640px) {
          .confirm-loader {
            font-size: 30px;
          }
        }

        .confirm-loader:before {
          content: "Confirming...\\A⌰onfirming...\\A⌰⍜nfirming...\\A⌰⍜⋏firming...\\A⌰⍜⋏⎎irming...\\A⌰⍜⋏⎎⟟rming...\\A⌰⍜⋏⎎⟟⍀ming...\\A⌰⍜⋏⎎⟟⍀⋔ing...\\A⌰⍜⋏⎎⟟⍀⋔⟟ng...\\A⌰⍜⋏⎎⟟⍀⋔⟟⋏g...\\A⌰⍜⋏⎎⟟⍀⋔⟟⋏☌...\\A⌰⍜⋏⎎⟟⍀⋔⟟⋏☌⟒..\\A⌰⍜⋏⎎⟟⍀⋔⟟⋏☌⟒⏁.\\A⌰⍜⋏⎎⟟⍀⋔⟟⋏☌⟒⏁⋔";
          white-space: pre;
          display: inline-block;
          animation: confirmAnim 1.2s infinite steps(13) alternate;
        }

        @keyframes confirmAnim {
          100% {
            transform: translateY(calc(-100% + 1.2em));
          }
        }
      `}} />
    </div>
  )
}

export { ConfirmLoader as Loader }

