import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// translations.xlsx is at repo root — two levels up from frontend/scripts/
const XLSX_PATH = path.resolve(__dirname, '../../translations.xlsx');
const OUTPUT_DIR = path.resolve(__dirname, '../src/assets/i18n');
const FALLBACK_SHEET = 'en_us';

interface Row {
  key: string;
  default: string;
  translation?: string;
}

function buildLocale(rows: Row[], fallback: Record<string, string>): Record<string, string> {
  // Start with fallback so missing translations degrade gracefully
  const locale: Record<string, string> = { ...fallback };
  for (const row of rows) {
    if (row.key && row.translation?.trim()) {
      locale[row.key] = row.translation.trim();
    }
  }
  return locale;
}

function run() {
  if (!fs.existsSync(XLSX_PATH)) {
    console.error(`❌ translations.xlsx not found at: ${XLSX_PATH}`);
    process.exit(1);
  }

  const workbook = XLSX.readFile(XLSX_PATH);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Build fallback map from sheet 1 (always en_us)
  const fallbackRows: Row[] = XLSX.utils.sheet_to_json(workbook.Sheets[FALLBACK_SHEET]);
  const fallback: Record<string, string> = {};
  for (const row of fallbackRows) {
    if (row.key) fallback[row.key] = row.default ?? row.key;
  }

  // Emit one JSON per sheet
  for (const sheetName of workbook.SheetNames) {
    const rows: Row[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    const locale = sheetName === FALLBACK_SHEET
      ? { ...fallback }                         // en_us: use default column directly
      : buildLocale(rows, fallback);             // others: translation column, fallback to default

    const outPath = path.join(OUTPUT_DIR, `${sheetName}.json`);
    fs.writeFileSync(outPath, JSON.stringify(locale, null, 2), 'utf-8');
    console.log(`✅ ${sheetName}.json → ${Object.keys(locale).length} keys`);
  }

  console.log(`\n📁 Output: ${OUTPUT_DIR}`);
}

run();