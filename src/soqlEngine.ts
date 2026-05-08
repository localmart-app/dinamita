import { createClient } from '@libsql/client';
import { SOQLQuery } from './types';

const client = createClient({
    url: "libsql://dinamita-mig8at.aws-us-east-1.turso.io",
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzgyNzAwOTIsImlkIjoiMDE5ZTA5MjUtMDgwMS03ZDcyLWFlMmMtYjY1Y2UyMjQ2ZDFmIiwicmlkIjoiODQ0ODU4ODctZmM5Zi00OTBmLWIyOGUtMDUzN2Q5ODU3NDEwIn0.2rJfj2Idb3BjiRa94URGJhYQilQnFSUFjaW85YoMi5oTJZxCzopbzTuJKeg_Si0znb6Ziqra59E3BrtYDI62AQ",
});

export const applySOQL = async (query: SOQLQuery) => {
    let select = query.$select ? query.$select : '*';
    let sql = `SELECT ${select} FROM contratos WHERE 1=1`;
    const params: any[] = [];

    Object.keys(query).forEach(key => {
        if (!key.startsWith('$')) {
            sql += ` AND "${key}" = ?`;
            params.push(query[key]);
        }
    });

    if (query.$where) {
        sql += ` AND (${query.$where})`;
    }

    if (query.$order) sql += ` ORDER BY ${query.$order}`;

    const limit = query.$limit ? parseInt(query.$limit) : 100;
    sql += ` LIMIT ${limit}`;

    if (query.$offset) sql += ` OFFSET ${parseInt(query.$offset)}`;

    const result = await client.execute({ sql, args: params });
    return result.rows;
};