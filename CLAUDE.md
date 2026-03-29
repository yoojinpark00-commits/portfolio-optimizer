# CLAUDE.md — Portfolio Optimizer

## Project Overview

A quantitative portfolio optimization platform built with React + Vite, deployed on Vercel. It combines ETF/stock portfolio management with regime-aware optimization, backtesting, and AI-powered advisory. The entire frontend logic lives in a single monolithic `src/App.jsx` (~9,500 lines).

## Tech Stack

- **Frontend**: React 19 (JSX, no TypeScript), Vite 7, inline styles (IBM Carbon-inspired dark theme)
- **Backend**: Vercel Serverless Functions (Node.js, ESM) in `api/`
- **Data Sources**: Yahoo Finance (primary), Twelve Data (fallback), FRED (macro/regime data), Anthropic Claude API (AI advisor)
- **Deployment**: Vercel (configured via `vercel.json`)
- **Linting**: ESLint 9 with flat config, react-hooks and react-refresh plugins
- **No test framework** — there are no automated tests

## Repository Structure

```
├── api/                    # Vercel serverless functions
│   ├── prices.js           # Live quotes (Yahoo → Twelve Data fallback)
│   ├── history.js          # Historical price data (adjusted close)
│   ├── search.js           # Ticker search via Yahoo autosuggest
│   ├── regime.js           # Regime detection using 19 FRED series
│   ├── RegimeEngine.js     # Client-side HMM + BOCPD + ensemble engine
│   └── ai.js               # AI advisor proxy to Anthropic Claude API
├── src/
│   ├── App.jsx             # Entire application (engine + UI, ~9500 lines)
│   ├── App.css             # Global styles, animations
│   ├── index.css            # Root CSS reset
│   ├── main.jsx            # React entry point
│   └── assets/             # Static assets
├── public/                 # Public static files (vite.svg)
├── .github/workflows/      # CI: Claude Code review + Claude Code action
├── PLAN.md                 # Alpha enhancement implementation plan
├── package.json            # Dependencies and scripts
├── eslint.config.js        # ESLint flat config
├── vite.config.js          # Vite config with dev proxy stub
├── vercel.json             # Vercel rewrites for SPA + API
└── index.html              # HTML entry point
```

## Key Commands

```bash
npm run dev          # Start Vite dev server (HMR)
npm run build        # Production build to dist/
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
npx vercel dev       # Full local dev with serverless functions
```

## Architecture

### App.jsx Structure (~9,500 lines)

The file is organized in large sections:

1. **Data Constants** (lines 1–530): `ETF_DB` (150+ ETFs with metadata), `STOCK_DB`, `SUB_PARENT` category hierarchy, `SUB_CORR` correlation matrix, `SP500_BY_SECTOR` historical constituents
2. **Core Engine** (lines 530–2000): Portfolio metrics, regime tilts, factor scoring (`computeFactorScores`), Black-Litterman returns, risk parity, transaction costs, vol scaling, drawdown control, HMM implementation (client-side), BOCPD
3. **Optimizer** (lines 2000–2750): `optimizeCash()` — the main optimization loop using stochastic search with regime-aware scoring, efficient frontier generation
4. **UI Components** (lines 2750–3900): Charts (SVG-based), regime visualizations, equity curves, heatmaps, drawdown charts, frontier scatter, performance tracker, AI markdown renderer
5. **Main App Component** (lines 3900–end): Tab-based UI with 7 tabs: My Portfolio, Deploy Cash, Portfolio Analysis, Regime Analysis, Frontier, AI Advisor, Backtest

### Serverless API (`api/`)

- **prices.js**: Fetches live quotes. Yahoo Finance v7 (primary) with Twelve Data fallback. Handles BRK.B ↔ BRK-B symbol mapping.
- **history.js**: Historical price data via Yahoo Finance v8 chart endpoint. Supports daily (`1d`) and monthly (`1mo`) intervals. Uses adjusted close for dividend/split accuracy.
- **search.js**: Ticker autocomplete via Yahoo Finance search API. Filters to equities and ETFs only.
- **regime.js**: Fetches 19 FRED macro series (VIX, credit spreads, yield curves, Sahm rule, etc.) and computes a 5-state regime classification (Bull/Euphoria/Correction/Crisis/Recovery).
- **RegimeEngine.js**: Client-side Gaussian HMM (Baum-Welch/Viterbi/Forward-Backward), BOCPD, ensemble detector, turbulence index, absorption ratio.
- **ai.js**: Proxies requests to Anthropic Claude API with web search tool enabled.

### Key Algorithms

- **5-State Regime Model**: Bull → Euphoria → Correction → Crisis → Recovery. Uses FRED macro data + HMM + BOCPD ensemble.
- **Factor Scoring**: Multi-factor model with momentum (vol-scaled, FIP quality, 52-week high, acceleration, EWMAC), value, quality, low-vol, mean reversion, and relative value signals. Factors are orthogonalized.
- **Optimization**: Stochastic search optimizer with regime-conditional scoring, Black-Litterman expected returns, risk parity weighting, CPPI drawdown protection, half-Kelly position sizing.
- **Backtesting**: Walk-forward with out-of-sample validation, IndexedDB caching for historical data, regime-duration models, three-stage pattern prediction.

## Environment Variables (Vercel)

- `FRED_API_KEY` — Required for regime detection (free at fred.stlouisfed.org)
- `ANTHROPIC_API_KEY` — Required for AI advisor feature
- `TWELVEDATA_API_KEY` — Optional fallback for price data

## Code Conventions

- **No TypeScript** — plain JavaScript with JSX
- **Single-file architecture** — `App.jsx` contains all frontend logic; avoid splitting unless explicitly requested
- **Inline styles** — uses JS style objects, not CSS classes (except `App.css` for animations/global resets)
- **Abbreviated variable names** — common in the codebase (e.g., `cs` for color scheme, `gc` for get-correlation, `sq` for search query, `sr` for Sharpe ratio mode)
- **IBM Carbon design language** — dark theme, monospace fonts (`IBM Plex Mono`), sharp corners (border-radius: 2-3px), muted color palette
- **ESLint rule**: `no-unused-vars` ignores variables starting with uppercase or underscore (`varsIgnorePattern: '^[A-Z_]'`)
- **ESM modules** — `"type": "module"` in package.json; all files use `import`/`export`
- **No test suite** — changes should be manually verified via `npm run dev` and `npm run build`

## Important Patterns

- **Price data flow**: Frontend calls `/api/prices` or `/api/history` → serverless function fetches from Yahoo Finance → returns normalized JSON
- **Regime data flow**: Frontend calls `/api/regime` → serverless function fetches 19 FRED series → computes composite regime score → frontend runs HMM/BOCPD ensemble via `RegimeEngine.js`
- **State persistence**: Portfolio state saved to `localStorage` under key `etf_optimizer_state_v1`; historical price cache uses `IndexedDB`
- **Password gate**: Simple SHA-256 hash check (default: "1234"), stored in `localStorage`
- **Symbol normalization**: BRK.B ↔ BRK-B conversion between internal format (dot) and Yahoo API (dash)

## Common Pitfalls

- **App.jsx size**: At ~9,500 lines, edits require careful line targeting. Always read the relevant section before modifying.
- **Variable shadowing**: The `q` variable is used in both search functions and array callbacks — watch for conflicts.
- **Regime state coupling**: The optimizer depends on regime context (`lastRegimeCtx`). Changes to regime computation can break optimization.
- **Yahoo Finance API**: No official API key needed but responses can change format. The `User-Agent` header is required.
- **FRED rate limits**: API calls are batched (4 concurrent) with 100ms delays between batches.
- **Adjusted vs raw close**: Historical data MUST use adjusted close (`adjclose`) to account for dividends and splits. Using raw close introduces ~2%/yr error for SPY.

## Git Workflow

- `main` branch is the production branch
- Feature branches use the pattern `claude/<description>-<id>`
- CI: Claude Code Review runs on PRs; Claude Code Action responds to `@claude` mentions
- No pre-commit hooks or required checks beyond ESLint

## When Making Changes

1. Run `npm run lint` to check for ESLint errors before committing
2. Run `npm run build` to verify the production build succeeds
3. For UI changes, verify with `npm run dev` in the browser
4. Keep changes within the existing single-file architecture unless explicitly asked to refactor
5. Match the existing abbreviated naming style and inline style patterns
6. Do not add TypeScript, test frameworks, or additional dependencies without being asked
