/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Activity, FavoritePlace } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, Navigation, Compass, Heart, Trash2, Crosshair, 
  Layers, Map as MapIcon, ChevronRight, CheckCircle, Info 
} from 'lucide-react';

interface MapContainerProps {
  selectedActivity: Activity | null;
  activities: Activity[];
}

export default function MapContainer({ selectedActivity, activities }: MapContainerProps) {
  // 收藏清單狀態 (使用 LocalStorage 永續保存)
  const [favorites, setFavorites] = useState<FavoritePlace[]>(() => {
    const saved = localStorage.getItem('TRAVEL_FAVORITE_PLACES');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', name: '伏見稻荷大社 千本鳥居', address: '京都市伏見區深草藪之內町68', latitude: 34.9671, longitude: 135.7727, category: '觀光景點', rating: 4.8, addedAt: new Date().toISOString() },
      { id: '2', name: '清水寺 三年坂', address: '京都市東山區清水1-294', latitude: 34.9949, longitude: 135.7850, category: '觀光景點', rating: 4.7, addedAt: new Date().toISOString() },
      { id: '3', name: '祇園 白川巽橋', address: '京都市東山區元吉町', latitude: 35.0037, longitude: 135.7782, category: '美食品嚐', rating: 4.6, addedAt: new Date().toISOString() }
    ];
  });

  const [activeTab, setActiveTab] = useState<'map' | 'favs'>('map');
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'terrain'>('standard');
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  
  // 新增收藏表單
  const [favName, setFavName] = useState('');
  const [favAddress, setFavAddress] = useState('');
  const [favCategory, setFavCategory] = useState('觀光景點');

  // 目前虛擬中心點
  const [center, setCenter] = useState({ lat: 35.0116, lng: 135.7681 });
  const [zoom, setZoom] = useState(13);
  const [currentGPS, setCurrentGPS] = useState<{ lat: number; lng: number } | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // 永續保存收藏
  useEffect(() => {
    localStorage.setItem('TRAVEL_FAVORITE_PLACES', JSON.stringify(favorites));
  }, [favorites]);

  // 監聽外部選擇的行程活動
  useEffect(() => {
    if (selectedActivity) {
      setCenter({ lat: selectedActivity.latitude, lng: selectedActivity.longitude });
      setZoom(15);
      setActiveTab('map');
    }
  }, [selectedActivity]);

  const handleAddFavorite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!favName.trim()) return;

    // 隨機生成微小的經緯度偏差，確保景點散佈在京都市中心
    const randomLat = 35.00 + (Math.random() - 0.5) * 0.08;
    const randomLng = 135.75 + (Math.random() - 0.5) * 0.08;

    const newFav: FavoritePlace = {
      id: Date.now().toString(),
      name: favName,
      address: favAddress || '日本京都特別自治市',
      latitude: randomLat,
      longitude: randomLng,
      category: favCategory,
      rating: parseFloat((4 + Math.random()).toFixed(1)),
      addedAt: new Date().toISOString()
    };

    setFavorites([newFav, ...favorites]);
    setFavName('');
    setFavAddress('');
    setIsNavigating(false);
  };

  const handleDeleteFavorite = (id: string) => {
    setFavorites(favorites.filter(fav => fav.id !== id));
  };

  // 觸發虛擬 GPS 模擬，展示定位功能
  const handleTriggerGPS = () => {
    if (currentGPS) {
      setCurrentGPS(null);
    } else {
      // 模擬定位在京都御所附近
      const kyotoImperialPlace = { lat: 35.0254, lng: 135.7621 };
      setCurrentGPS(kyotoImperialPlace);
      setCenter(kyotoImperialPlace);
      setZoom(14);
    }
  };

  const handleFocusPlace = (lat: number, lng: number) => {
    setCenter({ lat, lng });
    setZoom(15);
    setActiveTab('map');
  };

  return (
    <div className="bg-[#141414] border border-white/5 rounded-[40px] overflow-hidden flex flex-col lg:flex-row h-[550px] w-full shadow-2xl relative">
      
      {/* 左側地圖面板/導航控制列 (佔 1/3) */}
      <div className="w-full lg:w-80 bg-[#0d0d0d] border-b lg:border-b-0 lg:border-r border-white/5 p-6 flex flex-col h-1/2 lg:h-full z-10 text-left">
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 mb-6">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'map' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            景點導航定位
          </button>
          <button
            onClick={() => setActiveTab('favs')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'favs' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            收藏最愛 ({favorites.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          <AnimatePresence mode="wait">
            {activeTab === 'map' ? (
              <motion.div
                key="map-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div>
                  <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">當前聚焦點</h4>
                  {selectedActivity ? (
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-left">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <MapPin className="w-4 h-4 text-[#FF385C]" />
                        {selectedActivity.title}
                      </div>
                      <p className="text-[10px] text-white/40 mt-1">{selectedActivity.locationName}</p>
                      <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-white/30 border-t border-white/5 pt-2">
                        <span>LAT: {selectedActivity.latitude.toFixed(4)}</span>
                        <span>LNG: {selectedActivity.longitude.toFixed(4)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-white/2 border border-white/5 rounded-2xl text-xs text-white/40 text-center">
                      在右側地圖上點選任何活動、或自下方行程中點擊「地圖標誌」即可於此快速追蹤定位。
                    </div>
                  )}
                </div>

                {/* 行程景點清單 */}
                <div>
                  <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2.5">本日安排探險點 ({activities.length})</h4>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto">
                    {activities.map(act => (
                      <button
                        key={act.id}
                        onClick={() => handleFocusPlace(act.latitude, act.longitude)}
                        className={`w-full p-3 bg-white/2 hover:bg-white/5 border rounded-2xl text-left flex items-center justify-between transition-all ${
                          selectedActivity?.id === act.id ? 'border-[#FF385C]/40 bg-[#FF385C]/5' : 'border-white/5'
                        }`}
                      >
                        <div className="truncate">
                          <p className="text-xs font-bold text-white truncate">{act.title}</p>
                          <p className="text-[9px] text-white/40 mt-0.5 truncate">{act.locationName}</p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="favs-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* 新增收藏最愛 */}
                <form onSubmit={handleAddFavorite} className="space-y-2 bg-white/2 p-3 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">新增私人景點口袋名單</p>
                  <input
                    type="text"
                    required
                    placeholder="景點名稱 (例：嵐山渡月橋)"
                    value={favName}
                    onChange={(e) => setFavName(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:border-white/20 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="地址 (例：京都市右京區嵐山)"
                    value={favAddress}
                    onChange={(e) => setFavAddress(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:border-white/20 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <select
                      value={favCategory}
                      onChange={(e) => setFavCategory(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white/70 focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="觀光景點" className="bg-[#141414]">觀光景點</option>
                      <option value="美食品嚐" className="bg-[#141414]">美食品嚐</option>
                      <option value="飯店住宿" className="bg-[#141414]">飯店住宿</option>
                    </select>
                    <button
                      type="submit"
                      className="bg-white text-black px-4 rounded-xl text-xs font-bold hover:bg-opacity-90 active:scale-95 transition-all"
                    >
                      添加
                    </button>
                  </div>
                </form>

                {/* 收藏景點列表 */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {favorites.length === 0 ? (
                    <p className="text-xs text-white/30 py-6 text-center">口袋名單內暫無景點</p>
                  ) : (
                    favorites.map(fav => (
                      <div key={fav.id} className="p-3 bg-white/2 hover:bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between gap-2 transition-all">
                        <button
                          onClick={() => handleFocusPlace(fav.latitude, fav.longitude)}
                          className="flex-1 text-left min-w-0"
                        >
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-white truncate">{fav.name}</span>
                            <span className="px-1.5 py-0.5 bg-pink-500/10 border border-pink-500/20 rounded-md text-[8px] text-pink-400 font-bold font-sans">
                              ★ {fav.rating}
                            </span>
                          </div>
                          <p className="text-[9px] text-white/40 mt-1 truncate">{fav.address}</p>
                        </button>
                        <button
                          onClick={() => handleDeleteFavorite(fav.id)}
                          className="p-1.5 rounded-lg text-white/20 hover:text-rose-400 hover:bg-rose-500/5 transition-all flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 右側互動式地圖圖層 (佔 2/3) */}
      <div className="flex-1 h-1/2 lg:h-full relative bg-[#1c1c1c] overflow-hidden">
        
        {/* 背景網格圖樣與裝飾：營造極簡數位感 */}
        <div 
          className="absolute inset-0 opacity-40 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px]"
          style={{ transform: `scale(${zoom / 13}) translate(${(center.lng - 135.768) * 1000}px, ${(center.lat - 35.01) * 1000}px)` }}
        />

        {/* 衛星/標準地圖疊加色 */}
        {mapType === 'satellite' && (
          <div className="absolute inset-0 bg-[#070d14]/40 z-0 border border-indigo-500/10" />
        )}

        {/* 地形微影 */}
        {mapType === 'terrain' && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a1128]/20 to-[#141e30]/30 z-0" />
        )}

        {/* 航線描繪線 (Connecting active daily itinerary points) */}
        {activities.length > 1 && (
          <svg className="absolute inset-0 pointer-events-none w-full h-full z-0">
            {/* 連接點線 */}
            <path
              d="M 150 150 L 300 120 L 450 300 L 250 400"
              fill="none"
              stroke="#FF385C"
              strokeWidth="2"
              strokeDasharray="4 6"
              className="animate-[dash_10s_linear_infinite]"
            />
          </svg>
        )}

        {/* 地圖上的標記 Pin 點 (京都市著名景點 ＆ 活動點) */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {/* 金閣寺 / Kinkakuji */}
          <div className="absolute top-[18%] left-[25%] pointer-events-auto">
            <motion.div
              onHoverStart={() => setHoveredPin('kinkaku')}
              onHoverEnd={() => setHoveredPin(null)}
              onClick={() => handleFocusPlace(35.0394, 135.7292)}
              className="relative cursor-pointer flex flex-col items-center"
            >
              <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center border-2 border-white shadow-lg relative z-10">
                <Compass className="w-3.5 h-3.5" />
              </div>
              <AnimatePresence>
                {hoveredPin === 'kinkaku' && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-8 bg-black/90 border border-white/20 p-2 rounded-xl text-[9px] font-bold text-white whitespace-nowrap">
                    金閣寺 (Kinkaku-ji)
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* 嵐山竹林 / Arashiyama */}
          <div className="absolute top-[40%] left-[10%] pointer-events-auto">
            <motion.div
              onHoverStart={() => setHoveredPin('arashiyama')}
              onHoverEnd={() => setHoveredPin(null)}
              onClick={() => handleFocusPlace(35.0156, 135.6715)}
              className="relative cursor-pointer flex flex-col items-center"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white shadow-lg relative z-10">
                <Compass className="w-3.5 h-3.5" />
              </div>
              <AnimatePresence>
                {hoveredPin === 'arashiyama' && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-8 bg-black/90 border border-white/20 p-2 rounded-xl text-[9px] font-bold text-white whitespace-nowrap">
                    嵐山竹林 (Arashiyama Bamboo Forest)
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* 清水寺 / Kiyomizu-dera */}
          <div className="absolute top-[60%] right-[20%] pointer-events-auto">
            <motion.div
              onHoverStart={() => setHoveredPin('kiyomizu')}
              onHoverEnd={() => setHoveredPin(null)}
              onClick={() => handleFocusPlace(34.9949, 135.7850)}
              className="relative cursor-pointer flex flex-col items-center"
            >
              <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center border-2 border-white shadow-lg relative z-10">
                <Compass className="w-3.5 h-3.5" />
              </div>
              <AnimatePresence>
                {hoveredPin === 'kiyomizu' && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-8 bg-black/90 border border-white/20 p-2 rounded-xl text-[9px] font-bold text-white whitespace-nowrap">
                    清水寺 (Kiyomizu-dera)
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* 伏見稻荷千本鳥居 / Fushimi Inari */}
          <div className="absolute bottom-[15%] right-[35%] pointer-events-auto">
            <motion.div
              onHoverStart={() => setHoveredPin('fushimi')}
              onHoverEnd={() => setHoveredPin(null)}
              onClick={() => handleFocusPlace(34.9671, 135.7727)}
              className="relative cursor-pointer flex flex-col items-center"
            >
              <div className="w-7 h-7 rounded-full bg-[#FF385C] text-white flex items-center justify-center border-2 border-white shadow-lg relative z-10">
                <Compass className="w-3.5 h-3.5" />
              </div>
              <AnimatePresence>
                {hoveredPin === 'fushimi' && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-8 bg-black/90 border border-white/20 p-2 rounded-xl text-[9px] font-bold text-white whitespace-nowrap">
                    伏見稻荷大社 (Fushimi Inari Shrine)
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* 模擬當前 GPS 定位點 */}
          {currentGPS && (
            <div className="absolute top-[48%] left-[48%] pointer-events-auto">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-500/30 animate-pulse" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 頂部地圖工具列：地圖樣式切換 */}
        <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-center pointer-events-none">
          <div className="flex bg-black/70 backdrop-blur-md p-1 rounded-xl border border-white/10 pointer-events-auto">
            <button
              onClick={() => setMapType('standard')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                mapType === 'standard' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
              }`}
            >
              標準
            </button>
            <button
              onClick={() => setMapType('satellite')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                mapType === 'satellite' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
              }`}
            >
              衛星
            </button>
            <button
              onClick={() => setMapType('terrain')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                mapType === 'terrain' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
              }`}
            >
              地形
            </button>
          </div>

          {/* 右上模擬導航、GPS 操作按鈕 */}
          <div className="flex gap-2 pointer-events-auto">
            <button
              onClick={handleTriggerGPS}
              className={`p-2.5 rounded-xl border backdrop-blur-md transition-all ${
                currentGPS ? 'bg-blue-500 border-blue-400 text-white' : 'bg-black/70 border-white/10 text-white'
              }`}
              title="定位目前位置"
            >
              <Crosshair className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsNavigating(!isNavigating)}
              className={`p-2.5 rounded-xl border backdrop-blur-md transition-all ${
                isNavigating ? 'bg-[#FF385C] border-[#FF385C]/40 text-white' : 'bg-black/70 border-white/10 text-white'
              }`}
              title="開始導航 (AR 行駛描繪模式)"
            >
              <Navigation className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 底部浮動地名與圖資宣告資訊 */}
        <div className="absolute bottom-6 left-6 right-6 z-20 pointer-events-none flex justify-between items-end">
          <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-left pointer-events-auto">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#FF385C] animate-spin-slow" />
              京都市中心地圖虛擬畫布 (Kyoto Sandbox)
            </p>
            <p className="text-[10px] text-white/50 mt-1">目前地圖中心：北緯 {center.lat.toFixed(3)}, 東經 {center.lng.toFixed(3)}</p>
          </div>

          <div className="text-[9px] font-mono text-white/30 tracking-wider">
            © GOOGLE MAPS PLATFORM EMBEDDED
          </div>
        </div>

        {/* 導航輔助浮動面板 (僅在點擊導航時出現) */}
        <AnimatePresence>
          {isNavigating && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="absolute top-20 left-6 right-6 z-20 bg-[#FF385C] border border-[#FF385C]/30 text-white rounded-2xl p-4 text-left shadow-xl"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-bold text-xs uppercase tracking-widest opacity-80">導航路徑精算中 (Auto Route)</h5>
                  <p className="text-sm font-semibold mt-1">
                    {activities.length > 0 ? `連線起點「${activities[0].title}」往「${activities[activities.length-1]?.title}」之行程路網` : '京都市中心景點最佳連線規劃'}
                  </p>
                  <p className="text-[10px] opacity-70 mt-1">總預估時間：35 分鐘 • 全長：8.2 公里 • 建議交通：京都市營地下鐵東西線</p>
                </div>
                <button
                  onClick={() => setIsNavigating(false)}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[9px] font-bold"
                >
                  關閉
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
