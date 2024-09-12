import OpenAI from 'openai';
import express from 'express';
import dotenv from 'dotenv';
import { Cache } from '../utils/Cache'
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const router = express.Router();
const myCache = new Cache<string>(300000);

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

const assistantId = process.env.ASSISTANT_ID;
const vectorID = process.env.LEYES_SALTA_VS_ID;

async function getThreadID (key: string, prompt: string, fileStream :fs.ReadStream | null) : Promise<string> {
    let threadIDCached: string | null= myCache.get(key);
    if (threadIDCached == null) {
        console.log("Getting thread")
        let thread;
        if (fileStream == null) {
            thread = await openAI.beta.threads.create({
                messages: [
                  {
                    role: 'user',
                    content: prompt,
                  },
                ],
                tool_resources: {
                    "file_search": {
                        "vector_store_ids": [vectorID]
                    }
                }
              });
        } else {
            console.log("creating thread with file");
            const fileUploaded = await openAI.files.create({
                file: fileStream,
                purpose: "assistants",
            });
            console.log("fileUploaded: " + fileUploaded.filename+ " id:" + fileUploaded.id );
            thread = await openAI.beta.threads.create({
                messages: [
                  {
                    role: "user",
                    content: prompt + ` Considerar documento adjunto a este mensaje con nombre = ${fileUploaded.filename} y id = ${fileUploaded.id}`,
                    attachments: [{ file_id: fileUploaded.id, tools: [{ type: "file_search" }] }],
                  },
                ]
              });
        }

        threadIDCached = thread.id;
        myCache.set(key, threadIDCached);
    } else {
        console.log("reusing thread : " + threadIDCached)

        let threadMessages;
        if (fileStream == null) {
            threadMessages = await openAI.beta.threads.messages.create(
                threadIDCached,
                { role: "user", content: prompt }
              );
        } else {
            const fileUploaded = await openAI.files.create({
                file: fileStream,
                purpose: "assistants",
            });

            threadMessages = await openAI.beta.threads.messages.create(
                threadIDCached,
                { 
                    role: "user", 
                    content: prompt + ` Considerar documento adjunto a este mensaje con nombre = ${fileUploaded.filename} y id = ${fileUploaded.id}`,
                    attachments: [{ file_id: fileUploaded.id, tools: [{ type: "file_search" }] }]
                }
              );
            }
        console.log(threadMessages);

    }
    console.log('Using thread with Id: ' + threadIDCached);
    return threadIDCached;
}

async function createThreadAndRun (prompt: string) {
    try {
        let threadId : string = await getThreadID('user1', prompt, null);
        
        const run = await openAI.beta.threads.runs.createAndPoll(threadId, {
            assistant_id: assistantId,
            additional_instructions: 'Por favor usa los documentos provistos para responder preguntas de indole legal.',
        });

        console.log('Run finished with status: ' + run.status);

        let response : string = "";
        if (run.status == 'completed') {
            const messages = await openAI.beta.threads.messages.list(threadId);
            response = messages.data[0].content[0].text.value;
        }
        console.log(response);
        return response;
    } catch (error) {
        console.error('Error comunication with OpenAI:', error);
        throw error;
    }
}

router.post('/send', async (req, res) => {
    const response = await createThreadAndRun(req.body.data);
    console.log(JSON.stringify(response));
    res.json({ result: response });
});

router.post('/send-stream', async (req, res) => {

    if (req.body.data == null) {
        return '';
    }

    let threadId : string = await getThreadID('user1', req.body.data, null);
    const stream = openAI.beta.threads.runs
    .stream(threadId, {
        assistant_id: assistantId,
    })
    .on("textCreated", () => console.log("assistant >"))
    .on("toolCallCreated", (event) => console.log("assistant " + event.type))
    .on("messageDone", async (event) => {
        if (event.content[0].type === "text") {
        const { text } = event.content[0];
        const { annotations } = text;
        const citations: string[] = [];

        let index = 0;
        for (let annotation of annotations) {
            text.value = text.value.replace(annotation.text, "[" + index + "]");
            const { file_citation } = annotation;
            if (file_citation) {
                const citedFile = await openAI.files.retrieve(file_citation.file_id);
                citations.push("[" + index + "]" + citedFile.filename);
            }
            index++;
        }

        console.log(text.value);
        console.log(citations.join("\n"));
        res.json({ result: text.value, citations: citations})
        }
    });
});

router.post('/test-file-send', upload.single('archivo'), async (req, res) => {
    const { pregunta, tipoDocumento } = req.body;
    const archivo = req.file; // Access the uploaded file
    

    if (!archivo) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    
    // Get the full path of the uploaded file
    const filePath = path.join(__dirname, 'uploads', archivo.filename);

    // Create a readable stream of the file
    const fileStream = fs.createReadStream(filePath);

    let threadId : string = await getThreadID('user1', pregunta, fileStream);
    
    const run = await openAI.beta.threads.runs.createAndPoll(threadId, {
        assistant_id: assistantId,
        additional_instructions: 'Por favor usa los documentos provistos para responder preguntas de indole legal.',
        
    });

    console.log('Run finished with status: ' + run.status);

    let response : string = "";
    if (run.status == 'completed') {
        const messages = await openAI.beta.threads.messages.list(threadId);
        response = messages.data[0].content[0].text.value;
    }
    res.json({ message: `Respuesta: ${response}` });
});




// TEST 

router.get('/hello', (req, res) => res.send({message:"Hello word"})
)

router.post('/test', upload.single('archivo'), (req, res) => {
    const { pregunta, tipoDocumento } = req.body;
    const archivo = req.file; // Access the uploaded file
  
    res.json({ message: `Pregunta: ${pregunta}, Tipo Documento: ${tipoDocumento}, Archivo: ${archivo?.originalname || 'No archivo subido'}` });
  });


export default router;