export function toCsv(headers, rows) {
  const escapeCell = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map((h) => escapeCell(h.label)).join(',');
  const dataLines = rows.map((row) => headers.map((h) => escapeCell(row[h.key])).join(','));
  return [headerLine, ...dataLines].join('\n');
}
