/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { Trip, Activity, Expense, TravelMember } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, Map, Landmark, Calendar, MessageSquare, 
  Menu, X, Bell, Moon, Sun, Laptop, ShieldCheck, RefreshCw 
} from 'lucide-react';

// 引入模組化子組件
import Auth from './components/Auth';
import Home from './components/Home';
import Itinerary from './components/Itinerary';
import Finance from './components/Finance';
import MapContainer from './components/MapContainer';
import About from './components/About';

// 預設旅遊成員名單
const DEFAULT_MEMBERS: TravelMember[] = [
  { id: 'user_self', name: '小明', email: 'xiaoming@example.com' },
  { id: 'member_2', name: '大雄', email: 'daxiong@example.com' },
  { id: 'member_3', name: '靜香', email: 'shizuka@example.com' },
  { id: 'member_4', name: '胖虎', email: 'takeshi@example.com' }
];

// 預設行程項目 (清水寺、金閣寺、伏見稻荷大社等京都地標)
const DEFAULT_ACTIVITIES: Activity[] = [
  {
    id: 'act_1',
    tripId: 'kyoto_trip_2026',
    title: '伏見稻荷大社 千本鳥居參拜',
    category: 'sightseeing',
    date: '2026-07-12',
    startTime: '09:30',
    endTime: '12:00',
    locationName: 'Fushimi Inari-taisha, Kyoto',
    latitude: 34.9671,
    longitude: 135.7727,
    notes: '必看千本鳥居！建議早起避免人潮，穿好走的鞋子健行。',
    cost: 0,
    order: 0
  },
  {
    id: 'act_2',
    tripId: 'kyoto_trip_2026',
    title: '順正湯豆腐 本店午餐',
    category: 'food',
    date: '2026-07-12',
    startTime: '12:30',
    endTime: '14:00',
    locationName: 'Junsei Tofu, Kyoto',
    latitude: 35.0116,
    longitude: 135.7681,
    notes: '百年老店豆腐宴，清淡爽口，環境是優雅的日式庭園。',
    cost: 35,
    order: 1
  },
  {
    id: 'act_3',
    tripId: 'kyoto_trip_2026',
    title: '清水寺 ＆ 祇園花街和服散策',
    category: 'sightseeing',
    date: '2026-07-12',
    startTime: '14:30',
    endTime: '18:00',
    locationName: 'Kiyomizu-dera, Kyoto',
    latitude: 34.9949,
    longitude: 135.7850,
    notes: '漫步二年坂、三年坂、巽橋，體驗最道地的江戶風情。',
    cost: 45,
    order: 2
  }
];

// 預設記帳支出項目
const DEFAULT_EXPENSES: Expense[] = [
  {
    id: 'exp_1',
    tripId: 'kyoto_trip_2026',
    title: '順正豆腐午餐墊付',
    amount: 140,
    payerId: 'user_self',
    payerName: '小明',
    splitWith: ['user_self', 'member_2', 'member_3', 'member_4'],
    date: '2026-06-29',
    category: 'food'
  },
  {
    id: 'exp_2',
    tripId: 'kyoto_trip_2026',
    title: '京都地鐵一日券團體購買',
    amount: 32,
    payerId: 'member_2',
    payerName: '大雄',
    splitWith: ['user_self', 'member_2', 'member_3', 'member_4'],
    date: '2026-06-29',
    category: 'transport'
  }
];

export default function App() {
  // 核心主 Tab 導航狀態
  const [activeTab, setActiveTab] = useState<'home' | 'itinerary' | 'finance' | 'map' | 'about'>('home');
  
  // 側邊欄 RWD 收合狀態
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 當前登入使用者狀態
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userName, setUserName] = useState('小明');
  const [avatarUrl, setAvatarUrl] = useState('');

  // 旅遊行程主體
  const [trip, setTrip] = useState<Trip>({
    id: 'kyoto_trip_2026',
    title: 'Spring in Kyoto',
    startDate: '2026-07-12',
    endDate: '2026-07-22',
    budgetLimit: 1500
  });

  // 成員、行程、支出狀態 (有 localStorage 與 Firestore 雙向備份同步機制)
  const [members, setMembers] = useState<TravelMember[]>(DEFAULT_MEMBERS);
  const [activities, setActivities] = useState<Activity[]>(DEFAULT_ACTIVITIES);
  const [expenses, setExpenses] = useState<Expense[]>(DEFAULT_EXPENSES);

  // 選取的活動項目，用於傳遞給地圖進行定位
  const [selectedActivityForMap, setSelectedActivityForMap] = useState<Activity | null>(null);

  // 烤吐司訊息通知系統 (Toasts)
  const [toasts, setToasts] = useState<{ id: string; text: string; type: 'success' | 'info' | 'warn' }[]>([]);

  const addToast = (text: string, type: 'success' | 'info' | 'warn' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // 登入狀態變更
  const handleUserChanged = (user: User | null, customName?: string, customAvatar?: string) => {
    setCurrentUser(user);
    if (user) {
      const finalName = customName || user.displayName || '旅人';
      const finalAvatar = customAvatar || user.photoURL || '';
      
      setUserName(finalName);
      setAvatarUrl(finalAvatar);

      // 動態將當前登入旅人寫入 members 清單
      setMembers(prev => prev.map(m => {
        if (m.id === 'user_self') {
          return { ...m, name: finalName, avatar: finalAvatar };
        }
        return m;
      }));
      
      addToast(`歡迎回來，${finalName}！已成功連接 Firestore 雲端資料庫。`, 'success');
    } else {
      setUserName('小明');
      setAvatarUrl('');
      setMembers(DEFAULT_MEMBERS);
      addToast('已登出。目前切換為 Local 本地離線暫存模式。', 'info');
    }
  };

  // ==========================================
  // 資料同步載入機制：登入後從 Firestore 讀取，登出或離線時從 LocalStorage
  // ==========================================
  useEffect(() => {
    const loadData = async () => {
      if (currentUser) {
        try {
          // 1. 讀取活動行程
          const actQuery = await getDocs(collection(db, 'trips', trip.id, 'activities'));
          const actData: Activity[] = [];
          actQuery.forEach(docSnap => {
            actData.push({ ...docSnap.data(), id: docSnap.id } as Activity);
          });

          // 2. 讀取支出帳務
          const expQuery = await getDocs(collection(db, 'trips', trip.id, 'expenses'));
          const expData: Expense[] = [];
          expQuery.forEach(docSnap => {
            expData.push({ ...docSnap.data(), id: docSnap.id } as Expense);
          });

          if (actData.length > 0) setActivities(actData);
          if (expData.length > 0) setExpenses(expData);
        } catch (err) {
          console.error('Firestore 載入錯誤，切換 LocalStorage: ', err);
          loadFromLocal();
        }
      } else {
        loadFromLocal();
      }
    };

    loadData();
  }, [currentUser]);

  // 從 LocalStorage 載入
  const loadFromLocal = () => {
    const localActs = localStorage.getItem('KYOTO_ACTIVITIES');
    const localExps = localStorage.getItem('KYOTO_EXPENSES');
    if (localActs) setActivities(JSON.parse(localActs));
    if (localExps) setExpenses(JSON.parse(localExps));
  };

  // 持久化儲存本機 LocalStorage 作為備份，並同步上傳 Firestore
  const persistActivities = async (newActs: Activity[]) => {
    setActivities(newActs);
    localStorage.setItem('KYOTO_ACTIVITIES', JSON.stringify(newActs));
    
    if (currentUser) {
      try {
        // 全量同步或逐一上傳：本專案採用 Batch 同步或直接 setDoc 覆蓋以確保一致性
        for (const act of newActs) {
          await setDoc(doc(db, 'trips', trip.id, 'activities', act.id), act);
        }
      } catch (err) {
        console.error('Firestore 同步活動失敗：', err);
      }
    }
  };

  const persistExpenses = async (newExps: Expense[]) => {
    setExpenses(newExps);
    localStorage.setItem('KYOTO_EXPENSES', JSON.stringify(newExps));

    if (currentUser) {
      try {
        for (const exp of newExps) {
          await setDoc(doc(db, 'trips', trip.id, 'expenses', exp.id), exp);
        }
      } catch (err) {
        console.error('Firestore 同步支出失敗：', err);
      }
    }
  };

  // ==========================================
  // 行程 CRUD 操作
  // ==========================================
  const handleAddActivity = async (actData: Omit<Activity, 'id'>) => {
    const newId = 'act_' + Date.now();
    const newAct: Activity = { ...actData, id: newId };
    const updated = [...activities, newAct];
    await persistActivities(updated);
    addToast(`已成功安排新活動：${actData.title}`);
  };

  const handleUpdateActivity = async (updatedAct: Activity) => {
    const updated = activities.map(act => act.id === updatedAct.id ? updatedAct : act);
    await persistActivities(updated);
    addToast(`行程活動「${updatedAct.title}」內容已成功更新`);
  };

  const handleDeleteActivity = async (id: string) => {
    const target = activities.find(act => act.id === id);
    const updated = activities.filter(act => act.id !== id);
    await persistActivities(updated);
    
    if (currentUser) {
      try {
        await deleteDoc(doc(db, 'trips', trip.id, 'activities', id));
      } catch (err) {
        console.error(err);
      }
    }
    addToast(`已移除行程：${target?.title || '指定活動'}`, 'warn');
  };

  // 地圖定位聚焦橋接器
  const handleSelectActivityOnMap = (act: Activity) => {
    setSelectedActivityForMap(act);
    setActiveTab('map');
    addToast(`地圖已聚焦定位至：${act.title}`);
  };

  // ==========================================
  // 財務/支出 CRUD 操作
  // ==========================================
  const handleAddExpense = async (expData: Omit<Expense, 'id'>) => {
    const newId = 'exp_' + Date.now();
    const newExp: Expense = { ...expData, id: newId };
    const updated = [...expenses, newExp];
    await persistExpenses(updated);
    addToast(`已入帳開銷：${expData.title} (${expData.amount} USD)`);
  };

  const handleDeleteExpense = async (id: string) => {
    const target = expenses.find(exp => exp.id === id);
    const updated = expenses.filter(exp => exp.id !== id);
    await persistExpenses(updated);

    if (currentUser) {
      try {
        await deleteDoc(doc(db, 'trips', trip.id, 'expenses', id));
      } catch (err) {
        console.error(err);
      }
    }
    addToast(`已刪除該筆支出：${target?.title || ''}`, 'warn');
  };

  const handleClearExpenses = async () => {
    await persistExpenses([]);
    if (currentUser) {
      try {
        // 刪除所有 expenses
        for (const exp of expenses) {
          await deleteDoc(doc(db, 'trips', trip.id, 'expenses', exp.id));
        }
      } catch (err) {
        console.error(err);
      }
    }
    addToast('所有共享帳目已完成結算清空！', 'success');
  };

  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* 烤吐司訊息層 (Dynamic Toast alerts container) */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-2.5 max-w-sm">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.9 }}
              className={`p-4 rounded-2xl border text-xs font-semibold shadow-2xl backdrop-blur-xl flex items-center gap-2.5 ${
                t.type === 'warn' 
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                  : t.type === 'info' 
                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current animate-ping" />
              <span>{t.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 1. 側邊導航欄 (Sidebar Rail with responsive design) */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 md:w-20 bg-white/5 border-r border-white/10 backdrop-blur-2xl z-40 transition-transform duration-300 flex flex-col justify-between items-center py-8 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* LOGO 標誌 */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-[#FF385C] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF385C]/20 mb-8 cursor-pointer" onClick={() => setActiveTab('home')}>
            <Compass className="w-6 h-6 text-white animate-spin-slow" />
          </div>
          <span className="text-[10px] uppercase font-black tracking-widest text-white/20 block md:hidden">TRAVEL APP</span>
        </div>

        {/* 導航按鈕清單 */}
        <nav className="flex flex-col gap-6 w-full px-4 md:px-0">
          <button
            id="nav-home"
            onClick={() => { setActiveTab('home'); setIsSidebarOpen(false); }}
            className={`w-full md:w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              activeTab === 'home' ? 'bg-white text-black shadow-lg' : 'text-white/50 hover:bg-white/5 hover:text-white'
            }`}
            title="首頁儀表板"
          >
            <Laptop className="w-5 h-5" />
          </button>
          
          <button
            id="nav-itinerary"
            onClick={() => { setActiveTab('itinerary'); setIsSidebarOpen(false); }}
            className={`w-full md:w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              activeTab === 'itinerary' ? 'bg-white text-black shadow-lg' : 'text-white/50 hover:bg-white/5 hover:text-white'
            }`}
            title="行程細節規劃"
          >
            <Calendar className="w-5 h-5" />
          </button>

          <button
            id="nav-finance"
            onClick={() => { setActiveTab('finance'); setIsSidebarOpen(false); }}
            className={`w-full md:w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              activeTab === 'finance' ? 'bg-white text-black shadow-lg' : 'text-white/50 hover:bg-white/5 hover:text-white'
            }`}
            title="Splitwise記帳與理財"
          >
            <Landmark className="w-5 h-5" />
          </button>

          <button
            id="nav-map"
            onClick={() => { setActiveTab('map'); setIsSidebarOpen(false); }}
            className={`w-full md:w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              activeTab === 'map' ? 'bg-white text-black shadow-lg' : 'text-white/50 hover:bg-white/5 hover:text-white'
            }`}
            title="京都探索導航地圖"
          >
            <Map className="w-5 h-5" />
          </button>

          <button
            id="nav-about"
            onClick={() => { setActiveTab('about'); setIsSidebarOpen(false); }}
            className={`w-full md:w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              activeTab === 'about' ? 'bg-white text-black shadow-lg' : 'text-white/50 hover:bg-white/5 hover:text-white'
            }`}
            title="京都百科與系統指南"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </nav>

        {/* 底部雲端安全性宣告 */}
        <div className="mt-auto hidden md:flex flex-col items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-[7px] font-mono tracking-widest text-emerald-400 uppercase">SYNCED</span>
        </div>
      </aside>

      {/* 2. 手機版行動裝置專屬 Header Navbar */}
      <header className="md:hidden flex justify-between items-center bg-white/5 border-b border-white/10 px-6 py-4 sticky top-0 z-30 backdrop-blur-xl">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-white/5 border border-white/10 rounded-xl">
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-[#FF385C]" />
          <span className="font-extrabold text-sm tracking-widest uppercase">KYOTO TRAVEL</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden">
          {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <span className="text-xs">小</span>}
        </div>
      </header>

      {/* 3. 右側核心主要檢視內容區 (Main workspace shell) */}
      <main className="flex-1 p-6 md:p-10 flex flex-col gap-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* 頂部資訊對齊面板：Auth、同步狀態、系統宣告 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
          <div className="text-left">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF385C]">KYOTO CLOUD OFFICE</span>
            <div className="flex items-center gap-2.5 mt-0.5">
              <h2 className="text-xl font-bold tracking-tight text-white">Bento Travel Console</h2>
              {currentUser && (
                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-[9px] text-emerald-400 font-bold rounded-md uppercase font-sans tracking-wider flex items-center gap-1">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin-slow" />
                  Live Sync
                </span>
              )}
            </div>
          </div>

          {/* Firebase 整合 Auth 組件 */}
          <div className="self-stretch sm:self-auto flex justify-end">
            <Auth onUserChanged={handleUserChanged} />
          </div>
        </div>

        {/* 主 Tabs 顯示與過渡動畫 */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.25 }}
              >
                <Home 
                  trip={trip} 
                  activities={activities} 
                  expenses={expenses} 
                  members={members} 
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onSelectActivity={handleSelectActivityOnMap}
                  userName={userName}
                  avatarUrl={avatarUrl}
                />
              </motion.div>
            )}

            {activeTab === 'itinerary' && (
              <motion.div
                key="itinerary"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.25 }}
              >
                <Itinerary 
                  trip={trip} 
                  activities={activities} 
                  onAddActivity={handleAddActivity}
                  onUpdateActivity={handleUpdateActivity}
                  onDeleteActivity={handleDeleteActivity}
                  onSelectActivityOnMap={handleSelectActivityOnMap}
                />
              </motion.div>
            )}

            {activeTab === 'finance' && (
              <motion.div
                key="finance"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.25 }}
              >
                <Finance 
                  trip={trip} 
                  expenses={expenses} 
                  members={members} 
                  onAddExpense={handleAddExpense}
                  onDeleteExpense={handleDeleteExpense}
                  onClearExpenses={handleClearExpenses}
                />
              </motion.div>
            )}

            {activeTab === 'map' && (
              <motion.div
                key="map"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.25 }}
              >
                <MapContainer 
                  selectedActivity={selectedActivityForMap} 
                  activities={activities} 
                />
              </motion.div>
            )}

            {activeTab === 'about' && (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.25 }}
              >
                <About />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
