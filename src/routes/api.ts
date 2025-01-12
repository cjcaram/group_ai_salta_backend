import express from 'express';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { OpenAIService } from '../services/openaiService.js';
import { AIFormattedResponse } from '../dto/AIFormattedResponse.js';
import { authenticateToken } from '../middleware/auth.js';

dotenv.config();

const DOWNLOADS_PATH = process.env.DOWNLOADS_PATH || 'downloads';
const UPLOADS_PATH = process.env.UPLOADS_PATH || 'uploads';

const openAiService = new OpenAIService();
const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, UPLOADS_PATH + '/');
    },
    filename: (req, file, callback) => {
        callback(null, file.originalname);
    },
  });

const upload = multer({ storage: storage });

// DOWNLOAD FILES

router.get('/downloads/:filename', authenticateToken, (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(DOWNLOADS_PATH, filename);
    res.download(filePath, (err) => {
        if (err) {
            console.error('Error downloading file:', err);
            res.status(500).send('Error downloading file');
        }
    });
});

// OPENAI

router.post('/contestar-una-demanda', authenticateToken, upload.single('attachment'), async (req, res) => {
    const { additionalInfo, evidenceDescription } = req.body;
    
    const fileAttached = req.file;

    if (!fileAttached) {
        return res.status(400).json({ message: 'Archivo no adjunto o formato no valido' });
    }

    let prompt = `Redacta una contestación de demanda (teniendo en cuenta la demanda adjunta) para ser presentada ante un juzgado de la provincia de Salta. La contestación deberá seguir las siguientes instrucciones:

        1 - Incluir una Negativa General y Particular:

        1.a - Negativa General: Negar todos los hechos que no sean expresamente reconocidos por la parte demandada.
        1.b - Negativa Particular: Negar puntualmente cada una de las afirmaciones importantes de la demanda (ej. incumplimientos contractuales, falta de información, daños reclamados, trato indigno, entre otros).
        
        2 - Seguir una estructura formal con los siguientes puntos:

        2.a - Objeto: Exponer el propósito de la contestación y solicitar el rechazo de la demanda.
        2.b - Hechos: Relatar los hechos desde la perspectiva de la parte demandada.
        2.c - Falta de prueba: Argumentar la falta de prueba suficiente de los daños invocados por la parte actora.
        2.d - Negación de daños: Refutar la procedencia de daños.
        2.e - Responsabilidad del demandado: Sostener que el demandado actuó conforme a lo pactado y a la legislación vigente.
        2.f - Citar jurisprudencia: Preferentemente referir a jurisprudencia de la provincia de Salta que respalde los argumentos.
        2.g - Derecho: Incluir referencias a normas aplicables, como el Código Civil y Comercial, la Ley de Defensa del Consumidor, entre otras.
        
        3 - Petitorio:

        3.a - Solicitar el rechazo de la demanda con expresa imposición de costas a la parte actora.
        
        ${additionalInfo ? `Información adicional:

        Considerar la siguiente información adicional provista por el demandado para argumentar la contestación de la demanda, impugnar alguna prueba, negar algun hecho, plantear una excepción procesal o interponer una nulidad: ${additionalInfo}` : ''}
        ${evidenceDescription ? `Descripción de la prueba: Incluir en un apartado de la contestación de la demanda como prueba a favor del demandado (solo una descripción de los documentos que serán adjuntados a la contestación de demanda): ${evidenceDescription}.` : ''}
        
        Formato de la respuesta:
        La respuesta debe ser un archivo .docx, correctamente formateado, donde el contenido del archivo sea únicamente la contestación de la demanda.`;

    const filePath = path.join(UPLOADS_PATH, fileAttached.filename);
    const response: AIFormattedResponse = await openAiService.executePromtAndGetLastMessage(filePath, prompt);

    console.log(JSON.stringify(response));
    res.json(response);
});

// TEST 

router.get('/hello', (req, res) => res.send({message:"Hello word"})
)

// Example protected route
router.get('/protected-route', authenticateToken, (req, res) => {
    console.log('Usuario autenticado:', req.user);
    res.json({ message: `Bienvenido, ${req.user?.username}` });
});

export default router;