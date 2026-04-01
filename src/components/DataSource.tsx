import React, { useState, useCallback } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Participant } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface DataSourceProps {
  onParticipantsChange: (participants: Participant[]) => void;
  initialParticipants: Participant[];
}

export default function DataSource({ onParticipantsChange, initialParticipants }: DataSourceProps) {
  const [inputText, setInputText] = useState(initialParticipants.map(p => p.name).join('\n'));
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<string[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [pendingParticipants, setPendingParticipants] = useState<Participant[]>([]);

  const detectDuplicates = (names: string[]) => {
    const seen = new Set<string>();
    const dups = new Set<string>();
    names.forEach(name => {
      if (seen.has(name)) {
        dups.add(name);
      }
      seen.add(name);
    });
    return Array.from(dups);
  };

  const processNames = (text: string, skipModal = false) => {
    const names = text
      .split(/[\n,]+/)
      .map(n => n.trim())
      .filter(n => n.length > 0);
    
    const dups = detectDuplicates(names);
    
    const participants: Participant[] = names.map((name, index) => ({
      id: `${Date.now()}-${index}`,
      name,
    }));

    if (dups.length > 0 && !skipModal) {
      setDuplicates(dups);
      setPendingParticipants(participants);
      setShowDuplicateModal(true);
    } else {
      onParticipantsChange(participants);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);
    processNames(text);
  };

  const removeDuplicates = () => {
    const names: string[] = inputText
      .split(/[\n,]+/)
      .map(n => n.trim())
      .filter(n => n.length > 0);
    
    const uniqueNames = Array.from(new Set(names));
    const newText = uniqueNames.join('\n');
    setInputText(newText);
    
    const participants: Participant[] = uniqueNames.map((name, index) => ({
      id: `${Date.now()}-${index}`,
      name,
    }));
    
    onParticipantsChange(participants);
    setShowDuplicateModal(false);
  };

  const keepDuplicates = () => {
    onParticipantsChange(pendingParticipants);
    setShowDuplicateModal(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const extension = file.name.split('.').pop()?.toLowerCase();

    reader.onload = (event) => {
      const data = event.target?.result;
      if (!data) return;

      try {
        let names: string[] = [];

        if (extension === 'csv') {
          const result = Papa.parse(data as string, { header: false });
          names = result.data.flat().map((n: any) => String(n).trim()).filter(n => n.length > 0);
        } else if (extension === 'xlsx' || extension === 'xls') {
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          names = json.flat().map((n: any) => String(n).trim()).filter(n => n.length > 0);
        }

        if (names.length > 0) {
          const newText = names.join('\n');
          setInputText(newText);
          processNames(newText);
          setError(null);
        } else {
          setError('找不到有效的姓名名單');
        }
      } catch (err) {
        setError('檔案解析失敗，請確認格式是否正確');
      }
    };

    if (extension === 'csv') {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-milktea-700 flex items-center gap-2">
            <FileText className="w-4 h-4" /> 手動輸入或貼上名單 (每行一個姓名)
          </label>
          <textarea
            className="w-full h-64 p-4 rounded-2xl border border-milktea-200 focus:ring-2 focus:ring-milktea-400 focus:border-transparent transition-all outline-none resize-none bg-white shadow-sm"
            placeholder="例如：&#10;王小明&#10;李大華&#10;張美惠..."
            value={inputText}
            onChange={handleTextChange}
          />
          <div className="text-xs text-milktea-500">
            目前人數：<span className="font-bold text-milktea-600">{initialParticipants.length}</span> 人
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-semibold text-milktea-700 flex items-center gap-2">
            <Upload className="w-4 h-4" /> 上傳檔案 (CSV 或 Excel)
          </label>
          <div className="relative group">
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="h-64 border-2 border-dashed border-milktea-200 rounded-2xl flex flex-col items-center justify-center gap-4 bg-milktea-50/50 group-hover:bg-milktea-100 group-hover:border-milktea-300 transition-all">
              <div className="p-4 bg-white rounded-full shadow-sm">
                <Upload className="w-8 h-8 text-milktea-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-milktea-600">點擊或拖曳檔案至此</p>
                <p className="text-xs text-milktea-400 mt-1">支援 .csv, .xlsx, .xls</p>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Duplicate Modal */}
      <AnimatePresence>
        {showDuplicateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 text-amber-600">
                  <div className="p-2 bg-amber-50 rounded-full">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold">偵測到重複名單</h3>
                </div>
                
                <p className="text-milktea-600">
                  系統發現有 <span className="font-bold text-amber-600">{duplicates.length}</span> 筆重複資料：
                </p>
                
                <div className="bg-milktea-50 rounded-xl p-4 max-h-32 overflow-y-auto">
                  <ul className="list-disc list-inside text-sm text-milktea-700 space-y-1">
                    {duplicates.map((name, i) => (
                      <li key={i}>{name}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={removeDuplicates}
                    className="w-full py-3 bg-milktea-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-milktea-700 transition-all"
                  >
                    <Trash2 className="w-4 h-4" /> 一次性移除重複資料
                  </button>
                  <button
                    onClick={keepDuplicates}
                    className="w-full py-3 bg-white text-milktea-500 border border-milktea-100 rounded-xl font-bold hover:bg-milktea-50 transition-all"
                  >
                    保留重複資料並繼續
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
