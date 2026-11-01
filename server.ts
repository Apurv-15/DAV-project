import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  buildStatisticalEvidenceForQuestion,
  createInitialDatasets,
  executeConfigurableCleaning,
} from './src/engine/analyticsEngine';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Server-side Gemini client initialization following @google/genai guidelines
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // In-memory analytical repository registry
  const datasetsStore = createInitialDatasets();
  const jobsStore: Record<
    string,
    { id: string; status: string; progress: number; datasetId: string }
  > = {};

  // 0. GET /api/datasets - Retrieve full server-side dataset registry
  app.get('/api/datasets', (_req, res) => {
    return res.json({ datasets: datasetsStore });
  });

  // 1. POST /api/datasets/upload - Register or upsert uploaded dataset
  app.post('/api/datasets/upload', (req, res) => {
    const { dataset } = req.body || {};
    if (dataset && typeof dataset.id === 'string' && dataset.id.trim()) {
      const existingIdx = datasetsStore.findIndex((d) => d.id === dataset.id);
      if (existingIdx >= 0) {
        datasetsStore[existingIdx] = dataset;
      } else {
        datasetsStore.unshift(dataset);
      }
      const jobId = `job-${Date.now()}`;
      jobsStore[jobId] = {
        id: jobId,
        status: 'Completed',
        progress: 100,
        datasetId: dataset.id,
      };
      return res.json({ status: 'Completed', jobId, datasetId: dataset.id });
    }
    return res.status(400).json({ error: 'Invalid dataset payload' });
  });

  // 1b. PUT /api/datasets/:id - Sync updated dataset (schema remap or cleaning)
  app.put('/api/datasets/:id', (req, res) => {
    const { dataset } = req.body || {};
    const targetId = req.params.id;
    if (!dataset || typeof targetId !== 'string') {
      return res.status(400).json({ error: 'Invalid dataset update payload' });
    }
    const idx = datasetsStore.findIndex((d) => d.id === targetId);
    if (idx >= 0) {
      datasetsStore[idx] = dataset;
    } else {
      datasetsStore.unshift(dataset);
    }
    return res.json({ status: 'Synchronized', datasetId: targetId });
  });

  // 1c. DELETE /api/datasets/:id - Remove dataset from server registry
  app.delete('/api/datasets/:id', (req, res) => {
    const targetId = req.params.id;
    const idx = datasetsStore.findIndex((d) => d.id === targetId);
    if (idx >= 0 && datasetsStore.length > 1) {
      datasetsStore.splice(idx, 1);
    }
    return res.json({ status: 'Deleted', datasetId: targetId });
  });

  // 2. GET /api/datasets/:id/profile
  app.get('/api/datasets/:id/profile', (req, res) => {
    const ds =
      datasetsStore.find((d) => d.id === req.params.id) || datasetsStore[0];
    return res.json({
      id: ds.id,
      name: ds.name,
      rawRowCount: ds.rawRowCount,
      cleanedRowCount: ds.cleanedRowCount,
      columnCount: ds.columnCount,
      schemaMapping: ds.schemaMapping,
      columns: ds.columns,
    });
  });

  // 3. GET /api/datasets/:id/quality
  app.get('/api/datasets/:id/quality', (req, res) => {
    const ds =
      datasetsStore.find((d) => d.id === req.params.id) || datasetsStore[0];
    return res.json(ds.quality);
  });

  // 4. POST /api/datasets/:id/clean
  app.post('/api/datasets/:id/clean', (req, res) => {
    const idx = datasetsStore.findIndex((d) => d.id === req.params.id);
    const target = idx >= 0 ? datasetsStore[idx] : datasetsStore[0];
    const config = req.body?.config || target.cleaningConfig;
    const cleaned = executeConfigurableCleaning(target, config);
    if (idx >= 0) {
      datasetsStore[idx] = cleaned;
    }
    return res.json({
      status: 'Cleaned',
      beforeAfter: cleaned.beforeAfter,
      cleaningLogs: cleaned.cleaningLogs,
      quality: cleaned.quality,
    });
  });

  // 5. POST /api/datasets/:id/analyse
  app.post('/api/datasets/:id/analyse', (req, res) => {
    const ds =
      datasetsStore.find((d) => d.id === req.params.id) || datasetsStore[0];
    const jobId = `job-${Date.now()}`;
    jobsStore[jobId] = {
      id: jobId,
      status: 'Completed',
      progress: 100,
      datasetId: ds.id,
    };
    return res.json({ jobId, status: 'Completed', datasetId: ds.id });
  });

  // 6. GET /api/jobs/:id
  app.get('/api/jobs/:id', (req, res) => {
    const job = jobsStore[req.params.id] || {
      id: req.params.id,
      status: 'Completed',
      progress: 100,
      datasetId: datasetsStore[0].id,
    };
    return res.json(job);
  });

  // 7. GET /api/datasets/:id/dashboard
  app.get('/api/datasets/:id/dashboard', (req, res) => {
    const ds =
      datasetsStore.find((d) => d.id === req.params.id) || datasetsStore[0];
    return res.json(ds.baseAggregations);
  });

  // 8. GET /api/datasets/:id/charts
  app.get('/api/datasets/:id/charts', (req, res) => {
    const ds =
      datasetsStore.find((d) => d.id === req.params.id) || datasetsStore[0];
    return res.json(ds.chartRecommendations);
  });

  // 9. GET /api/datasets/:id/insights
  app.get('/api/datasets/:id/insights', (req, res) => {
    const ds =
      datasetsStore.find((d) => d.id === req.params.id) || datasetsStore[0];
    return res.json(ds.aiInsights);
  });

  // 10. POST /api/datasets/:id/ask (Server-side Gemini API grounded in actual computed statistics)
  app.post('/api/datasets/:id/ask', async (req, res) => {
    const {
      question,
      statisticalContext,
      fallbackExplanation,
      conversationHistory,
    } = req.body || {};

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res
        .status(400)
        .json({ error: 'A non-empty analytical question is required.' });
    }

    const ds =
      datasetsStore.find((d) => d.id === req.params.id) || datasetsStore[0];

    const computed = buildStatisticalEvidenceForQuestion(ds, question.trim());
    const contextToUse = statisticalContext || computed.compactContextJson;
    const recentTurns = Array.isArray(conversationHistory)
      ? conversationHistory
          .slice(-4)
          .map(
            (m: { role?: string; content?: string }) =>
              `${m.role === 'user' ? 'User' : 'Analyst'}: ${String(m.content || '').slice(0, 280)}`
          )
          .join('\n')
      : '';

    try {
      const ai = getGeminiClient();
      if (!ai) {
        return res.json({
          answer: fallbackExplanation || computed.deterministicAnswer,
          evidence: computed.evidence,
          sqlEquivalent: computed.sqlEquivalent,
          source: 'statistical_engine',
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `${recentTurns ? `Recent Thread Context:\n${recentTurns}\n\n` : ''}User Analytical Question: "${question.trim()}"\n\nVerified Pre-Computed Dataset & Entity Telemetry Statistics (JSON):\n${contextToUse}`,
        config: {
          systemInstruction:
            'You are GLOBAL INSIGHT, a senior e-commerce data scientist and executive business intelligence analyst. ' +
            'Strictly answer the user question using ONLY the verified pre-computed numbers provided in the JSON context (including matchedEntity YoY/QoQ/MoM growth rates, monthlySeries, and topCountries when present). ' +
            'NEVER invent, guess, or extrapolate revenue figures, customer counts, or percentages. ' +
            'Keep your response concise (2 to 4 short paragraphs or bullet points), clear, and quantitative.',
        },
      });

      const text =
        response.text || fallbackExplanation || computed.deterministicAnswer;
      return res.json({
        answer: text,
        evidence: computed.evidence,
        sqlEquivalent: computed.sqlEquivalent,
        source: 'gemini-3.8-flash',
      });
    } catch {
      // If Gemini quota or API key is unavailable, return the verified statistical explanation seamlessly
      return res.json({
        answer: fallbackExplanation || computed.deterministicAnswer,
        evidence: computed.evidence,
        sqlEquivalent: computed.sqlEquivalent,
        source: 'statistical_engine_fallback',
      });
    }
  });

  // 11. GET /api/datasets/:id/export
  app.get('/api/datasets/:id/export', (req, res) => {
    const ds =
      datasetsStore.find((d) => d.id === req.params.id) || datasetsStore[0];
    return res.json({
      dataset: ds.name,
      completedAt: ds.completedAt,
      quality: ds.quality,
      beforeAfter: ds.beforeAfter,
      aggregations: ds.baseAggregations,
      insights: ds.aiInsights,
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GLOBAL INSIGHT server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
