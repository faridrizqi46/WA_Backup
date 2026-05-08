'use client';

import { useState } from 'react';

// ── Canvas ────────────────────────────────────────────────────────────────────
const W  = 1500;
const H  = 680;
const AX = 750;
const AY = 340;
const AW = 210;
const AH = 74;
const CW = 185;
const CH = 30;

// ── Layout x-positions (suppliers left, customers right) ─────────────────────
const T1_HUB_X    = 530;
const CUST_HUB_X  = 970;
const T1_CARD_RX  = T1_HUB_X  - 55;          // 475
const T1_CARD_LX  = T1_CARD_RX - CW;          // 290
const T2_CARD_RX  = T1_CARD_LX - 28;          // 262
const T2_CARD_LX  = T2_CARD_RX - CW;          // 77
const CUST_CARD_LX = CUST_HUB_X + 55;         // 1025
const CUST_CARD_RX = CUST_CARD_LX + CW;       // 1210 (unused but for reference)

// ── Types & data ──────────────────────────────────────────────────────────────
type NodeType = 'Supplier' | 'Local Customer' | 'Global Customer';

interface ChainNode   { id: string; name: string; nodeType: NodeType; }
interface T2ChainNode extends ChainNode { parentId: string; }

const CUSTOMERS: ChainNode[] = [
  { id: 'bestmeat', name: 'Best Meat',            nodeType: 'Local Customer'  },
  { id: 'fast',     name: 'PT FAST (KFC)',         nodeType: 'Local Customer'  },
  { id: 'eka',      name: 'PT Eka Bogainti',       nodeType: 'Local Customer'  },
  { id: 'magetan',  name: 'PT Magetan Gajah Mada', nodeType: 'Local Customer'  },
  { id: 'toh',      name: 'Toh Thye San Farm',     nodeType: 'Global Customer' },
  { id: 'yanur',    name: 'Ya Nur Trading Co',      nodeType: 'Global Customer' },
  { id: 'sojitz',   name: 'Sojitz Foods Corp',     nodeType: 'Global Customer' },
];

const T1_SUPPLIERS: ChainNode[] = [
  { id: 'swift',   name: 'Swift & Company',     nodeType: 'Supplier' },
  { id: 'gavilon', name: 'Gavilon Ingredients', nodeType: 'Supplier' },
  { id: 'poet',    name: 'POET Nutrition Inc.',  nodeType: 'Supplier' },
  { id: 'cargill', name: 'Cargill',              nodeType: 'Supplier' },
  { id: 'annona',  name: 'Annona Pte Ltd',       nodeType: 'Supplier' },
  { id: 'petani',  name: 'Petani Lokal',         nodeType: 'Supplier' },
];

// Grouped by parent so siblings are adjacent in the array
const T2_SUPPLIERS: T2ChainNode[] = [
  // swift ×1
  { id: 'maple',    name: 'Maple Leaf Food Inc.', nodeType: 'Supplier', parentId: 'swift'   },
  // gavilon ×3 — all three will cluster around gavilon's Y
  { id: 'ifp',      name: 'Intl Food Packaging',  nodeType: 'Supplier', parentId: 'gavilon' },
  { id: 'nebraska', name: 'Nebraskaland',          nodeType: 'Supplier', parentId: 'gavilon' },
  { id: 'isabelle', name: 'Isabelle (Taiwan)',     nodeType: 'Supplier', parentId: 'gavilon' },
  // cargill ×1
  { id: 'khong',    name: 'Khong Guan Corp',       nodeType: 'Supplier', parentId: 'cargill' },
  // petani ×2
  { id: 'rnd',      name: 'R&D Kulo Group',        nodeType: 'Supplier', parentId: 'petani'  },
  { id: 'ubp',      name: 'UBP Limited',           nodeType: 'Supplier', parentId: 'petani'  },
];

const TYPE_COLOR: Record<NodeType, string> = {
  'Supplier':       '#1e3a6e',
  'Local Customer': '#dc2626',
  'Global Customer':'#0f2d52',
};

const TYPE_BADGE: Record<NodeType, string> = {
  'Supplier':       'Supplier',
  'Local Customer': 'Local',
  'Global Customer':'Global',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function ySpread(count: number, margin: number): number[] {
  if (count <= 1) return [H / 2];
  const step = (H - margin * 2) / (count - 1);
  return Array.from({ length: count }, (_, i) => margin + i * step);
}

// Centers each T2 sibling group around its T1 parent's Y
function groupedT2Ys(
  nodes: T2ChainNode[],
  t1YMap: Record<string, number>,
  gap = 44,
): number[] {
  return nodes.map((node) => {
    const parentY  = t1YMap[node.parentId] ?? AY;
    const siblings = nodes.filter((n) => n.parentId === node.parentId);
    const idx      = siblings.findIndex((n) => n.id === node.id);
    const offset   = (idx - (siblings.length - 1) / 2) * gap;
    return parentY + offset;
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ValueChain() {
  const [hovered, setHovered] = useState<string | null>(null);

  const custYs = ySpread(CUSTOMERS.length, 80);
  const t1Ys   = ySpread(T1_SUPPLIERS.length, 100);

  const t1YMap: Record<string, number> = {};
  T1_SUPPLIERS.forEach((n, i) => { t1YMap[n.id] = t1Ys[i]; });

  const t2Ys = groupedT2Ys(T2_SUPPLIERS, t1YMap);

  function renderCard(node: ChainNode, lx: number, cy: number) {
    const isHov    = hovered === node.id;
    const color    = TYPE_COLOR[node.nodeType];
    const isDashed = node.nodeType === 'Global Customer';
    return (
      <g key={node.id}
        onMouseEnter={() => setHovered(node.id)}
        onMouseLeave={() => setHovered(null)}
        style={{ cursor: 'default' }}
      >
        <rect
          x={lx} y={cy - CH / 2} width={CW} height={CH} rx={3}
          fill={isHov ? '#eff6ff' : 'white'}
          stroke={isHov ? '#2563eb' : isDashed ? '#0f2d52' : '#e5e7eb'}
          strokeWidth={isHov ? 1.5 : 1}
          strokeDasharray={isDashed && !isHov ? '5 3' : undefined}
        />
        <rect x={lx} y={cy - CH / 2} width={4} height={CH} rx={2} fill={color} />
        <text x={lx + 12} y={cy + 4} fontSize={9.5}
          fontWeight={isHov ? '700' : '500'}
          fill={isHov ? '#1d4ed8' : '#1f2937'}
          pointerEvents="none">
          {node.name}
        </text>
        <text x={lx + CW - 8} y={cy + 4} fontSize={8} fontWeight="600"
          fill={isHov ? '#2563eb' : '#9ca3af'}
          textAnchor="end" pointerEvents="none">
          {TYPE_BADGE[node.nodeType]}
        </text>
      </g>
    );
  }

  return (
    <div className="bg-white rounded-sm">

      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <h3 className="text-sm font-semibold text-gray-800">Value Chain</h3>
        <button className="text-sm text-blue-600 hover:underline font-medium">View Data</button>
      </div>

      <div className="px-2 pb-2">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>

          {/* ── Column labels ── */}
          <text x={T2_CARD_LX + CW / 2} y={42} textAnchor="middle"
            fontSize={11} fontWeight="700" fontStyle="italic" fill="#9ca3af" pointerEvents="none">
            Tier 2 Suppliers
          </text>
          <text x={T1_CARD_LX + CW / 2} y={72} textAnchor="middle"
            fontSize={11} fontWeight="700" fontStyle="italic" fill="#9ca3af" pointerEvents="none">
            Tier 1 Suppliers
          </text>
          <text x={CUST_CARD_LX + CW / 2} y={42} textAnchor="middle"
            fontSize={11} fontWeight="700" fontStyle="italic" fill="#9ca3af" pointerEvents="none">
            Customers
          </text>

          {/* ── T2 → T1 dashed lines ── */}
          {T2_SUPPLIERS.map((node, i) => (
            <line key={`t2l-${node.id}`}
              x1={T2_CARD_RX} y1={t2Ys[i]}
              x2={T1_CARD_LX} y2={t1YMap[node.parentId] ?? AY}
              stroke={hovered === node.id ? '#2563eb' : '#e5e7eb'}
              strokeWidth={hovered === node.id ? 1.5 : 1}
              strokeDasharray="4 3"
            />
          ))}

          {/* ── T1 supplier → hub ── */}
          {T1_SUPPLIERS.map((node, i) => (
            <line key={`t1l-${node.id}`}
              x1={T1_CARD_RX} y1={t1Ys[i]}
              x2={T1_HUB_X}   y2={AY}
              stroke={hovered === node.id ? '#2563eb' : '#d1d5db'}
              strokeWidth={hovered === node.id ? 1.8 : 1}
            />
          ))}

          {/* ── Supplier hub → anchor ── */}
          <line x1={T1_HUB_X + 6} y1={AY} x2={AX - AW / 2} y2={AY}
            stroke="#374151" strokeWidth={2.5} />

          {/* ── Anchor → customer hub ── */}
          <line x1={AX + AW / 2} y1={AY} x2={CUST_HUB_X - 6} y2={AY}
            stroke="#374151" strokeWidth={2.5} />

          {/* ── Customer hub → customer cards ── */}
          {CUSTOMERS.map((node, i) => (
            <line key={`cl-${node.id}`}
              x1={CUST_HUB_X}   y1={AY}
              x2={CUST_CARD_LX} y2={custYs[i]}
              stroke={hovered === node.id ? '#2563eb' : '#d1d5db'}
              strokeWidth={hovered === node.id ? 1.8 : 1}
            />
          ))}

          {/* ── Cards (on top of lines) ── */}
          {T2_SUPPLIERS.map((node, i) => renderCard(node, T2_CARD_LX, t2Ys[i]))}
          {T1_SUPPLIERS.map((node, i) => renderCard(node, T1_CARD_LX, t1Ys[i]))}
          {CUSTOMERS.map((node, i)    => renderCard(node, CUST_CARD_LX, custYs[i]))}

          {/* ── Supplier hub ── */}
          <rect x={T1_HUB_X - 6} y={AY - 6} width={12} height={12} rx={2} fill="#374151" />
          <text x={T1_HUB_X} y={AY + 22} textAnchor="middle"
            fontSize={10} fontWeight="600" fill="#6b7280" pointerEvents="none">
            {T1_SUPPLIERS.length} Suppliers
          </text>

          {/* ── Customer hub ── */}
          <rect x={CUST_HUB_X - 6} y={AY - 6} width={12} height={12} rx={2} fill="#374151" />
          <text x={CUST_HUB_X} y={AY + 22} textAnchor="middle"
            fontSize={10} fontWeight="600" fill="#6b7280" pointerEvents="none">
            {CUSTOMERS.length} Customers
          </text>

          {/* ── Anchor box ── */}
          <rect x={AX - AW / 2} y={AY - AH / 2} width={AW} height={AH} rx={6} fill="#1e3a6e" />
          <text x={AX} y={AY - 10} textAnchor="middle"
            fontSize={12} fontWeight="800" fill="white" pointerEvents="none">PT JAPFA</text>
          <text x={AX} y={AY + 6} textAnchor="middle"
            fontSize={12} fontWeight="800" fill="white" pointerEvents="none">COMFEED TBK</text>
          <text x={AX} y={AY + 23} textAnchor="middle"
            fontSize={9} fontWeight="600" fill="#93c5fd" pointerEvents="none">Anchor</text>

        </svg>
      </div>

      {/* ── Legend ── */}
      <div className="flex gap-8 px-6 pb-6 pt-3 border-t border-gray-100 text-xs text-gray-700">
        <div>
          <p className="font-bold mb-2 text-gray-900">Client Type</p>
          {(['Supplier', 'Local Customer', 'Global Customer'] as NodeType[]).map((type) => (
            <div key={type} className="flex items-center gap-2 mb-1.5">
              <div className="relative w-10 h-4 rounded-sm overflow-hidden"
                style={{
                  border: type === 'Global Customer'
                    ? '1px dashed #0f2d52'
                    : '1px solid #e5e7eb',
                }}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ backgroundColor: TYPE_COLOR[type] }} />
              </div>
              <span>{type}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
