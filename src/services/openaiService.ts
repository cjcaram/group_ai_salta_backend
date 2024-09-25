import { Cache } from '../utils/Cache'
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AIFormattedResponse } from 'dto/AIFormattedResponse';

dotenv.config();

const ASSISTANT_ID = process.env.ASSISTANT_ID;
const VECTOR_ID = process.env.LEYES_SALTA_VS_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SERVER_URL = process.env.SERVER_URL;

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const thisFileDirName = path.dirname(__filename);
const __dirname = thisFileDirName.substring(0, thisFileDirName.indexOf(process.env.PROJECT_NAME) + process.env.PROJECT_NAME.length + 1); 

export class OpenAIService {

    private myCache: Cache<string>;
    private openAI: OpenAI;

    constructor() {
        this.myCache = new Cache<string>(300000);
        this.openAI = new OpenAI({apiKey: OPENAI_API_KEY});
    }

    async getThreadID (key: string, prompt: string) : Promise<string> {
        let threadIDCached: string | null= this.myCache.get(key);
        if (threadIDCached == null) {
            console.log("getting thread...");
            
            const thread = await this.openAI.beta.threads.create({
                messages: [
                    { role: 'user', content: prompt, },
                ],
                tool_resources: { "file_search": { "vector_store_ids": [VECTOR_ID] } }
            });
            threadIDCached = thread.id;
            this.myCache.set(key, threadIDCached);
        } else {
            console.log("reusing thread...");
    
            const threadMessages = await this.openAI.beta.threads.messages.create(
                threadIDCached, { role: "user", content: prompt });
                
        }
        console.log('OpenAI_Thread_Id: ' + threadIDCached);
        return threadIDCached;
    }

    async executeRunAndGetMessages(filePath: string, prompt: string) : Promise<OpenAI.Beta.Threads.Messages.MessagesPage> {
        
        let threadId : string = await this.getThreadID('user1', prompt);
        
        const fileStream = fs.createReadStream(filePath);
        const fileUploaded = await this.openAI.files.create({
            file: fileStream,
            purpose: "assistants",
        });
        
        const run = await this.openAI.beta.threads.runs.createAndPoll(threadId, {
            assistant_id: ASSISTANT_ID,
            additional_instructions: 'Por favor, usa los documentos provistos para responder preguntas de indole legal.',
            additional_messages: [
                { 
                    role: "user", 
                    content: ` Considerar documento adjunto a este mensaje con nombre = ${fileUploaded.filename} y id = ${fileUploaded.id}`,
                    attachments: [{ file_id: fileUploaded.id, tools: [{ type: "file_search" }, {type: "code_interpreter"}] }]
                }
            ]
        });

        console.log('Run finished with status: ' + run.status);

        return await this.openAI.beta.threads.messages.list(threadId);
    }

    async saveFileFromOpenAI(messages : OpenAI.Beta.Threads.Messages.MessagesPage): Promise<string> {
        const fileId = messages.data[0].attachments[0].file_id;
        const runID = messages.data[0].run_id;
        const threadID = messages.data[0].thread_id;
        
        const responseFile = await this.openAI.files.content(fileId);
        const file = await responseFile.arrayBuffer();
        const file_data_buffer = Buffer.from(file);
        const downloadPath = `${__dirname}downloads/${threadID}-${runID}.docx`;

        fs.writeFileSync(downloadPath, file_data_buffer);

        return `${SERVER_URL}/api/downloads/${threadID}-${runID}.docx`;
    }

    async executePromtAndGetLastMessage(filePath: string, prompt: string) : Promise<AIFormattedResponse> {
        
        let messages = await this.executeRunAndGetMessages(filePath, prompt);
        let fileUrl = await this.saveFileFromOpenAI(messages);
        return { message: 'Se ha generado el archivo .docx con la contestación de demanda solicitada. Puedes descargarlo utilizando el siguiente enlace:', 
            fileUrl: fileUrl };
    }
}


