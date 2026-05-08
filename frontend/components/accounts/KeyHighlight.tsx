'use client';

interface KeyHighlightProps {
  text: string;
}

function renderBoldText(text: string) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}

export default function KeyHighlight({ text }: KeyHighlightProps) {
  return (
    <div className="bg-white rounded-sm px-6 py-4">
      <div className="border border-blue-300 rounded-md p-4 bg-white">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-blue-700 text-sm">✦</span>
          <p className="text-sm font-bold text-blue-800">Key Highlight</p>
        </div>
        <p className="text-xs text-gray-700 leading-relaxed">
          {renderBoldText(text)}
        </p>
      </div>
    </div>
  );
}
