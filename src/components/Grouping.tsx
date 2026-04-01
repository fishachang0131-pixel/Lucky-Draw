import React, { useState } from 'react';
import { Users, LayoutGrid, Shuffle, Download, FileSpreadsheet } from 'lucide-react';
import { motion } from 'motion/react';
import * as XLSX from 'xlsx';
import { Participant, Group } from '../types';
import { cn } from '../lib/utils';

interface GroupingProps {
  participants: Participant[];
}

export default function Grouping({ participants }: GroupingProps) {
  const [groupSize, setGroupSize] = useState(3);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isGrouping, setIsGrouping] = useState(false);

  const performGrouping = () => {
    if (participants.length === 0) return;
    
    setIsGrouping(true);
    
    // Shuffle
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    
    const newGroups: Group[] = [];
    for (let i = 0; i < shuffled.length; i += groupSize) {
      newGroups.push({
        id: Math.floor(i / groupSize) + 1,
        members: shuffled.slice(i, i + groupSize),
      });
    }
    
    // Small delay for effect
    setTimeout(() => {
      setGroups(newGroups);
      setIsGrouping(false);
    }, 500);
  };

  const downloadGroups = (format: 'csv' | 'xlsx') => {
    if (groups.length === 0) return;
    
    const data: any[] = [];
    groups.forEach(group => {
      group.members.forEach(member => {
        data.push({
          '組別': `第 ${group.id} 組`,
          '姓名': member.name
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "分組結果");

    if (format === 'csv') {
      XLSX.writeFile(workbook, `分組結果_${new Date().getTime()}.csv`, { bookType: 'csv' });
    } else {
      XLSX.writeFile(workbook, `分組結果_${new Date().getTime()}.xlsx`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="glass rounded-3xl p-6 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-milktea-400 uppercase tracking-wider">每組人數</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="2"
                max="20"
                value={groupSize}
                onChange={(e) => setGroupSize(parseInt(e.target.value))}
                className="w-32 h-2 bg-milktea-100 rounded-lg appearance-none cursor-pointer accent-milktea-600"
              />
              <span className="font-black text-2xl text-milktea-600 w-8">{groupSize}</span>
            </div>
          </div>
          <div className="h-10 w-px bg-milktea-100" />
          <div className="space-y-1">
            <label className="text-xs font-bold text-milktea-400 uppercase tracking-wider">預計組數</label>
            <div className="text-xl font-bold text-milktea-700">
              {Math.ceil(participants.length / groupSize)} <span className="text-sm font-normal text-milktea-400">組</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {groups.length > 0 && (
            <div className="flex gap-2">
              <button 
                onClick={() => downloadGroups('csv')}
                className="p-2.5 bg-white border border-milktea-100 text-milktea-500 rounded-full hover:bg-milktea-50 transition-all shadow-sm"
                title="下載 CSV"
              >
                <Download className="w-5 h-5" />
              </button>
              <button 
                onClick={() => downloadGroups('xlsx')}
                className="p-2.5 bg-white border border-milktea-100 text-milktea-500 rounded-full hover:bg-milktea-50 transition-all shadow-sm"
                title="下載 Excel"
              >
                <FileSpreadsheet className="w-5 h-5" />
              </button>
            </div>
          )}
          <button
            onClick={performGrouping}
            disabled={participants.length === 0 || isGrouping}
            className="px-8 py-3 bg-milktea-600 text-white rounded-full font-bold shadow-lg hover:bg-milktea-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Shuffle className={cn("w-5 h-5", isGrouping && "animate-spin")} />
            {isGrouping ? '分組中...' : '隨機分組'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group, idx) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white rounded-3xl border border-milktea-50 shadow-sm overflow-hidden flex flex-col"
          >
            <div className="bg-milktea-50/50 px-5 py-3 border-b border-milktea-50 flex items-center justify-between">
              <span className="font-black text-milktea-300 text-[10px] uppercase tracking-widest">Group</span>
              <span className="font-black text-milktea-600 text-lg">{group.id.toString().padStart(2, '0')}</span>
            </div>
            <div className="p-5 space-y-2">
              {group.members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-milktea-50/50 transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-milktea-100 flex items-center justify-center text-milktea-600 font-bold text-xs group-hover:bg-milktea-200 transition-colors">
                    {member.name.charAt(0)}
                  </div>
                  <span className="font-medium text-milktea-800">{member.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
        
        {groups.length === 0 && !isGrouping && (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="inline-block p-6 bg-milktea-50 rounded-full">
              <Users className="w-12 h-12 text-milktea-200" />
            </div>
            <p className="text-milktea-400 font-medium">設定人數並點擊「隨機分組」開始</p>
          </div>
        )}
      </div>
    </div>
  );
}
