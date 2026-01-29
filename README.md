# Personal Finance Dashboard

A responsive React application for tracking income, expenses, and budgets with real-time data visualization.

**[Live Demo](https://finance-dashboard-seven-gamma.vercel.app/)** · **[Report Bug](https://github.com/Crespo1301/finance-dashboard/issues)** · **[Request Feature](https://github.com/Crespo1301/finance-dashboard/issues)**

![Dashboard Demo](https://github.com/Crespo1301/finance-dashboard/blob/main/public/finance.gif)

## Overview

Personal Finance Dashboard is a client-side financial tracking application built with React 19 and Chart.js. It provides intuitive expense categorization, budget management with progress tracking, and visual analytics including pie charts and line graphs. All data persists locally in the browser using localStorage, ensuring complete privacy with no server-side data transmission.

## Features

**Transaction Management**
- Add, edit, and delete income/expense entries
- Categorize transactions across 12 predefined categories
- Search and filter by description, category, or transaction type
- Export transaction history to CSV

**Budget Tracking**
- Set monthly spending limits by category
- Visual progress bars with color-coded alerts (green/yellow/red)
- Month-by-month budget navigation
- Automatic migration from legacy budget format

**Data Visualization**
- Interactive pie chart with category breakdown and period comparison
- Line chart displaying income, expenses, and net trends over time
- Linear regression forecasting with confidence bands
- Year-over-year comparison table with change indicators

**Multi-Currency Support**
- USD, EUR, GBP, JPY, CAD, AUD, and MXN
- Persistent currency preference

**Period Comparison**
- Compare current vs. previous month
- Compare current vs. previous year
- Navigate between months with arrow controls

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 19 |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS v4 |
| Charts | Chart.js 4 + react-chartjs-2 |
| Routing | React Router 7 |
| Storage | localStorage |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher

### Installation

```bash
git clone https://github.com/Crespo1301/finance-dashboard.git
cd finance-dashboard
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
finance-dashboard/
├── src/
│   ├── components/
│   │   ├── BudgetManager.jsx     # Monthly budget tracking
│   │   ├── CurrencySelector.jsx  # Currency dropdown
│   │   ├── LineChart.jsx         # Trends + forecasting
│   │   ├── PieChart.jsx          # Category breakdown
│   │   ├── PrivacyPolicy.jsx     # Privacy page
│   │   ├── Summary.jsx           # Income/expense/balance cards
│   │   ├── TransactionForm.jsx   # Add transaction form
│   │   ├── TransactionList.jsx   # Filterable transaction list
│   │   └── YearComparison.jsx    # Year-over-year table
│   ├── context/
│   │   └── CurrencyContext.jsx   # Global currency state
│   ├── App.jsx                   # Main dashboard + routing
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Tailwind imports + base styles
├── public/
├── package.json
└── vite.config.js
```

## Usage

1. **Add Transactions**: Select income or expense, enter details, choose a category, and submit.
2. **Set Budgets**: Navigate to the Budgets section, select a category, enter a limit, and click Set.
3. **View Analytics**: The pie chart shows expense distribution; the line chart displays monthly trends with forecasting.
4. **Compare Periods**: Use the comparison toggle to view month-over-month or year-over-year changes.
5. **Export Data**: Click "Export CSV" to download your transaction history.

Data persists automatically in your browser's localStorage.

## Architecture Decisions

**Client-Side Only**: All data remains on the user's device. No accounts, no servers, no tracking beyond optional Google AdSense.

**Inclusive Date Ranges**: Period boundaries use `.setMilliseconds(-1)` to capture transactions on the last day of each month/year correctly.

**Budget Key Format**: Budgets are stored by month key (`"2026-01"`) to support month-specific limits with automatic migration from legacy flat formats.

**Currency Context**: A React Context provides global access to currency formatting and symbol retrieval without prop drilling.

## Changelog

### v2.1 (January 29, 2026)
- Fixed date range comparison bug causing silent data exclusion
- Added month navigation controls for period selection
- Added debug overlay for development (date range visualization)
- Improved empty state UI for charts
- Updated README with architecture documentation

### v2.0 (January 21, 2026)
- Added multi-currency support (USD, EUR, GBP, JPY, CAD, AUD, MXN)
- Added CSV export functionality
- Added year-over-year comparison with statistics table
- Added budget tracker with category limits and progress visualization

### v1.0 (January 20, 2026)
- Initial release
- Transaction management (add, edit, delete)
- Pie chart for expense breakdown
- Line chart for monthly trends
- localStorage persistence
- Responsive design with Tailwind CSS

## Roadmap

- [ ] Recurring transactions
- [ ] Data backup/restore (JSON export/import)
- [ ] Receipt image uploads
- [ ] Financial insights and recommendations
- [ ] Dark/light theme toggle

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Author

**Carlos Crespo**

- Portfolio: [carloscrespo.info](https://carloscrespo.info)
- GitHub: [@Crespo1301](https://github.com/Crespo1301)
- LinkedIn: [Carlos Crespo](https://www.linkedin.com/in/carlos-crespo-46608014a/)