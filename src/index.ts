import express, { Request, Response } from 'express';
import cors from 'cors';
import { applySOQL } from './soqlEngine';
import { SOQLQuery } from './types';

const app = express();
app.use(cors());
app.use(express.json());

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

export default app;