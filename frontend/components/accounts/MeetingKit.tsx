'use client';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmtMD(d: Date)  { return `${MONTHS[d.getMonth()]} ${d.getDate()}`; }
function fmtMDY(d: Date) { return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

interface Props {
  lastDate: Date;
  supplier: string;
  carrier: string;
  lastPort: string;
  containers: number;
  winStart: Date;
  winEnd: Date;
  lcDeadline: Date;
  avgFreq: number;
  ports: string[];
  score: number;
  todayDate: Date;
  totalBols: number;
}

function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="bg-gray-100 px-6 py-3 border-y border-gray-200">
      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-0.5">{label}</p>
      <h4 className="text-sm font-bold text-gray-900">{title}</h4>
    </div>
  );
}

export default function MeetingKit({
  lastDate, supplier, carrier, lastPort, containers,
  winStart, winEnd, lcDeadline, avgFreq, ports, score, todayDate, totalBols,
}: Props) {
  const carrierShort = carrier.split(' ')[0];

  // ── Section 1 — Steps ─────────────────────────────────────────────────────
  const steps = [
    {
      title: 'Today — Intelligence Call (5 min)',
      body: `Call Japfa treasury with a targeted opening: "Kami melihat dari data US Customs bahwa shipment MBM dari ${supplier} tiba ${fmtMD(lastDate)} melalui ${carrierShort} dengan ${containers} kontainer. Window berikutnya sekitar ${fmtMD(winStart)}–${fmtMD(winEnd)}. Kami ingin memastikan fasilitas LC siap sebelum itu — ada waktu 30 menit minggu ini?"`,
      green: true,
    },
    {
      title: 'Prepare 3 Printed Pages',
      body: 'Print 01: BoL summary (latest confirmed shipments with supplier, carrier, port). Print 02: Next window forecast sheet with cadence stats. Print 03: XAI opportunity scoring card (score: ' + score + '/100).',
      green: true,
    },
    {
      title: 'Meeting Day — Lead With Data',
      body: 'Place the BoL printout on the table face-up. Open with the data — not a product brochure or slide deck. Stay silent while they read the shipment summary. Let the data do the opening.',
      green: false,
    },
    {
      title: 'Propose Import LC + FX Forward Only',
      body: `FX talking point: "Dengan impor rutin dari Kanada setiap ~${avgFreq} hari, Anda terekspos IDR/USD setiap siklus. Kami bisa lock rate forward yang terikat langsung ke jadwal impor — tidak perlu overhead operasional tambahan."`,
      green: false,
    },
    {
      title: 'No Verbal Pricing — 3-Day Written Proposal',
      body: 'Do not quote LC fees or FX spreads verbally in the meeting. Commit to a written proposal within 3 business days. This preserves pricing context and creates a concrete follow-up anchor.',
      green: false,
    },
    {
      title: 'Follow Up — Proposal + SCF Teaser',
      body: 'Send the formal LC + FX proposal within 48 hours. Append one paragraph: "Selain itu, kami melihat peluang Supply Chain Finance untuk jaringan distributor downstream Japfa — potensi efisiensi modal kerja yang signifikan untuk dibahas di pertemuan berikutnya."',
      green: false,
    },
  ];

  // ── Section 2 — What to bring ─────────────────────────────────────────────
  // Cyan 80 → #003a6d, Teal 90 → #022b30, Red 100 → #2d0709
  const bringCards = [
    {
      badge: 'PRINT 01', badgeColor: '#82cfff', borderColor: '#00539a',
      gradient: 'linear-gradient(135deg, #003a6d 0%, #00539a 100%)',
      title: 'BoL Summary',
      body: `${supplier} — ${fmtMD(lastDate)}, ${carrierShort}, ${containers} containers. Cargill Meat Solutions — Mar 22 & Mar 30, Maersk, Lampung. Source: InsightBank™ BoL Analytics.`,
    },
    {
      badge: 'PRINT 02', badgeColor: '#82cfff', borderColor: '#00539a',
      gradient: 'linear-gradient(135deg, #003a6d 0%, #00539a 100%)',
      title: 'Next Window Forecast',
      body: `Est. arrival: ${fmtMD(winStart)}–${fmtMD(winEnd)}. Avg cadence: ${avgFreq} days. Last confirmed: ${fmtMD(lastDate)}. Ports: ${ports.slice(0, 2).join(' · ')}.`,
    },
    {
      badge: 'PRINT 03', badgeColor: '#82cfff', borderColor: '#00539a',
      gradient: 'linear-gradient(135deg, #003a6d 0%, #00539a 100%)',
      title: 'XAI Opportunity Scoring',
      body: `Overall: ${score}/100 — Approach Now. Anchor Certainty: 98 · Trade Verified: 95 · Banking Fit: 92. Print from InsightBank™ XAI panel.`,
    },
    {
      badge: 'TABLET', badgeColor: '#3ddbd9', borderColor: '#004144',
      gradient: 'linear-gradient(135deg, #022b30 0%, #004144 100%)',
      title: 'XAI Scoring — Show Only',
      body: 'Open InsightBank™ on tablet. Show the XAI panel live if client asks for detail. Do not leave the device behind.',
    },
    {
      badge: 'VERBAL', badgeColor: '#3ddbd9', borderColor: '#004144',
      gradient: 'linear-gradient(135deg, #022b30 0%, #004144 100%)',
      title: 'Objection Responses',
      body: 'Memorise RM Challenge Prep from XAI panel. Key: "Japfa punya bank lain untuk LC" → Enter from SCF angle, not as direct LC competitor.',
    },
    {
      badge: '✕ DO NOT BRING', badgeColor: '#ff8389', borderColor: '#520408',
      gradient: 'linear-gradient(135deg, #2d0709 0%, #520408 100%)',
      title: 'Full Generic Deck',
      body: 'A bank product deck signals you did not research Japfa specifically. The BoL printout IS the pitch. Deck kills the data moment.',
    },
  ];

  // ── Section 5 — Do / Don't ────────────────────────────────────────────────
  const dos = [
    'Bring the BoL printout and place it on the table',
    'Lead with the data — let them read first',
    'Ask open questions about their current LC workflow',
    'Propose Import LC + FX Forward only (no upsell yet)',
    'Book the follow-up meeting before leaving the room',
  ];
  const donts = [
    'Open with a product brochure or generic bank deck',
    'Quote LC fees or FX spreads verbally',
    'Mention competitor banks by name',
    'Leave behind more than the 3 printouts',
    'Send the written proposal the same day (removes urgency)',
  ];

  // ── Section 6 — What happens next ────────────────────────────────────────
  const timeline = [
    { label: 'Intelligence call',  date: todayDate,              green: true  },
    { label: 'Prepare materials',  date: addDays(todayDate, 1),  green: true  },
    { label: 'Treasury meeting',   date: addDays(todayDate, 3),  green: false },
    { label: 'Send proposal',      date: addDays(todayDate, 5),  green: false },
    { label: 'LC deadline',        date: lcDeadline,             green: false },
    { label: 'Window opens',       date: winStart,               green: false },
  ];

  return (
    <div>

      {/* Kit header */}
      <div className="bg-[#1e3a6e] px-6 py-5">
        <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-1">
          Meeting Kit — Generated by InsightBank™
        </p>
        <h3 className="text-base font-black text-white">
          Import LC Pitch Kit — {supplier}
        </h3>
        <p className="text-[11px] text-blue-300 mt-1">
          Opportunity score: {score}/100 · Next window: {fmtMD(winStart)}–{fmtMD(winEnd)} · LC deadline: {fmtMD(lcDeadline)}
        </p>
      </div>

      {/* ── Section 1 — Steps ── */}
      <SectionHeader label="Section 01" title="Step-by-Step RM Action Plan" />
      <div className="bg-white px-6 py-5 divide-y divide-gray-100">
        {steps.map((step, i) => (
          <div key={i} className="py-4 first:pt-0 last:pb-0 flex gap-4 items-start">
            <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
              step.green ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              {i + 1}
            </div>
            <div>
              <p className={`text-xs font-bold mb-1 ${step.green ? 'text-green-700' : 'text-gray-900'}`}>
                {step.title}
              </p>
              <p className="text-xs text-gray-600 leading-relaxed">{step.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Section 2 — What to bring ── */}
      <SectionHeader label="Section 02" title="What to Bring" />
      <div className="bg-white px-6 py-5">
        <div className="grid grid-cols-3 gap-3">
          {bringCards.map((card, i) => (
            <div key={i} className="rounded border px-4 py-3"
              style={{ background: card.gradient, borderColor: card.borderColor }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1"
                style={{ color: card.badgeColor }}>
                {card.badge}
              </p>
              <p className="text-xs font-bold text-white mb-1">{card.title}</p>
              <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>{card.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 3 — Deck decision ── */}
      <SectionHeader label="Section 03" title="Deck Decision" />
      <div className="bg-white px-6 py-5">
        <div className="grid grid-cols-2 gap-4">
          {/* Meeting 1 — Gray 50 → Gray 40 */}
          <div className="rounded border px-5 py-4"
            style={{ background: 'linear-gradient(135deg, #8d8d8d 0%, #a8a8a8 100%)', borderColor: '#6f6f6f' }}>
            <p className="text-[10px] font-bold text-black uppercase tracking-widest mb-2">Meeting 1 — No Deck</p>
            <p className="text-xs font-bold text-black mb-2">Arrive with data, not slides.</p>
            <p className="text-xs text-black leading-relaxed">
              The BoL printout IS the pitch. A generic bank deck signals you did not do specific research on Japfa. The data creates a moment — slides kill it.
            </p>
          </div>
          {/* Meeting 2 — Warm Gray 20 → Warm Gray 10 */}
          <div className="rounded border px-5 py-4"
            style={{ background: 'linear-gradient(135deg, #e5e0df 0%, #f7f3f2 100%)', borderColor: '#cac5c4' }}>
            <p className="text-[10px] font-bold text-black uppercase tracking-widest mb-2">Meeting 2 — Yes, 5 Slides Max</p>
            <p className="text-xs font-bold text-black mb-2">Only if they request a formal follow-up presentation:</p>
            <ol className="text-xs text-black space-y-1 list-decimal list-inside leading-relaxed">
              <li>Supply Chain Value Map (Japfa-specific)</li>
              <li>Shipment Timeline & Next Window Forecast</li>
              <li>Import LC Proposal — terms & structure</li>
              <li>FX Forward Hedging — IDR/USD calendar</li>
              <li>Next Steps & Proposed Timeline</li>
            </ol>
          </div>
        </div>
      </div>

      {/* ── Section 4 — Opening script ── */}
      <SectionHeader label="Section 04" title="Opening Script — Bahasa Indonesia" />
      <div className="bg-white px-6 py-5">
        <div className="bg-gray-50 border border-gray-200 rounded px-5 py-4 text-xs text-gray-800 leading-loose italic">
          <p className="mb-3">
            "Selamat pagi. Kami ingin menyampaikan sesuatu yang mungkin relevan untuk tim treasury Anda.
          </p>
          <p className="mb-3">
            Berdasarkan data US Customs, kami mencatat bahwa Japfa secara rutin mengimpor Beef Meat and Bone Meal dari{' '}
            <mark className="bg-green-100 text-green-800 font-semibold not-italic px-0.5 rounded">{supplier}</mark>
            {' '}ke{' '}
            <mark className="bg-green-100 text-green-800 font-semibold not-italic px-0.5 rounded">{ports.join(', ')}</mark>
            {' '}— dengan frekuensi rata-rata setiap{' '}
            <mark className="bg-green-100 text-green-800 font-semibold not-italic px-0.5 rounded">{avgFreq} hari</mark>
            {' '}sekali.
          </p>
          <p className="mb-3">
            Shipment terakhir yang kami catat tiba pada{' '}
            <mark className="bg-green-100 text-green-800 font-semibold not-italic px-0.5 rounded">{fmtMDY(lastDate)}</mark>
            . Berdasarkan pola ini, window berikutnya diperkirakan sekitar{' '}
            <mark className="bg-green-100 text-green-800 font-semibold not-italic px-0.5 rounded">{fmtMD(winStart)}–{fmtMD(winEnd)}</mark>.
          </p>
          <p>
            Kami ingin memastikan fasilitas Import LC Anda sudah siap sebelum jadwal itu — sehingga tidak perlu rush di last minute. Apakah ada waktu 30 menit minggu ini untuk kami presentasikan proposalnya?"
          </p>
        </div>
        <p className="text-[10px] text-gray-400 mt-2">
          Highlighted = data points from US Customs · adjust tone to relationship level
        </p>
      </div>

      {/* ── Section 5 — Do / Don't ── */}
      <SectionHeader label="Section 05" title="Do / Don't in the Meeting" />
      <div className="bg-white px-6 py-5">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-3">✓ Do</p>
            <div className="space-y-2.5">
              {dos.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-green-100 text-green-600 text-[10px] font-black flex items-center justify-center mt-0.5">✓</span>
                  <p className="text-xs text-gray-700 leading-snug">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-3">✕ Don't</p>
            <div className="space-y-2.5">
              {donts.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-red-100 text-red-500 text-[10px] font-black flex items-center justify-center mt-0.5">✕</span>
                  <p className="text-xs text-gray-700 leading-snug">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 6 — What happens next ── */}
      <SectionHeader label="Section 06" title="What Happens Next" />
      <div className="bg-white px-6 py-6">
        <div className="relative">
          <div className="absolute top-3.5 left-0 right-0 h-px bg-gray-200" />
          <div className="relative flex justify-between">
            {timeline.map((step, i) => (
              <div key={i} className="flex flex-col items-center" style={{ width: `${100 / timeline.length}%` }}>
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-black z-10 ${
                  step.green
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  {i + 1}
                </div>
                <p className={`text-[10px] font-semibold mt-2 text-center leading-tight ${step.green ? 'text-green-700' : 'text-gray-500'}`}>
                  {fmtMD(step.date)}
                </p>
                <p className="text-[9px] text-gray-400 text-center leading-tight mt-0.5 px-1">{step.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Source strip */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex flex-wrap gap-2">
        {[
          { label: `verified — US Customs BoL ${fmtMD(lastDate)}`,                              green: true  },
          { label: `next window: ${fmtMD(lastDate)} + ${avgFreq} days = ${fmtMD(winStart)}–${fmtMD(winEnd)}`, green: true  },
          { label: `opportunity score: ${score}/100`,                                            green: false },
          { label: `generated: ${fmtMDY(todayDate)}`,                                           green: false },
        ].map(({ label, green }) => (
          <span key={label}
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium border ${
              green ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-gray-400 border-gray-200'
            }`}>
            {label}
          </span>
        ))}
      </div>

    </div>
  );
}
