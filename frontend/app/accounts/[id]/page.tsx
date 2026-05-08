import { notFound } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import TabNav from '@/components/layout/TabNav';
import AccountHeader from '@/components/accounts/AccountHeader';
import AccountDetailsPanel from '@/components/accounts/AccountDetailsPanel';
import { getAllAccounts } from '@/services/DatabaseService';
import { AccountDetail } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AccountDetailPage({ params }: PageProps) {
  const { id } = await params;
  const accounts = await getAllAccounts();
  const accountDTO = accounts.find((a) => a.id === id);

  if (!accountDTO) notFound();

  const account: AccountDetail = {
    id: accountDTO.id,
    name: accountDTO.name,
    layerId: accountDTO.layerId,
    industry: accountDTO.industry,
    type: accountDTO.type,
    segment: accountDTO.segment,
    cfoCount: accountDTO.cfoCount,
    accountNumber: accountDTO.accountNumber,
    description: accountDTO.description,
    headquarters: accountDTO.headquarters,
    latitude: accountDTO.latitude,
    longitude: accountDTO.longitude,
    alsoFoundAt: accountDTO.alsoFoundAt,
    keyHighlight: accountDTO.keyHighlight,
    financialMetrics: accountDTO.financialMetrics,
    companyTree: accountDTO.companyTree,
    valueChainNodes: accountDTO.valueChainNodes,
    insightsRelated: accountDTO.insightsRelated
      ? {
          defaultInsights: {
            industryInsights: accountDTO.insightsRelated.defaultInsights.industryInsights,
            clientInsights: accountDTO.insightsRelated.defaultInsights.clientInsights,
          },
          productPortion: accountDTO.insightsRelated.productPortion,
          walletShare: accountDTO.insightsRelated.walletShare,
          opportunityCount: accountDTO.insightsRelated.opportunityCount,
          totalOpportunityAmount: accountDTO.insightsRelated.totalOpportunityAmount,
          opportunities: accountDTO.opportunities,
          contacts: accountDTO.contacts,
        }
      : undefined,
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa] flex flex-col">
      <TopBar />
      <TabNav />
      <main className="flex-1 flex flex-col">
        <AccountHeader account={account} />
        <AccountDetailsPanel account={account} />
      </main>
      <footer className="bg-[#1a2436] text-gray-400 text-xs py-3 px-6">
        © 2026 Copyright
      </footer>
    </div>
  );
}
