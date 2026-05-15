import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const XLSX_PATH = path.resolve(__dirname, '../../translations.xlsx');
const OUTPUT_DIR = path.resolve(__dirname, '../src/assets/i18n');
const REQUIRED_HEADERS = ['key', 'translation', 'default'];

interface Row {
  key: string;
  translation: string;
  default: string;
}

// Strip \r \n and extra spaces from a string
function sanitize(value: any): string {
  if (typeof value !== 'string') return String(value ?? '');
  return value.replace(/[\r\n]/g, ' ').trim();
}

// Read raw rows from a sheet WITHOUT header parsing (header: 1 gives us a 2D array)
// Row 0 = headers, Row 1+ = data
function parseSheet(sheet: XLSX.WorkSheet): { headers: string[]; rows: Row[] } | null {
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (raw.length === 0) {
    console.error('  ❌ Sheet is completely empty');
    return null;
  }

  // Step 4: Sanitise header row and validate required columns
  const headers = (raw[0] as unknown[]).map(h => sanitize(h).toLowerCase());
  const missing = REQUIRED_HEADERS.filter(h => !headers.includes(h));

  if (missing.length > 0) {
    console.error(`  ❌ Missing required columns: ${missing.join(', ')}`);
    console.error(`     Found columns: ${headers.join(', ')}`);
    return null;
  }

  const keyIdx         = headers.indexOf('key');
  const translationIdx = headers.indexOf('translation');
  const defaultIdx     = headers.indexOf('default');

  // Step 5: Loop through data rows (skip header at index 0)
  const rows: Row[] = [];
  let hasErrors = false;

  for (let i = 1; i < raw.length; i++) {
    const rawRow = raw[i] as unknown[];

    const key         = sanitize(rawRow[keyIdx]);
    const translation = sanitize(rawRow[translationIdx]);
    const def         = sanitize(rawRow[defaultIdx]);

    // Skip completely empty rows silently
    if (!key && !translation && !def) continue;

    // Validate each field is present and non-empty
    const rowErrors: string[] = [];
    if (!key)         rowErrors.push("'key' is empty");
    if (!translation) rowErrors.push("'translation' is empty");
    if (!def)         rowErrors.push("'default' is empty");

    if (rowErrors.length > 0) {
      console.error(`  ❌ Row ${i + 1}: ${rowErrors.join(', ')}`);
      hasErrors = true;
      continue;
    }

    rows.push({ key, translation, default: def });
  }

  if (hasErrors) return null;

  return { headers, rows };
}

function run() {
  // Step 1: Check if xlsx exists
  if (!fs.existsSync(XLSX_PATH)) {
    console.error(`❌ translations.xlsx not found at: ${XLSX_PATH}`);
    process.exit(1);
  }

  // Step 2: Read workbook
  const workbook = XLSX.readFile(XLSX_PATH);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('\n🔍 Processing sheets...\n');

  let hasErrors = false;

  for (const sheetName of workbook.SheetNames) {
    console.log(`📄 ${sheetName}`);

    const result = parseSheet(workbook.Sheets[sheetName]);

    if (!result) {
      hasErrors = true;
      continue;
    }

    const { rows } = result;

    // Check for duplicate keys
    const seenKeys = new Set<string>();
    let duplicateFound = false;
    for (const row of rows) {
      if (seenKeys.has(row.key)) {
        console.error(`  ❌ Duplicate key: '${row.key}'`);
        duplicateFound = true;
      }
      seenKeys.add(row.key);
    }
    if (duplicateFound) { hasErrors = true; continue; }

    // Build locale output:
    // - use 'translation' as the value for this locale
    // - fall back to 'default' if translation is same as key or missing
    const locale: Record<string, string> = {};
    let fallbackCount = 0;

    for (const row of rows) {
      const value = row.translation || row.default;
      if (value === row.default && row.translation !== row.default) fallbackCount++;
      locale[row.key] = value;
    }

    // Write JSON
    const outPath = path.join(OUTPUT_DIR, `${sheetName}.json`);
    fs.writeFileSync(outPath, JSON.stringify(locale, null, 2), 'utf-8');

    console.log(`  ✅ ${rows.length} keys written`);
    if (fallbackCount > 0) {
      console.log(`  ⚠️  ${fallbackCount} keys used default as fallback`);
    }
  }

  console.log('\n' + '='.repeat(50));

  if (hasErrors) {
    console.error('❌ Some sheets failed. Fix the errors above and re-run.');
    process.exit(1);
  }

  console.log(`✨ All sheets processed successfully!`);
  console.log(`📁 Output: ${OUTPUT_DIR}\n`);
}

run();