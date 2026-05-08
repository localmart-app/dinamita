import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { applySOQL } from './soqlEngine';
import { SOQLQuery } from './types';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Servir el frontend localmente
app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/contratos', async (req: Request<{}, {}, {}, SOQLQuery>, res: Response) => {
    try {
        const result = await applySOQL(req.query);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({
            error: "Error en la consulta SOQL",
            details: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Dashboard listo en: http://localhost:${PORT}`);
});

export default app;