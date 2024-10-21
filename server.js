import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';  // Use node-fetch for HTTP requests

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5002;

// Define your Hugging Face Space URL (modify if needed)
const SPACE_URL = 'https://qwen-qwen2-5.hf.space';

// POST endpoint for predictions
app.post('/predict', async (req, res) => {
  const { text } = req.body;

  try {
    // Step 1: Modify system session (similar to the first Python `client.predict` call)
    const modifySessionResponse = await fetch(`${SPACE_URL}/call/modify_system_session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [
          `Given an input (whether it's a link or a question), verify its accuracy using available online resources. Determine if the information is true or false. Provide the output in the following format:

          Prediction: A one-line statement confirming if the information is true or false with a percentage of certainty.
          Justification: A brief paragraph (under 1000 characters) explaining the reasoning behind the prediction.`,
        ],
      }),
    });

    if (!modifySessionResponse.ok) {
      throw new Error(`Failed to modify system session: ${modifySessionResponse.status}`);
    }

    // Step 2: Model chat prediction (similar to the second Python `client.predict` call)
    const predictionResponse = await fetch(`${SPACE_URL}/call/model_chat_1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [
          text,  // Send the user query (from req.body.text)
          [],  // Empty history
          `Given an input (whether it's a link or a question), verify its accuracy using available online resources. Determine if the information is true or false. Provide the output in the following format:

          Prediction: A one-line statement confirming if the information is true or false with a percentage of certainty.
          Justification: A brief paragraph (under 1000 characters) explaining the reasoning behind the prediction.`,
          72,  // The radio parameter value (change if necessary)
        ],
      }),
    });

    if (!predictionResponse.ok) {
      throw new Error(`Failed to fetch prediction: ${predictionResponse.status}`);
    }

    const result = await predictionResponse.json();
    res.json({ prediction: result });
  } catch (error) {
    console.error('Error fetching prediction:', error);
    res.status(500).json({ error: "Error connecting to the Hugging Face Space API" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
