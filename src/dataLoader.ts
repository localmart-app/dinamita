import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { IContratoSecop } from './types';

// Función para limpiar y normalizar los nombres de las llaves del CSV
const normalizeKey = (key: string) => {
    return key
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Quitar tildes
        .replace(/\s+/g, '_')           // Espacios por guiones bajos
        .replace(/[()]/g, '');          // Quitar paréntesis
};

export const loadCSVData = (): Promise<IContratoSecop[]> => {
    const results: IContratoSecop[] = [];
    const csvPath = path.resolve(__dirname, '../data.csv');

    return new Promise((resolve, reject) => {
        if (!fs.existsSync(csvPath)) {
            console.error("❌ No se encontró el archivo data.csv en la raíz del proyecto.");
            return resolve([]); // Devolvemos array vacío para no romper la app
        }

        fs.createReadStream(csvPath)
            .pipe(csv({
                mapHeaders: ({ header }) => normalizeKey(header)
            }))
            .on('data', (data) => {
                // Limpieza de datos: Convertir valores numéricos que vienen con comas o formato string
                const cleanedData = { ...data };

                // Convertimos el valor del contrato a número puro
                if (cleanedData.valor_del_contrato) {
                    cleanedData.valor_del_contrato = parseFloat(
                        String(cleanedData.valor_del_contrato).replace(/[^0-9.]/g, '')
                    ) || 0;
                }

                results.push(cleanedData as IContratoSecop);
            })
            .on('end', () => {
                console.log(`✅ CSV cargado exitosamente: ${results.length} registros.`);
                resolve(results);
            })
            .on('error', (err) => reject(err));
    });
};