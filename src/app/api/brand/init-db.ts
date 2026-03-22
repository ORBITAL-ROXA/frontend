import { dbPool } from "@/lib/tournaments-db";

let tablesEnsured = false;

export async function ensureBrandTables() {
  if (tablesEnsured) {
    try {
      await dbPool.execute("SELECT 1 FROM brand_tasks LIMIT 1");
      return;
    } catch {
      tablesEnsured = false;
    }
  }

  try {
    // brand_tasks — cronograma/plano 90 dias
    await dbPool.execute(`
      CREATE TABLE IF NOT EXISTS brand_tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category ENUM('instagram','conteudo','negocio','tech','campeonato') NOT NULL DEFAULT 'conteudo',
        priority ENUM('high','med','low') NOT NULL DEFAULT 'med',
        week INT NOT NULL DEFAULT 1,
        week_label VARCHAR(255) NOT NULL DEFAULT '',
        week_date VARCHAR(100) NOT NULL DEFAULT '',
        done BOOLEAN DEFAULT FALSE,
        done_at DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tasks_week (week),
        INDEX idx_tasks_category (category)
      )
    `);

    // brand_ai_reports — relatórios gerados pela IA
    await dbPool.execute(`
      CREATE TABLE IF NOT EXISTS brand_ai_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        action_id VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content LONGTEXT,
        status ENUM('generating','ready','error') DEFAULT 'generating',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_reports_action (action_id)
      )
    `);

    // Tabelas removidas: brand_posts, brand_checklist, brand_sponsors, brand_notes
    // Substituídas por: instagram_posts (gerenciada em /api/instagram/route.ts)
  } catch (err) {
    console.error("[BRAND INIT]", err);
  }

  tablesEnsured = true;
}
