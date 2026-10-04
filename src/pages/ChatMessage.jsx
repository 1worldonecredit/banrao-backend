import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, User, AlertCircle, MessageSquareText } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const ChatMessage = () => {
  const [chatList, setChatList] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  
  const [p2pContext, setP2pContext] = useState(null);
  const messagesEndRef = useRef(null);

  // 1. ดึงรายชื่อคนแชททั้งหมด
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
    const interval = setInterval(fetchChatList, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, p2pContext]);

  // 2. เมื่อคลิกเลือก User เพื่อคุย
  const selectUserChat = async (userId) => {
    setSelectedUserId(userId);
    setP2pContext(null);

    try {
      const res = await axios.get(`${API_URL}/api/admin/chats/${userId}`);
      const chatHistory = res.data;
      setMessages(chatHistory);
      fetchChatList();

      // วิเคราะห์คำเพื่อดึงข้อมูล P2P (ฝากเงิน)
      const recentMessages = chatHistory.slice(-5);
      const isTalkingAboutDeposit = recentMessages.some(msg => 
        msg.sender_type === 'user' && (msg.message_text.includes('ฝาก') || msg.message_text.includes('โอน'))
      );

      if (isTalkingAboutDeposit) {
        const p2pRes = await axios.get(`${API_URL}/api/admin/chats/${userId}/smart-p2p`);
        if (p2pRes.data && p2pRes.data.found) {
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

    setMessages(prev => [...prev, { id: Date.now(), sender_type: 'admin', message_text: msgText, created_at: new Date().toISOString() }]);

    try {
      await axios.post(`${API_URL}/api/admin/chats/send`, {
        user_id: selectedUserId,
        message_text: msgText
      });
      fetchChatList();
    } catch (error) {
      alert("ส่งข้อความไม่สำเร็จ");
    }
  };

  return (
    <div className="chat-admin-container">
      <h2 className="chat-admin-title">ข้อความพูดคุย</h2>
      
      <div className="chat-admin-layout">
        
        {/* ================= ซ้าย: รายชื่อ ================= */}
        <div className="chat-admin-sidebar">
          <div className="chat-sidebar-header">
            <h4>รายการสนทนา</h4>
          </div>
          
          <div className="chat-user-list">
            {chatList.length === 0 && <p className="chat-empty-text">ไม่มีการสนทนา</p>}
            
            {chatList.map((user) => (
              <div 
                key={user.user_id} 
                onClick={() => selectUserChat(user.user_id)}
                className={`chat-user-item ${selectedUserId === user.user_id ? 'active' : ''}`}
              >
                <div className="chat-user-avatar">
                  <User size={20} />
                </div>
                <div className="chat-user-info">
                  <div className="chat-user-name-row">
                    <h5>ผู้ใช้ ID: {user.user_id}</h5>
                    {user.unread_count > 0 && (
                      <span className="chat-unread-badge">{user.unread_count} ใหม่</span>
                    )}
                  </div>
                  <p className="chat-latest-msg">{user.latest_message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= ขวา: หน้าต่างแชท ================= */}
        <div className="chat-admin-main">
          
          {selectedUserId ? (
            <>
              <div className="chat-main-header">
                <h3>สนทนากับผู้ใช้ ID: {selectedUserId}</h3>
              </div>

              {p2pContext && (
                <div className="chat-smart-p2p-card">
                  <div className="p2p-card-header">
                    <AlertCircle size={18} />
                    <strong>ระบบตรวจพบข้อมูลการฝากเงินล่าสุดที่อาจเกี่ยวข้อง:</strong>
                  </div>
                  <div className="p2p-card-details">
                    <div><strong>จำนวนเงิน:</strong> ฿{p2pContext.amount}</div>
                    <div>
                      <strong>สถานะ:</strong> 
                      <span className={`status-badge status-${p2pContext.status}`}>
                        {p2pContext.status === 'pending' ? 'รอโอน' : 
                         p2pContext.status === 'matched' ? 'มีผู้รับงานแล้ว' : 'สำเร็จ'}
                      </span>
                    </div>
                    <div><strong>ผู้รับงาน (P2P):</strong> {p2pContext.handler_username || 'ยังไม่มีคนรับ'}</div>
                    <div><strong>เวลาแจ้ง:</strong> {new Date(p2pContext.created_at).toLocaleString('th-TH')}</div>
                  </div>
                </div>
              )}

              <div className="chat-messages-area">
                {messages.map((msg) => (
                  <div key={msg.id} className={`chat-bubble-wrapper ${msg.sender_type === 'admin' ? 'admin' : 'user'}`}>
                    <div className="chat-bubble">
                      {msg.message_text}
                    </div>
                    <span className="chat-time">
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
                  placeholder="พิมพ์ข้อความตอบกลับ..." 
                  className="chat-input-field"
                />
                <button type="submit" disabled={!inputValue.trim()} className="chat-send-btn">
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            <div className="chat-placeholder-area">
              <MessageSquareText size={48} className="placeholder-icon" />
              <p>เลือกลูกค้าทางซ้ายมือเพื่อเริ่มการสนทนา</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ChatMessage;