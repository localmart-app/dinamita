import { createClient } from '@libsql/client';
import { SOQLQuery } from './types';

const client = createClient({
    url: "libsql://dinamita-mig8at.aws-us-east-1.turso.io",
    authToken: "TU_TOKEN_AQUI",
});

export const applySOQL = async (query: SOQLQuery) => {
    let select = query.$select ? query.$select : '*';
    let sql = `SELECT ${select} FROM contratos WHERE 1=1`;
    const params: any[] = [];

    // Filtros directos (ej: ?ciudad=Pasto)
    Object.keys(query).forEach(key => {
        if (!key.startsWith('$')) {
            sql += ` AND "${key}" = ?`;
            params.push(query[key]);
        }
    });

    // Cláusula WHERE compleja
    if (query.$where) {
        sql += ` AND (${query.$where})`;
    }

    // Ordenamiento
    if (query.$order) {
        sql += ` ORDER BY ${query.$order}`;
    }

    // --- LIMITACIÓN ESTRICTA ---
    // Si no viene límite, ponemos 100. Si viene uno muy alto, lo capamos en 500 por seguridad.
    const requestedLimit = parseInt(query.$limit || '100');
    const limit = Math.min(requestedLimit, 500);

    sql += ` LIMIT ${limit}`;

    if (query.$offset) {
        sql += ` OFFSET ${parseInt(query.$offset)}`;
    }

    const result = await client.execute({ sql, args: params });
    return result.rows;
};