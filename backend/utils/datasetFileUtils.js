const path = require('path');

let xlsx;
try {
  xlsx = require('xlsx');
} catch (error) {
  console.warn('[DatasetUtils] xlsx module not found. Excel file support will be limited.');
  xlsx = null;
}

const ALLOWED_EXTENSIONS = [
  '.csv',
  '.tsv',
  '.txt',
  '.vcf',
  '.fastq',
  '.fq',
];

const ALLOWED_MIME_TYPES = [
  'text/csv',
  'text/plain',
  'text/x-vcard',
  'application/octet-stream',
  'application/fastq',
];

function normalizeFileType(fileType) {
  if (!fileType || typeof fileType !== 'string') {
    return null;
  }

  const lower = fileType.trim().toLowerCase();
  if (lower === 'fastq' || lower === 'fq') return 'fastq';
  if (lower === 'vcf') return 'vcf';
  if (lower === 'csv') return 'csv';
  if (lower === 'tsv') return 'tsv';
  if (lower === 'txt') return 'txt';
  if (lower === 'xlsx' || lower === 'excel') return 'xlsx';
  if (lower === 'xls') return 'xls';
  return null;
}

function detectDatasetFileType(originalName, declaredType) {
  const normalizedDeclared = normalizeFileType(declaredType);
  if (normalizedDeclared) {
    return normalizedDeclared;
  }

  const lowerName = String(originalName || '').toLowerCase();
  const extension = ALLOWED_EXTENSIONS.find((ext) => lowerName.endsWith(ext));
  if (!extension) {
    return null;
  }

  if (extension === '.fq') {
    return 'fastq';
  }

  return extension.replace('.', '');
}

function isAllowedDatasetFile(mimetype, originalName) {
  const lowerName = String(originalName || '').toLowerCase();
  const hasAllowedExtension = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  return ALLOWED_MIME_TYPES.includes(String(mimetype || '').toLowerCase()) || hasAllowedExtension;
}

function splitDelimited(content, delimiter) {
  const lines = String(content)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error('Dataset file must contain a header row and at least one data row.');
  }

  const headerLine = lines[0];
  const delimiterRegex = new RegExp(`${delimiter}(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)`);
  const headers = headerLine
    .split(delimiterRegex)
    .map((header) => header.replace(/^"|"$/g, '').trim());

  const rows = lines.slice(1).map((line) => {
    const values = line
      .split(delimiterRegex)
      .map((value) => value.replace(/^"|"$/g, '').trim());

    return headers.reduce((row, header, index) => {
      row[header] = values[index] ?? null;
      return row;
    }, {});
  });

  return {
    headers,
    rows,
    lineCount: lines.length,
    columnCount: headers.length,
  };
}

function parseCsv(content) {
  return splitDelimited(content, ',');
}

function parseTsv(content) {
  return splitDelimited(content, '\t');
}

function parseText(content) {
  const trimmed = String(content).trim();
  if (trimmed.includes('\t')) {
    return parseTsv(trimmed);
  }
  return parseCsv(trimmed);
}

function parseVcf(content) {
  const lines = String(content)
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  const headerLine = lines.find((line) => line.startsWith('#CHROM') || line.startsWith('#chrom'));
  if (!headerLine) {
    throw new Error('Invalid VCF file: missing #CHROM header line.');
  }

  const headers = headerLine.replace(/^#/, '').split('\t').map((header) => header.trim());
  const dataLines = lines.filter((line) => !line.startsWith('#'));

  if (dataLines.length === 0) {
    throw new Error('VCF file must contain at least one variant record.');
  }

  const rows = dataLines.map((line) => {
    const values = line.split('\t');
    return headers.reduce((row, header, index) => {
      row[header] = values[index] ?? null;
      return row;
    }, {});
  });

  return {
    headers,
    rows,
    lineCount: dataLines.length,
    columnCount: headers.length,
  };
}

function parseFastq(content) {
  const lines = String(content)
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length % 4 !== 0) {
    throw new Error('FASTQ file must contain records with exactly 4 lines each.');
  }

  const rows = [];
  for (let i = 0; i < lines.length; i += 4) {
    const idLine = lines[i];
    const sequence = lines[i + 1] ?? '';
    const plusLine = lines[i + 2] ?? '';
    const quality = lines[i + 3] ?? '';

    if (!idLine.startsWith('@') || !plusLine.startsWith('+')) {
      throw new Error('Invalid FASTQ record structure.');
    }

    rows.push({
      id: idLine.slice(1).trim(),
      sequence: sequence.trim(),
      quality: quality.trim(),
    });
  }

  return {
    headers: ['id', 'sequence', 'quality'],
    rows,
    lineCount: rows.length,
    columnCount: 3,
  };
}

function parseExcel(buffer) {
  if (!xlsx) {
    throw new Error('Excel file parsing requires the xlsx package. Please run: npm install xlsx');
  }

  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('Excel file contains no worksheet data.');
  }

  const worksheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(worksheet, { defval: null });
  const headers = rows.length > 0
    ? Object.keys(rows[0])
    : (xlsx.utils.sheet_to_json(worksheet, { header: 1 })[0] || []);

  if (!headers || headers.length === 0) {
    throw new Error('Excel file must contain column headers.');
  }

  return {
    headers,
    rows,
    lineCount: rows.length,
    columnCount: headers.length,
  };
}

function parseDatasetFile(fileType, buffer, content) {
  switch (fileType) {
    case 'csv':
      return parseCsv(content);
    case 'tsv':
      return parseTsv(content);
    case 'txt':
      return parseText(content);
    case 'vcf':
      return parseVcf(content);
    case 'fastq':
      return parseFastq(content);
    default:
      throw new Error('Unsupported dataset file type.');
  }
}

module.exports = {
  detectDatasetFileType,
  isAllowedDatasetFile,
  parseDatasetFile,
  ALLOWED_EXTENSIONS,
};
