/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Expense, TravelMember, Trip } from '../types';
import { analyzeBudget, calculateSplitwiseBalances } from '../utils/algorithm';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DollarSign, PieChart, Landmark, TrendingUp, Plus, Trash2, Check, 
  ArrowRight, Users, Loader2, Award, AlertCircle 
} from 'lucide-react';

interface FinanceProps {
  trip: Trip;
  expenses: Expense[];
  members: TravelMember[];
  onAddExpense: (exp: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
  onClearExpenses: () => void;
}

export default function Finance({
  trip,
  expenses,
  members,
  onAddExpense,
  onDeleteExpense,
  onClearExpenses
}: FinanceProps) {
  // 記帳 Modal 狀態
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [payerId, setPayerId] = useState<string>(members[0]?.id || '1');
  const [splitWith, setSplitWith] = useState<string[]>(members.map(m => m.id));
  const [category, setCategory] = useState<'food' | 'transport' | 'accommodation' | 'ticket' | 'other'>('food');

  const budgetAnalysis = analyzeBudget(expenses, trip.budgetLimit);
  const splitwiseAnalysis = calculateSplitwiseBalances(expenses, members);

  // 處理複選框切換 (分攤人員)
  const handleToggleSplit = (id: string) => {
    if (splitWith.includes(id)) {
      if (splitWith.length > 1) {
        setSplitWith(splitWith.filter(mId => mId !== id));
      }
    } else {
      setSplitWith([...splitWith, id]);
    }
  };

  const handleOpenForm = () => {
    setTitle('');
    setAmount(0);
    setPayerId(members[0]?.id || '1');
    setSplitWith(members.map(m => m.id));
    setCategory('food');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) return;

    const selectedPayer = members.find(m => m.id === payerId);
    const expenseData = {
      tripId: trip.id,
      title,
      amount,
      payerId,
      payerName: selectedPayer ? selectedPayer.name : '旅人',
      splitWith,
      date: new Date().toISOString().split('T')[0],
      category
    };

    onAddExpense(expenseData);
    setIsFormOpen(false);
  };

  // 取得分類對比的中文字
  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'food': return '餐飲美食';
      case 'transport': return '大眾交通';
      case 'accommodation': return '飯店住宿';
      case 'ticket': return '門票景點';
      default: return '其他支出';
    }
  };

  // 取得分類主色系
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'food': return 'text-orange-400 bg-orange-500/10';
      case 'transport': return 'text-blue-400 bg-blue-500/10';
      case 'accommodation': return 'text-emerald-400 bg-emerald-500/10';
      case 'ticket': return 'text-indigo-400 bg-indigo-500/10';
      default: return 'text-zinc-400 bg-zinc-500/10';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      {/* 預算統計 Bento 卡片 (占 5 欄) */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        {/* 預算主卡片 */}
        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF385C]/10 blur-3xl rounded-full" />
          
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">旅遊經費進度條</p>
              <h3 className="text-3xl font-bold font-mono mt-1">${budgetAnalysis.totalSpent.toFixed(2)}</h3>
            </div>
            <span className="px-3.5 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-white/60">
              上限: ${trip.budgetLimit}
            </span>
          </div>

          {/* 進度條 */}
          <div className="mt-8">
            <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${budgetAnalysis.percentUsed}%` }}
                transition={{ duration: 1 }}
                className={`h-full rounded-full ${
                  budgetAnalysis.percentUsed > 90 ? 'bg-rose-500' : budgetAnalysis.percentUsed > 70 ? 'bg-yellow-500' : 'bg-emerald-500'
                }`}
              />
            </div>
            <div className="flex justify-between items-center mt-3 text-xs">
              <span className="text-white/40">消耗比例</span>
              <span className={`font-mono font-bold ${budgetAnalysis.percentUsed > 90 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {budgetAnalysis.actualPercent.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* 預算超支警示 */}
          {budgetAnalysis.overBudget > 0 && (
            <div className="mt-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex gap-2 items-center">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>注意！您的預算已超支 <b>${budgetAnalysis.overBudget.toFixed(2)}</b>，請適度調整後續行程花費。</span>
            </div>
          )}
        </div>

        {/* 類別消費圓盤分析 (Simulated category breakdown card) */}
        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 text-left">
          <h4 className="font-bold text-sm text-white mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-400" />
            花費類別分佈
          </h4>
          <div className="space-y-3">
            {Object.entries(budgetAnalysis.categoryTotals).map(([cat, amount]) => {
              const maxAmount = budgetAnalysis.totalSpent || 1;
              const ratio = (amount / maxAmount) * 100;
              const catLabel = getCategoryLabel(cat);
              const colorClass = getCategoryColor(cat);

              return (
                <div key={cat} className="flex items-center justify-between p-3 bg-white/2 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className={`p-2 rounded-xl text-xs font-semibold ${colorClass}`}>
                      {catLabel.substring(0,2)}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-white/80">{catLabel}</p>
                      <div className="w-24 bg-white/5 rounded-full h-1 mt-1 overflow-hidden">
                        <div className="bg-white/40 h-full rounded-full" style={{ width: `${ratio}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold font-mono text-white">${amount.toFixed(2)}</p>
                    <p className="text-[9px] text-white/30 font-mono mt-0.5">{ratio.toFixed(0)}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Splitwise 成員平衡與交易 (占 7 欄) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        {/* Ledger & Settle Up Container */}
        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 text-left flex-1 flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base">Splitwise 共享記帳帳本</h3>
                <p className="text-[10px] text-white/40 mt-0.5">自動簡化帳務與朋友結算交易</p>
              </div>
            </div>
            
            <button
              onClick={handleOpenForm}
              className="flex items-center gap-1.5 bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-emerald-400 active:scale-95 transition-all shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              新增拆帳項目
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            {/* 成員個人餘額平衡表 */}
            <div className="flex flex-col">
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                旅人餘額平衡表
              </h4>
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[250px] pr-1">
                {splitwiseAnalysis.memberBalances.map(m => {
                  const isCreditor = m.amount > 0.01;
                  const isDebtor = m.amount < -0.01;

                  return (
                    <div key={m.memberId} className="flex items-center justify-between p-3 bg-white/2 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold uppercase overflow-hidden border border-white/10">
                          {m.avatar ? <img src={m.avatar} alt="avatar" className="w-full h-full object-cover" /> : m.memberName.substring(0, 2)}
                        </div>
                        <span className="text-xs font-bold text-white/80">{m.memberName}</span>
                      </div>
                      <div className="text-right">
                        {isCreditor ? (
                          <span className="text-xs font-bold text-emerald-400 font-mono">+${m.amount.toFixed(2)}</span>
                        ) : isDebtor ? (
                          <span className="text-xs font-bold text-rose-400 font-mono">-${Math.abs(m.amount).toFixed(2)}</span>
                        ) : (
                          <span className="text-xs font-bold text-white/30 font-mono">$0.00</span>
                        )}
                        <p className="text-[8px] text-white/30 uppercase mt-0.5">
                          {isCreditor ? '應拿回' : isDebtor ? '應支付' : '已結清'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 結算建議建議 transaction */}
            <div className="flex flex-col border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                結算轉帳最佳路徑
              </h4>
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[250px]">
                {splitwiseAnalysis.transactions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <Award className="w-8 h-8 text-emerald-400/40 mb-2" />
                    <p className="text-xs font-semibold text-white/50">目前帳務平衡！</p>
                    <p className="text-[10px] text-white/30 mt-0.5">大家都互不相欠，太讚了！</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {splitwiseAnalysis.transactions.map((tx, idx) => (
                      <div key={idx} className="p-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
                          <span className="text-rose-400">{tx.fromName}</span>
                          <ArrowRight className="w-3 h-3 text-white/30" />
                          <span className="text-emerald-400">{tx.toName}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-emerald-400 font-mono">${tx.amount.toFixed(2)}</span>
                          <span className="block text-[8px] text-emerald-400/40 mt-0.5">匯款給對方</span>
                        </div>
                      </div>
                    ))}
                    
                    {/* 一鍵結清 */}
                    <button
                      onClick={onClearExpenses}
                      className="w-full py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 active:scale-95 transition-all text-[10px] uppercase font-bold tracking-widest text-center rounded-xl text-white/70"
                    >
                      確認完成所有結算 (清空帳本)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 支出明細小列表 */}
          <div className="border-t border-white/10 mt-6 pt-4">
            <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">帳目消費流向歷史</h4>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {expenses.length === 0 ? (
                <p className="text-xs text-white/30 py-4 text-center">暫無任何消費紀錄</p>
              ) : (
                [...expenses].reverse().map(exp => (
                  <div key={exp.id} className="flex items-center justify-between p-2.5 bg-white/2 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${getCategoryColor(exp.category)}`}>
                        {getCategoryLabel(exp.category).substring(0, 2)}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-white">{exp.title}</p>
                        <p className="text-[9px] text-white/30 mt-0.5">
                          由 {exp.payerName} 墊付 • 共 {exp.splitWith?.length || members.length} 人分攤
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold font-mono text-white">${exp.amount.toFixed(2)}</span>
                      <button
                        onClick={() => onDeleteExpense(exp.id)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/5 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 新增拆帳項目 Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-[#020202]/85 backdrop-blur-md" onClick={() => setIsFormOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#0d0d0d] border border-white/10 rounded-[32px] p-8 overflow-hidden shadow-2xl z-10"
            >
              <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                新增旅遊開銷
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                {/* 項目名稱 */}
                <div>
                  <label className="text-[10px] font-bold text-white/40 block mb-1.5 uppercase tracking-wider">項目名稱 *</label>
                  <input
                    type="text"
                    required
                    placeholder="例：順正豆腐居酒屋晚餐"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-white/30 focus:outline-none transition-all"
                  />
                </div>

                {/* 金額與類別 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-white/40 block mb-1.5 uppercase tracking-wider">金額 (USD) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={amount === 0 ? '' : amount}
                      onChange={(e) => setAmount(parseFloat(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-white/30 focus:outline-none transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-white/40 block mb-1.5 uppercase tracking-wider">費用類別</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-white/30 focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="food" className="bg-[#1a1a1a]">餐飲美食</option>
                      <option value="transport" className="bg-[#1a1a1a]">大眾交通</option>
                      <option value="accommodation" className="bg-[#1a1a1a]">飯店住宿</option>
                      <option value="ticket" className="bg-[#1a1a1a]">門票景點</option>
                      <option value="other" className="bg-[#1a1a1a]">其他項目</option>
                    </select>
                  </div>
                </div>

                {/* 付款人 */}
                <div>
                  <label className="text-[10px] font-bold text-white/40 block mb-1.5 uppercase tracking-wider">先由誰代墊這筆錢？</label>
                  <select
                    value={payerId}
                    onChange={(e) => setPayerId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-white/30 focus:outline-none appearance-none cursor-pointer"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id} className="bg-[#1a1a1a]">{m.name}</option>
                    ))}
                  </select>
                </div>

                {/* 分攤名單複選 */}
                <div>
                  <label className="text-[10px] font-bold text-white/40 block mb-1.5 uppercase tracking-wider">分攤參與成員 (複選)</label>
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-[140px] overflow-y-auto p-1 border border-white/5 rounded-2xl">
                    {members.map(m => {
                      const isSelected = splitWith.includes(m.id);

                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleToggleSplit(m.id)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-xs ${
                            isSelected 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-semibold' 
                              : 'bg-white/2 border-white/5 text-white/50 hover:bg-white/5'
                          }`}
                        >
                          <span>{m.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 儲存按鈕 */}
                <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white/70 text-sm font-semibold hover:bg-white/10 transition-all"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold rounded-2xl transition-all"
                  >
                    確認記帳
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
