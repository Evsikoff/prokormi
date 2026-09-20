// Syncs the Supabase table `monster_data_mart` with monster_data_mart_rows.json.
//   npm run data:pull            downloads the table into the file
//   npm run data:push            uploads the file into the table: adds new rows, updates changed ones
//   npm run data:push -- --dry-run   only prints what push would change
//   npm run data:push -- --delete    also deletes table rows that are missing from the file
// Settings live in .env.local (see .env.example).

import { existsSync } from 'node:fs';
import { readFile, rename, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual, parseArgs } from 'node:util';

const TABLE = 'monster_data_mart';
const KEY = 'id'; // primary key: pull sorts by it, push matches file rows with table rows by it
const PAGE_SIZE = 1000; // Supabase returns at most 1000 rows per request by default
const DATA_FILE = fileURLToPath(new URL('../monster_data_mart_rows.json', import.meta.url));
const ENV_FILE = fileURLToPath(new URL('../.env.local', import.meta.url));
const USAGE = 'Использование: node scripts/data-mart.js pull | push [--dry-run] [--delete]';

function loadConfig() {
  if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);

  const url = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
  const key = (process.env.SUPABASE_KEY || '').trim();
  if (!url || !key) {
    throw new Error('Не заданы SUPABASE_URL и SUPABASE_KEY. Скопируй .env.example в .env.local и заполни оба значения.');
  }
  return { url, key };
}

function requestHeaders(key, accept = 'application/json') {
  const headers = { apikey: key, Accept: accept };
  // Legacy anon/service_role keys are JWTs and also go into Authorization;
  // new sb_publishable_/sb_secret_ keys must be sent only as `apikey`.
  if (/^eyJ[\w-]*\.[\w-]+\.[\w-]+$/.test(key)) headers.Authorization = `Bearer ${key}`;
  return headers;
}

async function describeError(response) {
  const body = await response.text();
  try {
    const { message, hint, details } = JSON.parse(body);
    return [message, details, hint].filter(Boolean).join(' — ') || body;
  } catch {
    return body || response.statusText;
  }
}

// The OpenAPI schema lists the table columns and tells which of them are json/jsonb.
// Supabase serves it only to secret (service_role) keys, so a publishable key gets null here.
async function fetchSchema({ url, key }) {
  const response = await fetch(`${url}/rest/v1/`, { headers: requestHeaders(key, 'application/openapi+json') });
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error(`Не удалось прочитать схему API (${response.status}): ${await describeError(response)}`);

  const schema = await response.json();
  const columns = schema.definitions?.[TABLE]?.properties;
  if (!columns) throw new Error(`Таблица «${TABLE}» не найдена в Data API. Проверь название и что схема public открыта для API.`);
  return {
    columns: Object.keys(columns),
    jsonColumns: Object.entries(columns)
      .filter(([, column]) => column.format === 'jsonb' || column.format === 'json')
      .map(([name]) => name),
  };
}

async function fetchRows({ url, key }) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const query = new URLSearchParams({ select: '*', order: `${KEY}.asc`, limit: String(PAGE_SIZE), offset: String(offset) });
    const response = await fetch(`${url}/rest/v1/${TABLE}?${query}`, { headers: requestHeaders(key) });
    if (!response.ok) throw new Error(`Supabase ответил ${response.status}: ${await describeError(response)}`);

    const page = await response.json();
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

// Supabase already returns jsonb as real objects. A cell still arrives as a string when
// JSON text was saved into it as a string (e.g. pasted with quotes or imported from CSV);
// such text is turned back into an object. Plain strings and numbers stay untouched.
function unwrapJsonText(value) {
  let current = value;
  for (let depth = 0; depth < 3 && typeof current === 'string'; depth += 1) {
    try {
      current = JSON.parse(current);
    } catch {
      return value;
    }
  }
  return current !== null && typeof current === 'object' ? current : value;
}

function normalizeJsonCells(rows, jsonColumns) {
  const fixed = [];
  for (const row of rows) {
    for (const column of jsonColumns ?? Object.keys(row)) {
      const value = row[column];
      if (typeof value !== 'string') continue;
      const unwrapped = unwrapJsonText(value);
      if (unwrapped === value) continue;
      row[column] = unwrapped;
      fixed.push(`${column} (${KEY}=${row[KEY]})`);
    }
  }
  return fixed;
}

async function writeIfChanged(content) {
  const previous = existsSync(DATA_FILE) ? await readFile(DATA_FILE, 'utf8') : null;
  if (previous === content) return false;
  const temporary = `${DATA_FILE}.tmp`;
  await writeFile(temporary, content, 'utf8');
  await rename(temporary, DATA_FILE); // never leaves a half-written file behind
  return true;
}

async function pull(config) {
  const schema = await fetchSchema(config);
  const rows = await fetchRows(config);

  if (schema) {
    console.log(`JSON/JSONB-колонки: ${schema.jsonColumns.length ? schema.jsonColumns.join(', ') : 'нет'}`);
  } else {
    console.log('Схема таблицы недоступна для этого ключа (нужен secret-ключ), поэтому JSON-текст ищется во всех колонках.');
  }
  const fixed = normalizeJsonCells(rows, schema?.jsonColumns);
  if (fixed.length) {
    console.log(`В Supabase JSON лежит строкой, в файл записан объектом: ${fixed.join(', ')}`);
  }

  if (!rows.length) {
    console.warn('Таблица вернула 0 строк. Если используешь publishable-ключ, проверь политики RLS на чтение — или возьми secret-ключ. Файл не изменён.');
    return;
  }

  const changed = await writeIfChanged(`${JSON.stringify(rows, null, 2)}\n`);
  const types = Object.entries(Object.groupBy(rows, (row) => row.object_type ?? '(без object_type)'))
    .map(([type, items]) => `  ${type}: ${items.length}`)
    .join('\n');
  console.log(`${changed ? 'Записано' : 'Без изменений'}: ${rows.length} строк → ${DATA_FILE}\n${types}`);
}

function rowLabel(row, index) {
  return row[KEY] == null ? `строка №${index + 1} без ${KEY}` : `${KEY}=${row[KEY]}`;
}

async function readDataFile() {
  if (!existsSync(DATA_FILE)) throw new Error(`Нет файла ${DATA_FILE}. Сначала выгрузи таблицу: npm run data:pull`);
  let rows;
  try {
    rows = JSON.parse((await readFile(DATA_FILE, 'utf8')).replace(/^﻿/, '')); // Notepad may add a BOM
  } catch (error) {
    throw new Error(`Файл ${DATA_FILE} — некорректный JSON: ${error.message}`);
  }
  if (!Array.isArray(rows)) throw new Error(`В файле ${DATA_FILE} должен быть массив строк таблицы.`);
  return rows;
}

// Everything is checked before the first write, so a typo never leaves the table half-updated.
function checkFileRows(rows, schema) {
  const problems = [];
  const seen = new Set();
  rows.forEach((row, index) => {
    if (row === null || typeof row !== 'object' || Array.isArray(row)) {
      problems.push(`строка №${index + 1} — не объект`);
      return;
    }
    if (row[KEY] != null) {
      if (seen.has(String(row[KEY]))) problems.push(`${KEY}=${row[KEY]} встречается в файле несколько раз`);
      seen.add(String(row[KEY]));
    }
    const unknown = schema ? Object.keys(row).filter((column) => !schema.columns.includes(column)) : [];
    if (unknown.length) problems.push(`${rowLabel(row, index)}: в таблице нет колонок ${unknown.join(', ')}`);
  });
  if (problems.length) throw new Error(`В Supabase ничего не записано, сначала исправь файл:\n  ${problems.join('\n  ')}`);
}

// A file row without id is new, and the database gives it an id. A column missing from a file row
// stays as it is in the table. An update carries the whole row (changed cells from the file, the rest
// exactly as the table holds them), because PostgREST wants the same keys in every object of a request.
function planPush(fileRows, tableRows, jsonColumns) {
  const comparable = structuredClone(tableRows);
  normalizeJsonCells(comparable, jsonColumns); // compare with the table the way pull would have written it
  const tableByKey = new Map(tableRows.map((row, index) => [String(row[KEY]), { row, comparable: comparable[index] }]));

  const inserts = [];
  const updates = [];
  fileRows.forEach((row, index) => {
    if (row[KEY] == null) {
      inserts.push({ index, row: Object.fromEntries(Object.entries(row).filter(([column]) => column !== KEY)) });
      return;
    }
    const current = tableByKey.get(String(row[KEY]));
    if (!current) {
      inserts.push({ index, row });
      return;
    }
    tableByKey.delete(String(row[KEY]));
    const changed = Object.keys(row).filter((column) => !isDeepStrictEqual(row[column], current.comparable[column]));
    if (changed.length) {
      const cells = Object.fromEntries(changed.map((column) => [column, row[column]]));
      updates.push({ index, row: { ...current.row, ...cells }, changed });
    }
  });
  const missing = [...tableByKey.values()].map(({ row }) => row[KEY]);
  return { inserts, updates, missing };
}

// Rows are sent in groups with the same key set; normally that is a single request, i.e. one transaction.
// Each item gets `saved`: the row as the database stored it.
async function saveRows({ url, key }, items) {
  const groups = Object.values(Object.groupBy(items, ({ row }) => Object.keys(row).sort().join()));
  const done = [];
  for (const group of groups) {
    const upsert = KEY in group[0].row;
    const labels = group.map(({ row, index }) => rowLabel(row, index));
    const response = await fetch(`${url}/rest/v1/${TABLE}${upsert ? `?on_conflict=${KEY}` : ''}`, {
      method: 'POST',
      headers: {
        ...requestHeaders(key),
        'Content-Type': 'application/json',
        Prefer: upsert ? 'resolution=merge-duplicates,return=representation' : 'return=representation',
      },
      body: JSON.stringify(group.map(({ row }) => row)),
    });
    if (!response.ok) {
      const saved = done.length ? `\n  Уже записаны: ${done.join(', ')}.` : '';
      // Rows inserted with explicit ids do not move the id counter, so the next generated id may be taken.
      const hint = !upsert && response.status === 409
        ? `\n  Счётчик ${KEY} в базе отстаёт от заданных вручную: укажи ${KEY} явно или сдвинь счётчик в SQL Editor:\n  `
          + `select setval(pg_get_serial_sequence('${TABLE}', '${KEY}'), (select max(${KEY}) from ${TABLE}));`
        : '';
      throw new Error(`Supabase не принял ${labels.join(', ')} (${response.status}): ${await describeError(response)}${saved}${hint}`);
    }

    const saved = await response.json();
    const savedByKey = new Map(saved.map((row) => [String(row[KEY]), row]));
    group.forEach((item, position) => {
      item.saved = upsert ? savedByKey.get(String(item.row[KEY])) : saved[position];
    });
    done.push(...labels);
  }
}

async function deleteRows({ url, key }, ids) {
  const query = new URLSearchParams({ [KEY]: `in.(${ids.map((id) => JSON.stringify(String(id))).join(',')})` });
  const response = await fetch(`${url}/rest/v1/${TABLE}?${query}`, {
    method: 'DELETE',
    headers: { ...requestHeaders(key), Prefer: 'return=representation' },
  });
  if (!response.ok) throw new Error(`Supabase не удалил строки (${response.status}): ${await describeError(response)}`);
  return (await response.json()).length;
}

async function push(config, { 'dry-run': dryRun = false, delete: prune = false }) {
  const fileRows = await readDataFile();
  const schema = await fetchSchema(config);
  checkFileRows(fileRows, schema);
  if (prune && !fileRows.length) throw new Error('Файл пустой: с --delete это стёрло бы всю таблицу. Ничего не сделано.');

  const tableRows = await fetchRows(config);
  if (!tableRows.length && !schema) {
    console.warn('Таблица вернула 0 строк. С publishable-ключом так бывает из-за политик RLS — лучше взять secret-ключ.');
  }
  const { inserts, updates, missing } = planPush(fileRows, tableRows, schema?.jsonColumns);
  const deletions = prune ? missing : [];

  console.log(`В файле ${fileRows.length} строк, в таблице ${tableRows.length}.`);
  if (inserts.length) {
    console.log(`Добавить (${inserts.length}): ${inserts.map(({ row, index }) => rowLabel(row, index)).join(', ')}`);
  }
  if (updates.length) {
    console.log(`Изменить (${updates.length}): ${updates.map(({ row, changed }) => `${KEY}=${row[KEY]} [${changed.join(', ')}]`).join('; ')}`);
  }
  if (missing.length) {
    const ids = missing.map((id) => `${KEY}=${id}`).join(', ');
    console.log(prune
      ? `Удалить (${missing.length}): ${ids}`
      : `Есть только в таблице (${missing.length}): ${ids} — не удаляются, для удаления добавь --delete`);
  }

  if (!inserts.length && !updates.length && !deletions.length) {
    console.log('В Supabase записывать нечего.');
    return;
  }
  if (dryRun) {
    console.log('Пробный запуск (--dry-run): в Supabase ничего не записано.');
    return;
  }

  const written = [...inserts, ...updates];
  if (written.length) await saveRows(config, written);
  const deleted = deletions.length ? await deleteRows(config, deletions) : 0;
  console.log(`Записано в Supabase: добавлено ${inserts.length}, изменено ${updates.length}${prune ? `, удалено ${deleted}` : ''}.`);
  if (deleted < deletions.length) {
    console.warn(`Удалено ${deleted} из ${deletions.length}: остальные строки не найдены или их удаление запрещено политиками RLS.`);
  }

  // The file takes back what the database filled in or reformatted (new ids, defaults, timestamps),
  // so the next push finds no differences.
  const saved = written.filter((item) => item.saved);
  normalizeJsonCells(saved.map((item) => item.saved), schema?.jsonColumns);
  for (const item of saved) fileRows[item.index] = item.saved;
  if (saved.length && (await writeIfChanged(`${JSON.stringify(fileRows, null, 2)}\n`))) {
    console.log(`Файл обновлён тем, что заполнила база (id, значения по умолчанию, формат дат): ${DATA_FILE}`);
  }
}

async function main() {
  let args;
  try {
    args = parseArgs({ allowPositionals: true, options: { 'dry-run': { type: 'boolean' }, delete: { type: 'boolean' } } });
  } catch (error) {
    throw new Error(`${error.message}\n${USAGE}`);
  }
  const [command] = args.positionals;
  if (args.positionals.length !== 1 || !['pull', 'push'].includes(command)) throw new Error(USAGE);

  const config = loadConfig();
  if (command === 'pull') await pull(config);
  else await push(config, args.values);
}

main().catch((error) => {
  const cause = error.cause?.code || error.cause?.message;
  const networkHint = cause ? ` (${cause}). Проверь SUPABASE_URL и подключение к интернету.` : '';
  console.error(`Ошибка: ${error.message}${networkHint}`);
  process.exitCode = 1;
});
