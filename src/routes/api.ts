import OpenAI from 'openai';
import express from 'express';
import dotenv from 'dotenv';
import { Cache } from '../utils/Cache'
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { OpenAIService } from '../services/openaiService';
import { AIFormattedResponse } from 'dto/AIFormattedResponse';

dotenv.config();

const openAiService = new OpenAIService();

const router = express.Router();
const myCache = new Cache<string>(300000);

const assistantId = process.env.ASSISTANT_ID;
const vectorID = process.env.LEYES_SALTA_VS_ID;

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const thisFileDirName = path.dirname(__filename);
const __dirname = thisFileDirName.substring(0, thisFileDirName.indexOf(process.env.PROJECT_NAME) + process.env.PROJECT_NAME.length + 1); 

// Multer Configuration
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'uploads/');
    },
    filename: (req, file, callback) => {
        callback(null, file.originalname);
    },
  });
const upload = multer({ storage: storage });

const openAI = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

router.get('/downloads/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'downloads', filename);
    res.download(filePath, (err) => {
        if (err) {
            console.error('Error downloading file:', err);
            res.status(500).send('Error downloading file');
        }
    });
});

router.post('/contestar-una-demanda', upload.single('attachment'), async (req, res) => {
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
        2.c - Falta de prueba: Argumentar la falta de prueba de los daños invocados por la parte actora.
        2.d - Negación de daños extrapatrimoniales y punitivos: Refutar la procedencia de estos daños.
        2.e - Responsabilidad del demandado: Sostener que el demandado actuó conforme a lo pactado y a la legislación vigente.
        2.f - Citar jurisprudencia local: Referir a jurisprudencia de la provincia de Salta que respalde los argumentos.
        2.g - Derecho: Incluir referencias a normas aplicables, como el Código Civil y Comercial, la Ley de Defensa del Consumidor, entre otras.
        
        3 - Petitorio:

        3.a - Solicitar el rechazo de la demanda con expresa imposición de costas a la parte actora.
        
        ${additionalInfo ? `Información adicional:

        Considerar la siguiente información adicional provista por el demandado para realizar la contestación: ${additionalInfo}` : ''}
        ${evidenceDescription ? `Descripción de la evidencia: Además, incluir la siguiente descripción de la evidencia (solo una descripción de los documentos que serán adjuntados a la contestación de demanda): ${evidenceDescription}.` : ''}
        Formato de la respuesta:

        La respuesta debe ser un archivo .docx, correctamente formateado, donde el contenido del archivo sea únicamente la contestación de la demanda.`;

    const filePath = path.join(__dirname, 'uploads', fileAttached.filename);
    const response: AIFormattedResponse = await openAiService.executePromtAndGetLastMessage(filePath, prompt);

    console.log(JSON.stringify(response));
    res.json(response);
});

// TEST 

router.get('/hello', (req, res) => res.send({message:"Hello word"})
)


export default router;