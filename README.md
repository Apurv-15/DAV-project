# GLOBAL INSIGHT — Global E-Commerce Consumer Behaviour & Shopping Trends Analytics

GLOBAL INSIGHT is an automated full-stack data profiling, non-destructive cleaning, interactive visualization, and grounded AI analytics platform engineered for global e-commerce datasets containing **1.4–1.5 million records or more**.

---

## 1. Design System ("Island Capsule")

- **Palette**: `#F5F5F7` canvas, `#FFFFFF` primary cards, `#ECECEE` secondary controls, `#000000` / `#101014` editorial contrast bands, `#1D1D1F` primary typography, and `#F34B38` coral accents reserved strictly for primary CTAs and key active indicators.
- **Typography**: System UI / `Plus Jakarta Sans` for structural precision, `Instrument Serif Italic` for editorial headline accents, and `JetBrains Mono` (`tabular-nums`) for all financial and statistical metrics.

---

## 2. Installation & Setup

### Frontend & Integrated Full-Stack Server Setup
```bash
npm install
npm run dev
```
The application launches on `http://localhost:3000` with the integrated Express + Vite analytical server and pre-loaded **1.48M-row Global E-Commerce Benchmark Repository**.

### Reference Python + FastAPI + DuckDB Backend Setup (Optional Standalone)
You can download `global_insight_fastapi_duckdb_service.py` directly from **Page 8: Executive Reports** inside the app.
```bash
pip install fastapi uvicorn duckdb pandas pyarrow psycopg2-binary
uvicorn global_insight_fastapi_duckdb_service:app --reload --port 8000
```

---

## 3. Environment Variables

Configure your environment variables in `.env` (see `.env.example`):
```env
GEMINI_API_KEY="your_gemini_api_key"
APP_URL="http://localhost:3000"
DATABASE_URL="postgresql://user:password@localhost:5432/global_insight"
```
- `GEMINI_API_KEY` is used strictly on the server side (`/api/datasets/:id/ask`) via `@google/genai` (`gemini-3.8-flash`). It is never exposed to the client browser.

---

## 4. Dataset Processing & AI Grounding Architecture

1. **Chunked Upload & Schema Detection**: Supports `.csv`, `.xlsx`, and `.parquet` files as well as built-in 10K, 100K, 500K, and 1.5M row benchmark stress tests without loading all records into browser memory.
2. **Automated Profiling & Non-Destructive Cleaning**: Maps 12 semantic e-commerce fields (`order_id`, `customer_id`, `product`, `category`, `date`, `country`, `quantity`, `price`, `revenue`, `discount`, `payment_method`, `rating`), computes Completeness/Validity/Uniqueness/Consistency scores, and logs all cleaning operations with a Before-and-After comparison.
3. **Grounded AI Analyst**: Pre-computes exact statistical aggregations and DuckDB query equivalents before invoking `gemini-3.8-flash`, ensuring the AI never invents metrics.
