const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function readSql(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function splitSqlStatements(sqlText) {
  const text = String(sqlText || '')
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  const lines = text.split('\n');
  let delimiter = ';';
  let chunk = '';
  const statements = [];

  const flushChunk = () => {
    const parts = splitChunkByDelimiter(chunk, delimiter);
    for (const stmt of parts) {
      const trimmed = stmt.trim();
      if (trimmed) statements.push(trimmed);
    }
    chunk = '';
  };

  for (const line of lines) {
    const m = line.match(/^\s*DELIMITER\s+(.+?)\s*$/i);
    if (m) {
      flushChunk();
      delimiter = m[1];
      continue;
    }
    chunk += line + '\n';
  }

  flushChunk();
  return statements;
}

function splitChunkByDelimiter(chunk, delimiter) {
  const out = [];
  const delim = String(delimiter || ';');
  if (!delim) return [chunk];

  let current = '';

  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < chunk.length; i++) {
    const ch = chunk[i];
    const next = chunk[i + 1] || '';

    if (inLineComment) {
      current += ch;
      if (ch === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      current += ch;
      if (ch === '*' && next === '/') {
        current += next;
        i++;
        inBlockComment = false;
      }
      continue;
    }

    if (!inSingle && !inDouble && !inBacktick) {
      if (ch === '-' && next === '-') {
        const next2 = chunk[i + 2] || '';
        if (next2 === ' ' || next2 === '\t' || next2 === '\r' || next2 === '\n' || next2 === '') {
          inLineComment = true;
          current += ch + next;
          i++;
          continue;
        }
      }
      if (ch === '#') {
        inLineComment = true;
        current += ch;
        continue;
      }
      if (ch === '/' && next === '*') {
        inBlockComment = true;
        current += ch + next;
        i++;
        continue;
      }
    }

    if (!inDouble && !inBacktick && ch === "'" && !isEscaped(chunk, i)) {
      inSingle = !inSingle;
      current += ch;
      continue;
    }
    if (!inSingle && !inBacktick && ch === '"' && !isEscaped(chunk, i)) {
      inDouble = !inDouble;
      current += ch;
      continue;
    }
    if (!inSingle && !inDouble && ch === '`' && !isEscaped(chunk, i)) {
      inBacktick = !inBacktick;
      current += ch;
      continue;
    }

    if (!inSingle && !inDouble && !inBacktick) {
      if (chunk.startsWith(delim, i)) {
        out.push(current);
        current = '';
        i += delim.length - 1;
        continue;
      }
    }

    current += ch;
  }

  if (current.trim()) out.push(current);
  return out;
}

function isEscaped(text, index) {
  let slashCount = 0;
  for (let i = index - 1; i >= 0; i--) {
    if (text[i] === '\\') slashCount++;
    else break;
  }
  return slashCount % 2 === 1;
}

async function main() {
  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const hasPasswordVar = Object.prototype.hasOwnProperty.call(process.env, 'DB_PASSWORD');
  if (!hasPasswordVar) {
    throw new Error('DB_PASSWORD 未配置（backend/.env），请设置为你的 MySQL 密码（如无密码可设为空：DB_PASSWORD=）');
  }

  const initSqlPath = path.join(__dirname, '..', '..', 'database', 'init.sql');
  const sampleSqlPath = path.join(__dirname, '..', '..', 'database', 'sample_data.sql');

  if (!fs.existsSync(initSqlPath)) {
    throw new Error(`init.sql not found: ${initSqlPath}`);
  }
  if (!fs.existsSync(sampleSqlPath)) {
    throw new Error(`sample_data.sql not found: ${sampleSqlPath}`);
  }

  const initSql = readSql(initSqlPath);
  const sampleSql = readSql(sampleSqlPath);

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    charset: 'utf8mb4',
    multipleStatements: false
  });

  try {
    await connection.query("SET NAMES utf8mb4");
    const initStatements = splitSqlStatements(initSql);
    for (const stmt of initStatements) {
      await connection.query(stmt);
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of [
      'order_items',
      'orders',
      'product_reviews',
      'products',
      'comments',
      'donation_records',
      'donations',
      'animals',
      'users',
      'notices'
    ]) {
      await connection.query(`TRUNCATE TABLE ${table}`);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    const sampleStatements = splitSqlStatements(sampleSql);
    for (const stmt of sampleStatements) {
      await connection.query(stmt);
    }
    console.log('数据库初始化与示例数据导入完成');
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error('数据库初始化失败:', err.message);
  process.exit(1);
});
