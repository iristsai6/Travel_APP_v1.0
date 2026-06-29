/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, HelpCircle, Send, Sparkles, AlertTriangle, 
  Map, MessageSquare, BookOpen, User, ArrowRight, Loader2, Landmark 
} from 'lucide-react';

export default function About() {
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; text: string; time: string }[]>([
    {
      sender: 'ai',
      text: '你好！我是您的京都專屬 AI 旅遊助手。您可以向我詢問關於京都當季名產、必玩景點、和服體驗、公車票價或行程衝突調整建議！請在下方輸入您的旅遊疑問：',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  // 旅遊指南精選清單
  const travelTips = [
    { title: '京都巴士與地下鐵交通攻略', content: '建議購買「地下鐵・巴士一日券」（大人 1100 日圓），可在一天內無限次搭乘京都市營巴士、地下鐵與京都巴士，節省大量交通費。' },
    { title: '神社參拜禮儀', content: '進入神社時，請在手水舍洗手與漱口。參拜時實行「二禮、二拍手、一禮」：鞠躬兩次、拍手兩次、默禱許願，最後再深深鞠躬一次。' },
    { title: '和服體驗與預約須知', content: '祇園與清水寺周邊有大量優質和服出租店。請提前上網預約，建議預約早上 9:00 第一梯次，可選取最新最漂亮的款式，且人潮較少。' }
  ];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userMessage = inputText.trim();
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages(prev => [...prev, { sender: 'user', text: userMessage, time: currentTime }]);
    setInputText('');
    setLoading(true);

    try {
      // 呼叫伺服器端後端的 Gemini 代理 API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();
      const aiResponse = data.reply || '抱歉，我的大腦出了點小狀況，請稍後再試一次！';

      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: aiResponse,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (error) {
      console.error('Gemini API 請求錯誤：', error);
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: '很抱歉，我現在無法連線到雲端大腦。請確保您的伺服器端 API 金鑰設定正確，或者再問我一次！',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full text-left">
      {/* 左側京都百科 (占 5 欄) */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 text-left">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#FF385C]" />
            京都探索必知與文化禮儀
          </h3>
          <p className="text-xs text-white/50 mb-6 leading-relaxed">
            京都是日本的文化之心，擁有超過千年的京城歷史、十七處世界文化遺產，以及無數充滿韻味的石疊小徑。在出發前，先閱讀我們精選的實用小知識：
          </p>

          <div className="space-y-4">
            {travelTips.map((tip, idx) => (
              <div key={idx} className="p-4 bg-white/2 hover:bg-white/5 rounded-2xl border border-white/5 transition-all">
                <p className="text-xs font-bold text-white mb-1.5 flex items-center gap-2">
                  <Landmark className="w-3.5 h-3.5 text-[#FF385C]" />
                  {tip.title}
                </p>
                <p className="text-[11px] text-white/50 leading-relaxed">{tip.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 關於本專案 */}
        <div className="bg-gradient-to-br from-[#FF385C]/10 to-indigo-500/5 border border-white/10 rounded-[32px] p-6 text-left">
          <h4 className="font-bold text-xs uppercase tracking-wider text-[#FF385C]">系統資訊與特色</h4>
          <p className="text-[11px] text-white/60 mt-3 leading-relaxed">
            本系統是一套完全實踐 Bento Grid 與 Glassmorphism 工藝設計的企業級旅遊 Web App。採用極速 Vite、React 18 技術，並深度整合了 <b>Firebase Auth 登入雲端同步</b>、<b>Firestore 即時資料庫資料 CRUD</b>、以及 <b>Splitwise 結算餘額分析演算法</b>。
          </p>
          <div className="mt-4 flex gap-4 text-[10px] font-mono text-white/30">
            <span>React v19.0</span>
            <span>Vite v6.2</span>
            <span>Tailwind v4.0</span>
          </div>
        </div>
      </div>

      {/* 右側 Gemini AI 旅行顧問聊天室 (占 7 欄) */}
      <div className="lg:col-span-7">
        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 h-[500px] flex flex-col">
          {/* 聊天室頂部 */}
          <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF385C]/10 text-[#FF385C] flex items-center justify-center">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Gemini AI 京都探索顧問</h3>
                <p className="text-[9px] text-white/40 mt-0.5">基於 Google Gemini 1.5/2.5 伺服器端智能分析</p>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              ONLINE
            </span>
          </div>

          {/* 訊息對話區塊 */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
            {messages.map((msg, idx) => {
              const isAI = msg.sender === 'ai';
              return (
                <div key={idx} className={`flex gap-3 max-w-[85%] ${isAI ? 'mr-auto text-left' : 'ml-auto flex-row-reverse text-right'}`}>
                  {/* 頭像 */}
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    isAI ? 'bg-[#FF385C]/10 text-[#FF385C] border border-[#FF385C]/20' : 'bg-white/10 text-white'
                  }`}>
                    {isAI ? 'AI' : 'ME'}
                  </div>

                  <div>
                    <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isAI 
                        ? 'bg-white/5 border border-white/10 text-white/90' 
                        : 'bg-[#FF385C] text-white rounded-tr-none shadow-lg shadow-[#FF385C]/10'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-white/30 block mt-1 font-mono">{msg.time}</span>
                  </div>
                </div>
              );
            })}
            
            {loading && (
              <div className="flex gap-3 max-w-[85%] mr-auto text-left">
                <div className="w-7 h-7 rounded-lg bg-[#FF385C]/10 text-[#FF385C] border border-[#FF385C]/20 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
                <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl text-xs text-white/50 flex items-center gap-2">
                  <span>顧問正在翻閱京都古籍、規劃最佳路線中</span>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 推薦問題選項 */}
          <div className="flex flex-wrap gap-2 mb-3">
            {['清水寺一日遊路線怎麼排？', '伏見稻荷大社參拜指南', '京都必吃湯豆腐老店推薦', '和服預約與挑選貼心提醒'].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setInputText(q)}
                className="text-[10px] bg-white/5 border border-white/5 hover:border-white/15 hover:bg-white/10 text-white/60 hover:text-white px-2.5 py-1 rounded-lg transition-all cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* 輸入表單 */}
          <form onSubmit={handleSend} className="relative flex gap-2 pt-2 border-t border-white/5">
            <input
              type="text"
              required
              placeholder="例如：京都三日遊不重複推薦景點有哪些？"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-4 pr-12 py-3.5 text-xs text-white placeholder-white/30 focus:border-white/20 focus:outline-none transition-all"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="absolute right-2 top-[14px] bg-white text-black p-2 rounded-xl hover:bg-opacity-90 active:scale-95 disabled:opacity-45 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
