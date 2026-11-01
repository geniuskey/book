const fallbackExperiments = {
  chipindustrybook: 'chapters/business.html#sim-bm-map',
  colorbook: 'chapters/colorimetry.html#sim-match',
  etchbook: 'chapters/ale.html#sim-cyc',
  moneybook: 'chapters/behavior.html#sim-value',
  stockbook: 'chapters/backtest.html#sim-engine',
};

export function simulatorUrlFor(book, discovery) {
  // Compact discovery entries encode book, chapter and anchor in their ID.
  const entry = discovery.experiments.find(item =>
    (item.bookId || item.id?.split('/')[0]) === book.id);
  if (entry?.url) return entry.url;

  let link = entry?.link;
  if (!link && entry?.id) {
    const [, chapter, ...anchor] = entry.id.split('/');
    if (chapter && anchor.length) link = `chapters/${chapter}.html#${anchor.join('/')}`;
  }
  link ||= fallbackExperiments[book.id];
  if (!link) return undefined;
  return new URL(link, `${book.url.replace(/\/$/, '')}/`).href;
}
