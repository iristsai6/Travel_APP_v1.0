/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Activity, Expense, TravelMember, Trip } from '../types';
import { calculateCountdown, analyzeBudget, calculateDailyProgress } from '../utils/algorithm';
import { motion } from 'motion/react';
import { 
  Compass, Calendar, Clock, Landmark, Navigation, ArrowUpRight, 
  MapPin, CloudSun, Users, CheckCircle, TrendingUp, Sparkles, Heart 
} from 'lucide-react';

interface HomeProps {
  trip: Trip;
  activities: Activity[];
  expenses: Expense[];
  members: TravelMember[];
  onNavigateTab: (tab: 'home' | 'itinerary' | 'finance' | 'map' | 'about') => void;
  onSelectActivity: (act: Activity) => void;
  userName: string;
  avatarUrl: string;
}

export default function Home({
  trip,
  activities,
  expenses,
  members,
  onNavigateTab,
  onSelectActivity,
  userName,
  avatarUrl
}: HomeProps) {
  const countdown = calculateCountdown(trip.startDate);
  const budget = analyzeBudget(expenses, trip.budgetLimit);
  
  // 篩選出今日的所有行程活動
  const todayStr = new Date().toISOString().split('T')[0];
  const todayActivities = activities.filter(act => act.date === todayStr);
  const displayActivities = todayActivities.length > 0 
    ? todayActivities 
    : activities.slice(0, 3); // 若今日無行程，預定展示前三個

  const dailyProgress = calculateDailyProgress(todayActivities);

  // 模擬今日步數 (可點擊按鈕增加，象徵運動與探索感)
  const [steps, setSteps] = useState(14280);

  const handleWalk = () => {
    setSteps(prev => prev + Math.floor(Math.random() * 800) + 200);
  };

  return (
    <div className="flex flex-col gap-8 text-left">
      
      {/* 頂部歡迎與天氣橫幅 (Welcome Banner) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white flex items-center gap-2">
            探索京都和服之旅
            <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
          </h1>
          <p className="text-white/50 text-sm mt-1.5 font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#FF385C]" />
            {trip.startDate} — {trip.endDate} • 10 日精緻日本行
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/5 border border-white/10 rounded-full px-4.5 py-2.5 flex items-center gap-3.5 shadow-lg">
            <CloudSun className="w-5 h-5 text-yellow-400" />
            <div className="text-left">
              <span className="text-xs font-semibold text-white/40 block tracking-widest uppercase">KYOTO WEATHER</span>
              <span className="text-sm font-bold text-white">18°C • 晴朗偶晴天</span>
            </div>
          </div>
        </div>
      </div>

      {/* 核心 3x4 Bento Grid 卡片網格佈局 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[110px] md:auto-rows-[120px]">
        
        {/* 大卡片 (左下)：京都目的地 Hero 橫圖 ＆ 旅行夥伴 (Col: 8, Row: 3) */}
        <div className="md:col-span-8 md:row-span-3 bg-white/5 border border-white/10 rounded-[36px] p-8 overflow-hidden relative group flex flex-col justify-between">
          {/* 流光渲染背景 */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-[#FF385C]/15 pointer-events-none" />
          
          <div className="relative z-10 flex justify-between items-start">
            <span className="px-4 py-1.5 bg-white/10 border border-white/10 rounded-full text-[10px] font-bold text-white/80 tracking-widest uppercase backdrop-blur-sm">
              {countdown > 0 ? '即將出發' : countdown === 0 ? '正在進行' : '精彩回憶'}
            </span>
            <div className="text-right">
              <div className="text-4xl font-bold font-mono tracking-tight text-white">
                {countdown > 0 ? `${countdown}` : countdown === 0 ? '0' : '已結束'}
              </div>
              <div className="text-[9px] text-white/50 tracking-widest uppercase font-semibold mt-0.5">DAYS TO GO</div>
            </div>
          </div>

          <div className="relative z-10 max-w-lg mt-6">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight tracking-tight">
              伏見稻荷大社、清水寺參拜與和服漫步
            </h2>
            
            {/* 旅行夥伴與頭像 */}
            <div className="flex gap-3">
              <div className="flex -space-x-2">
                {members.map((member, idx) => (
                  <div 
                    key={member.id} 
                    className="w-8 h-8 rounded-full border-2 border-[#0a0a0a] bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden"
                    title={member.name}
                  >
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      member.name.substring(0, 2)
                    )}
                  </div>
                ))}
              </div>
              <span className="text-xs text-white/60 self-center font-medium">
                {userName ? `${userName} ＆ ${members.length - 1}位同伴共同編輯` : `${members.length} 位冒險成員共同旅行中`}
              </span>
            </div>
          </div>
        </div>

        {/* 右側：地圖縮圖定位卡片 (Col: 4, Row: 3) */}
        <div 
          onClick={() => onNavigateTab('map')}
          className="md:col-span-4 md:row-span-3 bg-white/5 border border-white/10 rounded-[36px] overflow-hidden relative group cursor-pointer flex flex-col justify-end"
        >
          {/* 地圖背景網格裝飾 */}
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] group-hover:scale-105 transition-transform duration-500" />
          
          {/* 中間動態地標針 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="w-9 h-9 bg-[#FF385C] rounded-full border-4 border-[#0a0a0a] flex items-center justify-center shadow-lg animate-bounce">
              <Navigation className="w-4 h-4 text-white rotate-45" />
            </div>
            <div className="w-10 h-1 bg-black/40 rounded-full blur-[2px] mt-1" />
          </div>

          <div className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2.5 rounded-xl border border-white/10">
            <ArrowUpRight className="w-4 h-4 text-white" />
          </div>

          <div className="p-6 bg-gradient-to-t from-[#0a0a0a] via-black/40 to-transparent relative z-10">
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">MAP NAVIGATION</p>
            <h3 className="text-base font-bold text-white mt-0.5">京都數位導航定位</h3>
            <p className="text-xs text-white/50 mt-1">目前定位：東山區 清水寺</p>
          </div>
        </div>

        {/* 下排左：財務總花費與拆帳摘要卡片 (Col: 4, Row: 3) */}
        <div 
          onClick={() => onNavigateTab('finance')}
          className="md:col-span-4 md:row-span-3 bg-[#0d0d0d] border border-white/5 rounded-[36px] p-6 cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Landmark className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-emerald-400 font-mono tracking-tight bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
              {budget.percentUsed > 100 ? '超支' : '預算充足'}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-white/40 uppercase tracking-widest block font-semibold">旅遊經費已花費</span>
            <h3 className="text-3xl font-extrabold font-mono text-white mt-1">${budget.totalSpent.toFixed(2)}</h3>
            <div className="w-full bg-white/5 rounded-full h-1.5 mt-3 overflow-hidden">
              <div 
                className="bg-emerald-400 h-full rounded-full transition-all duration-1000" 
                style={{ width: `${Math.min(100, budget.percentUsed)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-white/30 mt-2">
              <span>預算比例 {budget.actualPercent.toFixed(0)}%</span>
              <span>上限 ${trip.budgetLimit}</span>
            </div>
          </div>
        </div>

        {/* 下排中：接下來的行程 (Upcoming itinerary Timeline) (Col: 4, Row: 3) */}
        <div 
          onClick={() => onNavigateTab('itinerary')}
          className="md:col-span-4 md:row-span-3 bg-white/5 border border-white/10 rounded-[36px] p-6 cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold text-xs text-white uppercase tracking-widest flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#FF385C]" />
              接下來的行程 (TODAY)
            </h4>
            <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" />
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-2.5">
            {displayActivities.length === 0 ? (
              <p className="text-xs text-white/30 italic text-center py-4">今天尚無安排任何行程項目</p>
            ) : (
              displayActivities.map((act, idx) => (
                <div key={act.id} className="flex gap-3 items-center text-left">
                  <span className="text-[10px] font-bold font-mono text-white/40">{act.startTime}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  <span className="text-xs font-semibold text-white truncate flex-1">{act.title}</span>
                </div>
              ))
            )}
          </div>

          <p className="text-[10px] text-[#FF385C] font-semibold mt-2">
            共安排 {activities.length} 個精彩行程 ➔
          </p>
        </div>

        {/* 下排右：運動探索與今日完工進度 (Col: 4, Row: 2) */}
        <div 
          onClick={handleWalk}
          className="md:col-span-4 md:row-span-2 bg-[#FF385C] rounded-[36px] p-6 relative overflow-hidden group cursor-pointer flex flex-col justify-between"
        >
          {/* 光影粒子背景 */}
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/20 blur-3xl rounded-full" />
          
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase opacity-80 tracking-widest">每日足跡與進度</span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-bold font-sans">
              步數 +
            </span>
          </div>

          <div className="flex items-end justify-between mt-4">
            <div>
              <div className="text-3xl font-extrabold italic tracking-tight">{dailyProgress}%</div>
              <span className="text-[10px] opacity-75">行程完成率</span>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold font-mono">{(steps / 1000).toFixed(1)}k</div>
              <span className="text-[10px] opacity-75">探索步數</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
