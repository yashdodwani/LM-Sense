// Purpose: Token-level diff overlay between raw and debiased responses.
// Removed tokens shown with red strikethrough, added tokens in green.
// Can be toggled on/off via a button in the sandbox page.

"use client";

import { useMemo } from "react";

interface DiffOverlayProps {
  rawText: string;
  debiasedText: string;
}

interface DiffToken {
  text: string;
  type: "unchanged" | "removed" | "added";
}

function tokenize(text: string): string[] {
  return text.split(/(\s+)/);
}

function computeDiff(rawTokens: string[], debiasedTokens: string[]): DiffToken[] {
  // Simple LCS-based word diff
  const m = rawTokens.length;
  const n = debiasedTokens.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (rawTokens[i - 1] === debiasedTokens[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result: DiffToken[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && rawTokens[i - 1] === debiasedTokens[j - 1]) {
      result.unshift({ text: rawTokens[i - 1], type: "unchanged" });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ text: debiasedTokens[j - 1], type: "added" });
      j--;
    } else {
      result.unshift({ text: rawTokens[i - 1], type: "removed" });
      i--;
    }
  }

  return result;
}

export function DiffOverlay({ rawText, debiasedText }: DiffOverlayProps) {
  const diff = useMemo(() => {
    const rawTokens = tokenize(rawText);
    const debiasedTokens = tokenize(debiasedText);
    return computeDiff(rawTokens, debiasedTokens);
  }, [rawText, debiasedText]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h4 className="mb-3 text-sm font-semibold text-gray-700">
        Token-level Diff
      </h4>
      <p className="mb-4 text-xs text-gray-400">
        <span className="inline-block rounded bg-red-50 px-1.5 text-red-600 line-through mr-2">removed</span>
        <span className="inline-block rounded bg-emerald-50 px-1.5 text-emerald-700 font-medium">added</span>
      </p>
      <div className="text-sm leading-7 text-gray-700">
        {diff.map((token, i) => {
          if (token.type === "removed") {
            return (
              <span
                key={i}
                className="rounded bg-red-50 px-0.5 text-red-600 line-through"
              >
                {token.text}
              </span>
            );
          }
          if (token.type === "added") {
            return (
              <span
                key={i}
                className="rounded bg-emerald-50 px-0.5 text-emerald-700 font-medium"
              >
                {token.text}
              </span>
            );
          }
          return <span key={i}>{token.text}</span>;
        })}
      </div>
    </div>
  );
}
