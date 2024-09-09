import OpenAI from 'openai';
import express from 'express';
import dotenv from 'dotenv';
import { Cache } from '../utils/Cache'

dotenv.config();

const router = express.Router();
const myCache = new Cache<string>(300000);

const openAI = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const assistantId = process.env.ASSISTANT_ID;
const vectorID = process.env.LEYES_SALTA_VS_ID;

async function getThreadID (key: string, prompt: string) : Promise<string> {
    let threadIDCached: string | null= myCache.get(key);
    if (threadIDCached == null) {
        console.log("Getting thread")
        const thread = await openAI.beta.threads.create({
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

        threadIDCached = thread.id;
        myCache.set(key, threadIDCached);
    } else {
        console.log("reusing thread : " + threadIDCached)
        const threadMessages = await openAI.beta.threads.messages.create(
            threadIDCached,
            { role: "user", content: prompt }
          );
          console.log(threadMessages);
    }
    console.log('Using thread with Id: ' + threadIDCached);
    return threadIDCached;
}

async function createThreadAndRun (prompt: string) {
    try {
        let threadId : string = await getThreadID('user1', prompt);
        
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

router.post('/send', async (req: Request, res: Response) => {
    const response = await createThreadAndRun(req.body.data);
    console.log(JSON.stringify(response));
    res.json({ result: response });
});

router.post('/send-async', async (req: Request, res: Response) => {

    if (req.body.data == null) {
        return '';
    }

    let threadId : string = await getThreadID('user1', req.body.data);
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


export default router;