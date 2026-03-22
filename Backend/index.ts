import express, { Request, Response } from 'express';
import { OpenRouter } from '@openrouter/sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Inicializar OpenRouter con API_KEY del .env
const openRouter = new OpenRouter({
  apiKey: process.env.API_KEY,
});

// Endpoint de prueba
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'API running correctly' });
});

// Endpoint principal para hacer preguntas a la IA
app.post('/api/ask', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    // Llamar a OpenRouter
    const completion = await openRouter.chat.send({
      chatGenerationParams: {
        model: 'openrouter/free',
        messages: [
          {
            role: 'user',
            content: String(message),
          },
        ],
      }
    });

    const aiResponse = completion.choices[0].message.content;
    const modelUsed = (completion as any).model || 'unknown';

    res.json({
      success: true,
      message: message,
      response: aiResponse,
      model: modelUsed,
    });
  } catch (error) {
    console.error('Error calling OpenRouter:', error);
    res.status(500).json({
      success: false,
      error: 'Error processing request',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ API running on http://localhost:${PORT}`);
  console.log(`📝 Use POST http://localhost:${PORT}/api/ask to ask questions`);
});
