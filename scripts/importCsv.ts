import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import Database from 'better-sqlite3';

const db = new Database('database.sqlite');

const normalize = (h: string) => h.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar tildes
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_');

async function migrate() {
    const csvPath = path.resolve(__dirname, '../data.csv');

    if (!fs.existsSync(csvPath)) {
        console.error("❌ ERROR: No se encontró el archivo data.csv en la raíz.");
        return;
    }

    console.log("🚀 Iniciando migración a SQLite... esto puede tardar según el tamaño del CSV.");

    let headers: string[] = [];
    let initialized = false;
    let count = 0;

    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = OFF');

    const insertChunk: any[] = [];
    const CHUNK_SIZE = 5000;

    const stream = fs.createReadStream(csvPath).pipe(csv());

    for await (const row of stream) {
        if (!initialized) {
            headers = Object.keys(row).map(normalize);
            const columns = headers.map(h => `"${h}" TEXT`).join(', ');
            db.exec(`DROP TABLE IF EXISTS contratos`);
            db.exec(`CREATE TABLE contratos (${columns})`);
            initialized = true;
        }

        insertChunk.push(Object.values(row));

        if (insertChunk.length >= CHUNK_SIZE) {
            insertData(headers, insertChunk);
            insertChunk.length = 0;
            count += CHUNK_SIZE;
            console.log(`⏳ Insertados ${count} registros...`);
        }
    }

    if (insertChunk.length > 0) {
        insertData(headers, insertChunk);
    }

    console.log("🎯 Creando índices...");
    db.exec(`CREATE INDEX idx_ciudad ON contratos (ciudad)`);
    console.log("✅ ¡Listo! Base de datos generada.");
}

function insertData(headers: string[], rows: any[]) {
    const placeholders = headers.map(() => '?').join(',');
    const insert = db.prepare(`INSERT INTO contratos ("${headers.join('","')}") VALUES (${placeholders})`);
    const transaction = db.transaction((allRows) => {
        for (const r of allRows) insert.run(r);
    });
    transaction(rows);
}

migrate().catch(console.error);