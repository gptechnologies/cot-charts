import Papa from 'papaparse';

export interface PolicyRate {
  currency: string;
  areaCode: string;
  rate: number;
  asOfDate: string;
  source: string;
}

interface PolicyRateCsvRow {
  currency?: string;
  area_code?: string;
  rate?: number | string;
  as_of_date?: string;
  source?: string;
}

export async function loadPolicyRates(url: string): Promise<PolicyRate[]> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Policy-rate request failed with status ${response.status}`);
  }

  const csvText = await response.text();
  const parsed = Papa.parse<PolicyRateCsvRow>(csvText, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0].message);
  }

  const rates = parsed.data.flatMap((row) => {
    const currency = String(row.currency || '').trim().toUpperCase();
    const areaCode = String(row.area_code || '').trim().toUpperCase();
    const rate = Number(row.rate);
    const asOfDate = String(row.as_of_date || '').trim();
    const source = String(row.source || '').trim();

    if (!currency || !areaCode || !Number.isFinite(rate) || !/^\d{4}-\d{2}-\d{2}$/.test(asOfDate)) {
      return [];
    }

    return [{ currency, areaCode, rate, asOfDate, source }];
  });

  if (rates.length === 0) {
    throw new Error('Policy-rate data did not contain any valid rows');
  }

  return rates;
}
