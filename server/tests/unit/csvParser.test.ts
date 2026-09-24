import { parseRosterCsv } from '../../src/utils/csvParser';

describe('csvParser util', () => {
  it('parses valid CSV with roll_no and name headers', () => {
    const csv = `roll_no,name\nCS-01,Alice\nCS-02,Bob`;
    const result = parseRosterCsv(csv);
    
    expect(result.errors).toHaveLength(0);
    expect(result.validRows).toHaveLength(2);
    expect(result.validRows[0]).toEqual({ roll_no: 'CS-01', name: 'Alice' });
    expect(result.validRows[1]).toEqual({ roll_no: 'CS-02', name: 'Bob' });
  });

  it('skips empty lines', () => {
    const csv = `roll_no,name\n\nCS-01,Alice\n\n`;
    const result = parseRosterCsv(csv);
    
    expect(result.errors).toHaveLength(0);
    expect(result.validRows).toHaveLength(1);
    expect(result.validRows[0]).toEqual({ roll_no: 'CS-01', name: 'Alice' });
  });

  it('reports missing roll_no', () => {
    const csv = `roll_no,name\n,Alice\nCS-02,Bob`;
    const result = parseRosterCsv(csv);
    
    expect(result.validRows).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual({ row: 2, reason: 'Missing roll_no' });
  });

  it('reports missing name', () => {
    const csv = `roll_no,name\nCS-01,\nCS-02,Bob`;
    const result = parseRosterCsv(csv);
    
    expect(result.validRows).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual({ row: 2, reason: 'Missing name' });
  });

  it('trims whitespace from values', () => {
    const csv = `roll_no,name\n  CS-01  ,  Alice  \n`;
    const result = parseRosterCsv(csv);
    
    expect(result.validRows[0]).toEqual({ roll_no: 'CS-01', name: 'Alice' });
  });
});
