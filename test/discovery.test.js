import test from 'node:test';
import assert from 'node:assert/strict';
import { simulatorUrlFor } from './browser/discovery.js';

const book = { id: 'devicebook', url: 'https://semi.euiyun.com/device/' };

test('compact discovery resolves the matching book under its published path', () => {
  const discovery = { schemaVersion: 2, experiments: [
    { id: 'digitalbook/overview/sim-chain' },
    { id: 'devicebook/bjt/sim-anim' },
  ] };
  for (const url of [book.url, book.url.slice(0, -1)]) {
    assert.equal(simulatorUrlFor({ ...book, url }, discovery),
      'https://semi.euiyun.com/device/chapters/bjt.html#sim-anim');
  }
});

test('compact discovery respects explicit link overrides', () => {
  assert.equal(simulatorUrlFor(book, { experiments: [
    { id: 'devicebook/bjt/sim-anim', link: 'lab.html#custom' },
  ] }), 'https://semi.euiyun.com/device/lab.html#custom');
});

test('expanded discovery retains its explicit simulator URL', () => {
  const url = 'https://devicebook.euiyun.com/chapters/pn.html#sim-join';
  assert.equal(simulatorUrlFor(book, { experiments: [{ bookId: book.id, url }] }), url);
});

test('fallback links preserve a consolidated book path', () => {
  assert.equal(simulatorUrlFor({ id: 'etchbook', url: 'https://semi.euiyun.com/etch/' },
    { experiments: [] }), 'https://semi.euiyun.com/etch/chapters/ale.html#sim-cyc');
});

test('a missing experiment remains a missing URL so the smoke test fails', () => {
  assert.equal(simulatorUrlFor(book, { experiments: [] }), undefined);
});
