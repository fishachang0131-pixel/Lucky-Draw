import React, { useState } from 'react';
import { Users, Trophy, Settings, LayoutDashboard, Github } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Participant, AppMode } from './types';
import DataSource from './components/DataSource';
import LuckyDraw from './components/LuckyDraw';
import Grouping from './components/Grouping';
import { cn } from './lib/utils';

export default function App() {
  const [mode, setMode] = useState<AppMode>('setup');
  const [participants, setParticipants] = useState<Participant[]>([]);

  React.useEffect(() => {
    document.title = "抽籤分組幫手";
  }, []);

  const navItems = [
    { id: 'setup', label: '名單設定', icon: Settings },
    { id: 'draw', label: '獎品抽籤', icon: Trophy },
    { id: 'group', label: '自動分組', icon: Users },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-milktea-50">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-milktea-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-milktea-600 rounded-2xl flex items-center justify-center shadow-lg shadow-milktea-200/50">
                <LayoutDashboard className="text-white w-7 h-7" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-black tracking-tighter text-milktea-900 leading-none">
                  抽籤分組小幫手
                </h1>
                <p className="text-[10px] font-bold text-milktea-400 uppercase tracking-widest mt-1">
                  Lucky Draw & Grouping
                </p>
              </div>
            </div>

            <nav className="flex items-center gap-2 sm:gap-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setMode(item.id as AppMode)}
                  className={cn(
                    "flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300",
                    mode === item.id 
                      ? "bg-milktea-600 text-white shadow-lg shadow-milktea-200" 
                      : "text-milktea-500 hover:bg-milktea-100 hover:text-milktea-700"
                  )}
                >
                  <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {mode === 'setup' && (
              <div className="space-y-10">
                <div className="space-y-2">
                  <h2 className="text-4xl font-black text-milktea-900 tracking-tight">名單設定</h2>
                  <p className="text-milktea-500 font-medium">請輸入或上傳參與者名單，系統將自動解析姓名並檢查重複。</p>
                </div>
                <DataSource 
                  onParticipantsChange={setParticipants}
                  initialParticipants={participants}
                />
                
                {participants.length > 0 && (
                  <div className="flex justify-center pt-10">
                    <button
                      onClick={() => setMode('draw')}
                      className="px-16 py-4 bg-milktea-800 text-white rounded-full font-bold shadow-2xl hover:bg-milktea-900 transition-all transform hover:-translate-y-1 active:scale-95"
                    >
                      名單已就緒，開始使用功能
                    </button>
                  </div>
                )}
              </div>
            )}

            {mode === 'draw' && (
              <div className="space-y-10">
                <div className="space-y-2">
                  <h2 className="text-4xl font-black text-milktea-900 tracking-tight">獎品抽籤</h2>
                  <p className="text-milktea-500 font-medium">隨機抽取幸運兒，支援重複或不重複中獎設定。</p>
                </div>
                {participants.length === 0 ? (
                  <EmptyState onAction={() => setMode('setup')} />
                ) : (
                  <LuckyDraw participants={participants} />
                )}
              </div>
            )}

            {mode === 'group' && (
              <div className="space-y-10">
                <div className="space-y-2">
                  <h2 className="text-4xl font-black text-milktea-900 tracking-tight">自動分組</h2>
                  <p className="text-milktea-500 font-medium">設定每組人數，系統將隨機分配成員並視覺化顯示結果。</p>
                </div>
                {participants.length === 0 ? (
                  <EmptyState onAction={() => setMode('setup')} />
                ) : (
                  <Grouping participants={participants} />
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-milktea-100">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <p className="text-milktea-300 text-sm font-bold tracking-widest uppercase">
            &copy; 2026 抽籤分組小幫手
          </p>
          <div className="flex justify-center gap-4 text-milktea-200">
            <div className="w-1 h-1 rounded-full bg-milktea-200" />
            <div className="w-1 h-1 rounded-full bg-milktea-200" />
            <div className="w-1 h-1 rounded-full bg-milktea-200" />
          </div>
        </div>
      </footer>
    </div>
  );
}

function EmptyState({ onAction }: { onAction: () => void }) {
  return (
    <div className="glass rounded-[3rem] p-20 text-center space-y-8 max-w-2xl mx-auto">
      <div className="inline-block p-8 bg-milktea-50 rounded-full">
        <Settings className="w-16 h-16 text-milktea-400" />
      </div>
      <div className="space-y-3">
        <h3 className="text-3xl font-bold text-milktea-900">尚未設定名單</h3>
        <p className="text-milktea-500 font-medium">請先前往「名單設定」輸入或上傳參與者姓名，才能開始抽籤或分組。</p>
      </div>
      <button
        onClick={onAction}
        className="px-10 py-4 bg-milktea-600 text-white rounded-full font-bold shadow-xl hover:bg-milktea-700 transition-all transform active:scale-95"
      >
        前往設定名單
      </button>
    </div>
  );
}
