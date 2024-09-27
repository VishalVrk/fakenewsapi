import express from 'express';
import cors from 'cors';
import { Client } from '@gradio/client';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5002;

app.post('/predict', async (req, res) => {
  const { text } = req.body;
  try {
    const client = await Client.connect("shoukaku/fake-health-news-detection");
    const result = await client.predict("/_predict", { text });
    res.json({ prediction: result.data });
  } catch (error) {
    res.status(500).json({ error: "Error connecting to Gradio API" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
