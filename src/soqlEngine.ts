import { createClient } from '@libsql/client';
import { SOQLQuery } from './types';

const client = createClient({
    url: "libsql://dinamita-mig8at.aws-us-east-1.turso.io",
    authToken: "TU_TOKEN_AQUÍ",
});

export const applySOQL = async (query: SOQLQuery) => {
    let select = query.$select ? query.$select : '*';
    let sql = `SELECT ${select} FROM contratos WHERE 1=1`;
    const params: any[] = [];

    // Filtros dinámicos
    Object.keys(query).forEach(key => {
        if (!key.startsWith('$')) {
            sql += ` AND "${key}" = ?`;
            params.push(query[key]);
        }
    });

    if (query.$where) {
        sql += ` AND (${query.$where})`;
    }

    if (query.$order) {
        sql += ` ORDER BY ${query.$order}`;
    }

    // --- CAMBIO AQUÍ: Límite estricto de 100 ---
    const requestedLimit = query.$limit ? parseInt(query.$limit) : 100;
    const limit = Math.min(requestedLimit, 100); // Si piden 500, devolverá 100.

    sql += ` LIMIT ${limit}`;

    if (query.$offset) {
        sql += ` OFFSET ${parseInt(query.$offset)}`;
    }

    const result = await client.execute({ sql, args: params });
    return result.rows;
};