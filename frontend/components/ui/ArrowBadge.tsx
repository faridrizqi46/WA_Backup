'use client';

interface ArrowBadgeProps {
  direction: 'up' | 'down';
}

export default function ArrowBadge({ direction }: ArrowBadgeProps) {
  const isUp = direction === 'up';
  return (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
        isUp ? 'bg-green-100' : 'bg-red-100'
      }`}
    >
      <svg
        className={`w-4 h-4 ${isUp ? 'text-green-600' : 'text-red-600'}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
      >
        {isUp ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        )}
      </svg>
    </span>
  );
}
