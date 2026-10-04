import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, User, Search, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const ChatMessage = () => {
  const [chatList, setChatList] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  
  // State สำหรับ Smart P2P Info
  const [p2pContext, setP2pContext] = useState(null);
  
  const messagesEndRef = useRef(null);

  // 1. ดึงรายชื่อคนแชททั้งหมด (ดึงใหม่ทุกๆ 10 วินาทีเพื่ออัปเดตแจ้งเตือน)
  const fetchChatList = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/chats`);
      setChatList(res.data);
    } catch (error) {
      console.error("Error fetching chat list:", error);
    }
  };

  useEffect(() => {
    fetchChatList();
    const interval = setInterval(fetchChatList, 10000); // อัปเดต List ทุก 10 วิ
    return () => clearInterval(interval);
  }, []);

  // เลื่อนจอลงล่าง
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, p2pContext]);

  // 2. เมื่อคลิกเลือก User เพื่อคุย
  const selectUserChat = async (userId) => {
    setSelectedUserId(userId);
    setP2pContext(null); // เคลียร์ข้อมูล P2P เก่าออกก่อน

    try {
      // ดึงประวัติแชท
      const res = await axios.get(`${API_URL}/api/admin/chats/${userId}`);
      const chatHistory = res.data;
      setMessages(chatHistory);
      fetchChatList(); // อัปเดต badge ตัวเลข

      // 🤖 ความฉลาดอยู่ตรงนี้: วิเคราะห์ว่าลูกค้าคุยเรื่อง "ฝากเงิน" หรือไม่
      const recentMessages = chatHistory.slice(-5); // ดู 5 ข้อความล่าสุด
      const isTalkingAboutDeposit = recentMessages.some(msg => 
        msg.sender_type === 'user' && (msg.message_text.includes('ฝาก') || msg.message_text.includes('โอน'))
      );

      // ถ้าคุยเรื่องฝากเงิน ให้ยิง API ไปดึงข้อมูล P2P ล่าสุดของคนนี้มาเลย
      if (isTalkingAboutDeposit) {
        const p2pRes = await axios.get(`${API_URL}/api/admin/chats/${userId}/smart-p2p`);
        if (p2pRes.data.found) {
          setP2pContext(p2pRes.data.data);
        }
      }

    } catch (error) {
      console.error("Error fetching chat detail:", error);
    }
  };

  // 3. Admin พิมพ์ตอบ
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !selectedUserId) return;

    const msgText = inputValue;
    setInputValue('');

    // โชว์หน้าจอก่อนเพื่อความไว
    setMessages(prev => [...prev, { id: Date.now(), sender_type: 'admin', message_text: msgText, created_at: new Date().toISOString() }]);

    try {
      await axios.post(`${API_URL}/api/admin/chats/send`, {
        user_id: selectedUserId,
        message_text: msgText
      });
      fetchChatList(); // ดึง list ใหม่ให้อันดับเด้งขึ้นบนสุด
    } catch (error) {
      alert("ส่งข้อความไม่สำเร็จ");
    }
  };

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>จัดการข้อร้องเรียน (Admin Chat)</h2>
      
      <div style={{ display: 'flex', height: '70vh', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        
        {/* ================= ซ้าย: รายชื่อคนแชท ================= */}
        <div style={{ width: '30%', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '15px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
            <h4 style={{ margin: 0, color: '#334155' }}>รายการสนทนา</h4>
          </div>
          
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {chatList.length === 0 ? <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '20px' }}>ไม่มีการสนทนา</p> : null}
            
            {chatList.map((user) => (
              <div 
                key={user.user_id} 
                onClick={() => selectUserChat(user.user_id)}
                style={{ 
                  padding: '15px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                  backgroundColor: selectedUserId === user.user_id ? '#eff6ff' : 'transparent',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} color="#64748b" />
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h5 style={{ margin: 0, color: '#1e293b', fontSize: '14px' }}>ผู้ใช้ ID: {user.user_id}</h5>
                    {user.unread_count > 0 && (
                      <span style={{ backgroundColor: '#ef4444', color: 'white', fontSize: '11px', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
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
        <div style={{ width: '70%', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
          
          {selectedUserId ? (
            <>
              {/* Header ห้องแชท */}
              <div style={{ padding: '15px 20px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#1e293b' }}>สนทนากับผู้ใช้ ID: {selectedUserId}</h3>
              </div>

              {/* 🤖 การ์ดอัจฉริยะ (Smart P2P Info) จะโชว์เมื่อคุยเรื่องฝากเงิน */}
              {p2pContext && (
                <div style={{ margin: '15px', padding: '15px', backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <AlertCircle size={18} color="#d97706" />
                    <strong style={{ color: '#b45309' }}>ระบบตรวจพบข้อมูลการฝากเงินล่าสุดที่อาจเกี่ยวข้อง:</strong>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', color: '#451a03' }}>
                    <div><strong>จำนวนเงิน:</strong> ฿{p2pContext.amount}</div>
                    <div>
                      <strong>สถานะ:</strong> 
                      {p2pContext.status === 'pending' ? <span style={{ color: '#d97706', marginLeft: '5px' }}>รอโอน</span> : 
                       p2pContext.status === 'matched' ? <span style={{ color: '#2563eb', marginLeft: '5px' }}>มีผู้รับงานแล้ว</span> : 
                       <span style={{ color: '#16a34a', marginLeft: '5px' }}>สำเร็จ</span>}
                    </div>
                    <div><strong>ผู้รับงาน (P2P):</strong> {p2pContext.handler_username || 'ยังไม่มีคนรับ'}</div>
                    <div><strong>เวลาแจ้ง:</strong> {new Date(p2pContext.created_at).toLocaleString('th-TH')}</div>
                  </div>
                </div>
              )}

              {/* พื้นที่แสดงข้อความ */}
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {messages.map((msg) => (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender_type === 'admin' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ 
                      maxWidth: '70%', padding: '10px 15px', borderRadius: '12px', fontSize: '14px',
                      backgroundColor: msg.sender_type === 'admin' ? '#0ea5e9' : 'white',
                      color: msg.sender_type === 'admin' ? 'white' : '#1e293b',
                      border: msg.sender_type === 'admin' ? 'none' : '1px solid #e2e8f0',
                      borderBottomRightRadius: msg.sender_type === 'admin' ? '2px' : '12px',
                      borderBottomLeftRadius: msg.sender_type === 'user' ? '2px' : '12px',
                    }}>
                      {msg.message_text}
                    </div>
                    <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                      {new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* ช่องพิมพ์ข้อความ */}
              <form onSubmit={handleSendMessage} style={{ padding: '15px', backgroundColor: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="พิมพ์ข้อความตอบกลับ..." 
                  style={{ flex: 1, padding: '10px 15px', borderRadius: '20px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
                />
                <button type="submit" disabled={!inputValue.trim()} style={{ backgroundColor: inputValue.trim() ? '#0ea5e9' : '#cbd5e1', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: inputValue.trim() ? 'pointer' : 'default' }}>
                  <Send size={18} style={{ marginLeft: '3px' }} />
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

// 🌟 จำเป็นต้อง import icon นี้เพิ่มด้านบน (ลืมใส่ในบรรทัด import ตอนแรก)
import { MessageSquareText } from 'lucide-react'; 

export default ChatMessage;