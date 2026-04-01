import React, { useState, useEffect, useRef } from 'react';
import { Trophy, RotateCcw, Settings2, UserCheck, Download, FileSpreadsheet, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';
import { Participant, Prize } from '../types';
import { cn } from '../lib/utils';

interface LuckyDrawProps {
  participants: Participant[];
}

interface DrawHistoryItem extends Participant {
  prizeName: string;
  drawTime: string;
}

export default function LuckyDraw({ participants }: LuckyDrawProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [winners, setWinners] = useState<Participant[]>([]);
  const [history, setHistory] = useState<DrawHistoryItem[]>([]);
  const [allowRepeat, setAllowRepeat] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(0);
  
  // Prize Management State
  const [prizes, setPrizes] = useState<Prize[]>([
    { id: '1', name: '特等獎', count: 1 },
    { id: '2', name: '頭獎', count: 3 },
    { id: '3', name: '二獎', count: 5 },
  ]);
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>('1');
  const [editingPrizeId, setEditingPrizeId] = useState<string | null>(null);
  const [newPrizeName, setNewPrizeName] = useState('');
  const [newPrizeCount, setNewPrizeCount] = useState(1);

  const selectedPrize = prizes.find(p => p.id === selectedPrizeId) || prizes[0];

  const availableParticipants = allowRepeat 
    ? participants 
    : participants.filter(p => !history.some(h => h.id === p.id));

  const addPrize = () => {
    if (!newPrizeName.trim()) return;
    const newPrize: Prize = {
      id: Date.now().toString(),
      name: newPrizeName,
      count: newPrizeCount
    };
    setPrizes([...prizes, newPrize]);
    setNewPrizeName('');
    setNewPrizeCount(1);
  };

  const removePrize = (id: string) => {
    if (prizes.length <= 1) return;
    const updated = prizes.filter(p => p.id !== id);
    setPrizes(updated);
    if (selectedPrizeId === id) {
      setSelectedPrizeId(updated[0].id);
    }
  };

  const updatePrize = (id: string, updates: Partial<Prize>) => {
    setPrizes(prizes.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const draw = () => {
    if (!selectedPrize) return;
    const countToDraw = Math.min(selectedPrize.count, availableParticipants.length);
    if (countToDraw === 0) return;
    
    setIsDrawing(true);
    setWinners([]);

    let count = 0;
    const maxCount = 20;
    const interval = setInterval(() => {
      setDisplayIndex(Math.floor(Math.random() * availableParticipants.length));
      count++;
      
      if (count >= maxCount) {
        clearInterval(interval);
        
        const currentAvailable = [...availableParticipants];
        const selectedWinners: Participant[] = [];
        
        for (let i = 0; i < countToDraw; i++) {
          if (currentAvailable.length === 0) break;
          const randomIndex = Math.floor(Math.random() * currentAvailable.length);
          const picked = currentAvailable[randomIndex];
          selectedWinners.push(picked);
          
          if (!allowRepeat) {
            currentAvailable.splice(randomIndex, 1);
          }
        }

        setWinners(selectedWinners);
        const drawTime = new Date().toLocaleString();
        const historyItems: DrawHistoryItem[] = selectedWinners.map(w => ({
          ...w,
          prizeName: selectedPrize.name,
          drawTime
        }));
        
        setHistory(prev => [...historyItems.reverse(), ...prev]);
        setIsDrawing(false);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#a68b7c', '#8d7765', '#e6d5c3']
        });
      }
    }, 80);
  };

  const reset = () => {
    if (window.confirm('確定要清除所有中獎紀錄嗎？')) {
      setHistory([]);
      setWinners([]);
    }
  };

  const downloadHistory = (format: 'csv' | 'xlsx') => {
    if (history.length === 0) return;
    
    const data = history.map((p, i) => ({
      '序號': history.length - i,
      '獎項': p.prizeName,
      '姓名': p.name,
      '中獎時間': p.drawTime
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "中獎名單");

    if (format === 'csv') {
      XLSX.writeFile(workbook, `抽籤結果_${new Date().getTime()}.csv`, { bookType: 'csv' });
    } else {
      XLSX.writeFile(workbook, `抽籤結果_${new Date().getTime()}.xlsx`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Prize Management Section */}
      <div className="glass rounded-[2.5rem] p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-milktea-100 rounded-xl flex items-center justify-center text-milktea-600">
              <Settings2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-milktea-900">獎項與人數設定</h3>
              <p className="text-xs font-bold text-milktea-400 uppercase tracking-widest">Configure Prizes</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prizes.map((prize) => (
            <div 
              key={prize.id}
              onClick={() => setSelectedPrizeId(prize.id)}
              className={cn(
                "relative group p-5 rounded-3xl border-2 transition-all cursor-pointer",
                selectedPrizeId === prize.id 
                  ? "bg-white border-milktea-600 shadow-xl shadow-milktea-100 scale-[1.02]" 
                  : "bg-milktea-50/50 border-transparent hover:border-milktea-200"
              )}
            >
              <div className="flex justify-between items-start mb-3">
                {editingPrizeId === prize.id ? (
                  <input
                    autoFocus
                    className="bg-transparent font-bold text-milktea-900 outline-none border-b-2 border-milktea-300 w-full mr-2"
                    value={prize.name}
                    onChange={(e) => updatePrize(prize.id, { name: e.target.value })}
                    onBlur={() => setEditingPrizeId(null)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingPrizeId(null)}
                  />
                ) : (
                  <h4 className="font-bold text-milktea-900 text-lg">{prize.name}</h4>
                )}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingPrizeId(prize.id); }}
                    className="p-1.5 hover:bg-milktea-100 rounded-lg text-milktea-400 hover:text-milktea-600"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removePrize(prize.id); }}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-milktea-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-milktea-400 uppercase">抽取人數</span>
                  <div className="flex items-center bg-white rounded-xl p-1 border border-milktea-100 shadow-sm" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => updatePrize(prize.id, { count: Math.max(1, prize.count - 1) })}
                      className="w-6 h-6 flex items-center justify-center text-milktea-600 hover:bg-milktea-50 rounded-lg transition-all font-bold"
                    >-</button>
                    <input 
                      type="number" 
                      value={prize.count}
                      onChange={(e) => updatePrize(prize.id, { count: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-8 text-center bg-transparent font-black text-milktea-800 outline-none text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button 
                      onClick={() => updatePrize(prize.id, { count: prize.count + 1 })}
                      className="w-6 h-6 flex items-center justify-center text-milktea-600 hover:bg-milktea-50 rounded-lg transition-all font-bold"
                    >+</button>
                  </div>
                </div>
                {selectedPrizeId === prize.id && (
                  <div className="w-2 h-2 rounded-full bg-milktea-600 animate-pulse" />
                )}
              </div>
            </div>
          ))}

          {/* Add New Prize Button/Input */}
          <div className="p-5 rounded-3xl border-2 border-dashed border-milktea-200 bg-white/50 flex flex-col justify-center gap-3">
            <input
              placeholder="新增獎項名稱..."
              className="bg-transparent font-medium text-milktea-700 outline-none border-b border-milktea-100 focus:border-milktea-400 px-1 py-1 text-sm"
              value={newPrizeName}
              onChange={(e) => setNewPrizeName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPrize()}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-milktea-400 uppercase">預設人數</span>
                <input 
                  type="number" 
                  value={newPrizeCount}
                  onChange={(e) => setNewPrizeCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-10 text-center bg-milktea-50 rounded-lg font-bold text-milktea-800 outline-none text-xs py-1"
                />
              </div>
              <button 
                onClick={addPrize}
                disabled={!newPrizeName.trim()}
                className="p-2 bg-milktea-600 text-white rounded-xl hover:bg-milktea-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Draw Area */}
        <div className="flex-1 space-y-6">
          <div className="glass rounded-[2.5rem] p-12 text-center relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center">
            <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
              <div className="px-4 py-1.5 bg-milktea-800 text-white rounded-full text-xs font-black tracking-widest uppercase shadow-lg">
                正在抽取：{selectedPrize?.name}
              </div>
              <div className="text-[10px] font-bold text-milktea-400 uppercase tracking-tighter">
                預計抽出 {selectedPrize?.count} 位幸運兒
              </div>
            </div>

            <AnimatePresence mode="wait">
              {isDrawing ? (
                <motion.div
                  key="drawing"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.2 }}
                  className="text-5xl md:text-7xl font-black text-milktea-600 tracking-tighter"
                >
                  {availableParticipants[displayIndex]?.name}
                </motion.div>
              ) : winners.length > 0 ? (
                <motion.div
                  key="winners"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="space-y-6 w-full pt-8"
                >
                  <div className="text-milktea-500 font-bold uppercase tracking-widest text-sm">恭喜中獎！</div>
                  <div className={cn(
                    "flex flex-wrap justify-center gap-4",
                    winners.length > 6 ? "max-h-[250px] overflow-y-auto p-4" : ""
                  )}>
                    {winners.map((w, i) => (
                      <motion.div
                        key={`${w.id}-${i}`}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white px-8 py-4 rounded-3xl shadow-xl border border-milktea-100 flex flex-col items-center gap-1"
                      >
                        <span className="text-2xl md:text-4xl font-black text-milktea-900">{w.name}</span>
                        <span className="text-[10px] font-bold text-milktea-400 uppercase">{selectedPrize?.name}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="w-24 h-24 bg-milktea-50 rounded-full flex items-center justify-center">
                    <Trophy className="w-12 h-12 text-milktea-200" />
                  </div>
                  <div className="text-milktea-200 text-xl font-medium">
                    準備好抽取 {selectedPrize?.name} 了嗎？
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={draw}
              disabled={isDrawing || availableParticipants.length === 0}
              className={cn(
                "px-16 py-5 rounded-full font-black text-xl shadow-2xl transition-all transform active:scale-95 flex items-center gap-3",
                isDrawing || availableParticipants.length === 0
                  ? "bg-milktea-100 text-milktea-300 cursor-not-allowed"
                  : "bg-milktea-600 text-white hover:bg-milktea-700 hover:shadow-milktea-200 hover:-translate-y-1"
              )}
            >
              <Trophy className="w-6 h-6" />
              {isDrawing ? '正在抽出幸運兒...' : `開始抽取 ${selectedPrize?.name}`}
            </button>
            
            <button
              onClick={reset}
              className="p-5 rounded-full bg-white border border-milktea-100 text-milktea-500 hover:bg-milktea-50 transition-all shadow-lg hover:-translate-y-1 active:scale-95"
              title="重置歷史紀錄"
            >
              <RotateCcw className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-4 p-4 bg-milktea-50/50 rounded-2xl border border-milktea-100">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={allowRepeat}
                  onChange={(e) => setAllowRepeat(e.target.checked)}
                />
                <div className="w-10 h-6 bg-milktea-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-milktea-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-milktea-600"></div>
              </div>
              <span className="text-sm text-milktea-600 group-hover:text-milktea-800 transition-colors font-bold uppercase tracking-wider">允許重複中獎</span>
            </label>
            <div className="h-4 w-px bg-milktea-200" />
            <div className="text-sm text-milktea-500 font-bold uppercase tracking-wider">
              剩餘人數：<span className="text-milktea-800">{availableParticipants.length}</span>
            </div>
          </div>
        </div>

        {/* History Sidebar */}
        <div className="w-full lg:w-80 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 font-black text-milktea-900 uppercase tracking-tight">
              <UserCheck className="w-5 h-5 text-milktea-600" /> 中獎紀錄 ({history.length})
            </div>
            {history.length > 0 && (
              <div className="flex gap-1">
                <button 
                  onClick={() => downloadHistory('csv')}
                  className="p-2 text-milktea-400 hover:text-milktea-600 hover:bg-milktea-50 rounded-xl transition-colors"
                  title="下載 CSV"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => downloadHistory('xlsx')}
                  className="p-2 text-milktea-400 hover:text-milktea-600 hover:bg-milktea-50 rounded-xl transition-colors"
                  title="下載 Excel"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <div className="bg-white rounded-[2rem] border border-milktea-50 shadow-xl overflow-hidden h-[500px] flex flex-col">
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              <AnimatePresence initial={false}>
                {history.map((p, idx) => (
                  <motion.div
                    key={`${p.id}-${history.length - idx}`}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="flex flex-col p-4 rounded-2xl bg-milktea-50/30 border border-milktea-50 hover:bg-milktea-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-milktea-900 text-lg">{p.name}</span>
                      <span className="text-[10px] font-black text-milktea-500 bg-white px-2 py-0.5 rounded-full border border-milktea-100">
                        #{history.length - idx}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-milktea-600 bg-milktea-100 px-2 py-0.5 rounded-lg">
                        {p.prizeName}
                      </span>
                      <span className="text-[9px] font-medium text-milktea-400">
                        {p.drawTime.split(' ')[1]}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {history.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-milktea-200 gap-2">
                  <Trophy className="w-8 h-8 opacity-20" />
                  <p className="text-sm font-bold uppercase tracking-widest">尚無中獎紀錄</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
