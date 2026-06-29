/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Activity, ActivityCategory, Trip } from '../types';
import { checkItineraryConflicts, calculateCountdown, filterAndSortActivities } from '../utils/algorithm';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Calendar, Clock, MapPin, DollarSign, Trash2, Edit2, AlertTriangle, 
  Search, ArrowUpDown, ChevronUp, ChevronDown, CheckCircle2, Navigation2, HelpCircle 
} from 'lucide-react';

interface ItineraryProps {
  trip: Trip;
  activities: Activity[];
  onAddActivity: (act: Omit<Activity, 'id'>) => void;
  onUpdateActivity: (act: Activity) => void;
  onDeleteActivity: (id: string) => void;
  onSelectActivityOnMap: (act: Activity) => void;
}

export default function Itinerary({
  trip,
  activities,
  onAddActivity,
  onUpdateActivity,
  onDeleteActivity,
  onSelectActivityOnMap
}: ItineraryProps) {
  // 篩選與搜尋狀態
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'time' | 'cost' | 'custom'>('time');
  const [selectedDate, setSelectedDate] = useState<string>(''); // 依據特定日期篩選，預設為全部

  // 新增/修改活動 Modal 狀態
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // 表單欄位
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('sightseeing');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState(35.0116); // 預設京都經緯度
  const [longitude, setLongitude] = useState(135.7681);
  const [notes, setNotes] = useState('');
  const [cost, setCost] = useState<number>(0);

  // 時間衝突警告狀態 (預檢)
  const [conflictWarning, setConflictWarning] = useState<Activity[]>([]);

  // 取得旅程包含的所有不重複日期列表
  const getTripDates = () => {
    const dates: string[] = [];
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const datesList = getTripDates();

  // 若尚未設定選取日期，預設設定為第一天
  React.useEffect(() => {
    if (!selectedDate && datesList.length > 0) {
      setSelectedDate(datesList[0]);
    }
  }, [datesList, selectedDate]);

  // 即時監聽表單時間，檢查是否存在衝突
  React.useEffect(() => {
    if (isFormOpen && date && startTime && endTime) {
      const tempAct: Partial<Activity> = {
        id: editingActivity?.id || 'temp',
        date,
        startTime,
        endTime
      };
      const conflicts = checkItineraryConflicts(tempAct, activities);
      setConflictWarning(conflicts);
    } else {
      setConflictWarning([]);
    }
  }, [isFormOpen, date, startTime, endTime, activities, editingActivity]);

  // 開啟表單 (新增)
  const handleOpenAdd = () => {
    setEditingActivity(null);
    setTitle('');
    setCategory('sightseeing');
    setDate(selectedDate || trip.startDate);
    setStartTime('10:00');
    setEndTime('11:30');
    setLocationName('');
    setLatitude(35.0116);
    setLongitude(135.7681);
    setNotes('');
    setCost(0);
    setIsFormOpen(true);
  };

  // 開啟表單 (修改)
  const handleOpenEdit = (act: Activity) => {
    setEditingActivity(act);
    setTitle(act.title);
    setCategory(act.category);
    setDate(act.date);
    setStartTime(act.startTime);
    setEndTime(act.endTime);
    setLocationName(act.locationName);
    setLatitude(act.latitude);
    setLongitude(act.longitude);
    setNotes(act.notes || '');
    setCost(act.cost);
    setIsFormOpen(true);
  };

  // 送出表單
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !locationName.trim()) return;

    // 自訂位置經緯度微調
    let finalLat = latitude;
    let finalLng = longitude;
    if (locationName.toLowerCase().includes('gion') || locationName.includes('祇園')) {
      finalLat = 35.0037; finalLng = 135.7782;
    } else if (locationName.toLowerCase().includes('fushimi') || locationName.includes('伏見稻荷')) {
      finalLat = 34.9671; finalLng = 135.7727;
    } else if (locationName.toLowerCase().includes('kinkaku') || locationName.includes('金閣寺')) {
      finalLat = 35.0394; finalLng = 135.7292;
    } else if (locationName.toLowerCase().includes('kiyomizu') || locationName.includes('清水寺')) {
      finalLat = 34.9949; finalLng = 135.7850;
    } else if (locationName.toLowerCase().includes('arashiyama') || locationName.includes('嵐山')) {
      finalLat = 35.0156; finalLng = 135.6715;
    }

    const activityData = {
      tripId: trip.id,
      title,
      category,
      date,
      startTime,
      endTime,
      locationName,
      latitude: finalLat,
      longitude: finalLng,
      notes,
      cost,
      order: editingActivity ? editingActivity.order : activities.length
    };

    if (editingActivity) {
      onUpdateActivity({ ...activityData, id: editingActivity.id });
    } else {
      onAddActivity(activityData);
    }

    setIsFormOpen(false);
  };

  // 排序調整：自訂順序向上移動
  const handleMoveUp = (index: number, dayActs: Activity[]) => {
    if (index === 0) return;
    const current = { ...dayActs[index] };
    const prev = { ...dayActs[index - 1] };
    
    const tempOrder = current.order;
    current.order = prev.order;
    prev.order = tempOrder;

    onUpdateActivity(current);
    onUpdateActivity(prev);
  };

  // 排序調整：自訂順序向下移動
  const handleMoveDown = (index: number, dayActs: Activity[]) => {
    if (index === dayActs.length - 1) return;
    const current = { ...dayActs[index] };
    const next = { ...dayActs[index + 1] };

    const tempOrder = current.order;
    current.order = next.order;
    next.order = tempOrder;

    onUpdateActivity(current);
    onUpdateActivity(next);
  };

  // 篩選出目前選取日期的所有活動
  const currentDayActivities = activities.filter(act => act.date === selectedDate);
  const filteredActivities = filterAndSortActivities(
    currentDayActivities,
    searchQuery,
    categoryFilter,
    sortBy
  );

  // 取得分類標籤名稱
  const getCategoryLabel = (cat: ActivityCategory) => {
    switch (cat) {
      case 'sightseeing': return '觀光';
      case 'food': return '美食';
      case 'transport': return '交通';
      case 'hotel': return '住宿';
      case 'shopping': return '購物';
      default: return '其他';
    }
  };

  // 取得分類對應的背景與文字色
  const getCategoryStyle = (cat: ActivityCategory) => {
    switch (cat) {
      case 'sightseeing': return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400';
      case 'food': return 'bg-orange-500/10 border-orange-500/20 text-orange-400';
      case 'transport': return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      case 'hotel': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'shopping': return 'bg-pink-500/10 border-pink-500/20 text-pink-400';
      default: return 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400';
    }
  };

  const countdown = calculateCountdown(trip.startDate);

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      {/* 頂部倒數計時與快速新增 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 border border-white/10 rounded-[24px] p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#FF385C]">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">行程規劃總覽</h3>
            <p className="text-xs text-white/50 mt-0.5">
              {trip.startDate} 至 {trip.endDate} • 共 {datesList.length} 天
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-right">
            <span className="text-2xl font-bold font-mono text-[#FF385C]">
              {countdown > 0 ? `${countdown}` : countdown === 0 ? '今日' : '已結束'}
            </span>
            <span className="text-[10px] text-white/40 block tracking-widest uppercase">
              {countdown > 0 ? 'DAYS TO GO' : countdown === 0 ? 'START TODAY' : 'COMPLETED'}
            </span>
          </div>
          <button
            id="btn-add-activity"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-opacity-90 active:scale-95 transition-all shadow-md shadow-white/5"
          >
            <Plus className="w-4 h-4" />
            新增活動
          </button>
        </div>
      </div>

      {/* 橫向日期選擇滑軌 */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
        {datesList.map((dateStr, idx) => {
          const isSelected = selectedDate === dateStr;
          const dateObj = new Date(dateStr);
          const dayNum = idx + 1;
          const weekday = ['日', '一', '二', '三', '四', '五', '六'][dateObj.getDay()];

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={`flex-shrink-0 flex flex-col items-center px-4.5 py-3 rounded-2xl border transition-all ${
                isSelected 
                  ? 'bg-white text-black border-white shadow-lg' 
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
            >
              <span className="text-[10px] font-semibold opacity-60 tracking-wider">DAY {dayNum}</span>
              <span className="text-sm font-bold mt-1">{dateStr.substring(5)}</span>
              <span className="text-[10px] font-medium opacity-60 mt-0.5">(週{weekday})</span>
            </button>
          );
        })}
      </div>

      {/* 控制列：搜尋、篩選與排序 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* 搜尋 */}
        <div className="relative md:col-span-5">
          <Search className="absolute left-4 top-3 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="搜尋本日行程名稱或地點..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-white/30 focus:outline-none transition-all"
          />
        </div>

        {/* 分類篩選 */}
        <div className="relative md:col-span-4">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white/70 focus:border-white/30 focus:outline-none appearance-none cursor-pointer"
          >
            <option value="all" className="bg-[#1a1a1a] text-white">所有分類</option>
            <option value="sightseeing" className="bg-[#1a1a1a] text-white">觀光景點</option>
            <option value="food" className="bg-[#1a1a1a] text-white">美食饗宴</option>
            <option value="transport" className="bg-[#1a1a1a] text-white">交通運輸</option>
            <option value="hotel" className="bg-[#1a1a1a] text-white">住宿飯店</option>
            <option value="shopping" className="bg-[#1a1a1a] text-white">購物清單</option>
          </select>
        </div>

        {/* 排序 */}
        <div className="relative md:col-span-3">
          <button
            onClick={() => {
              if (sortBy === 'time') setSortBy('cost');
              else if (sortBy === 'cost') setSortBy('custom');
              else setSortBy('time');
            }}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white/70 hover:bg-white/10 transition-all flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
              排序: {sortBy === 'time' ? '時間優先' : sortBy === 'cost' ? '花費高低' : '自訂排序'}
            </span>
          </button>
        </div>
      </div>

      {/* 活動時間軸清單 */}
      <div className="flex-1 min-h-[300px]">
        {filteredActivities.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white/2 rounded-[32px] border border-white/5 min-h-[300px]">
            <HelpCircle className="w-10 h-10 text-white/20 mb-3" />
            <p className="text-sm font-semibold text-white/60">本日尚未安排活動</p>
            <p className="text-xs text-white/40 mt-1 max-w-xs">點擊右上方「新增活動」按鈕，快速建立您在京都的一日精緻行程吧！</p>
          </div>
        ) : (
          <div className="relative border-l border-white/10 ml-6 pl-8 space-y-6">
            <AnimatePresence mode="popLayout">
              {filteredActivities.map((act, idx) => {
                const catStyle = getCategoryStyle(act.category);
                
                return (
                  <motion.div
                    key={act.id}
                    layoutId={act.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="relative group bg-white/5 border border-white/10 hover:border-white/20 rounded-[24px] p-5 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    {/* 時間軸圓點與虛線結合點 */}
                    <div className="absolute -left-[41px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#FF385C] border-4 border-[#0a0a0a] group-hover:scale-125 transition-transform" />

                    {/* 活動基本資訊 */}
                    <div className="flex-1 flex gap-4 items-start">
                      {/* 時間標籤 */}
                      <div className="flex flex-col text-left justify-center min-w-[70px]">
                        <span className="text-xs font-semibold text-white/50 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {act.startTime}
                        </span>
                        <span className="text-[10px] text-white/30 mt-0.5">至 {act.endTime}</span>
                      </div>

                      <div className="flex flex-col text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-base text-white">{act.title}</h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${catStyle}`}>
                            {getCategoryLabel(act.category)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-white/50 flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#FF385C]" />
                            {act.locationName}
                          </span>
                          {act.cost > 0 && (
                            <span className="flex items-center gap-0.5 text-emerald-400 font-mono font-medium">
                              <DollarSign className="w-3.5 h-3.5" />
                              {act.cost}
                            </span>
                          )}
                        </div>

                        {act.notes && (
                          <p className="text-xs text-white/40 mt-2 italic bg-white/2 p-2 rounded-xl border border-white/5">
                            {act.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 行動按鈕 (編輯、刪除、自訂排序) */}
                    <div className="flex items-center gap-2 self-end md:self-auto">
                      {/* 地圖聚焦 */}
                      <button
                        onClick={() => onSelectActivityOnMap(act)}
                        className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-white/70 hover:text-white transition-all"
                        title="在地圖上定位"
                      >
                        <Navigation2 className="w-4 h-4" />
                      </button>

                      {/* 上移、下移 (僅在自訂排序模式下顯示) */}
                      {sortBy === 'custom' && (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleMoveUp(idx, filteredActivities)}
                            disabled={idx === 0}
                            className="p-1 rounded-md bg-white/5 text-white/40 hover:text-white disabled:opacity-30 transition-all"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveDown(idx, filteredActivities)}
                            disabled={idx === filteredActivities.length - 1}
                            className="p-1 rounded-md bg-white/5 text-white/40 hover:text-white disabled:opacity-30 transition-all"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => handleOpenEdit(act)}
                        className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-white/70 hover:text-white transition-all"
                        title="編輯活動"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteActivity(act.id)}
                        className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"
                        title="刪除活動"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 活動新增、修改彈出表單 (Modal) */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-[#020202]/85 backdrop-blur-md" onClick={() => setIsFormOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#0d0d0d] border border-white/10 rounded-[32px] p-8 overflow-hidden shadow-2xl z-10"
            >
              <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#FF385C]" />
                {editingActivity ? '修改活動項目' : '安排全新精彩活動'}
              </h3>

              {/* 衝突警示標誌 */}
              {conflictWarning.length > 0 && (
                <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex gap-2 items-start">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-1">注意：此時間段存在行程衝突！</span>
                    將會與以下現有活動時間重疊：
                    <ul className="list-disc list-inside mt-1 opacity-80">
                      {conflictWarning.map(act => (
                        <li key={act.id}>{act.title} ({act.startTime} - {act.endTime})</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                {/* 活動名稱 */}
                <div>
                  <label className="text-[10px] font-bold text-white/40 block mb-1.5 uppercase tracking-wider">活動名稱 *</label>
                  <input
                    type="text"
                    required
                    placeholder="例：祇園周邊和服漫步"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-white/30 focus:outline-none transition-all"
                  />
                </div>

                {/* 分類與日期 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-white/40 block mb-1.5 uppercase tracking-wider">活動類別</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ActivityCategory)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-white/30 focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="sightseeing" className="bg-[#1a1a1a]">觀光景點</option>
                      <option value="food" className="bg-[#1a1a1a]">美食饗宴</option>
                      <option value="transport" className="bg-[#1a1a1a]">交通運輸</option>
                      <option value="hotel" className="bg-[#1a1a1a]">住宿飯店</option>
                      <option value="shopping" className="bg-[#1a1a1a]">購物清單</option>
                      <option value="other" className="bg-[#1a1a1a]">其他項目</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-white/40 block mb-1.5 uppercase tracking-wider">活動日期</label>
                    <select
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-white/30 focus:outline-none appearance-none cursor-pointer"
                    >
                      {datesList.map(d => (
                        <option key={d} value={d} className="bg-[#1a1a1a]">{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 開始時間、結束時間 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-white/40 block mb-1.5 uppercase tracking-wider">開始時間</label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-white/30 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-white/40 block mb-1.5 uppercase tracking-wider">結束時間</label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-white/30 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* 地點、活動花費 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-white/40 block mb-1.5 uppercase tracking-wider">具體位置/地址 *</label>
                    <input
                      type="text"
                      required
                      placeholder="例：Gion District, Kyoto"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-white/30 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-white/40 block mb-1.5 uppercase tracking-wider">預估門票/交通花費 (USD)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={cost === 0 ? '' : cost}
                      onChange={(e) => setCost(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-white/30 focus:outline-none transition-all font-mono"
                    />
                  </div>
                </div>

                {/* 備註與注意事項 */}
                <div>
                  <label className="text-[10px] font-bold text-white/40 block mb-1.5 uppercase tracking-wider">備註與貼心小筆記</label>
                  <textarea
                    placeholder="例：記得預約和服、穿舒服的鞋子、多帶一點零錢..."
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 focus:border-white/30 focus:outline-none transition-all resize-none"
                  />
                </div>

                {/* 儲存按鈕 */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white/70 text-sm font-semibold hover:bg-white/10 transition-all"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-white text-black text-sm font-bold rounded-2xl hover:bg-opacity-90 active:scale-95 transition-all"
                  >
                    {editingActivity ? '更新儲存' : '確認安排'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
