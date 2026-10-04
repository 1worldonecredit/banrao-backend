import React, { useState, useEffect, useRef } from 'react';
import { Send, User, AlertCircle, MessageSquareText, Bot } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const ChatMessage = () => {
  const [chatList, setChatList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null); // เก็บเป็น Object เพื่อดึงชื่อ
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  
  const [p2pContext, setP2pContext] = useState(null);
  const messagesEndRef = useRef(null);

  // 🌟 ดึงข้อมูลพนักงาน (Admin) ที่ล็อกอินอยู่ (อิงจาก LocalStorage ของระบบ SLAPI)
  const currentAdmin = JSON.parse(localStorage.getItem('userData')) || { username: 'พนักงานแอดมิน' };

  // ดึงรายชื่อคนแชททั้งหมด
  const fetchChatList = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/chats`);
      const data = await res.json();
      setChatList(data);
    } catch (error) {
      console.error("Error fetching chat list:", error);
    }
  };

  useEffect(() => {
    fetchChatList();
    const interval = setInterval(fetchChatList, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, p2pContext]);

  // เมื่อคลิกเลือก User
  const selectUserChat = async (user) => {
    setSelectedUser(user);
    setP2pContext(null);

    try {
      const res = await fetch(`${API_URL}/api/admin/chats/${user.user_id}`);
      const chatHistory = await res.json();
      setMessages(chatHistory);
      fetchChatList();

      const recentMessages = chatHistory.slice(-5);
      const isTalkingAboutDeposit = recentMessages.some(msg => 
        msg.sender_type === 'user' && (msg.message_text.includes('ฝาก') || msg.message_text.includes('โอน'))
      );

      if (isTalkingAboutDeposit) {
        const p2pRes = await fetch(`${API_URL}/api/admin/chats/${user.user_id}/smart-p2p`);
        const p2pData = await p2pRes.json();
        if (p2pData.found) {
          setP2pContext(p2pData.data);
        }
      }
    } catch (error) {
      console.error("Error fetching chat detail:", error);
    }
  };

  // Admin พิมพ์ตอบ
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !selectedUser) return;

    const msgText = inputValue;
    setInputValue('');

    setMessages(prev => [...prev, { 
      id: Date.now(), 
      sender_type: 'admin', 
      message_text: msgText, 
      created_at: new Date().toISOString() 
    }]);

    try {
      await fetch(`${API_URL}/api/admin/chats/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser.user_id,
          message_text: msgText,
          admin_name: currentAdmin.username // ส่งชื่อ admin ไปบันทึกด้วย (ถ้า API รองรับ)
        })
      });
      fetchChatList();
    } catch (error) {
      alert("ส่งข้อความไม่สำเร็จ");
    }
  };

  return (
    <div className="chat-admin-container">
      <h2 className="chat-admin-title">จัดการข้อร้องเรียนลูกค้า</h2>
      
      <div className="chat-admin-layout">
        
        {/* ================= ซ้าย: รายชื่อ ================= */}
        <div className="chat-admin-sidebar">
          <div className="chat-sidebar-header">
            <h4 style={{ margin: 0, color: '#334155' }}>รายการสนทนา</h4>
          </div>
          
          <div className="chat-user-list">
            {chatList.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '20px' }}>ไม่มีการสนทนา</p>}
            
            {chatList.map((user) => (
              <div 
                key={user.user_id} 
                onClick={() => selectUserChat(user)}
                className={`chat-user-item ${selectedUser?.user_id === user.user_id ? 'active' : ''}`}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} color="#64748b" />
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {/* 🌟 แสดงชื่อ Username ของลูกค้า (ถ้ามี) ถ้าไม่มีให้โชว์ ID */}
                    <h5 style={{ margin: 0, color: '#1e293b', fontSize: '14px' }}>
                      {user.username ? `ลูกค้า: ${user.username}` : `ผู้ใช้ ID: ${user.user_id}`}
                    </h5>
                    {user.unread_count > 0 && (
                      <span style={{ backgroundColor: '#ef4444', color: 'white', fontSize: '11px', padding: '2px 6px', borderRadius: '10px' }}>
                        {user.unread_count} ใหม่
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.latest_message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= ขวา: หน้าต่างแชท ================= */}
        <div className="chat-admin-main">
          
          {selectedUser ? (
            <>
              <div className="chat-main-header">
                <div>
                  <h3 style={{ margin: 0, color: '#1e293b' }}>
                    กำลังสนทนากับ: <span style={{ color: '#0ea5e9' }}>{selectedUser.username || `ผู้ใช้ ID: ${selectedUser.user_id}`}</span>
                  </h3>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Bot size={16} /> พนักงานที่ตอบ: <strong>{currentAdmin.username}</strong>
                </div>
              </div>

              {p2pContext && (
                <div style={{ margin: '15px', padding: '15px', backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <AlertCircle size={18} color="#d97706" />
                    <strong style={{ color: '#b45309' }}>ระบบตรวจพบข้อมูลการฝากเงินล่าสุด:</strong>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', color: '#451a03' }}>
                    <div><strong>จำนวนเงิน:</strong> ฿{p2pContext.amount}</div>
                    <div>
                      <strong>สถานะ:</strong> {p2pContext.status === 'pending' ? 'รอโอน' : p2pContext.status === 'matched' ? 'มีผู้รับงานแล้ว' : 'สำเร็จ'}
                    </div>
                    <div><strong>ผู้รับงาน (P2P):</strong> {p2pContext.handler_username || 'ยังไม่มีคนรับ'}</div>
                  </div>
                </div>
              )}

              <div className="chat-messages-area">
                {messages.map((msg) => (
                  <div key={msg.id} className={`chat-bubble-wrapper ${msg.sender_type === 'admin' ? 'admin' : 'user'}`}>
                    {/* 🌟 ระบุชื่อคนส่งบนกล่องข้อความ */}
                    <span className="chat-sender-name">
                      {msg.sender_type === 'admin' ? `แอดมิน (${currentAdmin.username})` : (selectedUser.username || `ลูกค้า ID: ${selectedUser.user_id}`)}
                    </span>
                    <div className="chat-bubble">
                      {msg.message_text}
                    </div>
                    <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                      {new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="chat-input-area">
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="พิมพ์ข้อความตอบกลับลูกค้า..." 
                  className="chat-input-field"
                />
                <button type="submit" disabled={!inputValue.trim()} className="chat-send-btn">
                  <Send size={18} style={{ marginLeft: '4px' }} />
                </button>
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
    </div>
  );
};

export default ChatMessage;