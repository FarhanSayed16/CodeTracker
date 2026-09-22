import Papa from 'papaparse';

export interface ParsedStudentRow {
  roll_no: string;
  name: string;
}

export interface ParseResult {
  validRows: ParsedStudentRow[];
  errors: { row: number; reason: string }[];
}

export function parseRosterCsv(csvString: string): ParseResult {
  const result: ParseResult = {
    validRows: [],
    errors: [],
  };

  const parsed = Papa.parse<any>(csvString, {
    header: true,
    skipEmptyLines: true,
  });

  parsed.data.forEach((row, index) => {
    // Check if the required headers exist
    // Expected headers: roll_no, name (case-insensitive ideally, but let's assume exact match or map it)
    const roll_no = row['roll_no']?.toString().trim();
    const name = row['name']?.toString().trim();

    if (!roll_no) {
      result.errors.push({ row: index + 2, reason: 'Missing roll_no' });
      return;
    }

    if (!name) {
      result.errors.push({ row: index + 2, reason: 'Missing name' });
      return;
    }

    result.validRows.push({ roll_no, name });
  });

  return result;
}
