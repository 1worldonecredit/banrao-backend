import React, { useState, useEffect, useRef } from 'react';
import { Send, User, AlertCircle, MessageSquareText, Bot, Info, X, Users, Wallet, ShoppingCart, Activity } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const ChatMessage = () => {
  const [chatList, setChatList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [p2pContext, setP2pContext] = useState(null);
  
  // 🌟 State สำหรับ Customer Insight Modal
  const [isInsightModalOpen, setIsInsightModalOpen] = useState(false);
  const [insightData, setInsightData] = useState(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);

  const messagesEndRef = useRef(null);
  const currentAdmin = JSON.parse(localStorage.getItem('userData')) || { username: 'Admin' };

  // --- (ฟังก์ชันแชทเดิมทั้งหมด) ---
  const fetchChatList = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/chats`);
      setChatList(await res.json());
    } catch (error) { console.error("Error:", error); }
  };

  const fetchActiveChatMessages = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/chats/${userId}`);
      setMessages(await res.json());
    } catch (error) { console.error("Error:", error); }
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
    } catch (error) { console.error("Error:", error); }
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

  // 🌟 ฟังก์ชันดึงข้อมูล Customer Insight 360
  const openCustomerInsight = async (userId) => {
    setIsInsightModalOpen(true);
    setIsLoadingInsight(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/customer-insight/${userId}`);
      if(res.ok) {
        const data = await res.json();
        setInsightData(data);
      }
    } catch (error) {
      console.error("Insight Error:", error);
    } finally {
      setIsLoadingInsight(false);
    }
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
                    {/* 🌟 ปุ่มตัว i เล็กๆ ไว้ดูข้อมูล */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); openCustomerInsight(user.user_id); }} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0ea5e9' }}
                      title="ดูข้อมูลลูกค้าเชิงลึก"
                    >
                      <Info size={16} />
                    </button>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.latest_message}
                  </p>
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
                    {/* 🌟 ปุ่มเปิด Insight ข้างชื่อบนหัวแชท */}
                    <button onClick={() => openCustomerInsight(selectedUser.user_id)} style={{ background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', color: '#0284c7', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Info size={14} /> ดูประวัติ 360°
                    </button>
                  </h3>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}><Bot size={16} /> พนักงาน: <strong>{currentAdmin.username}</strong></div>
              </div>

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
      {/* 🌟 MODAL: Customer Insight 360° (หน้าต่างป๊อปอัพ) */}
      {/* ================================================== */}
      {isInsightModalOpen && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, borderRadius: '16px' }}>
          <div style={{ backgroundColor: 'white', width: '80%', maxWidth: '700px', maxHeight: '90%', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            
            {/* Header Modal */}
            <div style={{ padding: '15px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}><Activity color="#0284c7" /> Customer Insight 360°</h3>
              <button onClick={() => setIsInsightModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X /></button>
            </div>

            {/* Body Modal */}
            <div style={{ padding: '20px', overflowY: 'auto' }}>
              {isLoadingInsight ? (
                <p style={{ textAlign: 'center', color: '#64748b' }}>กำลังโหลดข้อมูล...</p>
              ) : insightData && insightData.profile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* แถว 1: ข้อมูลพื้นฐาน & กระเป๋าเงิน */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div style={{ padding: '15px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                      <h4 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '5px', color: '#334155' }}><User size={16}/> ข้อมูลทั่วไป</h4>
                      <p style={{ margin: '5px 0', fontSize: '13px' }}><strong>Username:</strong> {insightData.profile.username}</p>
                      <p style={{ margin: '5px 0', fontSize: '13px' }}><strong>ประเทศ/สกุลเงิน:</strong> {insightData.profile.country || '-'} ({insightData.profile.currency_code})</p>
                      <p style={{ margin: '5px 0', fontSize: '13px' }}><strong>อายุสมาชิก:</strong> {insightData.profile.membership_days} วัน ({insightData.profile.membership_months} เดือน)</p>
                      <p style={{ margin: '5px 0', fontSize: '13px' }}><strong>ทีมงาน:</strong> {insightData.profile.team_count} คน</p>
                    </div>
                    <div style={{ padding: '15px', backgroundColor: '#eff6ff', borderRadius: '8px' }}>
                      <h4 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '5px', color: '#1d4ed8' }}><Wallet size={16}/> การเงิน & การซื้อ</h4>
                      <h2 style={{ margin: '0 0 10px 0', color: '#2563eb' }}>{insightData.profile.currency_code} {parseFloat(insightData.profile.wallet_balance || 0).toLocaleString()}</h2>
                      <p style={{ margin: '5px 0', fontSize: '13px', color: '#475569' }}><ShoppingCart size={14}/> <strong>ซื้อรวมทั้งหมด:</strong> ฿{insightData.purchase_stats.total_all_time.toLocaleString()}</p>
                      <p style={{ margin: '5px 0', fontSize: '13px', color: '#475569' }}><ShoppingCart size={14}/> <strong>ซื้อเฉพาะเดือนนี้:</strong> ฿{insightData.purchase_stats.lottery_this_month.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* แถว 2: สถิติ P2P */}
                  <div style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#334155' }}>สถิติคำขอ P2P (ฝาก/ถอน)</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', textAlign: 'center' }}>
                      <div style={{ backgroundColor: '#dcfce7', padding: '10px', borderRadius: '6px' }}><p style={{ margin:0, fontSize:'11px', color:'#166534'}}>ฝากสำเร็จ</p><h3 style={{ margin:0, color:'#15803d'}}>{insightData.p2p_stats.deposit_success}</h3></div>
                      <div style={{ backgroundColor: '#fee2e2', padding: '10px', borderRadius: '6px' }}><p style={{ margin:0, fontSize:'11px', color:'#991b1b'}}>ฝากไม่สำเร็จ</p><h3 style={{ margin:0, color:'#b91c1c'}}>{insightData.p2p_stats.deposit_fail}</h3></div>
                      <div style={{ backgroundColor: '#dcfce7', padding: '10px', borderRadius: '6px' }}><p style={{ margin:0, fontSize:'11px', color:'#166534'}}>ถอนสำเร็จ</p><h3 style={{ margin:0, color:'#15803d'}}>{insightData.p2p_stats.withdraw_success}</h3></div>
                      <div style={{ backgroundColor: '#fee2e2', padding: '10px', borderRadius: '6px' }}><p style={{ margin:0, fontSize:'11px', color:'#991b1b'}}>ถอนไม่สำเร็จ</p><h3 style={{ margin:0, color:'#b91c1c'}}>{insightData.p2p_stats.withdraw_fail}</h3></div>
                    </div>
                  </div>

                  {/* แถว 3: รายการ P2P ล่าสุด 5 รายการ */}
                  <div>
                    <h4 style={{ margin: '0 0 10px 0', color: '#334155' }}>รายการ P2P ล่าสุด (5 รายการ)</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                          <th style={{ padding: '8px', borderBottom: '1px solid #cbd5e1' }}>ประเภท</th>
                          <th style={{ padding: '8px', borderBottom: '1px solid #cbd5e1' }}>ยอดเงิน</th>
                          <th style={{ padding: '8px', borderBottom: '1px solid #cbd5e1' }}>สถานะ</th>
                          <th style={{ padding: '8px', borderBottom: '1px solid #cbd5e1' }}>ผู้รับงาน (Provider)</th>
                          <th style={{ padding: '8px', borderBottom: '1px solid #cbd5e1' }}>วันที่</th>
                        </tr>
                      </thead>
                      <tbody>
                        {insightData.recent_p2p.length === 0 ? <tr><td colSpan="5" style={{ textAlign:'center', padding:'10px' }}>ไม่มีประวัติ P2P</td></tr> : 
                          insightData.recent_p2p.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px' }}>{item.request_type === 'DEPOSIT' ? 'ฝาก' : 'ถอน'}</td>
                              <td style={{ padding: '8px' }}>{parseFloat(item.amount).toLocaleString()}</td>
                              <td style={{ padding: '8px' }}>
                                <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '11px', backgroundColor: item.status === 'COMPLETED' ? '#dcfce7' : '#fee2e2', color: item.status === 'COMPLETED' ? '#166534' : '#991b1b' }}>
                                  {item.status}
                                </span>
                              </td>
                              <td style={{ padding: '8px' }}>{item.provider_name || '-'}</td>
                              <td style={{ padding: '8px' }}>{new Date(item.created_at).toLocaleDateString('th-TH')}</td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>

                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#ef4444' }}>ไม่พบข้อมูลของลูกค้ารายนี้</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ChatMessage;