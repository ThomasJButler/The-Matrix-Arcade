import React from 'react';
import type { ScoreEntry } from '../../hooks/useSaveSystem';

interface ScoreTableProps {
  entries: ScoreEntry[];
  lastInitials: string;
}

function formatDuration(ms: number): string {
  if (ms <= 0) return '--:--';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  } catch {
    return '---';
  }
}

export const ScoreTable: React.FC<ScoreTableProps> = ({ entries, lastInitials }) => {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-green-500/40 font-mono">
        <p className="text-lg">NO SCORES YET</p>
        <p className="text-sm mt-2">Play this game to set a high score!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full font-mono text-sm">
        <thead>
          <tr className="text-green-400/60 border-b border-green-500/20">
            <th className="text-left py-2 px-2 w-8">#</th>
            <th className="text-left py-2 px-2">NAME</th>
            <th className="text-right py-2 px-2">SCORE</th>
            <th className="text-right py-2 px-2">LVL</th>
            <th className="text-right py-2 px-2">TIME</th>
            <th className="text-right py-2 px-2">DATE</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => {
            const isOwn = entry.initials === lastInitials;
            return (
              <tr
                key={`${i}-${entry.initials}-${entry.score}`}
                className={`border-b border-green-500/10 ${
                  isOwn ? 'score-highlight' : 'text-green-300/80'
                }`}
              >
                <td className="py-1.5 px-2 text-green-500/50">
                  {i + 1}
                  {isOwn && <span className="ml-1 score-1up-blink text-xs">1UP</span>}
                </td>
                <td className="py-1.5 px-2 tracking-widest">{entry.initials}</td>
                <td className="py-1.5 px-2 text-right tabular-nums">{entry.score.toLocaleString()}</td>
                <td className="py-1.5 px-2 text-right tabular-nums">{entry.level}</td>
                <td className="py-1.5 px-2 text-right tabular-nums">{formatDuration(entry.durationMs)}</td>
                <td className="py-1.5 px-2 text-right text-green-400/50 text-xs">{formatDate(entry.date)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
