import axios from 'axios';
import OpenAI from 'openai';

const openAI = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function sendRequestToOpenAI (prompt: string) {
    try {
        const response = await axios.post('https://api.openai.com/v1/completions', {
            model: "text-davinci-003",
            prompt: prompt,
            max_tokens: 150,
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            }
        });
        return response.data.choices[0].text.trim();
    } catch (error) {
        console.error('Error comunication with OpenAI:', error);
        throw error;
    }
}

