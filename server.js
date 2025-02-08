import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5002;
const AIML_API_KEY = '6cb41c23403144868c5befe28e649fc4'; // Replace with your actual API key

app.post('/update-api-key', (req, res) => {
  const { apiKey } = req.body;

  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(400).json({ error: 'Invalid API key provided' });
  }

  try {
    global.AIML_API_KEY = apiKey; // Update the global API key
    console.log('API key updated successfully'); // Debugging purposes
    res.status(200).json({ message: 'API key updated successfully' });
  } catch (error) {
    console.error('Failed to update API key:', error);
    res.status(500).json({ error: 'Failed to update API key' });
  }
});

app.post('/predict', async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ error: 'Invalid input text provided' });
  }

  try {
    const response = await fetch('https://api.aimlapi.com/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-1.5-pro',
        messages: [{ role: 'user', content: `From the given news: ${text} confirm the given news is real or fake and give justifications like a news detector` }],
        max_tokens: 512,
        stream: false,
      }),
    });

    const result = await response.json();
    const content = result?.choices?.[0]?.message?.content || 'No response received';

    res.json({ content });
  } catch (error) {
    console.error('Error calling AIML API:', error);
    res.status(500).json({ error: 'Error connecting to AIML API' });
  }
});


app.post('/suggest', async (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== 'string' || query.trim() === '') {
    return res.status(400).json({ suggestions: [], error: 'Invalid query provided' });
  }

  try {
    const response = await fetch('https://api.aimlapi.com/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-1.5-pro',
        messages: [
          {
            role: 'user',
            content: `Given the text "${query}", suggest a list of 5 related completions or phrases.`,
          },
        ],
        max_tokens: 100,
        temperature: 0.7,
        stream: false,
      }),
    });

    const data = await response.json();
    const suggestionsRaw = data.choices?.[0]?.message?.content || '';
    const suggestions = suggestionsRaw.split('\n').map((s) => s.trim()).filter((s) => s.length > 0);

    res.json({ suggestions });
  } catch (error) {
    console.error('Error with AIML API:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
