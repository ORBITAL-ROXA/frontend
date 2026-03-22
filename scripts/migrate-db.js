/**
 * ORBITAL ROXA — Database Migration Script
 *
 * Run with: DATABASE_URL=... node scripts/migrate-db.js
 *
 * This script:
 * 1. Adds secondary indexes for performance
 * 2. Drops deprecated brand_* tables (replaced by instagram_posts)
 * 3. Is idempotent — safe to run multiple times
 */

const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  console.log('Connected to MySQL\n');

  // ═══ 1. SECONDARY INDEXES ═══
  const indexes = [
    // faceit_match
    ['faceit_match', 'idx_faceit_tournament', 'tournament_id'],
    ['faceit_match', 'idx_faceit_status', 'status'],
    ['faceit_match', 'idx_faceit_g5match', 'g5_match_id'],

    // inscricoes
    ['inscricoes', 'idx_inscricoes_tournament', 'tournament_id'],
    ['inscricoes', 'idx_inscricoes_captain', 'captain_steam_id'],
    ['inscricoes', 'idx_inscricoes_status', 'status'],

    // instagram_posts
    ['instagram_posts', 'idx_ig_status', 'status'],
    ['instagram_posts', 'idx_ig_scheduled', 'scheduled_date'],

    // loja_pedidos
    ['loja_pedidos', 'idx_pedidos_status', 'status'],

    // brand_ai_reports
    ['brand_ai_reports', 'idx_reports_action', 'action_id'],

    // brand_tasks
    ['brand_tasks', 'idx_tasks_week', 'week'],
    ['brand_tasks', 'idx_tasks_category', 'category'],
  ];

  console.log('═══ Adding indexes ═══');
  for (const [table, name, column] of indexes) {
    try {
      await conn.query(`CREATE INDEX ${name} ON ${table} (${column})`);
      console.log(`  ✓ ${name} on ${table}(${column})`);
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log(`  - ${name} already exists`);
      } else if (err.code === 'ER_NO_SUCH_TABLE') {
        console.log(`  ✗ ${table} does not exist (skipped)`);
      } else {
        console.log(`  ✗ ${name}: ${err.message}`);
      }
    }
  }

  // ═══ 2. DROP DEPRECATED TABLES ═══
  console.log('\n═══ Dropping deprecated tables ═══');
  const deprecated = ['brand_posts', 'brand_checklist', 'brand_sponsors', 'brand_notes', 'brand_tasks'];
  for (const table of deprecated) {
    try {
      const [rows] = await conn.query(`SELECT COUNT(*) as c FROM ${table}`);
      const count = rows[0].c;
      if (count > 0) {
        console.log(`  ⚠ ${table} has ${count} rows — keeping (manual review needed)`);
      } else {
        await conn.query(`DROP TABLE IF EXISTS ${table}`);
        console.log(`  ✓ ${table} dropped (was empty)`);
      }
    } catch (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') {
        console.log(`  - ${table} already gone`);
      } else {
        console.log(`  ✗ ${table}: ${err.message}`);
      }
    }
  }

  // ═══ 3. VERIFY FINAL STATE ═══
  console.log('\n═══ Final state ═══');
  const [tables] = await conn.query('SHOW TABLES');
  console.log(`Tables: ${tables.length}`);
  for (const t of tables) {
    const name = Object.values(t)[0];
    try {
      const [rows] = await conn.query(`SELECT COUNT(*) as c FROM \`${name}\``);
      const [idxs] = await conn.query(`SHOW INDEX FROM \`${name}\``);
      const indexCount = new Set(idxs.map(i => i.Key_name)).size;
      console.log(`  ${name}: ${rows[0].c} rows, ${indexCount} indexes`);
    } catch {
      console.log(`  ${name}: (error reading)`);
    }
  }

  await conn.end();
  console.log('\nMigration complete!');
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
