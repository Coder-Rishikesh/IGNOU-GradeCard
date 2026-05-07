import { BCA_COURSE_TO_SEM, PROGRAM_TYPE_MAP, BCA_NEW_COURSE_TO_SEM, MCA_NEW_COURSE_TO_SEM } from './programtype.js';
import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function detectType(prog) {
  if (!prog) return 4;
  const upper = String(prog).toUpperCase();
  if (PROGRAM_TYPE_MAP[upper]) return PROGRAM_TYPE_MAP[upper];
  // Fallback heuristics
  if (['BCA','MCA','PGDCA','MBA'].some(p => upper.startsWith(p))) return 1;
  if (['BDP','BA','BCOM','BSC'].some(p => upper === p)) return 2;
  if (upper.endsWith('G') || upper.startsWith('BAG') || upper.startsWith('BCO')) return 3;
  return 4;
}

function romanToInt(roman) {
  if (!roman) return null;
  const s = String(roman).toUpperCase().replace(/[^IVXLCDM]/g, '');
  if (!s) return null;
  const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const curr = map[s[i]];
    const next = map[s[i + 1]];
    if (!curr) return null;
    if (next && next > curr) total -= curr;
    else total += curr;
  }
  return total || null;
}

function normalizeSectionLabel(raw) {
  if (!raw) return null;
  const text = String(raw).replace(/\s+/g, ' ').trim();
  if (!text) return null;

  const semesterMatch = text.match(/SEMESTER\s*[-:]*\s*(\d{1,2}|[IVXLCDM]{1,6})/i);
  if (semesterMatch) {
    const n = /^\d+$/.test(semesterMatch[1]) ? parseInt(semesterMatch[1], 10) : romanToInt(semesterMatch[1]);
    if (n) return `Semester ${n}`;
  }

  const yearMatch = text.match(/YEAR\s*[-:]*\s*(\d{1,2}|[IVXLCDM]{1,6})/i);
  if (yearMatch) {
    const n = /^\d+$/.test(yearMatch[1]) ? parseInt(yearMatch[1], 10) : romanToInt(yearMatch[1]);
    if (n) return `Year ${n}`;
  }

  const termMatch = text.match(/TERM\s*[-:]*\s*(\d{1,2}|[IVXLCDM]{1,6})/i);
  if (termMatch) {
    const n = /^\d+$/.test(termMatch[1]) ? parseInt(termMatch[1], 10) : romanToInt(termMatch[1]);
    if (n) return `Term ${n}`;
  }

  return null;
}

function extractSectionLabelForTable($, table) {
  const captionText = $(table).find('caption').first().text().trim();
  const capLabel = normalizeSectionLabel(captionText);
  if (capLabel) return capLabel;

  const labelSignal = /(SEMESTER|YEAR|TERM)/i;
  const ignoreIfOnly = /(ENROLMENT|ENROLLMENT|ENROL|NAME|PROGRAMME|PROGRAM|GRADE\s*CARD|COURSE|ASSIGNMENT|TERM\s*END|STATUS)/i;

  const scanPrev = ($el) => {
    const prevs = $el.prevAll();
    const limit = Math.min(prevs.length, 15);
    for (let i = 0; i < limit; i++) {
      const p = prevs.eq(i);
      if (p.is('table')) continue;
      const raw = p.text().replace(/\s+/g, ' ').trim();
      if (!raw) continue;
      if (ignoreIfOnly.test(raw) && !labelSignal.test(raw)) continue;
      if (!labelSignal.test(raw)) continue;
      const label = normalizeSectionLabel(raw);
      if (label) return label;
    }
    return null;
  };

  let current = $(table);
  for (let depth = 0; depth < 6; depth++) {
    const found = scanPrev(current);
    if (found) return found;
    current = current.parent();
    if (!current || !current.length) break;
  }

  return null;
}

function normalizeCourseCode(courseCode) {
  if (!courseCode) return '';
  return String(courseCode).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Generic course -> semester resolver.
 * Checks program-specific mappings (BCA, BCA_NEW, MCA_NEW) and falls back to prefix heuristics.
 */
function inferCourseTerm(programCode, courseCode) {
  if (!programCode || !courseCode) return null;
  const prog = String(programCode).trim().toUpperCase();
  const cc = normalizeCourseCode(courseCode);

  // Exact program mappings
  if (prog === 'BCA' || prog.startsWith('BCA ')) {
    const sem = BCA_COURSE_TO_SEM[cc] || BCA_NEW_COURSE_TO_SEM[cc];
    if (sem) return `Semester ${sem}`;
  }

  if (prog === 'BCA_NEW' || prog.startsWith('BCA_NEW') || prog === 'BCA-NEW') {
    const sem = BCA_NEW_COURSE_TO_SEM[cc] || BCA_COURSE_TO_SEM[cc];
    if (sem) return `Semester ${sem}`;
  }

  if (prog === 'MCA_NEW' || prog.startsWith('MCA_NEW') || prog === 'MCA-NEW') {
    const sem = MCA_NEW_COURSE_TO_SEM[cc];
    if (sem) return `Semester ${sem}`;
  }

  // Some IGNOU program codes might be just 'MCA' but correspond to MCA_NEW structure
  if (prog === 'MCA') {
    const sem = MCA_NEW_COURSE_TO_SEM[cc];
    if (sem) return `Semester ${sem}`;
  }

  // Generic fallback: check all mappings
  const semAll = BCA_COURSE_TO_SEM[cc] || BCA_NEW_COURSE_TO_SEM[cc] || MCA_NEW_COURSE_TO_SEM[cc];
  if (semAll) return `Semester ${semAll}`;

  return null;
}

// ─── Parse the grade card HTML ────────────────────────────────────────────────
function parseGradeCard($, eno, prog) {
  let enrollmentNo = eno;
  let studentName = 'Unknown';
  let programCode = (prog || '').toUpperCase();

  // Extract student info from the top metadata table.
  $('td').each((i, el) => {
    const text = $(el).text().trim();
    const nextText = $(el).next('td').text().trim();
    if (text === 'Enrolment No:' || text === 'Enrolment No') enrollmentNo = nextText || eno;
    if (text === 'Name:' || text === 'Name') studentName = nextText || studentName;
    if (text === 'Programme Code:' || text === 'Programme Code') programCode = nextText || programCode;
  });

  const courses = [];

  // Find the course data table by looking for a COURSE column header.
  $('table').each((tableIdx, table) => {
    const firstRow = $(table).find('tr').first();
    const headerCells = firstRow.find('td, th').map((i, el) => $(el).text().trim().toUpperCase()).get();

    const courseIdx = headerCells.findIndex(h => h === 'COURSE');
    if (courseIdx === -1) return;

    const sectionLabel = extractSectionLabelForTable($, table);

    // Map header names to column indexes dynamically
    const colMap = {};
    headerCells.forEach((h, i) => { colMap[h] = i; });

    $(table).find('tr').each((rowIdx, row) => {
      if (rowIdx === 0) return; // skip header row

      const cols = $(row).find('td');
      if (cols.length < 1) return;

      const parseVal = (idx) => {
        if (idx === undefined || idx >= cols.length) return null;
        const v = $(cols[idx]).text().trim();
        if (!v || v === '-' || v.toUpperCase() === 'N/A' || v === '*') return null;
        const n = parseFloat(v);
        return isNaN(n) ? null : n;
      };

      const courseCode = $(cols[colMap['COURSE'] ?? 0]).text().trim();
      if (!courseCode || courseCode.toUpperCase() === 'COURSE') return;

      const asgn = parseVal(colMap['ASGN1'] ?? colMap['ASSIGNMENT'] ?? 1);
      const lab1 = parseVal(colMap['LAB1'] ?? 2);
      const lab2 = parseVal(colMap['LAB2'] ?? 3);
      const lab3 = parseVal(colMap['LAB3'] ?? 4);
      const lab4 = parseVal(colMap['LAB4'] ?? 5);

      const teeIdx = colMap['TERM END THEORY'] ?? colMap['TERMEND THEORY'] ?? 6;
      const tepIdx = colMap['TERM END PRACTICAL'] ?? colMap['TERMEND PRACTICAL'] ?? 7;
      const statusIdx = colMap['STATUS'] ?? (cols.length - 1);

      const teeTheory = parseVal(teeIdx);
      const teePractical = parseVal(tepIdx);
      const status = $(cols[statusIdx]).text().trim();

      const inferredTerm = inferCourseTerm(programCode, courseCode);

      courses.push({
        courseCode,
        assignmentMarks: asgn,
        lab1, lab2, lab3, lab4,
        teeTheory,
        teePractical,
        term: sectionLabel || inferredTerm,
        status: status || 'UNKNOWN'
      });
    });
  });

  return { enrollmentNo, studentName, programCode, courses };
}

// ─── API route ────────────────────────────────────────────────────────────────
app.get('/api/gradecard', async (req, res) => {
  const { eno, prog } = req.query;
  let { type } = req.query;

  if (!eno || !prog) {
    return res.status(400).json({
      error: 'Missing required parameters.',
      details: 'Please provide: eno (enrollment number) and prog (programme code).'
    });
  }

  // Auto-detect type if not provided
  if (!type) type = detectType(prog);

  const url = `https://gradecard.ignou.ac.in/gradecard/view_gradecard.aspx?eno=${encodeURIComponent(eno)}&prog=${encodeURIComponent(prog.toUpperCase())}&type=${type}`;

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://gradecard.ignou.ac.in/gradecard/',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      timeout: 20000
    });

    const $ = cheerio.load(response.data);
    const data = parseGradeCard($, eno, prog);

    if (!data || !Array.isArray(data.courses) || data.courses.length === 0) {
      // Try other types automatically
      const triedTypes = [parseInt(type)];
      for (let t = 1; t <= 4; t++) {
        if (triedTypes.includes(t)) continue;
        const altUrl = `https://gradecard.ignou.ac.in/gradecard/view_gradecard.aspx?eno=${encodeURIComponent(eno)}&prog=${encodeURIComponent(prog.toUpperCase())}&type=${t}`;
        try {
          const altResp = await axios.get(altUrl, { headers: response.config.headers, timeout: 10000 });
          const $alt = cheerio.load(altResp.data);
          const altData = parseGradeCard($alt, eno, prog);
          if (altData && Array.isArray(altData.courses) && altData.courses.length > 0) {
            return res.json({ ...altData, detectedType: t });
          }
        } catch (_) {}
      }

      return res.status(404).json({
        error: 'No grade card data found.',
        details: 'Check your enrollment number and programme code, or try a different programme type.'
      });
    }

    res.json({ ...data, detectedType: parseInt(type) });

  } catch (err) {
    console.error('Fetch error:', err && err.message ? err.message : err);
    if (err && err.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'Request timed out. IGNOU server is slow. Try again.' });
    }
    res.status(502).json({
      error: 'Failed to reach IGNOU servers.',
      details: err && err.message ? err.message : String(err)
    });
  }
});

// ─── Serve frontend for all other routes ─────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🎓 IGNOU Grade Card Calculator`);
  console.log(`   Running at: http://localhost:${PORT}\n`);
});