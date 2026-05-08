import { ExtractedTable } from './DataIngestionService';
import { BolRecord } from '@/types';

export class BolRecordMapper {
  private static readonly COLUMN_MAPPING: Record<string, string[]> = {
    'arrivalDate': ['arrival date', 'date'],
    'bolNumber': ['master bol', 'bill of lading', 'bill of landing', 'bol'],
    'containerCount': ['quantity', 'no. of containers'],
    'grossWeightKgs': ['weight'],
    'productShort': ['commodity', 'description'],
    'supplier': ['shipper', 'supplier', 'suppliers', 'supplierscountry'],
    'vesselCarrier': ['vessel name'],
  };

  static findBolColumns(headers: string[]): Record<string, number> {
    const columnIndexMap: Record<string, number> = {};

    headers.forEach((header, index) => {
      const normalizedHeader = header.toLowerCase().trim();
      for (const [field, aliases] of Object.entries(this.COLUMN_MAPPING)) {
        if (aliases.includes(normalizedHeader)) {
          columnIndexMap[field] = index;
          break;
        }
      }
    });

    return columnIndexMap;
  }

  static mapRowToBolRecord(row: string[], columnIndexMap: Record<string, number>): Partial<BolRecord> {
    const record: Partial<BolRecord> = {
      supplierConfirmed: false,
    };

    if (columnIndexMap['arrivalDate'] !== undefined) {
      const dateValue = row[columnIndexMap['arrivalDate']];
      if (dateValue) {
        record.arrivalDate = new Date(dateValue).toISOString();
      }
    }

    if (columnIndexMap['bolNumber'] !== undefined) {
      record.bolNumber = row[columnIndexMap['bolNumber']] || '';
    }

    if (columnIndexMap['containerCount'] !== undefined) {
      const qty = row[columnIndexMap['containerCount']];
      record.containerCount = this.parseInt(qty);
    }

    if (columnIndexMap['grossWeightKgs'] !== undefined) {
      const weight = row[columnIndexMap['grossWeightKgs']];
      record.grossWeightKgs = this.parseInt(weight);
    }

    if (columnIndexMap['portOfDischarge'] !== undefined) {
      record.portOfDischarge = row[columnIndexMap['portOfDischarge']] || '';
    }

    if (columnIndexMap['productShort'] !== undefined) {
      record.productShort = row[columnIndexMap['productShort']] || '';
    }

    if (columnIndexMap['supplier'] !== undefined) {
      record.supplier = row[columnIndexMap['supplier']] || '';
    }

    if (columnIndexMap['vesselCarrier'] !== undefined) {
      record.vesselCarrier = row[columnIndexMap['vesselCarrier']] || '';
    }

    return record;
  }

  static extractBolRecordsFromTable(table: ExtractedTable): Partial<BolRecord>[] {
    if (table.rows.length < 2) {
      return [];
    }

    const columnIndexMap = this.findBolColumns(table.headers);

    if (Object.keys(columnIndexMap).length === 0) {
      return [];
    }

    return table.rows
      .map(row => this.mapRowToBolRecord(row, columnIndexMap))
      .filter(record => record.bolNumber || record.supplier);
  }

  private static parseInt(value: string | undefined): number {
    if (!value) return 0;
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
}
