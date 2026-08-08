import React, { useState, useEffect, useCallback } from 'react';
import { 
  Settings, Download, Trophy, Power, PlayCircle, StopCircle, 
  Play, Calendar, Calculator, Save, RefreshCw, AlertTriangle, 
  Crosshair, DollarSign, Search, CheckCircle, Eye, X, Clock, ChevronRight, Ban
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const ManageYeeki = () => {
  // ==========================================
  // 🌟 State หลัก & ข้อมูลรอบ
  // ==========================================
  const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  
  const savedDraft = JSON.parse(localStorage.getItem('yeekiManageDraft') || '{}');
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);

  const [settings, setSettings] = useState({ is_auto_draw: false, auto_draw_percent: 50 });
  const [activeTab, setActiveTab] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState({ prize_8: '-', prize_6: '-', prize_4: '-', prize_3: '-', prize_2_top: '-', prize_2_bottom: '-' });
  const [now, setNow] = useState(new Date());

  const [prizeRates, setPrizeRates] = useState([]);
  const [exchangeRateLAK, setExchangeRateLAK] = useState(0);

  const [simulatedSuper, setSimulatedSuper] = useState(savedDraft.simulatedSuper || '');   
  const [simulatedTop, setSimulatedTop] = useState(savedDraft.simulatedTop || '');       
  const [simulatedBottom, setSimulatedBottom] = useState(savedDraft.simulatedBottom || ''); 
  
  const [analysisResult, setAnalysisResult] = useState(savedDraft.analysisResult || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [targetPercent, setTargetPercent] = useState(savedDraft.targetPercent || 50);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isExecutingDraw, setIsExecutingDraw] = useState(false);

  const [searchNumber, setSearchNumber] = useState('');
  const [searchedBuyers, setSearchedBuyers] = useState(null); 
  const [isSearchingBuyers, setIsSearchingBuyers] = useState(false);

  const [showSimulatedUsers, setShowSimulatedUsers] = useState(false);
  const [simulatedUsersList, setSimulatedUsersList] = useState([]);
  const [simulatedUserLoading, setSimulatedUserLoading] = useState(false);

  const [winners, setWinners] = useState([]); 
  const [roundWinners, setRoundWinners] = useState([]);
  const [showWinnersModal, setShowWinnersModal] = useState(false);
  
  const [roundSales, setRoundSales] = useState({ THB: 0, LAK: 0 });

  // ==========================================
  // 🌟 ฟังก์ชัน Utilities
  // ==========================================
  const formatThaiDateFull = (dateStr) => {
    if (!dateStr) return '';
    const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    const [y, m, d] = dateStr.split('-');
    const thaiYear = parseInt(y, 10) + 543;
    const thaiMonth = months[parseInt(m, 10) - 1];
    const thaiDay = parseInt(d, 10);
    return `${thaiDay} ${thaiMonth} ${thaiYear}`;
  };

  const formatCurrency = (amt) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amt || 0);

  const getCountdown = (targetDate) => {
    if (!targetDate) return '00:00:00';
    const diff = new Date(targetDate) - now;
    if (diff <= 0) return '00:00:00';
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
    const m = Math.floor((diff / 1000 / 60) % 60).toString().padStart(2, '0');
    const s = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const getTodPermutations = (numStr) => {
    if (!numStr || numStr.length !== 3) return numStr;
    const arr = numStr.split('');
    const perms = new Set();
    for(let i=0; i<3; i++) {
        for(let j=0; j<3; j++) {
            if (i===j) continue;
            for(let k=0; k<3; k++) {
                if (i===k || j===k) continue;
                perms.add(arr[i] + arr[j] + arr[k]);
            }
        }
    }
    return Array.from(perms).join(', ');
  };

  // ==========================================
  // 🌟 ฟังก์ชันดึงข้อมูลรอบที่คลิก
  // ==========================================
  const fetchRoundDetail = useCallback(async (roundId) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/yeeki-round-detail?round_id=${roundId}`);
      const data = await res.json();
      if (data.success) {
        
        if (data.sales) {
            let thb = 0; let lak = 0;
            data.sales.forEach(s => {
                if (s.currency_code === 'THB') thb = s.total_sales;
                if (s.currency_code === 'LAK') lak = s.total_sales;
            });
            setRoundSales({ THB: thb, LAK: lak });
        } else {
            setRoundSales({ THB: 0, LAK: 0 });
        }
        
        if (data.round) {
          const res8 = data.round.result_8_super || '-';
          const res4 = data.round.result_4_top || '-';
          const res3 = data.round.result_3_top || (res4 !== '-' ? res4.slice(-3) : '-');
          const res2top = res4 !== '-' ? res4.slice(-2) : '-';
          const res2bot = data.round.result_2_bottom || '-';
          const res6 = (res2bot !== '-' && res4 !== '-') ? `${res2bot}${res4}` : '-';

          setSelectedRound(prev => ({ ...prev, result_8_super: res8, result_4_top: res4, result_3_top: res3, result_2_bottom: res2bot }));
          
          setRounds(prevRounds => prevRounds.map(r => 
            r.round_id === roundId ? { ...r, result_8_super: res8, result_4_top: res4, result_3_top: res3, result_2_bottom: res2bot } : r
          ));

          if (data.all_orders && data.all_orders.length > 0) {
              const actualWinners = [];
              const rateMap = {};
              prizeRates.forEach(r => rateMap[r.lottery_type] = r.multiplier);

              data.all_orders.forEach(order => {
                  let isWin = false;
                  const num = order.selected_number;
                  const type = order.lottery_type;

                  if (type === '8 ตัว (Super)' && num === res8) isWin = true;
                  else if (type === '6 ตัว' && num === res6) isWin = true;
                  else if (type === '4 ตัวท้าย' && num === res4) isWin = true;
                  else if (type === '3 ตัวบน' && num === res3) isWin = true;
                  else if (type === '3 ตัวโต๊ด' && res3 !== '-') {
                      if (res3.split('').sort().join('') === num.split('').sort().join('')) isWin = true;
                  }
                  else if (type === '2 ตัวบน' && num === res2top) isWin = true;
                  else if (type === '2 ตัวล่าง' && num === res2bot) isWin = true;
                  else if (type === 'วิ่งบน' && res4 !== '-' && res4.slice(-1) === num) isWin = true;
                  else if (type === 'วิ่งล่าง' && res2bot !== '-' && res2bot.slice(-1) === num) isWin = true;

                  if (isWin) {
                      actualWinners.push({
                          ...order,
                          prize_amount: order.prize_amount || (order.price * (rateMap[type] || 0)),
                          status: order.status === 'ชนะ' ? 'โอนเงินแล้ว' : (order.status || 'รอโอน')
                      });
                  }
              });
              setRoundWinners(actualWinners);
          } else {
              setRoundWinners([]);
          }
        }
      }
    } catch (err) { console.error('Error fetching round detail:', err); }
  }, [prizeRates]);

  // ==========================================
  // 🌟 ดึงข้อมูล API & Auto Refresh
  // ==========================================
  const fetchRounds = useCallback(async (silent = false) => {
    if (!silent) setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/yeeki-rounds?date=${selectedDate}`);
      const data = await res.json();
      
      if (data.success && data.rounds && data.rounds.length > 0) {
        const dbRounds = data.rounds.map(r => ({
          round_id: r.round_id, round_number: r.round_number,
          openTime: new Date(r.open_time.replace(' ', 'T')), closeTime: new Date(r.close_time.replace(' ', 'T')), 
          drawTime: new Date(r.draw_time.replace(' ', 'T')), status: r.status,
          result_8_super: r.result_8_super, result_4_top: r.result_4_top,
          result_3_top: r.result_3_top, result_2_bottom: r.result_2_bottom
        }));
        
        setRounds(prevRounds => {
            if (!prevRounds || prevRounds.length === 0) return dbRounds;
            return dbRounds.map(newR => {
                const oldR = prevRounds.find(old => old.round_id === newR.round_id);
                if (oldR) {
                    return {
                        ...newR,
                        result_8_super: newR.result_8_super || oldR.result_8_super,
                        result_4_top: newR.result_4_top || oldR.result_4_top,
                        result_3_top: newR.result_3_top || oldR.result_3_top,
                        result_2_bottom: newR.result_2_bottom || oldR.result_2_bottom,
                    };
                }
                return newR;
            });
        });
        
        setSelectedRound(prev => {
             const draftRoundId = JSON.parse(localStorage.getItem('yeekiManageDraft') || '{}').selectedRoundId;
             const foundDraftRound = dbRounds.find(r => r.round_id === draftRoundId);
             const firstPending = dbRounds.find(r => r.status === 'Pending' || r.status === 'Open' || r.status === 'Closed');
             
             if (prev) {
                 const updatedRound = dbRounds.find(r => r.round_id === prev.round_id);
                 if (updatedRound) {
                     return {
                         ...updatedRound,
                         result_8_super: updatedRound.result_8_super || prev.result_8_super,
                         result_4_top: updatedRound.result_4_top || prev.result_4_top,
                         result_3_top: updatedRound.result_3_top || prev.result_3_top,
                         result_2_bottom: updatedRound.result_2_bottom || prev.result_2_bottom,
                     };
                 }
                 return prev;
             }
             return foundDraftRound || firstPending || dbRounds[0];
        });
      } else {
        setRounds([]); setSelectedRound(null);
      }
    } catch (err) { console.error('Error fetching rounds:', err); } 
    finally { if (!silent) setIsProcessing(false); }
  }, [selectedDate]);

  const fetchDrawHistory = useCallback(async (date) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/yeeki-draw-history?date=${date}`);
      const data = await res.json();
      if (data.success) {
        if (data.results) {
          const res8 = data.results.result_8_super || '-';
          const res4 = data.results.result_4_top || '-';
          setResults(prev => ({
            prize_8: res8 !== '-' ? res8 : prev.prize_8,
            prize_6: res8 !== '-' ? res8.slice(-6) : prev.prize_6,
            prize_4: res4 !== '-' ? res4 : prev.prize_4,
            prize_3: data.results.result_3_top || prev.prize_3,
            prize_2_top: res4 !== '-' ? res4.slice(-2) : prev.prize_2_top,
            prize_2_bottom: data.results.result_2_bottom || prev.prize_2_bottom
          }));
        }
        if (data.winners && data.winners.length > 0) {
            setWinners(data.winners);
        }
      }
    } catch (err) { console.error('Error fetching history:', err); }
  }, []);

  const fetchSettings = useCallback(async () => {
      try {
        const res = await fetch(`${API_URL}/api/yeeki/settings`);
        const data = await res.json();
        if (data.success && data.data) {
          setSettings({ is_auto_draw: data.data.is_auto_draw || false, auto_draw_percent: data.data.auto_draw_percent || 50 });
          const draft = JSON.parse(localStorage.getItem('yeekiManageDraft') || '{}');
          if (!draft.targetPercent) setTargetPercent(data.data.auto_draw_percent || 50);
        }
      } catch (err) { console.error('Error fetching settings:', err); }
  }, []);

  const fetchPrizeRates = useCallback(async () => {
      try {
        const res = await fetch(`${API_URL}/api/yeeki/prize-rates`);
        const data = await res.json();
        if (data.success && data.rates.length > 0) setPrizeRates(data.rates);
      } catch (err) { console.error('Error fetching prize rates:', err); }
  }, []);

  const fetchExchangeRates = useCallback(async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/exchange-rates`);
        const data = await res.json();
        if (data.success) {
          const lakRate = data.rates.find(r => r.currency_pair === 'THB_LAK');
          if (lakRate) setExchangeRateLAK(lakRate.rate);
        }
      } catch (err) { console.error('Error fetching exchange rates:', err); }
  }, []);

  useEffect(() => {
    if (selectedRound && selectedRound.status === 'Completed') {
        fetchRoundDetail(selectedRound.round_id);
    } else {
        setRoundWinners([]);
    }
  }, [selectedRound?.round_id, fetchRoundDetail]);

  useEffect(() => {
    fetchRounds(); fetchDrawHistory(selectedDate);
  }, [selectedDate, fetchRounds, fetchDrawHistory]);

  useEffect(() => {
      const intervalId = setInterval(() => { fetchRounds(true); fetchDrawHistory(selectedDate); }, 60000); 
      return () => clearInterval(intervalId);
  }, [fetchRounds, fetchDrawHistory, selectedDate]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchPrizeRates(); fetchExchangeRates(); fetchSettings();
  }, [fetchPrizeRates, fetchExchangeRates, fetchSettings]);

  useEffect(() => {
    const draft = {
      selectedDate, targetPercent, simulatedSuper, simulatedTop, simulatedBottom, analysisResult,
      selectedRoundId: selectedRound ? selectedRound.round_id : null
    };
    localStorage.setItem('yeekiManageDraft', JSON.stringify(draft));
  }, [selectedDate, targetPercent, simulatedSuper, simulatedTop, simulatedBottom, analysisResult, selectedRound]);

  // ==========================================
  // 🌟 ฟังก์ชันจัดการปุ่มกดต่างๆ
  // ==========================================
  const handleToggleAutoDraw = async (isChecked) => {
      const actionText = isChecked ? 'เปิดใช้งาน' : 'ปิดใช้งาน';
      if (!window.confirm(`⚠️ ยืนยันการ${actionText}ระบบออกเลขอัตโนมัติ ใช่หรือไม่?`)) return;
      const updated = { ...settings, is_auto_draw: isChecked, auto_draw_percent: targetPercent };
      setSettings(updated);
      try {
        const res = await fetch(`${API_URL}/api/yeeki/settings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
        const data = await res.json();
        if (data.success) alert(isChecked ? `✅ เปิดใช้ออกเลขอัตโนมัติ (${targetPercent}%)` : '❌ ปิดใช้งานออกเลขอัตโนมัติแล้ว');
      } catch (err) { alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ API'); }
  };

  const handleSaveAutoPercent = async () => {
      if (!window.confirm(`⚠️ ยืนยันการตั้งเป้าหมายยอดจ่ายที่ ${targetPercent}% ใช่หรือไม่?`)) { setTargetPercent(settings.auto_draw_percent); return; }
      const updated = { ...settings, auto_draw_percent: targetPercent };
      setSettings(updated);
      try {
        const res = await fetch(`${API_URL}/api/yeeki/settings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
        const data = await res.json();
        if (data.success) alert(`✅ บันทึกเป้าหมายที่ ${targetPercent}% เรียบร้อยแล้ว`);
      } catch (err) { console.error(err); }
  };

  const handleSavePrizeRates = async () => {
      try {
        const res = await fetch(`${API_URL}/api/yeeki/prize-rates`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rates: prizeRates }) });
        const data = await res.json();
        if (data.success) alert('✅ บันทึกอัตราการจ่ายยี่กีสำเร็จ!'); else alert(`❌ ไม่สามารถบันทึกได้: ${data.message}`);
      } catch (err) { alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ API'); }
  };

  const handleSaveExchangeRate = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/exchange-rates`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pair: 'THB_LAK', rate: exchangeRateLAK }) });
        const data = await res.json();
        if (data.success) alert('✅ อัปเดตอัตราแลกเปลี่ยนสำเร็จ!'); else alert(`❌ ไม่สามารถบันทึกได้: ${data.message}`);
      } catch (err) { alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ API'); }
  };

  const handleAnalyzeDraw = async () => {
      if (simulatedSuper.length !== 8) return alert('กรุณากรอกเลข Super Jackpot ให้ครบ 8 หลัก');
      if (simulatedTop.length !== 4) return alert('กรุณากรอกเลขบน ให้ครบ 4 หลัก');
      if (simulatedBottom.length !== 2) return alert('กรุณากรอกเลขล่างให้ครบ 2 หลัก');
      if (!selectedRound) return alert('กรุณาเลือกรอบที่ต้องการวิเคราะห์');
  
      setIsAnalyzing(true);
      try {
        const res = await fetch(`${API_URL}/api/admin/analyze-yeeki-draw`, { 
          method: 'POST', headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ round_id: selectedRound.round_id, super_number: simulatedSuper, top_number: simulatedTop, bottom_number: simulatedBottom }) 
        });
        const data = await res.json();
        if (data.success) setAnalysisResult(data);
        else alert(`❌ วิเคราะห์ไม่สำเร็จ: ${data.message}`);
      } catch (err) { alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ API'); } 
      finally { setIsAnalyzing(false); }
  };

  const handleSuggestDraw = async () => {
      if (!selectedRound) return alert('กรุณาเลือกรอบที่ต้องการ');
      setIsSuggesting(true);
      try {
        const res = await fetch(`${API_URL}/api/admin/yeeki/suggest-draw`, { 
          method: 'POST', headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ target_percent: targetPercent, round_id: selectedRound.round_id }) 
        });
        const data = await res.json();
        if (data.success) {
          if (!simulatedSuper || simulatedSuper.length !== 8) {
              setSimulatedSuper(data.super_8 || data.suggestedSuper); 
          }
          setSimulatedTop(data.top_4 || data.suggestedTop);
          setSimulatedBottom(data.bottom_2 || data.suggestedBottom);
        } else alert(`❌ ไม่สามารถสุ่มเลขได้: ${data.message}`);
      } catch (err) { alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ API'); } 
      finally { setIsSuggesting(false); }
  };

  const handleExecuteDraw = async () => {
      if (!window.confirm(`⚠️ ยืนยันประกาศผลยี่กี รอบที่ ${selectedRound.round_number} ใช่หรือไม่?\n\nแจ็คพอต 8 ตัว: ${simulatedSuper}\nเลขบน 4 ตัว: ${simulatedTop}\nเลขล่าง 2 ตัว: ${simulatedBottom}\n\n(ระบบจะตรวจบิลและแจกเงินรางวัลทันที)`)) return;
      
      setIsExecutingDraw(true);
      try {
        const res = await fetch(`${API_URL}/api/admin/execute-yeeki-draw`, { 
          method: 'POST', headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ round_id: selectedRound.round_id, super_number: simulatedSuper, top_number: simulatedTop, bottom_number: simulatedBottom }) 
        });
        const data = await res.json();
        if (data.success) {
          alert('✅ ' + data.message);
          localStorage.removeItem('yeekiManageDraft');
          setSimulatedSuper(''); setSimulatedTop(''); setSimulatedBottom(''); setAnalysisResult(null);
          fetchRounds(); fetchDrawHistory(selectedDate); fetchRoundDetail(selectedRound.round_id); 
        } else { alert(`❌ ประกาศผลไม่สำเร็จ: ${data.message}`); }
      } catch (err) { alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ API'); } 
      finally { setIsExecutingDraw(false); }
  };

  const fetchSimulatedUsers = async (type, numberStr) => {
      setSimulatedUserLoading(true); setShowSimulatedUsers(true); setSimulatedUsersList([]);
      try {
        const res = await fetch(`${API_URL}/api/admin/simulate-yeeki-winners`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ round_id: selectedRound.round_id, number: numberStr, lottery_type: type })
        });
        const data = await res.json();
        if (data.success) setSimulatedUsersList(data.users);
        else alert(`❌ โหลดรายชื่อไม่สำเร็จ: ${data.message}`);
      } catch (err) { alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ API'); } 
      finally { setSimulatedUserLoading(false); }
  };

 const handleSearchBuyers = async () => {
      if (!searchNumber) return alert('กรุณากรอกเลขที่ต้องการค้นหา');
      setIsSearchingBuyers(true); setSearchedBuyers(null);
      try {
        const res = await fetch(`${API_URL}/api/admin/search-yeeki-buyers`, { 
          method: 'POST', headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ number: searchNumber, date: selectedDate }) 
        });
        const data = await res.json();
        
        if (data.success) {
            // 🌟 ป้องกันพัง: ดักรับทั้ง data.buyers และ data.data หรือถ้าไม่มีให้เป็น []
            setSearchedBuyers(data.buyers || data.data || []);
        }
        else { 
            setSearchedBuyers([]); 
            alert(`❌ ค้นหาไม่สำเร็จ: ${data.message}`); 
        }
      } catch (err) { 
          setSearchedBuyers([]); 
          alert('❌ เกิดข้อผิดพลาดในการค้นหา'); 
      } 
      finally { setIsSearchingBuyers(false); }
  };



  // 💡 ตัวกรองแยก: สำหรับตารางคนที่ถูก "เฉพาะรอบ" (Round Winners) ใช้งานใน Popup 
  // 💡 แก้ปัญหา ReferenceError โดยประกาศตัวแปรให้ครบ
  const filteredRoundWinners = activeTab === 'all' 
    ? roundWinners 
    : roundWinners.filter(w => w.lottery_type === activeTab);

  const filteredWinners = activeTab === 'all' 
    ? winners 
    : winners.filter(w => w.lottery_type === activeTab);

  const exportPDF = () => {
      const doc = new jsPDF(); 
      doc.addFont('THSarabunNew', 'normal'); doc.setFontSize(18); 
      doc.text(`Yeeki Winners Report - Round ${selectedRound?.round_number}`, 14, 20);
      const tableColumn = ["Round", "Username", "Type", "Number", "Bet", "Prize", "Currency", "Status"];
      const tableRows = [];
      filteredRoundWinners.forEach(w => {
        tableRows.push([ w.round_number, w.username, w.lottery_type, w.selected_number, w.price, w.prize_amount, w.currency_code, w.status || 'Paid' ]);
      });
      doc.autoTable({ head: [tableColumn], body: tableRows, startY: 30 }); 
      doc.save(`yeeki_winners_round_${selectedRound?.round_number}_${selectedDate}.pdf`);
  };

return (
    <div style={{ padding: '20px', backgroundColor: '#fdf2f8', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      {/* 🌟 Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ margin: 0, color: '#9d174d', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={28} /> บริหารหวยจับยี่กี (Yeeki VIP)
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'white', padding: '8px 15px', borderRadius: '8px', border: '1px solid #fbcfe8', boxShadow: '0 2px 5px rgba(219, 39, 119, 0.1)' }}>
          <Calendar size={20} color="#db2777" />
          <input 
            type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} 
            style={{ border: 'none', outline: 'none', fontWeight: 'bold', fontSize: '15px', color: '#831843', cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* 🌟 เลือกรอบจัดการ (แบบการ์ด 24 รอบ) */}
      <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(219, 39, 119, 0.08)', marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#9d174d', fontSize: '15px' }}>เลือกรอบที่ต้องการจัดการ:</h4>
        
        {isProcessing ? (
           <div style={{ padding: '20px', textAlign: 'center', color: '#db2777' }}><RefreshCw className="spin" size={24}/></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px', maxHeight: '500px', overflowY: 'auto', padding: '5px' }}>
            {rounds.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: '#ef4444', fontWeight: 'bold' }}>ไม่มีข้อมูลรอบของวันนี้</div>
            ) : rounds.map(r => {
              const isSelected = selectedRound?.round_id === r.round_id;
              const isCompleted = r.status === 'Completed';
              const isClosed = now > r.closeTime && !isCompleted;
              const isOpen = now >= r.openTime && now <= r.closeTime && !isCompleted;
              const isFuture = now < r.openTime && !isCompleted;

              let statusText = ''; let statusColor = ''; let IconComponent = Ban; 
              if (isCompleted) { statusText = 'ออกผลแล้ว'; statusColor = '#16a34a'; IconComponent = CheckCircle; } 
              else if (isClosed) { statusText = 'หมดเวลาแทงแล้ว'; statusColor = '#ef4444'; IconComponent = Ban; } 
              else if (isOpen) { statusText = getCountdown(r.closeTime); statusColor = '#e11d48'; IconComponent = PlayCircle; } 
              else if (isFuture) { statusText = 'รอเปิดรับแทง'; statusColor = '#d97706'; IconComponent = Clock; }

              const formatTimeOnly = (dateObj) => dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' น.';

              return (
                <div key={r.round_id}
                  onClick={() => { 
                      setSelectedRound(r); 
                      setAnalysisResult(null); setSimulatedSuper(''); setSimulatedTop(''); setSimulatedBottom(''); 
                      if (r.status === 'Completed') {
                          setShowWinnersModal(true); 
                      }
                  }}
                  style={{
                    backgroundColor: isSelected ? '#fdf2f8' : (isCompleted || isClosed) ? '#f9fafb' : 'white',
                    border: isSelected ? '2px solid #be185d' : (isCompleted || isClosed) ? '1px solid #e5e7eb' : isOpen ? '1px solid #fbcfe8' : '1px dashed #e2e8f0',
                    borderRadius: '12px', padding: '15px', cursor: 'pointer',
                    boxShadow: isSelected ? '0 4px 12px rgba(190, 24, 93, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s', opacity: (isCompleted || isClosed) && !isSelected ? 0.7 : 1
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isSelected ? '#be185d' : (isCompleted || isClosed) ? '#9ca3af' : '#db2777', fontWeight: 'bold', fontSize: '15px' }}>
                        <IconComponent size={18} /> รอบที่ {r.round_number}
                    </div>
                    {isCompleted && (<span style={{ fontSize: '12px', backgroundColor: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>ออกผลแล้ว</span>)}
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: '#64748b', marginBottom: '15px' }}>
                      <span>เปิดขาย:</span><span style={{ textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>{formatTimeOnly(r.openTime)}</span>
                      <span>ปิดรับแทง:</span><span style={{ textAlign: 'right', color: '#ef4444', fontWeight: 'bold' }}>{formatTimeOnly(r.closeTime)}</span>
                      <span>ออกผล:</span><span style={{ textAlign: 'right', color: '#d97706', fontWeight: 'bold' }}>{formatTimeOnly(r.drawTime)}</span>
                  </div>

                  {isCompleted && r.result_4_top && r.result_4_top !== '-' && (
                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>ผลรางวัล</div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 'bold', color: '#dc2626', fontSize: '16px' }}>{r.result_4_top}</span>
                        <span style={{ fontWeight: 'bold', color: '#1d4ed8', fontSize: '16px' }}>{r.result_2_bottom}</span>
                      </div>
                    </div>
                  )}

                  {!isCompleted && (<div style={{ textAlign: 'center', fontWeight: '900', fontSize: isOpen ? '18px' : '13px', color: statusColor }}>{statusText}</div>)}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🌟 กล่องผลการออกรางวัล (โชว์ของรอบที่เลือก) */}
      <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', marginBottom: '20px', border: '3px solid #fbcfe8', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '8px', height: '100%', backgroundColor: '#be185d' }}></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h3 style={{ margin: 0, color: '#9d174d', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Trophy size={28} color="#be185d" /> ผลการออกรางวัลยี่กี
            </h3>
            {selectedRound ? (
               <p style={{ margin: '5px 0 0 0', color: '#475569', fontSize: '16px', fontWeight: 'bold' }}>
                 กำลังแสดงข้อมูลของ: <span style={{ color: '#be185d', fontSize: '18px' }}>รอบที่ {selectedRound.round_number}</span> 
                 <span style={{ marginLeft: '10px', fontSize: '14px', color: selectedRound.status === 'Completed' ? '#16a34a' : '#d97706' }}>
                   ({selectedRound.status === 'Completed' ? 'ออกผลแล้ว' : 'ยังไม่ออกผล'})
                 </span>
               </p>
            ) : (
               <p style={{ margin: '5px 0 0 0', color: '#64748b' }}>กรุณาเลือกรอบด้านบนเพื่อดูผล</p>
            )}
          </div>
        </div>

        {selectedRound && selectedRound.status === 'Completed' ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px', marginBottom: '10px' }}>
            {[ 
              { label: '8 ตัว (Super Jackpot)', val: selectedRound.result_8_super || '-', color: '#7e22ce', bg: '#faf5ff', width: '250px' }, 
              { label: '6 ตัว', val: (selectedRound.result_2_bottom && selectedRound.result_4_top && selectedRound.result_4_top !== '-') ? `${selectedRound.result_2_bottom}${selectedRound.result_4_top}` : '-', color: '#4f46e5', bg: '#eff6ff', width: '200px' },
              { label: '4 ตัว', val: selectedRound.result_4_top || '-', color: '#dc2626', bg: '#fef2f2', width: '150px' }, 
              { label: '3 ตัวบน', val: selectedRound.result_3_top || (selectedRound.result_4_top ? selectedRound.result_4_top.slice(-3) : '-'), color: '#ea580c', bg: '#fff7ed', width: '120px' }, 
              { label: '2 ตัวบน', val: (selectedRound.result_4_top && selectedRound.result_4_top !== '-') ? selectedRound.result_4_top.slice(-2) : '-', color: '#f59e0b', bg: '#fffbeb', width: '120px' }, 
              { label: '2 ตัวล่าง', val: selectedRound.result_2_bottom || '-', color: '#1d4ed8', bg: '#eff6ff', width: '120px' } 
            ].map(p => (
              <div key={p.label} style={{ flex: `1 1 ${p.width}`, padding: '20px 10px', border: `2px solid ${p.color}`, borderRadius: '12px', minWidth: '120px', maxWidth: '300px', backgroundColor: p.bg, textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <p style={{ margin: '0 0 10px 0', color: p.color, fontSize: '15px', fontWeight: '900' }}>{p.label}</p>
                <h2 style={{ margin: 0, color: '#1e293b', fontSize: '32px', letterSpacing: '3px', fontWeight: '900' }}>{p.val}</h2>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
             <Clock size={40} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
             <h3 style={{ color: '#64748b', margin: 0 }}>รอบนี้ยังไม่มีการออกผลรางวัล</h3>
             <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '5px' }}>ผลรางวัลจะแสดงที่นี่เมื่อถึงเวลาหรือประกาศผลแล้ว</p>
          </div>
        )}
      </div>

      {/* 🌟 ตั้งค่าเรทเงิน & อัตราจ่าย */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#15803d', display: 'flex', alignItems: 'center', gap: '8px' }}><DollarSign size={20} color="#15803d" /> อัตราแลกเปลี่ยน (LAK เป็น THB)</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', backgroundColor: '#f0fdf4', padding: '10px 15px', borderRadius: '8px', border: '1px solid #bbf7d0', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '16px' }}>1 THB = </span>
            <input type="number" value={exchangeRateLAK} onChange={(e) => setExchangeRateLAK(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100px', fontWeight: 'bold', fontSize: '16px', outline: 'none' }} />
            <span style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '16px' }}>LAK</span>
          </div>
          <button onClick={handleSaveExchangeRate} style={{ padding: '10px 20px', backgroundColor: '#15803d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}><Save size={18} /> บันทึกเรทแลกเปลี่ยน</button>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '8px' }}><Calculator size={20} color="#8b5cf6" /> ปรับอัตราการจ่ายยี่กี (ตัวคูณ)</h4>
          <div style={{ overflowX: 'auto', marginBottom: '15px', maxHeight: '180px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', whiteSpace: 'nowrap' }}>
              <thead><tr style={{ backgroundColor: '#f8fafc', color: '#475569' }}><th style={{ padding: '8px', borderBottom: '2px solid #e2e8f0' }}>ประเภทรางวัล</th><th style={{ padding: '8px', borderBottom: '2px solid #e2e8f0' }}>อัตราจ่าย (ตัวคูณ)</th></tr></thead>
              <tbody>
                {prizeRates.map((rate, index) => (
                  <tr key={rate.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold', color: '#1e293b' }}>{rate.lottery_type}</td>
                    <td style={{ padding: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 'bold', color: '#8b5cf6' }}>X</span>
                        <input type="number" value={rate.multiplier} onChange={(e) => { const newRates = [...prizeRates]; newRates[index].multiplier = e.target.value; setPrizeRates(newRates); }} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '110px', fontWeight: 'bold', outline: 'none' }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={handleSavePrizeRates} style={{ padding: '10px 20px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}><Save size={18} /> บันทึกอัตราจ่ายยี่กี</button>
        </div>
      </div>

      {/* 🌟 โซนควบคุมการออกรางวัล */}
      {selectedRound && selectedRound.status !== 'Completed' && (
        <div style={{ backgroundColor: '#fffbeb', padding: '20px', borderRadius: '12px', border: '2px solid #fde68a', boxShadow: '0 4px 15px rgba(217, 119, 6, 0.1)', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h4 style={{ margin: 0, color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px' }}><Crosshair size={26} /> ควบคุมการออกรางวัล (รอบที่ {selectedRound.round_number})</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                 <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '4px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #fde68a' }}><Clock size={16} /> เหลือเวลาออกผล: {getCountdown(selectedRound.drawTime)}</span>
                 <p style={{ margin: 0, color: '#d97706', fontSize: '13px' }}>แยกระบบสุ่ม 3 ชุดอิสระ: ชุด 8 ตัว (Super), ชุด 4 ตัว (บน), ชุด 2 ตัว (ล่าง)</p>
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: settings.is_auto_draw ? '#10b981' : '#e2e8f0', color: settings.is_auto_draw ? 'white' : '#475569', padding: '10px 20px', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', transition: '0.3s', boxShadow: settings.is_auto_draw ? '0 4px 10px rgba(16, 185, 129, 0.3)' : 'none' }}>
              <input type="checkbox" checked={settings.is_auto_draw} onChange={(e) => handleToggleAutoDraw(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
              <Clock size={18} /> {settings.is_auto_draw ? `ระบบออโต้ทำงาน (คุมยอดจ่าย ${targetPercent}%)` : 'เปิดใช้ออกเลขออโต้'}
            </label>
          </div>

          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: '0 0 15px 0', fontWeight: 'bold', color: '#334155', fontSize: '15px' }}>1. ให้ระบบแนะนำเลขเด็ด (เพื่อให้ยอดจ่ายไม่เกินเป้า)</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
              <input type="range" min="0" max="100" value={targetPercent} onChange={(e) => setTargetPercent(e.target.value)} style={{ flex: '1 1 200px', cursor: 'pointer', maxWidth: '400px' }} />
              <span style={{ fontWeight: '900', color: '#d97706', fontSize: '22px', width: '60px' }}>{targetPercent}%</span>
              <button onClick={handleSaveAutoPercent} style={{ padding: '10px 15px', backgroundColor: '#e2e8f0', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}><Save size={16} /> บันทึก %</button>
              <button onClick={handleSuggestDraw} disabled={isSuggesting} style={{ flex: '1 1 auto', padding: '12px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)' }}><RefreshCw size={20} className={isSuggesting ? "spin" : ""} /> {isSuggesting ? 'ระบบกำลังคำนวณแยกชุด...' : 'สุ่มเลขแบบแยกชุดที่ปลอดภัยที่สุด'}</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '25px', backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ flex: '1 1 250px' }}>
              <span style={{ fontWeight: 'bold', color: '#7e22ce', display: 'block', marginBottom: '8px' }}>🏆 เลข 8 หลัก (Super Jackpot):</span>
              <input type="tel" placeholder="XXXXXXXX" maxLength="8" value={simulatedSuper} onChange={(e) => setSimulatedSuper(e.target.value.replace(/\D/g, ''))} style={{ width: '100%', padding: '12px', fontSize: '24px', fontWeight: '900', borderRadius: '8px', border: '2px solid #c084fc', outline: 'none', letterSpacing: '4px', color: '#6b21a8', textAlign: 'center', boxSizing: 'border-box' }} />
            </div>
            
            <div style={{ flex: '1 1 150px' }}>
              <span style={{ fontWeight: 'bold', color: '#b91c1c', display: 'block', marginBottom: '8px' }}>🔥 เลข 4 หลัก (รางวัลบน):</span>
              <input type="tel" placeholder="XXXX" maxLength="4" value={simulatedTop} onChange={(e) => setSimulatedTop(e.target.value.replace(/\D/g, ''))} style={{ width: '100%', padding: '12px', fontSize: '24px', fontWeight: '900', borderRadius: '8px', border: '2px solid #fca5a5', outline: 'none', letterSpacing: '6px', color: '#991b1b', textAlign: 'center', boxSizing: 'border-box' }} />
            </div>
            
            <div style={{ flex: '1 1 120px' }}>
              <span style={{ fontWeight: 'bold', color: '#1d4ed8', display: 'block', marginBottom: '8px' }}>👇 เลข 2 หลัก (ล่าง):</span>
              <input type="tel" placeholder="XX" maxLength="2" value={simulatedBottom} onChange={(e) => setSimulatedBottom(e.target.value.replace(/\D/g, ''))} style={{ width: '100%', padding: '12px', fontSize: '24px', fontWeight: '900', borderRadius: '8px', border: '2px solid #7dd3fc', outline: 'none', letterSpacing: '6px', color: '#075985', textAlign: 'center', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginTop: '20px', width: '100%' }}>
              <button 
                onClick={handleAnalyzeDraw} 
                disabled={isAnalyzing || simulatedSuper.length !== 8 || simulatedTop.length !== 4 || simulatedBottom.length !== 2} 
                style={{ padding: '15px 40px', backgroundColor: '#d97706', color: 'white', border: 'none', borderRadius: '30px', cursor: (simulatedSuper.length === 8 && simulatedTop.length === 4 && simulatedBottom.length === 2) ? 'pointer' : 'not-allowed', fontWeight: '900', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(217, 119, 6, 0.3)', width: '100%', maxWidth: '300px', justifyContent: 'center' }}
              >
                {isAnalyzing ? 'กำลังประมวลผล...' : '🔍 กดเช็คยอดจ่ายทันที'}
              </button>

              {(simulatedSuper.length === 8 && simulatedTop.length === 4 && simulatedBottom.length === 2) && (
                <div style={{ width: '100%', maxWidth: '500px', textAlign: 'center', padding: '20px', backgroundColor: '#ecfdf5', borderRadius: '12px', border: '1px dashed #34d399' }}>
                  <h4 style={{ color: '#047857', margin: '0 0 15px 0' }}>✅ ได้เลขรางวัลครบถ้วน พร้อมจ่ายเงินแล้ว!</h4>
                  <button onClick={handleExecuteDraw} disabled={isExecutingDraw} style={{ padding: '15px 40px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '50px', cursor: isExecutingDraw ? 'not-allowed' : 'pointer', fontWeight: '900', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)', opacity: isExecutingDraw ? 0.7 : 1, transition: 'all 0.3s', width: '100%' }}>
                    <Trophy size={24} /> {isExecutingDraw ? 'กำลังโอนเงินรางวัล...' : 'ยืนยันประกาศผลยี่กี ทันที!'}
                  </button>
                  <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '15px', fontWeight: 'bold' }}>* ระบบจะทำการตรวจบิลทั้งหมด และโอนเงินเข้า Wallet อัตโนมัติ</p>
                </div>
              )}
            </div>
          </div>

          {analysisResult && (
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h5 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '18px', textAlign: 'center' }}>
                จำลองผลออกรางวัล ซูเปอร์: <span style={{ color: '#7e22ce' }}>{simulatedSuper}</span> | บน: <span style={{ color: '#dc2626' }}>{simulatedTop}</span> | ล่าง: <span style={{ color: '#1d4ed8' }}>{simulatedBottom}</span>
              </h5>
              
              <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', color: '#475569' }}>
                      <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>รางวัล</th><th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>เลขที่จะถูก</th><th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>จำนวนคนซื้อถูก</th><th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>ยอดจ่ายสุทธิ (THB)</th><th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>ตรวจสอบบิล</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['8 ตัว (Super)', '6 ตัว', '4 ตัวท้าย', '3 ตัวบน', '3 ตัวโต๊ด', '2 ตัวบน', '2 ตัวล่าง', 'วิ่งบน', 'วิ่งล่าง'].map((type) => {
                      const data = analysisResult.analysis?.find(a => a.lottery_type === type);
                      let numSlice = '-';
                      
                      if (simulatedSuper.length === 8 && simulatedTop.length === 4 && simulatedBottom.length === 2) {
                          if (type === '8 ตัว (Super)') numSlice = simulatedSuper;
                          if (type === '6 ตัว') numSlice = `${simulatedBottom}${simulatedTop}`;
                          if (type === '4 ตัวท้าย') numSlice = simulatedTop;
                          if (type === '3 ตัวบน') numSlice = simulatedTop.slice(-3);
                          if (type === '3 ตัวโต๊ด') numSlice = `สลับ (${simulatedTop.slice(-3)})`;
                          if (type === '2 ตัวบน') numSlice = simulatedTop.slice(-2);
                          if (type === '2 ตัวล่าง') numSlice = simulatedBottom;
                          if (type === 'วิ่งบน') numSlice = `มีใน (${simulatedTop.slice(-3)})`;
                          if (type === 'วิ่งล่าง') numSlice = `มีใน (${simulatedBottom})`;
                      }

                      const hasWinners = data && data.winner_count > 0;

                      return (
                        <tr key={type} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: hasWinners ? '#fef2f2' : 'white' }}>
                          <td style={{ padding: '10px', fontWeight: '900', color: type === '8 ตัว (Super)' || type === '6 ตัว' ? '#7e22ce' : '#334155' }}>{type}</td>
                          <td style={{ padding: '10px', color: '#dc2626', fontWeight: 'bold', fontSize: '14px' }}>{numSlice}</td>
                          <td style={{ padding: '10px', fontWeight: '900', fontSize: '15px', color: hasWinners ? '#16a34a' : '#94a3b8' }}>{data ? data.winner_count : 0} คน</td>
                          <td style={{ padding: '10px', fontWeight: '900', fontSize: '15px', color: hasWinners ? '#b91c1c' : '#94a3b8' }}>{formatCurrency(data ? data.total_payout_thb : 0)}</td>
                          <td style={{ padding: '10px' }}>
                            {hasWinners && (
                              <button onClick={() => fetchSimulatedUsers(type, numSlice)} style={{ padding: '6px 12px', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', margin: '0 auto' }}><Eye size={16} /> ดูรายชื่อ</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Modal โชว์รายชื่อจำลอง */}
              {showSimulatedUsers && (
                <div style={{ backgroundColor: '#f1f5f9', padding: '15px', borderRadius: '12px', marginTop: '15px', border: '1px solid #cbd5e1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: '0', color: '#334155', fontSize: '16px' }}>รายชื่อผู้ที่ซื้อเลขนี้</h4>
                    <button onClick={() => setShowSimulatedUsers(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><X size={24} /></button>
                  </div>
                  {simulatedUserLoading ? ( <div style={{ textAlign: 'center', padding: '10px', color: '#64748b' }}>กำลังโหลด...</div> ) : (
                    <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', whiteSpace: 'nowrap' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #cbd5e1', color: '#475569', backgroundColor: '#f8fafc' }}>
                            <th style={{ padding: '10px' }}>Username</th><th style={{ padding: '10px' }}>สกุลเงิน</th><th style={{ padding: '10px' }}>ยอดแทง</th><th style={{ padding: '10px', color: '#b91c1c' }}>รางวัล (สกุลเดิม)</th><th style={{ padding: '10px', color: '#0ea5e9' }}>เทียบเป็น THB</th>
                          </tr>
                        </thead>
                        <tbody>
                          {simulatedUsersList.map((u, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '10px', fontWeight: 'bold' }}>{u.username}</td><td style={{ padding: '10px' }}>{u.currency_code}</td><td style={{ padding: '10px' }}>{u.price.toLocaleString()}</td><td style={{ padding: '10px', fontWeight: '900', color: '#b91c1c' }}>{u.estimated_prize.toLocaleString()}</td><td style={{ padding: '10px', fontWeight: '900', color: '#0ea5e9' }}>{Number(u.estimated_prize_thb).toLocaleString('th-TH', {minimumFractionDigits: 2})} ฿</td>
                            </tr>
                          ))}
                          {simulatedUsersList.length === 0 && (<tr><td colSpan="5" style={{ padding: '15px', textAlign: 'center', color: '#64748b' }}>ไม่พบรายชื่อผู้ถูกรางวัล</td></tr>)}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #cbd5e1', flexWrap: 'wrap', gap: '15px', marginTop: '20px' }}>
                <div><span style={{ display: 'block', fontSize: '13px', color: '#64748b' }}>ยอดขายรวมรอบนี้ (THB)</span><span style={{ fontSize: '20px', fontWeight: '900', color: '#0ea5e9' }}>{formatCurrency(analysisResult.totalSalesTHB)}</span></div>
                <div style={{ textAlign: 'right' }}><span style={{ display: 'block', fontSize: '13px', color: '#64748b' }}>ยอดจ่ายรวม (Payout THB)</span><span style={{ fontSize: '24px', fontWeight: '900', color: '#ef4444' }}>{formatCurrency(analysisResult.analysis?.reduce((sum, item) => sum + item.total_payout_thb, 0))}</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🌟 Popup แสดงรายชื่อ และ ยอดขายเมื่อคลิกการ์ด (อัปเดตตามคำสั่งล่าสุด) */}
      {showWinnersModal && selectedRound && selectedRound.status === 'Completed' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>

            {/* ส่วนหัว */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
              <h4 style={{ margin: '0', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px' }}>
                <Trophy size={24} color="#16a34a" /> สรุปผลรางวัลรอบที่ {selectedRound.round_number}
              </h4>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={exportPDF} style={{ padding: '8px 15px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '13px' }}>
                  <Download size={16} /> โหลด PDF
                </button>
                <button onClick={() => setShowWinnersModal(false)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* ส่วนแสดงเลขที่ออก (ยกเว้น 8 ตัว) และ ยอดขาย/ยอดจ่าย */}
            <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '15px', border: '1px solid #e2e8f0' }}>
               <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '15px' }}>
                 {[
                   { label: '6 ตัว', val: (selectedRound.result_2_bottom && selectedRound.result_4_top && selectedRound.result_4_top !== '-') ? `${selectedRound.result_2_bottom}${selectedRound.result_4_top}` : '-', color: '#4f46e5', bg: '#eff6ff' },
                   { label: '4 ตัวท้าย', val: selectedRound.result_4_top || '-', color: '#dc2626', bg: '#fef2f2' },
                   { label: '3 ตัวบน', val: selectedRound.result_3_top || (selectedRound.result_4_top ? selectedRound.result_4_top.slice(-3) : '-'), color: '#ea580c', bg: '#fff7ed' },
                   { label: '2 ตัวบน', val: (selectedRound.result_4_top && selectedRound.result_4_top !== '-') ? selectedRound.result_4_top.slice(-2) : '-', color: '#f59e0b', bg: '#fffbeb' },
                   { label: '2 ตัวล่าง', val: selectedRound.result_2_bottom || '-', color: '#1d4ed8', bg: '#eff6ff' },
                   { label: 'วิ่งบน', val: (selectedRound.result_4_top && selectedRound.result_4_top !== '-') ? selectedRound.result_4_top.slice(-1) : '-', color: '#059669', bg: '#dcfce7' },
                   { label: 'วิ่งล่าง', val: (selectedRound.result_2_bottom && selectedRound.result_2_bottom !== '-') ? selectedRound.result_2_bottom.slice(-1) : '-', color: '#0891b2', bg: '#e0f2fe' }
                 ].map(p => (
                   <div key={p.label} style={{ flex: '1 1 90px', padding: '10px 5px', border: `1px solid ${p.color}`, borderRadius: '8px', minWidth: '90px', backgroundColor: p.bg, textAlign: 'center' }}>
                     <p style={{ margin: '0 0 5px 0', color: p.color, fontSize: '11px', fontWeight: 'bold' }}>{p.label}</p>
                     <h3 style={{ margin: 0, color: '#1e293b', fontSize: '18px', fontWeight: '900' }}>{p.val}</h3>
                   </div>
                 ))}
               </div>
               
               {(() => {
                 const totalPayoutTHB = roundWinners.filter(w => w.currency_code === 'THB').reduce((sum, w) => sum + w.prize_amount, 0);
                 const totalPayoutLAK = roundWinners.filter(w => w.currency_code === 'LAK').reduce((sum, w) => sum + w.prize_amount, 0);
                 const convertedLAKtoTHB = exchangeRateLAK > 0 ? (roundSales.LAK / exchangeRateLAK) : 0;
                 const grandTotalSalesTHB = roundSales.THB + convertedLAKtoTHB;

                 return (
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', borderTop: '2px dashed #cbd5e1', paddingTop: '15px' }}>
                       <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <strong style={{ display: 'block', color: '#334155', marginBottom: '5px' }}>💰 ยอดขาย:</strong>
                          <div style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}><span>THB:</span> <strong>{formatCurrency(roundSales.THB)} ฿</strong></div>
                          <div style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}><span>LAK:</span> <strong>{formatCurrency(roundSales.LAK)} ₭</strong></div>
                          <div style={{ fontSize: '14px', display: 'flex', justifyContent: 'space-between', color: '#0ea5e9', marginTop: '5px', paddingTop: '5px', borderTop: '1px solid #f1f5f9' }}>
                              <strong>รวม (แปลงเป็นเงินไทย):</strong> <strong>{formatCurrency(grandTotalSalesTHB)} ฿</strong>
                          </div>
                       </div>
                       <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <strong style={{ display: 'block', color: '#334155', marginBottom: '5px' }}>💸 ยอดจ่ายรางวัล:</strong>
                          <div style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}><span>THB:</span> <strong style={{ color: '#b91c1c' }}>{formatCurrency(totalPayoutTHB)} ฿</strong></div>
                          <div style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}><span>LAK:</span> <strong style={{ color: '#b91c1c' }}>{formatCurrency(totalPayoutLAK)} ₭</strong></div>
                       </div>
                   </div>
                 );
               })()}
            </div>

            {/* แท็บตัวกรอง */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
              {[
                { id: 'all', label: 'ทั้งหมด' },
                { id: '8 ตัว (Super)', label: '8 ตัว (Super)' },
                { id: '6 ตัว', label: '6 ตัว' },
                { id: '4 ตัวท้าย', label: '4 ตัวท้าย' },
                { id: '3 ตัวบน', label: '3 ตัวบน' },
                { id: '3 ตัวโต๊ด', label: '3 ตัวโต๊ด' },
                { id: '2 ตัวบน', label: '2 ตัวบน' },
                { id: '2 ตัวล่าง', label: '2 ตัวล่าง' },
                { id: 'วิ่งบน', label: 'วิ่งบน' },
                { id: 'วิ่งล่าง', label: 'วิ่งล่าง' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: activeTab === tab.id ? '#0ea5e9' : '#f1f5f9',
                    color: activeTab === tab.id ? 'white' : '#64748b',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    transition: '0.2s'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ตารางรายชื่อ */}
            <div style={{ overflowY: 'auto', flex: 1, border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px', whiteSpace: 'nowrap', fontSize: '14px' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr style={{ backgroundColor: '#f8fafc', color: '#475569' }}>
                    <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>รอบที่</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>ผู้ใช้</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>ประเภท</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>เลขที่ถูก</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>ยอดซื้อ</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>เงินรางวัลที่ได้</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoundWinners.length === 0 ? (
                    <tr><td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>ไม่มีรายชื่อผู้ถูกรางวัลในประเภทนี้ สำหรับรอบที่ {selectedRound.round_number}</td></tr>
                  ) : filteredRoundWinners.map((w, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#9d174d' }}>{w.round_number}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{w.username}</td>
                      <td style={{ padding: '12px' }}>{w.lottery_type}</td>
                      <td style={{ padding: '12px', color: '#dc2626', fontWeight: 'bold' }}>{w.selected_number}</td>
                      <td style={{ padding: '12px' }}>{Number(w.price).toLocaleString()} {w.currency_code}</td>
                      <td style={{ padding: '12px', color: '#16a34a', fontWeight: 'bold' }}>+ {Number(w.prize_amount).toLocaleString()} {w.currency_code}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ backgroundColor: '#dcfce7', color: '#16a34a', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px' }}>
                          {w.status || 'โอนเงินแล้ว'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 ค้นหาประวัติย้อนหลัง */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#9d174d', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
          <Search size={22} color="#be185d" /> ค้นหาประวัติการซื้อจากตัวเลข (อิงตามวันที่เลือก)
        </h4>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
          <input 
            type="text" placeholder="กรอกตัวเลขที่ต้องการค้นหา" 
            value={searchNumber} 
            onChange={(e) => setSearchNumber(e.target.value.replace(/\D/g, ''))} 
            style={{ flex: '1 1 200px', padding: '12px 15px', fontSize: '16px', borderRadius: '8px', border: '2px solid #fbcfe8', outline: 'none', fontWeight: 'bold', color: '#9d174d' }} 
          />
          <button 
            onClick={handleSearchBuyers} disabled={isSearchingBuyers} 
            style={{ flex: '0 0 auto', padding: '12px 25px', backgroundColor: '#be185d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px' }}
          >
            {isSearchingBuyers ? 'กำลังค้นหา...' : 'ค้นหาประวัติ'}
          </button>
        </div>

        {/* 🌟 ป้องกันจอขาว: เช็คชัวร์ๆ ว่า searchedBuyers เป็น Array (รายการ) แน่นอน ถึงจะโชว์ตาราง */}
        {Array.isArray(searchedBuyers) && (
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px', whiteSpace: 'nowrap', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#fdf2f8', color: '#831843' }}>
                  <th style={{ padding: '12px' }}>รอบที่</th>
                  <th style={{ padding: '12px' }}>ผู้ใช้</th>
                  <th style={{ padding: '12px' }}>ประเภท</th>
                  <th style={{ padding: '12px' }}>เลขที่ซื้อ</th>
                  <th style={{ padding: '12px' }}>ยอดซื้อ</th>
                  <th style={{ padding: '12px' }}>รางวัล (สกุลเดิม)</th>
                  <th style={{ padding: '12px', color: '#0ea5e9' }}>เทียบเป็น THB</th>
                </tr>
              </thead>
              <tbody>
                {searchedBuyers.map((w, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: '900', color: '#9d174d' }}>{w.round_number}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{w.username}</td>
                    <td style={{ padding: '12px' }}>{w.lottery_type}</td>
                    <td style={{ padding: '12px', color: '#dc2626', fontWeight: 'bold', fontSize: '15px' }}>{w.selected_number}</td>
                    
                    {/* 🌟 ป้องกันจอขาว: ครอบ Number(... || 0) ป้องกันตัวเลขเป็น null */}
                    <td style={{ padding: '12px' }}>{Number(w.price || 0).toLocaleString()} {w.currency_code}</td>
                    <td style={{ padding: '12px', color: '#16a34a', fontWeight: 'bold' }}>+ {Number(w.estimated_prize || 0).toLocaleString()} {w.currency_code}</td>
                    <td style={{ padding: '12px', color: '#0ea5e9', fontWeight: 'bold' }}>
                      {Number(w.estimated_prize_thb || 0).toLocaleString('th-TH', {minimumFractionDigits: 2})} ฿
                    </td>
                  </tr>
                ))}
                
                {searchedBuyers.length === 0 && (
                  <tr><td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>ไม่พบประวัติการซื้อเลขนี้ในระบบ</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default ManageYeeki;