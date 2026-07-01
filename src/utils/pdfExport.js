import { jsPDF } from 'jspdf';

const A1_WIDTH = 594;
const A1_HEIGHT = 841;

const SPANISH_COLOR = [30, 100, 140];
const ENGLISH_COLOR = [45, 110, 55];
const TITLE_COLOR = [20, 20, 30];
const META_COLOR = [80, 80, 90];

const BASE_CONFIG = {
  marginX: 40,
  marginTop: 50,
  marginBottom: 40,
  gutter: 24,
  continuationTop: 36,
  titleSize: 36,
  artistSize: 22,
  albumSize: 16,
  legendSize: 12,
  spanishSize: 18,
  englishSize: 14,
  pairGap: 4,
  blockGap: 10,
};

function sanitizeFilename(str) {
  return str.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').slice(0, 80);
}

function scaledConfig(scale) {
  const s = Math.max(0.72, Math.min(1, scale));
  return {
    ...BASE_CONFIG,
    marginTop: BASE_CONFIG.marginTop * (0.88 + 0.12 * s),
    marginBottom: Math.max(28, BASE_CONFIG.marginBottom * (0.85 + 0.15 * s)),
    titleSize: BASE_CONFIG.titleSize * (0.9 + 0.1 * s),
    artistSize: BASE_CONFIG.artistSize * s,
    albumSize: BASE_CONFIG.albumSize * s,
    legendSize: Math.max(9, BASE_CONFIG.legendSize * s),
    spanishSize: BASE_CONFIG.spanishSize * s,
    englishSize: BASE_CONFIG.englishSize * s,
    pairGap: Math.max(2, BASE_CONFIG.pairGap * s),
    blockGap: Math.max(4, BASE_CONFIG.blockGap * s),
  };
}

function pageBottom(config) {
  return A1_HEIGHT - config.marginBottom;
}

function columnWidth(config) {
  const contentWidth = A1_WIDTH - config.marginX * 2;
  return (contentWidth - config.gutter) / 2;
}

function measureBlock(doc, pair, colWidth, config) {
  const { spanishSize, englishSize, pairGap, blockGap } = config;

  doc.setFontSize(spanishSize);
  const spanishLines = doc.splitTextToSize(pair.spanish, colWidth);
  doc.setFontSize(englishSize);
  const englishLines = doc.splitTextToSize(`(${pair.english})`, colWidth - 5);

  const spanishLineHeight = spanishSize * 0.45;
  const englishLineHeight = englishSize * 0.45;

  const height =
    spanishLines.length * spanishLineHeight +
    pairGap +
    englishLines.length * englishLineHeight +
    blockGap;

  return { spanishLines, englishLines, height, spanishLineHeight, englishLineHeight, pairGap, blockGap };
}

function measureHeaderEndY(doc, title, artist, album, config) {
  const contentWidth = A1_WIDTH - config.marginX * 2;
  let y = config.marginTop;

  doc.setFontSize(config.titleSize);
  const titleLines = doc.splitTextToSize(title, contentWidth);
  y += titleLines.length * (config.titleSize * 0.39);

  y += 4;
  y += config.artistSize * 0.45 + 10;

  if (album) {
    y += config.albumSize * 0.45 + 8;
  }

  y += 12 + 16; // divider spacing
  y += 14; // legend

  return y;
}

function simulateLyricsLayout(doc, pairs, config, lyricsStartY) {
  const bottom = pageBottom(config);
  const colWidth = columnWidth(config);
  const columns = [{ y: lyricsStartY }, { y: lyricsStartY }];
  let colIndex = 0;
  let pageCount = 1;
  let blocksOnLastPage = 0;
  let lastPageTop = lyricsStartY;
  let lastPageMaxY = lyricsStartY;

  pairs.forEach((pair) => {
    const block = measureBlock(doc, pair, colWidth, config);

    while (columns[colIndex].y + block.height > bottom) {
      if (colIndex === 0) {
        colIndex = 1;
      } else {
        pageCount += 1;
        blocksOnLastPage = 0;
        lastPageTop = config.continuationTop;
        columns[0].y = config.continuationTop;
        columns[1].y = config.continuationTop;
        colIndex = 0;
      }
    }

    columns[colIndex].y += block.height;
    blocksOnLastPage += 1;
    lastPageMaxY = Math.max(columns[0].y, columns[1].y);
  });

  const lastPageAvailable = bottom - lastPageTop;
  const lastPageUsed = lastPageMaxY - lastPageTop;
  const lastPageUsedRatio = lastPageAvailable > 0 ? lastPageUsed / lastPageAvailable : 1;

  return { pageCount, blocksOnLastPage, lastPageUsedRatio };
}

function isSmallOverflow(layout) {
  if (layout.pageCount !== 2) return false;
  return layout.blocksOnLastPage <= 5 || layout.lastPageUsedRatio < 0.28;
}

function chooseConfig(doc, title, artist, album, pairs) {
  const defaultConfig = scaledConfig(1);
  const lyricsStartY = measureHeaderEndY(doc, title, artist, album, defaultConfig);
  const defaultLayout = simulateLyricsLayout(doc, pairs, defaultConfig, lyricsStartY);

  if (!isSmallOverflow(defaultLayout)) {
    return defaultConfig;
  }

  // Binary search for the lightest compression that fits on one page
  let lo = 0.72;
  let hi = 1.0;
  let best = defaultConfig;

  for (let i = 0; i < 12; i += 1) {
    const mid = (lo + hi) / 2;
    const config = scaledConfig(mid);
    const startY = measureHeaderEndY(doc, title, artist, album, config);
    const layout = simulateLyricsLayout(doc, pairs, config, startY);

    if (layout.pageCount === 1) {
      best = config;
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return best;
}

function drawBlock(doc, block, x, startY, config) {
  let y = startY;
  const { spanishSize, englishSize, pairGap } = config;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(spanishSize);
  doc.setTextColor(...SPANISH_COLOR);
  block.spanishLines.forEach((line) => {
    doc.text(line, x, y);
    y += block.spanishLineHeight;
  });

  y += pairGap;
  doc.setFontSize(englishSize);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...ENGLISH_COLOR);
  block.englishLines.forEach((line) => {
    doc.text(line, x + 2, y);
    y += block.englishLineHeight;
  });
  doc.setFont('helvetica', 'normal');

  return startY + block.height;
}

function renderPdf(doc, { title, artist, album, pairs }, config) {
  const marginX = config.marginX;
  const contentWidth = A1_WIDTH - marginX * 2;
  const colWidth = columnWidth(config);
  const leftX = marginX;
  const rightX = marginX + colWidth + config.gutter;
  const bottom = pageBottom(config);
  let y = config.marginTop;

  const addPage = () => {
    doc.addPage([A1_WIDTH, A1_HEIGHT]);
    return config.continuationTop;
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(config.titleSize);
  doc.setTextColor(...TITLE_COLOR);
  const titleLines = doc.splitTextToSize(title, contentWidth);
  const titleLineHeight = config.titleSize * 0.39;
  titleLines.forEach((line) => {
    if (y + titleLineHeight > bottom) y = addPage();
    doc.text(line, marginX, y);
    y += titleLineHeight;
  });

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(config.artistSize);
  doc.setTextColor(...SPANISH_COLOR);
  doc.text(artist, marginX, y);
  y += config.artistSize * 0.45 + 10;

  if (album) {
    doc.setFontSize(config.albumSize);
    doc.setTextColor(...META_COLOR);
    doc.text(album, marginX, y);
    y += config.albumSize * 0.45 + 8;
  }

  y += 12;
  doc.setDrawColor(200, 200, 200);
  doc.line(marginX, y, A1_WIDTH - marginX, y);
  y += 16;

  doc.setFontSize(config.legendSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...SPANISH_COLOR);
  doc.text('ESPAÑOL', leftX, y);
  doc.setTextColor(...ENGLISH_COLOR);
  doc.text('ENGLISH', leftX + 70, y);
  doc.text('ESPAÑOL', rightX, y);
  doc.setTextColor(...ENGLISH_COLOR);
  doc.text('ENGLISH', rightX + 70, y);
  y += 14;

  const lyricsStartY = y;
  const columns = [
    { x: leftX, y: lyricsStartY },
    { x: rightX, y: lyricsStartY },
  ];
  let colIndex = 0;
  let dividerStartY = lyricsStartY;

  const startNewPage = () => {
    if (dividerStartY < bottom - 10) {
      doc.setDrawColor(220, 220, 220);
      const dividerX = marginX + colWidth + config.gutter / 2;
      doc.line(dividerX, dividerStartY, dividerX, bottom);
    }

    const newY = addPage();
    columns[0].y = newY;
    columns[1].y = newY;
    colIndex = 0;
    dividerStartY = newY;
  };

  pairs.forEach((pair) => {
    const block = measureBlock(doc, pair, colWidth, config);

    while (columns[colIndex].y + block.height > bottom) {
      if (colIndex === 0) {
        colIndex = 1;
      } else {
        startNewPage();
      }
    }

    const col = columns[colIndex];
    col.y = drawBlock(doc, block, col.x, col.y, config);
  });

  doc.setDrawColor(220, 220, 220);
  const dividerX = marginX + colWidth + config.gutter / 2;
  doc.line(dividerX, dividerStartY, dividerX, bottom);
}

function addPageFooters(doc, config) {
  const totalPages = doc.internal.getNumberOfPages();
  const footerY = A1_HEIGHT - 20;
  const marginX = config.marginX;

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...META_COLOR);

    doc.text(`Page ${page} of ${totalPages}`, A1_WIDTH / 2, footerY, { align: 'center' });

    if (page === totalPages) {
      doc.text(
        `Exported from Lyrica — ${new Date().toLocaleDateString()}`,
        marginX,
        footerY
      );
    }
  }
}

export function exportLyricsPdf({ title, artist, album, pairs }) {
  const probe = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [A1_WIDTH, A1_HEIGHT],
  });

  const config = chooseConfig(probe, title, artist, album, pairs);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [A1_WIDTH, A1_HEIGHT],
  });

  renderPdf(doc, { title, artist, album, pairs }, config);
  addPageFooters(doc, config);

  const filename = `${sanitizeFilename(title)}_${sanitizeFilename(artist)}_lyrics.pdf`;
  doc.save(filename);
}
