/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Compass, BookOpen, Landmark, Navigation, MapPin, 
  Coffee, Calendar, HelpCircle, Heart, ShieldCheck, Cpu 
} from 'lucide-react';

export default function About() {
  // 旅遊指南精選清單
  const travelTips = [
    { 
      title: '京都巴士與地下鐵交通攻略', 
      icon: <Navigation className="w-4 h-4 text-[#FF385C]" />,
      content: '建議購買「地下鐵・巴士一日券」（大人 1100 日圓），可在一天內無限次搭乘京都市營巴士、地下鐵與京都巴士，節省大量交通費與排隊購票時間。' 
    },
    { 
      title: '神社參拜必知禮儀', 
      icon: <Landmark className="w-4 h-4 text-[#FF385C]" />,
      content: '進入神社時，請在手水舍洗手與漱口。參拜時實行「二禮、二拍手、一禮」：鞠躬兩次、拍手兩次、默禱許願，最後再深深鞠躬一次表示敬意。' 
    },
    { 
      title: '和服體驗與預約須知', 
      icon: <Heart className="w-4 h-4 text-[#FF385C]" />,
      content: '祇園與清水寺周邊有大量優質和服出租店。請務必提前上網預約，建議預約早上 9:00 第一梯次，可選取最新、最豐富的款式，且此時店內人潮較少。' 
    },
    { 
      title: '清水寺一日遊黃金路線', 
      icon: <MapPin className="w-4 h-4 text-[#FF385C]" />,
      content: '完美規劃：清水五條 → 租借和服 → 五条坂 → 清水寺本堂・舞台 → 地主神社 → 音羽之瀑 → 二年坂、三年坂散步 → 八坂神社 → 祇園晚餐。' 
    },
    { 
      title: '伏見稻荷大社參拜指南', 
      icon: <Compass className="w-4 h-4 text-[#FF385C]" />,
      content: '千本鳥居是京都最知名的地標。整座稻荷山爬完約需 2-3 小時，山頂有無人神社與眺望京都市區的絕佳觀景點。建議攜帶充足水分，穿著舒適運動鞋。' 
    },
    { 
      title: '京都必吃湯豆腐老店推薦', 
      icon: <Coffee className="w-4 h-4 text-[#FF385C]" />,
      content: '推薦南禪寺附近的「順正湯豆腐」與「奧丹湯豆腐」。品嚐傳統昆布高湯與手工豆腐的清純原味，在百年優雅日式庭園中用餐，體驗視覺與味覺的雙重享受。' 
    }
  ];

  return (
    <div className="flex flex-col gap-8 w-full text-left">
      {/* 歡迎 Banner */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-[#FF385C]/20 via-indigo-500/10 to-transparent border border-white/10 p-8 md:p-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF385C]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#FF385C]">KYOTO ENCYCLOPEDIA</span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mt-2 mb-3">
            京都百科與系統指南
          </h2>
          <p className="text-xs md:text-sm text-white/70 leading-relaxed">
            歡迎來到京都自主漫遊控制台！本頁面為您整理了京都必玩景點、參拜文化與交通攻略，並提供系統的功能架構說明，幫助您更輕鬆地享受優雅的古都之旅。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* 左側京都百科 (占 7 欄) */}
        <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-[32px] p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#FF385C]" />
              古都探索必知與文化禮儀
            </h3>
            <p className="text-xs text-white/50 mb-6 leading-relaxed">
              京都是日本的文化之心，擁有超過千年的京城歷史、十七處世界文化遺產，以及無數充滿韻味的石疊小徑。在出發前，先閱讀我們為您精選的實用小知識：
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {travelTips.map((tip, idx) => (
                <div key={idx} className="p-4 bg-white/2 hover:bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                      {tip.icon}
                      {tip.title}
                    </p>
                    <p className="text-[11px] text-white/50 leading-relaxed">{tip.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右側系統指南與特色 (占 5 欄) */}
        <div className="lg:col-span-5 flex flex-col gap-6 h-full">
          {/* 系統技術特色 */}
          <div className="flex-1 bg-gradient-to-br from-[#FF385C]/10 to-indigo-500/5 border border-white/10 rounded-[32px] p-6 text-left flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-base mb-4 flex items-center gap-2 text-white">
                <Cpu className="w-4 h-4 text-[#FF385C]" />
                系統技術規格與特色
              </h3>
              <p className="text-xs text-white/60 leading-relaxed mb-6">
                本系統是一套完全實踐 Bento Grid 與 Glassmorphism 工藝設計的企業級旅遊 Web App，完全適配離線/雲端雙儲存模式：
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Firebase Live Sync 雲端同步</h4>
                    <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed">
                      使用 Firebase Authentication 進行會員登入。登入後，行程與記帳開銷會即時自動上傳備份至 Firestore 資料庫，多裝置無縫同步。
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Bento 智能行程管理</h4>
                    <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed">
                      支援行程活動新增、修改、刪除（CRUD）。提供時間衝突自動偵測警示，完美銜接各個景點。
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-md bg-[#FF385C]/10 text-[#FF385C] flex items-center justify-center shrink-0 mt-0.5">
                    <Landmark className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Splitwise 共享開銷理財</h4>
                    <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed">
                      內建智能結算演算法，自動簡化多人債務關係，一鍵計算出最少轉帳次數的清償方案。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between items-center border-t border-white/5 pt-4 text-[10px] font-mono text-white/30">
              <span>React v19.0</span>
              <span>Vite v6.2</span>
              <span>Tailwind v4.0</span>
            </div>
          </div>

          {/* 常見問題指南 */}
          <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 text-left">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#FF385C] flex items-center gap-2 mb-3">
              <HelpCircle className="w-3.5 h-3.5" />
              常見問題與說明
            </h4>
            <div className="space-y-3 text-[11px] text-white/60 leading-relaxed">
              <div>
                <p className="font-semibold text-white">Q: 我沒有登入也可以使用本系統嗎？</p>
                <p className="text-white/40 mt-0.5">A: 可以！系統會自動將資料儲存在您瀏覽器的 LocalStorage 中，適合單機快速記錄與體驗。</p>
              </div>
              <div>
                <p className="font-semibold text-white">Q: 登入後的資料會跟原本本地的重疊嗎？</p>
                <p className="text-white/40 mt-0.5">A: 登入後系統將優先讀取您在 Firestore 雲端資料庫的專屬旅遊資料，並與雲端即時同步。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
