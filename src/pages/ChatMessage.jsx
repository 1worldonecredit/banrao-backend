import React, { useState, useEffect, useRef } from 'react';
import { Send, User, AlertCircle, MessageSquareText, Bot, Info, X, Users, Wallet, ShoppingCart, Activity, Lock, Unlock, Search } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const ChatMessage = () => {
  const [chatList, setChatList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [p2pContext, setP2pContext] = useState(null);
  
  const [isInsightModalOpen, setIsInsightModalOpen] = useState(false);
  const [insightData, setInsightData] = useState(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);

  // 🌟 State สำหรับ ป๊อปอัพดูรายละเอียด P2P ลึกๆ
  const [isP2pDetailModalOpen, setIsP2pDetailModalOpen] = useState(false);
  const [p2pDetailData, setP2pDetailData] = useState(null);

  const messagesEndRef = useRef(null);
  const currentAdmin = JSON.parse(localStorage.getItem('userData')) || { username: 'Admin' };

  // --- ฟังก์ชันดึงข้อมูลพื้นฐาน (เหมือนเดิม) ---
  const fetchChatList = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/chats`);
      setChatList(await res.json());
    } catch (error) {}
  };

  const fetchActiveChatMessages = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/chats/${userId}`);
      setMessages(await res.json());
    } catch (error) {}
  };

  useEffect(() => {
    fetchChatList();
    const interval = setInterval(() => {
      fetchChatList();
      if (selectedUser?.user_id) fetchActiveChatMessages(selectedUser.user_id);
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, p2pContext]);

  const selectUserChat = async (user) => {
    setSelectedUser(user);
    setP2pContext(null);
    try {
      await fetchActiveChatMessages(user.user_id);
      fetchChatList();
      const res = await fetch(`${API_URL}/api/admin/chats/${user.user_id}`);
      const chatHistory = await res.json();
      const isDeposit = chatHistory.slice(-5).some(msg => msg.sender_type === 'user' && (msg.message_text.includes('ฝาก') || msg.message_text.includes('โอน')));
      if (isDeposit) {
        const p2pRes = await fetch(`${API_URL}/api/admin/chats/${user.user_id}/smart-p2p`);
        const p2pData = await p2pRes.json();
        if (p2pData.found) setP2pContext(p2pData.data);
      }
    } catch (error) {}
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !selectedUser) return;
    const msgText = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { id: Date.now(), sender_type: 'admin', message_text: msgText, created_at: new Date().toISOString() }]);
    try {
      await fetch(`${API_URL}/api/admin/chats/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: selectedUser.user_id, message_text: msgText, admin_name: currentAdmin.username })
      });
      fetchChatList();
    } catch (error) { alert("ส่งไม่สำเร็จ"); }
  };

  const openCustomerInsight = async (userId) => {
    setIsInsightModalOpen(true);
    setIsLoadingInsight(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/customer-insight/${userId}`);
      if(res.ok) setInsightData(await res.json());
    } catch (error) { console.error(error); } 
    finally { setIsLoadingInsight(false); }
  };

  // 🌟 ฟังก์ชัน สั่งล็อค / ปลดล็อคบัญชี
  const toggleUserLock = async () => {
    // เช็คค่า is_locked ว่าเป็น '1' หรือ true
    const isCurrentlyLocked = insightData.profile.is_locked === '1' || insightData.profile.is_locked === true;
    const confirmMsg = isCurrentlyLocked 
      ? `ยืนยันการ "ปลดล็อค" บัญชีของ ${insightData.profile.username} ใช่หรือไม่?`
      : `ยืนยันการ "ระงับบัญชี (Lock)" ของ ${insightData.profile.username} ใช่หรือไม่?\nระบบจะส่งข้อความแจ้งเตือนลูกค้าทันที`;
      
    if (!window.confirm(confirmMsg)) return;

    try {
      await fetch(`${API_URL}/api/admin/users/${insightData.profile.user_id}/toggle-lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_locked: !isCurrentlyLocked })
      });
      
      alert(isCurrentlyLocked ? "ปลดล็อคสำเร็จ" : "ระงับบัญชีสำเร็จ ระบบส่งแชทแจ้งลูกค้าแล้ว");
      
      // ดึงข้อมูล Insight ใหม่ และ ดึงแชทใหม่ให้โชว์ข้อความที่ระบบส่งให้
      openCustomerInsight(insightData.profile.user_id); 
      fetchActiveChatMessages(insightData.profile.user_id);
    } catch (error) {
      alert("เกิดข้อผิดพลาด");
    }
  };

  // 🌟 ฟังก์ชัน ดูรายละเอียด P2P เชิงลึก
  const openP2pDetail = async (requestId) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/p2p-detail/${requestId}`);
      if (res.ok) {
        setP2pDetailData(await res.json());
        setIsP2pDetailModalOpen(true);
      }
    } catch (error) { console.error(error); }
  };

  return (
    <div className="chat-admin-container" style={{ position: 'relative' }}>
      <h2 className="chat-admin-title">จัดการข้อร้องเรียนลูกค้า</h2>
      
      <div className="chat-admin-layout">
        {/* === ซ้าย: รายชื่อ === */}
        <div className="chat-admin-sidebar">
          <div className="chat-sidebar-header"><h4 style={{ margin: 0, color: '#334155' }}>รายการสนทนา</h4></div>
          <div className="chat-user-list">
            {chatList.map((user) => (
              <div key={user.user_id} onClick={() => selectUserChat(user)} className={`chat-user-item ${selectedUser?.user_id === user.user_id ? 'active' : ''}`}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} color="#64748b" />
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h5 style={{ margin: 0, color: '#1e293b', fontSize: '14px' }}>
                      {user.username ? `ลูกค้า: ${user.username}` : `ID: ${user.user_id}`}
                    </h5>
                    <button onClick={(e) => { e.stopPropagation(); openCustomerInsight(user.user_id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0ea5e9' }} title="ดูข้อมูลลูกค้าเชิงลึก"><Info size={16} /></button>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.latest_message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* === ขวา: ห้องแชท === */}
        <div className="chat-admin-main">
          {selectedUser ? (
            <>
              <div className="chat-main-header">
                <div>
                  <h3 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    สนทนากับ: <span style={{ color: '#0ea5e9' }}>{selectedUser.username || `ID: ${selectedUser.user_id}`}</span>
                    <button onClick={() => openCustomerInsight(selectedUser.user_id)} style={{ background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', color: '#0284c7', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Info size={14} /> ดูประวัติ 360°
                    </button>
                  </h3>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}><Bot size={16} /> พนักงาน: <strong>{currentAdmin.username}</strong></div>
              </div>

              {p2pContext && (
                <div style={{ margin: '15px', padding: '15px', backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <AlertCircle size={18} color="#d97706" />
                    <strong style={{ color: '#b45309' }}>ระบบตรวจพบข้อมูลการฝากเงินล่าสุด:</strong>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', color: '#451a03' }}>
                    <div><strong>จำนวนเงิน:</strong> ฿{p2pContext.amount}</div>
                    <div><strong>สถานะ:</strong> {p2pContext.status}</div>
                    <div><strong>ผู้รับงาน (P2P):</strong> {p2pContext.handler_username || 'ยังไม่มีคนรับ'}</div>
                  </div>
                </div>
              )}

              <div className="chat-messages-area">
                {messages.map((msg) => (
                  <div key={msg.id} className={`chat-bubble-wrapper ${msg.sender_type === 'admin' ? 'admin' : 'user'}`}>
                    <span className="chat-sender-name">{msg.sender_type === 'admin' ? `แอดมิน (${currentAdmin.username})` : (selectedUser.username || `ลูกค้า ID`)}</span>
                    <div className="chat-bubble">{msg.message_text}</div>
                    <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="chat-input-area">
                <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="พิมพ์ข้อความตอบกลับลูกค้า..." className="chat-input-field" />
                <button type="submit" disabled={!inputValue.trim()} className="chat-send-btn"><Send size={18} /></button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#94a3b8' }}>
              <MessageSquareText size={48} style={{ marginBottom: '10px', opacity: 0.5 }} />
              <p>เลือกลูกค้าทางซ้ายมือเพื่อเริ่มการสนทนา</p>
            </div>
          )}
        </div>
      </div>

      {/* ================================================== */}
      {/* 🌟 MODAL หลัก: Customer Insight 360° */}
      {/* ================================================== */}
      {isInsightModalOpen && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, borderRadius: '16px' }}>
          <div style={{ backgroundColor: 'white', width: '85%', maxWidth: '750px', maxHeight: '90%', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            
            <div style={{ padding: '15px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}><Activity color="#0284c7" /> Customer Insight 360°</h3>
              <button onClick={() => setIsInsightModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X /></button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto' }}>
              {isLoadingInsight ? (
                <p style={{ textAlign: 'center' }}>กำลังโหลดข้อมูล...</p>
              ) : insightData && insightData.profile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* 🌟 แถว 1: ข้อมูล & ปุ่ม ล็อคบัญชี */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div style={{ padding: '15px', backgroundColor: '#f1f5f9', borderRadius: '8px', position: 'relative' }}>
                      <h4 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '5px' }}><User size={16}/> ข้อมูลทั่วไป</h4>
                      <p style={{ margin: '5px 0', fontSize: '13px' }}><strong>Username:</strong> {insightData.profile.username}</p>
                      <p style={{ margin: '5px 0', fontSize: '13px' }}><strong>อายุสมาชิก:</strong> {insightData.profile.membership_days} วัน</p>
                      
                      {/* 🔥 ปุ่ม ระงับ/ปลดล็อค บัญชี */}
                      <button 
                        onClick={toggleUserLock}
                        style={{ position: 'absolute', top: '15px', right: '15px', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px',
                          backgroundColor: (insightData.profile.is_locked === '1' || insightData.profile.is_locked === true) ? '#22c55e' : '#ef4444',
                          color: 'white'
                        }}
                      >
                        {(insightData.profile.is_locked === '1' || insightData.profile.is_locked === true) ? <><Unlock size={14}/> ปลดล็อคบัญชี</> : <><Lock size={14}/> ระงับบัญชี (Lock)</>}
                      </button>
                    </div>

                    <div style={{ padding: '15px', backgroundColor: '#eff6ff', borderRadius: '8px' }}>
                      <h4 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '5px', color: '#1d4ed8' }}><Wallet size={16}/> การเงิน & การซื้อ</h4>
                      <h2 style={{ margin: '0 0 10px 0', color: '#2563eb' }}>{insightData.profile.currency_code} {parseFloat(insightData.profile.wallet_balance || 0).toLocaleString()}</h2>
                      <p style={{ margin: '5px 0', fontSize: '13px', color: '#475569' }}><strong>ซื้อรวมทั้งหมด:</strong> ฿{insightData.purchase_stats.total_all_time.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* แถว 2: ตาราง P2P */}
                  <div>
                    <h4 style={{ margin: '0 0 10px 0', color: '#334155' }}>รายการ P2P ล่าสุด (5 รายการ)</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                          <th style={{ padding: '8px', borderBottom: '1px solid #cbd5e1' }}>ประเภท</th>
                          <th style={{ padding: '8px', borderBottom: '1px solid #cbd5e1' }}>ยอดเงิน</th>
                          <th style={{ padding: '8px', borderBottom: '1px solid #cbd5e1' }}>สถานะ</th>
                          <th style={{ padding: '8px', borderBottom: '1px solid #cbd5e1' }}>ผู้รับงาน (Provider)</th>
                          <th style={{ padding: '8px', borderBottom: '1px solid #cbd5e1' }}>รายละเอียด</th>
                        </tr>
                      </thead>
                      <tbody>
                        {insightData.recent_p2p.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px' }}>{item.request_type === 'DEPOSIT' ? 'ฝาก' : 'ถอน'}</td>
                              <td style={{ padding: '8px' }}>{parseFloat(item.amount).toLocaleString()}</td>
                              <td style={{ padding: '8px' }}>
                                <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '11px', backgroundColor: item.status === 'COMPLETED' ? '#dcfce7' : '#fee2e2', color: item.status === 'COMPLETED' ? '#166534' : '#991b1b' }}>
                                  {item.status}
                                </span>
                              </td>
                              <td style={{ padding: '8px' }}>{item.provider_name || '-'}</td>
                              <td style={{ padding: '8px' }}>
                                {/* 🔥 ปุ่มกดเจาะดูรายละเอียด (แสดงเฉพาะเมื่อมี Provider และยังไม่เสร็จ) */}
                                {item.provider_id && item.status !== 'COMPLETED' ? (
                                  <button onClick={() => openP2pDetail(item.request_id)} style={{ padding: '4px 8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <Search size={12} /> เจาะลึก
                                  </button>
                                ) : ( <span style={{ color: '#cbd5e1', fontSize: '11px' }}>-</span> )}
                              </td>
                            </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* 🌟 MODAL ซ้อน: ดูรายละเอียดเจาะลึก P2P (Provider Data) */}
      {/* ================================================== */}
      {isP2pDetailModalOpen && p2pDetailData && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, borderRadius: '16px' }}>
          <div style={{ backgroundColor: 'white', width: '400px', borderRadius: '12px', padding: '20px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>รายละเอียดคำขอ #{p2pDetailData.request_id}</h3>
              <button onClick={() => setIsP2pDetailModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X /></button>
            </div>

            <div style={{ fontSize: '13px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ backgroundColor: '#f1f5f9', padding: '10px', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 5px 0' }}><strong>ประเภท:</strong> {p2pDetailData.request_type} ({p2pDetailData.currency})</p>
                <p style={{ margin: '0 0 5px 0' }}><strong>ยอดเงินโอนจริง:</strong> ฿{parseFloat(p2pDetailData.transfer_amount || p2pDetailData.amount).toLocaleString()}</p>
                <p style={{ margin: 0, color: '#dc2626', fontWeight: 'bold' }}>สถานะปัจจุบัน: {p2pDetailData.status}</p>
              </div>

              <div style={{ backgroundColor: '#eff6ff', padding: '10px', borderRadius: '8px', borderLeft: '3px solid #3b82f6' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#1d4ed8' }}>ข้อมูลผู้รับงาน (Provider)</h4>
                <p style={{ margin: '0 0 5px 0' }}><strong>ชื่อ:</strong> {p2pDetailData.provider_name}</p>
                <p style={{ margin: '0 0 5px 0' }}><strong>กระเป๋าเงิน:</strong> ฿{parseFloat(p2pDetailData.provider_balance || 0).toLocaleString()}</p>
                <p style={{ margin: 0 }}><strong>สถานะบัญชี:</strong> {(p2pDetailData.provider_is_locked === '1' || p2pDetailData.provider_is_locked === true) ? <span style={{ color: 'red' }}>โดนระงับอยู่</span> : <span style={{ color: 'green' }}>ปกติ</span>}</p>
              </div>

              <div>
                <h4 style={{ margin: '10px 0 5px 0' }}>ไทม์ไลน์เวลา</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#64748b' }}>
                  <li>สร้างคำขอ: {p2pDetailData.created_at ? new Date(p2pDetailData.created_at).toLocaleString('th-TH') : '-'}</li>
                  <li>ผู้รับกดรับงาน: {p2pDetailData.accepted_at ? new Date(p2pDetailData.accepted_at).toLocaleString('th-TH') : '-'}</li>
                  <li>เวลาแจ้งโอน (สลิป): {p2pDetailData.transfer_date ? new Date(p2pDetailData.transfer_date).toLocaleDateString('th-TH') : '-'} {p2pDetailData.transfer_time || ''}</li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ChatMessage;