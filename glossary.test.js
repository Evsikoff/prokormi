import assert from 'node:assert/strict';
import test from 'node:test';
import { GLOSSARY_TERMS, GLOSSARY_TOPICS, glossaryLetterGroups, glossaryTerm, glossaryTerms } from './glossary.js';

test('every term has a unique id, a known topic and filled texts', () => {
  const ids = new Set();
  for (const term of GLOSSARY_TERMS) {
    assert.ok(!ids.has(term.id), `повтор id ${term.id}`);
    ids.add(term.id);
    assert.ok(GLOSSARY_TOPICS.some((topic) => topic.key === term.topic), `${term.id}: неизвестная тема`);
    assert.ok(term.term && term.definition && term.example, `${term.id}: пустой текст`);
  }
});

test('«Смотри также» links lead to other existing terms', () => {
  for (const term of GLOSSARY_TERMS) {
    for (const id of term.related) {
      assert.ok(glossaryTerm(id), `${term.id} → ${id}: нет такого термина`);
      assert.notEqual(id, term.id, `${term.id} ссылается сам на себя`);
    }
  }
});

test('every topic has terms, and letter groups keep the alphabetical order', () => {
  for (const topic of GLOSSARY_TOPICS) assert.ok(glossaryTerms(topic.key).length > 0, `${topic.title}: пусто`);
  const letters = glossaryLetterGroups(glossaryTerms()).map((group) => group.letter);
  assert.equal(new Set(letters).size, letters.length);
  assert.deepEqual(letters, [...letters].sort((left, right) => left.localeCompare(right, 'ru')));
});
