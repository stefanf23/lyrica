/**
 * Converts markdown docs in docs/ to PDF files in the project root.
 * Run: node scripts/generate-docs-pdf.js
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { jsPDF } from 'jspdf';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const docsDir = join(root, 'docs');

const DOC_MAP = [
  { md: 'Lyrica-Overview.md', pdf: 'Lyrica-Overview.pdf', title: 'Lyrica — High-Level Overview' },
  { md: 'Lyrica-Technical.md', pdf: 'Lyrica-Technical.pdf', title: 'Lyrica — Technical Documentation' },
  { md: 'Lyrica-User-Guide.md', pdf: 'Lyrica-User-Guide.pdf', title: 'Lyrica — User Guide' },
];

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_LEFT = 18;
const MARGIN_RIGHT = 18;
const MARGIN_TOP = 22;
const MARGIN_BOTTOM = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const LINE_HEIGHT_BODY = 5.2;
const LINE_HEIGHT_H1 = 10;
const LINE_HEIGHT_H2 = 8;
const LINE_HEIGHT_H3 = 6.5;

/** jsPDF standard fonts only support WinAnsi/Latin-1; Unicode chars render as &/% garbage. */
function sanitizeForPdf(text) {
  const replacements = {
    '\u2192': '->',
    '\u2190': '<-',
    '\u2193': 'v',
    '\u2191': '^',
    '\u2014': '-',
    '\u2013': '-',
    '\u2022': '*',
    '\u2500': '-',
    '\u2501': '-',
    '\u2502': '|',
    '\u2503': '|',
    '\u250C': '+',
    '\u2510': '+',
    '\u2514': '+',
    '\u2518': '+',
    '\u251C': '+',
    '\u2524': '+',
    '\u252C': '+',
    '\u2534': '+',
    '\u253C': '+',
    '\u2550': '=',
    '\u2551': '|',
    '\u25BC': 'v',
    '\u25B2': '^',
    '\u2713': 'OK',
  };

  let out = '';
  for (const ch of text) {
    if (replacements[ch]) {
      out += replacements[ch];
    } else if (ch.charCodeAt(0) <= 127) {
      out += ch;
    } else {
      out += '?';
    }
  }
  return out;
}

function pdfText(doc, text, maxWidth) {
  return doc.splitTextToSize(sanitizeForPdf(text), maxWidth);
}

function stripMarkdownInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .trim();
}

function parseBlocks(markdown) {
  const lines = markdown.split(/\r?\n/);
  const blocks = [];
  let i = 0;
  let inCode = false;
  let codeLines = [];

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCode) {
        blocks.push({ type: 'code', text: codeLines.join('\n') });
        codeLines = [];
        inCode = false;
      } else {
        inCode = true;
      }
      i++;
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      i++;
      continue;
    }

    if (line.trim() === '---') {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    if (line.startsWith('# ')) {
      blocks.push({ type: 'h1', text: stripMarkdownInline(line.slice(2)) });
      i++;
      continue;
    }

    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', text: stripMarkdownInline(line.slice(3)) });
      i++;
      continue;
    }

    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', text: stripMarkdownInline(line.slice(4)) });
      i++;
      continue;
    }

    if (line.startsWith('|') && line.includes('|')) {
      const tableRows = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        const row = lines[i]
          .split('|')
          .slice(1, -1)
          .map((c) => stripMarkdownInline(c.trim()));
        if (!row.every((c) => /^[-:]+$/.test(c))) {
          tableRows.push(row);
        }
        i++;
      }
      if (tableRows.length) blocks.push({ type: 'table', rows: tableRows });
      continue;
    }

    if (/^[-*] /.test(line.trim())) {
      const items = [];
      while (i < lines.length && /^[-*] /.test(lines[i].trim())) {
        items.push(stripMarkdownInline(lines[i].trim().replace(/^[-*] /, '')));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    if (/^\d+\. /.test(line.trim())) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i].trim())) {
        items.push(stripMarkdownInline(lines[i].trim().replace(/^\d+\. /, '')));
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    if (line.trim() === '') {
      blocks.push({ type: 'space', size: 3 });
      i++;
      continue;
    }

    blocks.push({ type: 'p', text: stripMarkdownInline(line) });
    i++;
  }

  return blocks;
}

function createDoc(blocks, docTitle) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = MARGIN_TOP;
  const pageBottom = PAGE_HEIGHT - MARGIN_BOTTOM;
  let pageNum = 1;

  const addFooter = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(String(pageNum), PAGE_WIDTH / 2, PAGE_HEIGHT - 10, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  };

  const newPage = () => {
    addFooter();
    doc.addPage();
    pageNum++;
    y = MARGIN_TOP;
  };

  const ensureSpace = (needed) => {
    if (y + needed > pageBottom) newPage();
  };

  for (const block of blocks) {
    switch (block.type) {
      case 'h1': {
        ensureSpace(LINE_HEIGHT_H1 + 4);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(20, 60, 90);
        const h1Lines = pdfText(doc, block.text, CONTENT_WIDTH);
        h1Lines.forEach((ln) => {
          ensureSpace(LINE_HEIGHT_H1);
          doc.text(ln, MARGIN_LEFT, y);
          y += LINE_HEIGHT_H1;
        });
        y += 3;
        doc.setTextColor(0, 0, 0);
        break;
      }
      case 'h2': {
        ensureSpace(LINE_HEIGHT_H2 + 3);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(30, 90, 120);
        const h2Lines = pdfText(doc, block.text, CONTENT_WIDTH);
        h2Lines.forEach((ln) => {
          ensureSpace(LINE_HEIGHT_H2);
          doc.text(ln, MARGIN_LEFT, y);
          y += LINE_HEIGHT_H2;
        });
        y += 2;
        doc.setTextColor(0, 0, 0);
        break;
      }
      case 'h3': {
        ensureSpace(LINE_HEIGHT_H3 + 2);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        const h3Lines = pdfText(doc, block.text, CONTENT_WIDTH);
        h3Lines.forEach((ln) => {
          ensureSpace(LINE_HEIGHT_H3);
          doc.text(ln, MARGIN_LEFT, y);
          y += LINE_HEIGHT_H3;
        });
        y += 1.5;
        break;
      }
      case 'p': {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const pLines = pdfText(doc, block.text, CONTENT_WIDTH);
        pLines.forEach((ln) => {
          ensureSpace(LINE_HEIGHT_BODY);
          doc.text(ln, MARGIN_LEFT, y);
          y += LINE_HEIGHT_BODY;
        });
        break;
      }
      case 'ul':
      case 'ol': {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        block.items.forEach((item, idx) => {
          const prefix = block.type === 'ol' ? `${idx + 1}. ` : '• ';
          const itemLines = pdfText(doc, prefix + item, CONTENT_WIDTH - 4);
          itemLines.forEach((ln, lineIdx) => {
            ensureSpace(LINE_HEIGHT_BODY);
            doc.text(ln, MARGIN_LEFT + (lineIdx === 0 ? 0 : 4), y);
            y += LINE_HEIGHT_BODY;
          });
        });
        y += 1;
        break;
      }
      case 'code': {
        doc.setFont('courier', 'normal');
        doc.setFontSize(7);
        doc.setFillColor(245, 245, 248);
        const lines = sanitizeForPdf(block.text).split('\n');
        const lineHeight = 3.8;
        const boxHeight = lines.length * lineHeight + 6;
        ensureSpace(boxHeight + 2);
        doc.rect(MARGIN_LEFT, y - 3, CONTENT_WIDTH, boxHeight, 'F');
        doc.setTextColor(40, 40, 50);
        lines.forEach((ln) => {
          ensureSpace(lineHeight);
          doc.text(ln, MARGIN_LEFT + 3, y + 1);
          y += lineHeight;
        });
        y += 4;
        doc.setTextColor(0, 0, 0);
        break;
      }
      case 'table': {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const colCount = Math.max(...block.rows.map((r) => r.length));
        const colWidth = CONTENT_WIDTH / colCount;

        block.rows.forEach((row, rowIdx) => {
          ensureSpace(6);
          if (rowIdx === 0) {
            doc.setFont('helvetica', 'bold');
            doc.setFillColor(230, 240, 248);
            doc.rect(MARGIN_LEFT, y - 4, CONTENT_WIDTH, 6, 'F');
          } else {
            doc.setFont('helvetica', 'normal');
          }
          row.forEach((cell, colIdx) => {
            const cellLines = pdfText(doc, cell, colWidth - 2);
            doc.text(cellLines[0] || '', MARGIN_LEFT + colIdx * colWidth + 1, y);
          });
          y += 6;
        });
        y += 2;
        break;
      }
      case 'hr': {
        ensureSpace(5);
        doc.setDrawColor(200, 200, 200);
        doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);
        y += 5;
        break;
      }
      case 'space': {
        y += block.size;
        break;
      }
      default:
        break;
    }
  }

  addFooter();
  return doc;
}

console.log('Generating Lyrica documentation PDFs...\n');

for (const { md, pdf, title } of DOC_MAP) {
  const mdPath = join(docsDir, md);
  const pdfPath = join(root, pdf);
  const markdown = readFileSync(mdPath, 'utf-8');
  const blocks = parseBlocks(markdown);
  const doc = createDoc(blocks, title);
  const pdfOutput = doc.output('arraybuffer');
  writeFileSync(pdfPath, Buffer.from(pdfOutput));
  console.log(`  ✓ ${pdf}`);
}

console.log('\nDone. PDF files saved in the project root folder.');
