# COT Non-Commercial Positions Dashboard

A Next.js web application for visualizing Commitment of Traders (COT) Non-Commercial positions data. This dashboard mirrors the functionality of the original Streamlit application with interactive charts showing position levels and weekly changes.

## Features

- Interactive dual-pane charts showing positions and weekly changes
- Asset selection with search functionality
- Date range filtering
- Optional net position overlay
- Dark theme optimized for financial data visualization
- Unified hover tooltips with comprehensive position information
- Responsive design

## Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Click the deploy button above or manually import this repository to Vercel
2. Set the environment variable in Vercel dashboard:
   - `NEXT_PUBLIC_DATA_URL`: Your CSV data URL (optional - defaults to GitHub CSV)
3. Deploy

## Local Development

1. Clone the repository:
```bash
git clone <your-repo-url>
cd cot-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file (optional):
```bash
cp .env.example .env.local
# Edit .env.local with your data URL if different from default
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

- `NEXT_PUBLIC_DATA_URL`: URL to the CSV file containing COT data
  - Default: `https://raw.githubusercontent.com/gptechnologies/COTData/refs/heads/main/cot.csv`
  - Must be publicly accessible CSV with proper CORS headers

## Data Format

The CSV data should contain the following columns (flexible column name matching):

- Date column: `Report_Date_as_YYYY_MM_DD`, `date`, or `report_date`
- Symbol column: `CONTRACT_MARKET_NAME`, `symbol`, `market`, or `asset`
- Long positions: `NonComm_Positions_Long_All`, `long`, or `noncom_long`
- Short positions: `NonComm_Positions_Short_All`, `short`, or `noncom_short`
- Long changes (optional): `Change_in_NonComm_Long_All`, `d_long`
- Short changes (optional): `Change_in_NonComm_Short_All`, `d_short`

If change columns are not provided, they will be calculated automatically.

## Technology Stack

- **Framework**: Next.js 14 with TypeScript
- **Charts**: Plotly.js with React wrapper
- **Styling**: Tailwind CSS
- **Data Processing**: Papa Parse for CSV parsing
- **Date Handling**: date-fns

## File Structure

```
├── app/
│   ├── globals.css          # Global styles and dark theme
│   ├── layout.tsx           # Root layout component
│   └── page.tsx            # Main dashboard page
├── components/
│   └── COTChart.tsx        # Interactive chart component
├── lib/
│   └── dataLoader.ts       # Data loading and processing logic
├── package.json            # Dependencies and scripts
├── next.config.js         # Next.js configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## Deployment Notes

- The application is configured for static export and edge runtime compatibility
- No server-side dependencies - all data processing happens client-side
- Optimized for Vercel's edge network with proper caching headers
- Dark theme optimized for financial data visualization

## License

MIT License - see LICENSE file for details.