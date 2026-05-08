'use client';

interface ConfidenceBadgeProps {
  level: 'High' | 'Mid' | 'Low';
}

const colorMap: Record<string, string> = {
  High: 'text-blue-600',
  Mid: 'text-amber-600',
  Low: 'text-red-500',
};

export default function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
  return <span className={`font-medium ${colorMap[level]}`}>{level}</span>;
}
