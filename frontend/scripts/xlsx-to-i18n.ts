/// <reference types="node" />
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

interface Row {
  key: string;
  default: string;
  translation: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FALLBACK_SHEET = 'en_us';
const EXCEL_FILE = 'translations.xlsx';
const OUTPUT_DIR = path.resolve(__dirname, '../src/assets/i18n');

// 1. Verify Excel file exists before processing
if (!fs.existsSync(EXCEL_FILE)) {
  console.error(`Error: File "${EXCEL_FILE}" not found.`);
  process.exit(1);
}

const workbook = XLSX.readFile(EXCEL_FILE);
const fallbackSheet = workbook.Sheets[FALLBACK_SHEET];

if (!fallbackSheet) {
  console.error(`Error: Fallback sheet "${FALLBACK_SHEET}" missing.`);
  process.exit(1);
}

// 2. Build fallback map safely
const fallbackRows = XLSX.utils.sheet_to_json<Row>(fallbackSheet);
const fallbackMap: Record<string, string> = {};

fallbackRows.forEach((row) => {
  if (row.key && row.default) {
    fallbackMap[row.key] = row.default;
  }
});

// 3. Ensure output directory exists once
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// 4. Emit each sheet as its own locale JSON
workbook.SheetNames.forEach((sheetName) => {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return;

  const rows = XLSX.utils.sheet_to_json<Row>(sheet);
  
  // Clone fallback map to preserve base values
  const locale: Record<string, string> = { ...fallbackMap };

  rows.forEach((row) => {
    // Priority: Specific Translation -> Fallback Default
    if (row.key) {
      if (row.translation && row.translation.trim() !== '') {
        locale[row.key] = row.translation;
      } else if (!locale[row.key] && row.default) {
        locale[row.key] = row.default;
      }
    }
  });

  // Write finalized dictionary to file
  const outputPath = path.join(OUTPUT_DIR, `${sheetName}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(locale, null, 2), 'utf-8');
  console.log(`   Emitted ${sheetName}.json`);
});
