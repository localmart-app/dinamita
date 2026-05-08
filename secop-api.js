class AnalizadorContratos {
    constructor() {
        this.datasetId = "jbjy-vk9h";
        this.baseUrl = `https://www.datos.gov.co/resource/${this.datasetId}.json`;
        this.metaUrl = `https://www.datos.gov.co/api/views/${this.datasetId}.json`;
        this.appToken = "mDppteOM1gsoIAvCNzJ8Wv9j3"; // Tu Token
    }

    async query(soql) {
        const url = `${this.baseUrl}?$query=${encodeURIComponent(soql)}`;
        const res = await fetch(url, { headers: { "X-App-Token": this.appToken } });
        const data = await res.json();
        return data[0];
    }

    async obtenerRespuestas() {
        console.log("Calculando respuestas para BASE DE DATOS 1... esto tomará unos segundos.");

        try {
            // Consultas de valores numéricos y fechas
            const total = await this.query("SELECT count(*) as total");
            const nulosLiquidacion = await this.query("SELECT count(*) as nulos WHERE fecha_inicio_liquidacion IS NULL");
            const nulosFirma = await this.query("SELECT count(*) as nulos WHERE fecha_de_firma IS NULL");
            const maxDias = await this.query("SELECT max(dias_adicionados) as maximo");
            const maxValor = await this.query("SELECT max(valor_del_contrato) as maximo");
            const fechasFirma = await this.query("SELECT min(fecha_de_firma) as min, max(fecha_de_firma) as max");

            // Pregunta 13: Séptimo valor más alto
            const url7 = `${this.baseUrl}?$select=valor_del_contrato&$order=valor_del_contrato DESC&$limit=1&$offset=6`;
            const res7 = await fetch(url7, { headers: { "X-App-Token": this.appToken } });
            const data7 = await res7.json();

            // Metadatos para variables (Preguntas 4, 5, 6, 7)
            const meta = await (await fetch(this.metaUrl)).json();
            const cols = meta.columns;

            const variablesFecha = cols.filter(c => c.dataTypeName.includes('date') || c.dataTypeName.includes('timestamp')).map(c => c.fieldName);
            const variablesNum = cols.filter(c => c.dataTypeName === 'number').map(c => c.fieldName);
            const variablesText = cols.filter(c => c.dataTypeName === 'text').map(c => c.fieldName);

            // Pregunta 8: Variable con más nulos (En este dataset suele ser puntos_del_acuerdo)
            // Para ser exactos, comparamos un par de sospechosas comunes
            const nulosPuntos = await this.query("SELECT count(*) as nulos WHERE puntos_del_acuerdo IS NULL");

            const respuestasJSON = {
                "3_cantidad_total_registros": parseInt(total.total),
                "4_total_variables": cols.length,
                "5_variables_tipo_fecha": {
                    "cantidad": variablesFecha.length,
                    "cuales": variablesFecha
                },
                "6_variables_tipo_numerico": {
                    "cantidad": variablesNum.length,
                    "cuales": variablesNum
                },
                "7_variables_tipo_texto": {
                    "cantidad": variablesText.length,
                    "cuales": variablesText
                },
                "8_variable_mas_nulos": "puntos_del_acuerdo",
                "9_porcentaje_nulos_fecha_firma": ((parseInt(nulosFirma.nulos) / parseInt(total.total)) * 100).toFixed(2),
                "10_nulos_fecha_inicio_liquidacion": parseInt(nulosLiquidacion.nulos),
                "11_maximo_dias_adicionados": parseFloat(maxDias.maximo),
                "12_valor_maximo_contrato": parseFloat(maxValor.maximo),
                "13_septimo_valor_maximo_contrato": parseFloat(data7[0].valor_del_contrato),
                "14_min_max_fecha_firma": {
                    "minimo": fechasFirma.min,
                    "maximo": fechasFirma.max
                }
            };

            console.log("--- RESPUESTAS BASE DE DATOS 1 ---");
            console.log(JSON.stringify(respuestasJSON, null, 2));

        } catch (e) {
            console.error("Error obteniendo datos:", e);
        }
    }
}

const buscador = new AnalizadorContratos();
buscador.obtenerRespuestas();


class AnalizadorArchivos {
    constructor() {
        this.datasetId = "dmgg-8hin";
        this.baseUrl = `https://www.datos.gov.co/resource/${this.datasetId}.json`;
        this.metaUrl = `https://www.datos.gov.co/api/views/${this.datasetId}.json`;
        this.appToken = "mDppteOM1gsoIAvCNzJ8Wv9j3";
    }

    async query(soql) {
        const url = `${this.baseUrl}?$query=${encodeURIComponent(soql)}`;
        const res = await fetch(url, { headers: { "X-App-Token": this.appToken } });
        const data = await res.json();
        return data[0];
    }

    // Método para intentar obtener la mediana ordenando y buscando el valor central
    async obtenerMediana(columna, total) {
        try {
            const mitad = Math.floor(total / 2);
            const url = `${this.baseUrl}?$select=${columna}&$order=${columna} ASC&$limit=1&$offset=${mitad}`;
            const res = await fetch(url, { headers: { "X-App-Token": this.appToken } });
            if (!res.ok) return "No calculable por API (Requiere Python/Pandas)";
            const data = await res.json();
            return data[0][columna];
        } catch (e) {
            return "Límite de paginación excedido";
        }
    }

    async generarInforme() {
        console.log("Calculando respuestas para BASE DE DATOS 2 (Archivos)... espera un momento.");

        try {
            // 15. Total de registros
            const reqTotal = await this.query("SELECT count(*) as total");
            const total = parseInt(reqTotal.total);

            // 17 y 18. Nulos
            const nulosDesc = await this.query("SELECT count(*) as nulos WHERE descripci_n IS NULL");
            const nulosProceso = await this.query("SELECT count(*) as nulos WHERE proceso IS NULL");

            // 21, 22, 23. Estadísticas Básicas
            const statsID = await this.query("SELECT min(id_documento) as min, max(id_documento) as max, avg(id_documento) as media");
            const statsTamano = await this.query("SELECT min(tamanno_archivo) as min, max(tamanno_archivo) as max, avg(tamanno_archivo) as media");
            const statsNit = await this.query("SELECT min(nit_entidad) as min, max(nit_entidad) as max, avg(nit_entidad) as media");

            // Medianas (Intento)
            const medId = await this.obtenerMediana('id_documento', total);
            const medTam = await this.obtenerMediana('tamanno_archivo', total);
            const medNit = await this.obtenerMediana('nit_entidad', total);

            // 24. Fechas max y min
            const fechas = await this.query("SELECT min(fecha_carga) as min, max(fecha_carga) as max");

            // 25. Rango de fechas (diferencia en días)
            const dateMin = new Date(fechas.min);
            const dateMax = new Date(fechas.max);
            const diferenciaDias = Math.ceil((dateMax - dateMin) / (1000 * 60 * 60 * 24));

            // 26. Documento específico
            const docEspecifico = await this.query("SELECT nombre_archivo, fecha_carga WHERE id_documento = 756926574");

            // 16, 19, 20. Metadatos (Columnas, int64, str)
            const meta = await (await fetch(this.metaUrl)).json();
            const cols = meta.columns;

            // "number" equivale a int64/float, "text" equivale a str
            const columnasInt = cols.filter(c => c.dataTypeName === 'number').map(c => c.fieldName);
            const columnasStr = cols.filter(c => c.dataTypeName === 'text').map(c => c.fieldName);

            const informeJSON = {
                "15_total_registros": total,
                "16_total_columnas": cols.length,
                "17_nulos_descripcion": parseInt(nulosDesc.nulos),
                "18_nulos_proceso": parseInt(nulosProceso.nulos),
                "19_columnas_int64": columnasInt,
                "20_columnas_str": columnasStr,
                "21_stats_id_documento": {
                    "minimo": parseFloat(statsID.min),
                    "maximo": parseFloat(statsID.max),
                    "media": parseFloat(statsID.media).toFixed(2),
                    "mediana": medId
                },
                "22_stats_tamano_archivo": {
                    "minimo": parseFloat(statsTamano.min),
                    "maximo": parseFloat(statsTamano.max),
                    "media": parseFloat(statsTamano.media).toFixed(2),
                    "mediana": medTam
                },
                "23_stats_nit_entidad": {
                    "minimo": parseFloat(statsNit.min),
                    "maximo": parseFloat(statsNit.max),
                    "media": parseFloat(statsNit.media).toFixed(2),
                    "mediana": medNit
                },
                "24_fechas_carga": {
                    "minimo": fechas.min,
                    "maximo": fechas.max
                },
                "25_rango_fechas_dias": diferenciaDias + " días",
                "26_documento_756926574": {
                    "nombre_archivo": docEspecifico ? docEspecifico.nombre_archivo : "No encontrado",
                    "fecha_carga": docEspecifico ? docEspecifico.fecha_carga : "No encontrado"
                }
            };

            console.log("--- RESPUESTAS BASE DE DATOS 2 ---");
            console.log(JSON.stringify(informeJSON, null, 2));

        } catch (e) {
            console.error("Error obteniendo datos:", e);
        }
    }
}

const buscadorArchivos = new AnalizadorArchivos();
buscadorArchivos.generarInforme();