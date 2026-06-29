/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// 懶載入 / 延遲初始化 Gemini 用戶端，避免因 Key 缺失而於啟動時崩潰
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. AI 旅遊助手聊天代理 API 路由 (Chat Proxy Endpoint)
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    let ai;
    try {
      ai = getGeminiClient();
    } catch (e) {
      return res.json({
        reply: '【系統提示】目前專案後端未設定 GEMINI_API_KEY 金鑰。請於 AI Studio 右上方點擊「Settings > Secrets」設定後重試！現在我將以京都當地小精靈的身份代答：清水寺與千本鳥居是京都旅行不可錯空的絕美地標喔！'
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: message,
      config: {
        systemInstruction: `你是 Google L6 Staff Software Engineer 與專業的京都旅遊管家。
        你對京都市（Kiyomizu-dera, Kinkaku-ji, Fushimi Inari, Gion, Arashiyama 等）的歷史古蹟、神社禮節、米其林美食、和服體驗、公車市營地鐵乘車票價擁有頂級的了解。
        請使用親切、專業、流暢的繁體中文，為使用者提供客製化的京都旅行計畫與貼心小提醒。`
      }
    });

    const reply = response.text || '我正在精算這條路線，請您稍等我一下！';
    res.json({ reply });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// 2. 啟動伺服器並掛載 Vite 開發中間件
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kyoto Travel Console is live at http://localhost:${PORT}`);
  });
}

startServer();
