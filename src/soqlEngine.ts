import { createClient } from '@libsql/client';
import { SOQLQuery } from './types';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
    url: process.env.TURSO_URL!,
    authToken: process.env.TURSO_TOKEN,
});

export const applySOQL = async (query: SOQLQuery) => {
    let select = query.$select ? query.$select : '*';
    let sql = `SELECT ${select} FROM contratos WHERE 1=1`;
    const params: any[] = [];

    // 1. Filtros automáticos (ej: ?ciudad=Pereira)
    Object.keys(query).forEach(key => {
        if (!key.startsWith('$')) {
            sql += ` AND "${key}" = ?`;
            params.push(query[key]);
        }
    });

    // 2. Filtro complejo ($where)
    if (query.$where) {
        // Reemplazamos " (comillas dobles) por ' (comillas simples) para evitar errores comunes
        sql += ` AND (${query.$where})`;
    }

    // 3. Ordenamiento
    if (query.$order) sql += ` ORDER BY ${query.$order}`;

    // 4. Paginación (Poner un límite por defecto de 100 para no saturar si no viene uno)
    const limit = query.$limit ? parseInt(query.$limit) : 100;
    sql += ` LIMIT ${limit}`;

    if (query.$offset) sql += ` OFFSET ${parseInt(query.$offset)}`;

    console.log("Ejecutando SQL:", sql);

    const result = await client.execute({ sql, args: params });
    return result.rows; // Turso devuelve las filas aquí
};