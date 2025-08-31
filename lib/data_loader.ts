import Papa from 'papaparse';

export interface COTData {
  date: Date;
  symbol: string;
  long: number;
  short: number;
  d_long: number;
  d_short: number;
  net: number;
  d_net: number;
}

const COLS = {
  date: "Report_Date_as_YYYY_MM_DD",
  symbol: "CONTRACT_MARKET_NAME",
  long: "NonComm_Positions_Long_All",
  short: "NonComm_Positions_Short_All",
  d_long: "Change_in_NonComm_Long_All",
  d_short: "Change_in_NonComm_Short_All",
};

export async function loadDataFrame(url: string): Promise<COTData[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const data = results.data as any[];
            
            // Find columns using flexible matching
            const cols_lower = Object.fromEntries(
              Object.keys(data[0] || {}).map(k => [k.toLowerCase(), k])
            );
            
            const pick = (...opts: string[]) => {
              for (const o of opts) {
                if (o in cols_lower) {
                  return cols_lower[o];
                }
              }
              return null;
            };
            
            const date_col = pick(COLS.date.toLowerCase(), "date", "report_date");
            const sym_col = pick(COLS.symbol.toLowerCase(), "symbol", "market", "asset");
            const long_col = pick(COLS.long.toLowerCase(), "long", "noncom_long", "noncomm_positions_long_all");
            const short_col = pick(COLS.short.toLowerCase(), "short", "noncom_short", "noncomm_positions_short_all");
            const dlong_col = pick(COLS.d_long.toLowerCase(), "d_long", "change_in_noncomm_long_all");
            const dshrt_col = pick(COLS.d_short.toLowerCase(), "d_short", "change_in_noncomm_short_all");
            
            if (!date_col || !sym_col || !long_col || !short_col) {
              throw new Error("Required columns not found");
            }
            
            // Process data
            const processedData: COTData[] = [];
            const symbolGroups = new Map<string, COTData[]>();
            
            for (const row of data) {
              if (!row[date_col] || !row[sym_col]) continue;
              
              const dateStr = row[date_col];
              const date = new Date(dateStr);
              if (isNaN(date.getTime())) continue;
              
              const symbol = String(row[sym_col]).trim();
              const long = Number(row[long_col]) || 0;
              const short = Number(row[short_col]) || 0;
              const d_long = dlong_col ? (Number(row[dlong_col]) || 0) : 0;
              const d_short = dshrt_col ? (Number(row[dshrt_col]) || 0) : 0;
              
              const record: COTData = {
                date,
                symbol,
                long,
                short,
                d_long,
                d_short,
                net: long - short,
                d_net: d_long - d_short,
              };
              
              if (!symbolGroups.has(symbol)) {
                symbolGroups.set(symbol, []);
              }
              symbolGroups.get(symbol)!.push(record);
            }
            
            // Sort by date within each symbol group and calculate deltas if not provided
            for (const [symbol, records] of symbolGroups) {
              records.sort((a, b) => a.date.getTime() - b.date.getTime());
              
              // Calculate deltas if not provided in data
              if (!dlong_col || !dshrt_col) {
                for (let i = 1; i < records.length; i++) {
                  const prev = records[i - 1];
                  const curr = records[i];
                  curr.d_long = curr.long - prev.long;
                  curr.d_short = curr.short - prev.short;
                  curr.d_net = curr.d_long - curr.d_short;
                }
              }
              
              processedData.push(...records);
            }
            
            // Final sort by symbol and date
            processedData.sort((a, b) => {
              if (a.symbol !== b.symbol) {
                return a.symbol.localeCompare(b.symbol);
              }
              return a.date.getTime() - b.date.getTime();
            });
            
            resolve(processedData);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    throw new Error(`Failed to load data: ${error}`);
  }
}