# HBL Statement Calculator (Habib Bank Limited)

A high-performance calculator and analyzer for **HBL (Habib Bank Limited)** account statements (PDF documents and scanned activity reports).

## Key Features

- **Separate Totals & Remittances**:
  - **Total Credits (+ PKR)**: Total deposits, inward funds transfers, and remittances.
  - **Total Debits (- PKR)**: Total withdrawals, card purchases, IBFT outward, taxes, and service charges.
  - **Foreign & Swift Remittances**: Specifically isolates Swift foreign remittances (including CAD/USD/EUR/GBP inward wires) and international remittance channels.
  - **TapTap Send Remittance**: Dedicated breakdown for TapTap Send remittances.
  - **Net Cash Flow**: Instantly computes net financial position (Credits minus Debits).
- **HBL Account Profile**:
  - Automatically parses and displays Account Title, Account Number, IBAN, CNIC, Branch, Statement Duration, and Opening/Closing balances.
- **Accurate HBL Tabular Parsing**:
  - Accurately aligns columns: `Transaction Date`, `Value Date`, `Description / Narration`, `Credit (+)`, `Debit (-)`, and `Balance`.
  - Supports multi-line Raast reference numbers, STAN, and digital banking particulars.
- **AI OCR Document Scanner**:
  - Built-in Gemini AI document parser for photos, scanned pages, and image-based PDFs (PIN-protected).
- **CSV Export**:
  - Export complete transaction ledgers and calculated summaries to CSV (`hbl_statement_[timestamp].csv`).

## Run Locally

**Prerequisites:** Node.js (v18+)

1. Install dependencies:
   ```bash
   npm install
   ```
2. (Optional for AI OCR) Configure your Gemini API key in `.env`:
   ```env
   GEMINI_API_KEY="your_api_key_here"
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Run the test suite:
   ```bash
   npm test
   ```
