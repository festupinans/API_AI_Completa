import express, { Request, Response } from 'express';
import { OpenRouter } from '@openrouter/sdk';
import dotenv from 'dotenv';
import path from 'path';

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
  console.log('[GET] /health -> Petición de salud recibida.');
  res.json({ status: 'API running correctly' });
});

// Endpoint para el frontend de pruebas
app.get('/front_test_ia', (req: Request, res: Response) => {
  console.log('[GET] /front_test_ia -> Intentando servir public/test.html');
  const filePath = path.join(process.cwd(), 'public', 'test.html');
  console.log(`[GET] /front_test_ia -> Ruta calculada: ${filePath}`);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('[GET] /front_test_ia -> Error al enviar el archivo:', err);
      // Pasa el error al siguiente middleware pero no rompas
      res.status(404).json({
        message: "Not found",
        code: "NOT_FOUND",
        errorInfo: err.message,
        path: filePath
      });
    } else {
      console.log('[GET] /front_test_ia -> Archivo enviado correctamente.');
    }
  });
});

// Endpoint principal para hacer preguntas a la IA
app.post('/api/ask', async (req: Request, res: Response) => {
  console.log('[POST] /api/ask -> Petición recibida.');
  try {
    const { message } = req.body;
    console.log(`[POST] /api/ask -> Mensaje extraído: "${message}"`);

    if (!message) {
      console.log('[POST] /api/ask -> Error: El mensaje está vacío.');
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    // Llamar a OpenRouter
    console.log('[POST] /api/ask -> Preparando para llamar a OpenRouter con el modelo openrouter/free...');
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

    console.log('[POST] /api/ask -> Respuesta recibida de OpenRouter.');
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

// Endpoint para peticiones en Streaming (Ideal para Unity)
app.post('/api/ask/stream', async (req: Request, res: Response) => {
  console.log('[POST] /api/ask/stream -> Petición de streaming recibida.');
  try {
    const { message } = req.body;

    if (!message) {
      res.status(400).send('Message is required');
      return;
    }

    // Cabeceras HTTP para streaming de texto plano
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Connection': 'keep-alive'
    });

    const completion = await openRouter.chat.send({
      chatGenerationParams: {
        model: 'openrouter/free',
        stream: true,
        messages: [{ role: 'user', content: String(message) }]
      }
    });

    // Iterar los fragmentos asíncronamente mientras se generan
    for await (const chunk of completion) {
      const textChunk = chunk.choices[0]?.delta?.content || '';
      if (textChunk) {
        res.write(textChunk); // Enviar inmediatamente al cliente
      }
    }
    
    console.log('[POST] /api/ask/stream -> Streaming finalizado exitosamente.');
    res.end();
  } catch (error) {
    console.error('Error en streaming OpenRouter:', error);
    if (!res.headersSent) {
      res.status(500).send('Error processing request: ' + error);
    } else {
      res.end('\n[Error procesando el resto del mensaje]');
    }
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ API running on http://localhost:${PORT}`);
  console.log(`📝 Use POST http://localhost:${PORT}/api/ask to ask questions`);
  console.log(`🎨 Test UI available at http://localhost:${PORT}/front_test_ia`);
});
