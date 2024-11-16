import express from 'express';
import cors from 'cors';
import { Client } from '@gradio/client';
import  Configuration from 'openai'
import  OpenAIApi  from 'openai';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5002;

// OpenAI Configuration
const configuration = new Configuration({
  apiKey: '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',
});
const openai = new OpenAIApi(configuration);

app.post('/predict', async (req, res) => {
  const { text } = req.body; // Get the input text from the client
  try {
    // Step 1: Connect to the Qwen/Qwen2.5 Gradio Space
    const client = await Client.connect("Qwen/Qwen2.5");

    // Step 2: Modify the system session with the prompt
    await client.predict(
      "/modify_system_session",
      {
        system: `Given an input (whether it's a link or a question), verify its accuracy using available online resources. 
        Determine if the information is true or false. Provide the output in the following format:
        
        Prediction: A one-line statement confirming if the information is true or false with a percentage of certainty.
        Justification: A brief paragraph (under 1000 characters) explaining the reasoning behind the prediction.`,
      }
    );

    // Step 3: Get the prediction using the modified system
    const result = await client.predict(
      "/model_chat_1",
      {
        query: text, // Send the user input (text) as the query
        history: [], // Empty history
        system: `Given an input (whether it's a link or a question), verify its accuracy using available online resources. 
        Determine if the information is true or false. Provide the output in the following format:
        
        Prediction: A one-line statement confirming if the information is true or false with a percentage of certainty.
        Justification: A brief paragraph (under 1000 characters) explaining the reasoning behind the prediction.`,
        radio: "72B", // This value can be changed based on your API requirements
      }
    );

    // Step 4: Send the prediction result back to the client
    res.json({ prediction: result.data });
  } catch (error) {
    console.error('Error connecting to Gradio API:', error);
    res.status(500).json({ error: "Error connecting to Gradio API" });
  }
});

app.post('/suggest', async (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== 'string' || query.trim() === '') {
    return res.status(400).json({ suggestions: [], error: 'Invalid query provided' });
  }

  try {
    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: `Given the text "${query}", suggest a list of 5 related completions or phrases.` },
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Use gpt-4 or gpt-3.5-turbo as needed
      messages,
      max_tokens: 100,
      temperature: 0.7,
    });

    const suggestionsRaw = response.choices[0]?.message?.content || '';
    const suggestions = suggestionsRaw
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    res.json({ suggestions });
  } catch (error) {
    console.error('Error with OpenAI API:', error.response?.data || error.message || error);
    res.status(500).json({ error: 'Failed to fetch suggestions from OpenAI' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
