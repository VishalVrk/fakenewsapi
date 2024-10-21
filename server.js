import express from 'express';
import cors from 'cors';
import { Client } from '@gradio/client';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5002;

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
        radio: 72, // This value can be changed based on your API requirements
      }
    );

    // Step 4: Send the prediction result back to the client
    res.json({ prediction: result.data });
  } catch (error) {
    console.error('Error connecting to Gradio API:', error);
    res.status(500).json({ error: "Error connecting to Gradio API" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
