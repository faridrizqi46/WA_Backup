import TopBar from '@/components/layout/TopBar';
import TabNav from '@/components/layout/TabNav';
import KPIRow from '@/components/dashboard/KPIRow';
import PlanVsRealization from '@/components/dashboard/PlanVsRealization';
import TopOpportunities from '@/components/dashboard/TopOpportunities';
import { getKPIMetrics, getAllAccounts } from '@/services/DatabaseService';
import { industriesData } from '@/data/mockData';

export default async function Home() {
  const kpi = await getKPIMetrics();
  const accounts = await getAllAccounts();

const opportunities = accounts.flatMap((a) =>
    a.opportunities.map((o) => ({
      product: o.offeredProduct,
      company: a.name,
      companySlug: a.id,
      potentialValue: parseFloat(o.potentialValue.replace(/[^0-9.]/g, '')) || 0,
      offerDate: o.offerDate,
      confidence: o.confidenceLevel,
    }))
  );

  return (
    <div className="min-h-screen bg-[#f5f6fa] flex flex-col">
      <TopBar />
      <TabNav />
      <main className="flex-1 flex flex-col">
        {kpi && <KPIRow data={kpi} />}
        <div className="flex-1 px-6 py-4 flex flex-col gap-4">
          <PlanVsRealization data={industriesData} />
          <TopOpportunities data={opportunities} />
        </div>
      </main>
      <footer className="bg-[#1a2436] text-gray-400 text-xs py-3 px-6">
        © 2026 Copyright
      </footer>
    </div>
  );
}
