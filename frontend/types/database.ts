export type BorrowerType = 'Parent' | 'Subsidiary';

export interface LoanFacilityRow {
  id: number;
  accountId: string;
  bank: string;
  bankShortName: string;
  facilityType: string;
  maxLimitRpM: number;
  maxLimitNote: string | null;
  borrowerTag: string;
  borrowerType: BorrowerType;
  expiryDate: Date | string | null;
  expiryYear: number | null;
  insight: string;
  fullInsight: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoanFacility {
  facilityType: string;
  maxLimitRpM: number;
  maxLimitNote?: string;
  borrowerTag: string;
  borrowerType: BorrowerType;
  expiryDate: string | null;
  expiryYear: number | null;
  insight: string;
  fullInsight?: string | null;
}

export interface BankLoanGroup {
  bank: string;
  shortName: string;
  facilities: LoanFacility[];
}
