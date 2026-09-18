import React, { useState, useEffect } from 'react';
import { Users, Briefcase, FileText, CheckCircle2, XCircle, Eye, MessageSquare, Send, Clock, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const ListOfJobApplicants = () => {
  const [groupedApplicants, setGroupedApplicants] = useState({});
  const [activeTab, setActiveTab] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 🌟 Modal State
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 🌟 Reply Message State
  const [replyStatus, setReplyStatus] = useState(''); // 'Approved' หรือ 'Rejected'
  const [selectedReply, setSelectedReply] = useState('');
  const [customReply, setCustomReply] = useState('');

  const preDefinedMessages = {
    Approved: [
        "ยินดีด้วยครับ! คุณผ่านการพิจารณาเบื้องต้น ทางทีมงานจะติดต่อกลับไปเพื่อนัดหมายสัมภาษณ์",
        "ใบสมัครของคุณผ่านเกณฑ์ กรุณารอรับการติดต่อจากฝ่ายบุคคลทางโทรศัพท์เพื่อแจ้งรายละเอียดขั้นต่อไป",
        "เราสนใจในโปรไฟล์ของคุณ! โปรดเตรียมตัวให้พร้อมสำหรับการสัมภาษณ์รอบถัดไป"
    ],
    Rejected: [
        "ขออภัยครับ คุณสมบัติของคุณยังไม่ตรงกับตำแหน่งนี้ในขณะนี้ ขอบคุณที่ให้ความสนใจ SALAPI",
        "ทางเราได้รับใบสมัครของคุณแล้ว แต่ขณะนี้มีผู้สมัครที่ตรงกับความต้องการมากกว่า ขออภัยในความไม่สะดวก",
        "ขออภัย ทางเราขอเก็บประวัติของคุณไว้พิจารณาในโอกาสถัดไป หากมีตำแหน่งที่เหมาะสม"
    ]
  };

  const fetchApplicants = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/hrm/applicants`);
      const data = await res.json();
      if (data.success) {
        setGroupedApplicants(data.groupedApplicants);
        // ตั้งให้ Tab แรกทำงานอัตโนมัติ
        const positionsKeys = Object.keys(data.groupedApplicants);
        if (positionsKeys.length > 0 && !activeTab) {
            setActiveTab(positionsKeys[0]);
        }
      }
    } catch (err) {
      console.error("Fetch Data Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, []);

  const openApplicantModal = (applicant) => {
      setSelectedApplicant(applicant);
      setReplyStatus('');
      setSelectedReply('');
      setCustomReply('');
      setIsModalOpen(true);
  };

  const closeModal = () => {
      setIsModalOpen(false);
      setSelectedApplicant(null);
  };

  const handleUpdateStatus = async () => {
      if (!replyStatus) return alert("กรุณาเลือกสถานะ (ผ่าน / ไม่ผ่าน)");
      const finalMessage = selectedReply === 'custom' ? customReply : selectedReply;
      if (!finalMessage) return alert("กรุณาเลือกหรือกรอกข้อความตอบกลับ");

      if (!window.confirm(`ยืนยันการเปลี่ยนสถานะเป็น "${replyStatus === 'Approved' ? 'ผ่าน' : 'ไม่ผ่าน'}" และส่งข้อความให้ผู้สมัคร?`)) return;

      try {
          const res = await fetch(`${API_URL}/api/hrm/applicants/update-status`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  emp_code: selectedApplicant.emp_code,
                  status: replyStatus,
                  reply_message: finalMessage
              })
          });
          const data = await res.json();
          if (data.success) {
              alert("อัปเดตสถานะและส่งข้อความสำเร็จ!");
              closeModal();
              fetchApplicants(); // รีเฟรชตาราง
          } else {
              alert(`❌ ${data.message}`);
          }
      } catch (error) {
          alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      }
  };

  return (
    <div style={{ padding: '20px', minHeight: '100vh',  boxSizing: 'border-box' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#1e293b', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Users size={28} color="#0ea5e9" /> รายชื่อคำขอสมัครงาน
        </h2>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        
        {/* 🌟 Tabs ตำแหน่งงาน */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', overflowX: 'auto' }}>
            {Object.keys(groupedApplicants).length === 0 && !isLoading && (
                <div style={{ padding: '15px 20px', color: '#64748b' }}>ยังไม่มีผู้สมัครในขณะนี้</div>
            )}
            
            {Object.keys(groupedApplicants).map(posCode => {
                const isActive = activeTab === posCode;
                const count = groupedApplicants[posCode].applicants.length;
                return (
                    <div 
                        key={posCode} 
                        onClick={() => setActiveTab(posCode)} 
                        style={{ 
                            padding: '12px 24px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap',
                            borderBottom: isActive ? '3px solid #0ea5e9' : '3px solid transparent',
                            color: isActive ? '#0ea5e9' : '#64748b', display: 'flex', alignItems: 'center', gap: '8px',
                            backgroundColor: isActive ? '#f0f9ff' : 'transparent', transition: 'all 0.2s'
                        }}
                    >
                        <Briefcase size={16} /> {groupedApplicants[posCode].position_name} 
                        <span style={{ backgroundColor: isActive ? '#0284c7' : '#cbd5e1', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>
                            {count}
                        </span>
                    </div>
                )
            })}
        </div>

        {/* 🌟 ตารางแสดงรายชื่อผู้สมัคร */}
        <div style={{ padding: '20px' }}>
            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>กำลังโหลดข้อมูล...</div>
            ) : (
                <>
                    {activeTab && groupedApplicants[activeTab] && (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                                        <th style={{ padding: '12px' }}>วันที่สมัคร</th>
                                        <th style={{ padding: '12px' }}>รหัสอ้างอิง</th>
                                        <th style={{ padding: '12px' }}>Username</th>
                                        <th style={{ padding: '12px' }}>ชื่อ-นามสกุล</th>
                                        <th style={{ padding: '12px', textAlign: 'center' }}>รูปแบบงาน</th>
                                        <th style={{ padding: '12px', textAlign: 'center' }}>ดูรายละเอียด</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupedApplicants[activeTab].applicants.map(app => (
                                        <tr key={app.emp_code} style={{ borderBottom: '1px solid #e2e8f0', transition: '0.2s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                            <td style={{ padding: '12px', color: '#64748b', fontSize: '13px' }}>
                                                {new Date(app.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td style={{ padding: '12px', fontWeight: 'bold', color: '#475569' }}>{app.emp_code}</td>
                                            <td style={{ padding: '12px', color: '#0ea5e9' }}>{app.username}</td>
                                            <td style={{ padding: '12px', fontWeight: 'bold' }}>{app.firstname} {app.lastname}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{app.employment_type}</span>
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                <button onClick={() => openApplicantModal(app)} style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
                                                    <Eye size={16} /> พิจารณา
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
      </div>

      {/* 🌟 Modal พรีวิวใบสมัครแบบอลังการ */}
      {isModalOpen && selectedApplicant && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                  
                  {/* Modal Header */}
                  <div style={{ padding: '20px 25px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                      <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b' }}>
                          <FileText size={24} color="#0ea5e9" /> รายละเอียดใบสมัคร: {selectedApplicant.emp_code}
                      </h3>
                      <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={24} /></button>
                  </div>

                  {/* Modal Content (Scrollable) */}
                  <div style={{ padding: '25px', overflowY: 'auto', flex: 1, backgroundColor: '#f1f5f9' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '25px' }}>
                          
                          {/* ฝั่งซ้าย: รูปภาพและข้อมูลพื้นฐาน */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
                                  <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#e2e8f0', margin: '0 auto 15px auto', overflow: 'hidden', border: '4px solid white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                      {selectedApplicant.profile_pic_url ? (
                                          <img src={selectedApplicant.profile_pic_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      ) : (
                                          <Users size={60} color="#94a3b8" style={{ margin: '30px' }} />
                                      )}
                                  </div>
                                  <h3 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>{selectedApplicant.firstname} {selectedApplicant.lastname}</h3>
                                  <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Username: <strong>{selectedApplicant.username}</strong></p>
                              </div>

                              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                  <h4 style={{ margin: '0 0 10px 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}><Briefcase size={16}/> ตำแหน่งที่สมัคร</h4>
                                  <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                      <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>ตำแหน่ง: <strong>{groupedApplicants[activeTab]?.position_name}</strong></p>
                                      <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>รูปแบบ: <strong>{selectedApplicant.employment_type}</strong></p>
                                      <p style={{ margin: 0, fontSize: '14px' }}>เงินเดือนที่คาดหวัง: <strong style={{ color: '#16a34a' }}>฿{Number(selectedApplicant.expected_salary).toLocaleString()}</strong></p>
                                  </div>
                              </div>
                          </div>

                          {/* ฝั่งขวา: ข้อมูลเชิงลึก และ เอกสาร */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                  <h4 style={{ margin: '0 0 10px 0', color: '#334155' }}>ความสามารถพิเศษ (Skills)</h4>
                                  <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', fontSize: '14px', color: '#475569', minHeight: '60px', whiteSpace: 'pre-wrap' }}>
                                      {selectedApplicant.special_skills || '- ไม่ได้ระบุ -'}
                                  </div>

                                  <h4 style={{ margin: '15px 0 10px 0', color: '#334155' }}>เหตุผลที่ควรรับเข้าทำงาน</h4>
                                  <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '15px', borderRadius: '8px', fontSize: '14px', color: '#92400e', minHeight: '60px', whiteSpace: 'pre-wrap' }}>
                                      {selectedApplicant.why_hire_you || '- ไม่ได้ระบุ -'}
                                  </div>
                              </div>

                              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                  <h4 style={{ margin: '0 0 10px 0', color: '#334155' }}>เอกสารแนบ (วุฒิการศึกษา)</h4>
                                  {selectedApplicant.education_doc_url ? (
                                      <div style={{ width: '100%', height: '200px', backgroundColor: '#e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                          <img src={selectedApplicant.education_doc_url} alt="Education" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                      </div>
                                  ) : (
                                      <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#94a3b8' }}>- ไม่มีรูปภาพแนบมา -</div>
                                  )}
                              </div>
                          </div>
                      </div>

                      {/* 🌟 ส่วนพิจารณาและตอบกลับ */}
                      <div style={{ marginTop: '25px', backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', border: '1px solid #cbd5e1' }}>
                          <h3 style={{ margin: '0 0 15px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <MessageSquare size={20} color="#0ea5e9" /> พิจารณาและตอบกลับผู้สมัคร
                          </h3>
                          
                          {/* เลือกสถานะ */}
                          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                              <div onClick={() => setReplyStatus('Approved')} style={{ flex: 1, padding: '15px', borderRadius: '12px', border: replyStatus === 'Approved' ? '2px solid #16a34a' : '1px solid #cbd5e1', backgroundColor: replyStatus === 'Approved' ? '#f0fdf4' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: '0.2s' }}>
                                  <CheckCircle2 size={24} color={replyStatus === 'Approved' ? '#16a34a' : '#94a3b8'} />
                                  <div>
                                      <strong style={{ display: 'block', color: replyStatus === 'Approved' ? '#166534' : '#475569' }}>ผ่านการพิจารณา</strong>
                                      <span style={{ fontSize: '12px', color: '#64748b' }}>ส่งข้อความนัดหมาย / สัมภาษณ์</span>
                                  </div>
                              </div>
                              <div onClick={() => setReplyStatus('Rejected')} style={{ flex: 1, padding: '15px', borderRadius: '12px', border: replyStatus === 'Rejected' ? '2px solid #ef4444' : '1px solid #cbd5e1', backgroundColor: replyStatus === 'Rejected' ? '#fef2f2' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: '0.2s' }}>
                                  <XCircle size={24} color={replyStatus === 'Rejected' ? '#ef4444' : '#94a3b8'} />
                                  <div>
                                      <strong style={{ display: 'block', color: replyStatus === 'Rejected' ? '#991b1b' : '#475569' }}>ไม่ผ่านการพิจารณา</strong>
                                      <span style={{ fontSize: '12px', color: '#64748b' }}>ส่งข้อความปฏิเสธอย่างสุภาพ</span>
                                  </div>
                              </div>
                          </div>

                          {/* เลือกข้อความ */}
                          {replyStatus && (
                              <div style={{ animation: 'fadeIn 0.3s' }}>
                                  <h4 style={{ margin: '0 0 10px 0', color: '#334155', fontSize: '14px' }}>เลือกข้อความตอบกลับ:</h4>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                      {preDefinedMessages[replyStatus].map((msg, idx) => (
                                          <label key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', cursor: 'pointer', border: selectedReply === msg ? `1px solid ${replyStatus==='Approved'?'#16a34a':'#ef4444'}` : '1px solid transparent' }}>
                                              <input type="radio" name="reply" value={msg} checked={selectedReply === msg} onChange={(e) => setSelectedReply(e.target.value)} style={{ marginTop: '3px' }} />
                                              <span style={{ fontSize: '14px', color: '#475569' }}>{msg}</span>
                                          </label>
                                      ))}
                                      <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', cursor: 'pointer', border: selectedReply === 'custom' ? `1px solid ${replyStatus==='Approved'?'#16a34a':'#ef4444'}` : '1px solid transparent' }}>
                                          <input type="radio" name="reply" value="custom" checked={selectedReply === 'custom'} onChange={(e) => setSelectedReply(e.target.value)} style={{ marginTop: '3px' }} />
                                          <div style={{ width: '100%' }}>
                                              <span style={{ fontSize: '14px', color: '#475569', display: 'block', marginBottom: '8px' }}>พิมพ์ข้อความตอบกลับเอง:</span>
                                              {selectedReply === 'custom' && (
                                                  <textarea rows={3} value={customReply} onChange={(e)=>setCustomReply(e.target.value)} placeholder="พิมพ์ข้อความที่ต้องการส่งให้ผู้สมัคร..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
                                              )}
                                          </div>
                                      </label>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>

                  {/* Modal Footer (ปุ่มกดส่ง) */}
                  <div style={{ padding: '20px 25px', backgroundColor: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                      <button onClick={closeModal} style={{ padding: '12px 25px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>ยกเลิก</button>
                      <button 
                          onClick={handleUpdateStatus}
                          disabled={!replyStatus || !selectedReply}
                          style={{ padding: '12px 30px', backgroundColor: !replyStatus || !selectedReply ? '#cbd5e1' : (replyStatus === 'Approved' ? '#16a34a' : '#ef4444'), color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: !replyStatus || !selectedReply ? 'not-allowed' : 'pointer', transition: '0.2s' }}
                      >
                          <Send size={18} /> ยืนยันผลการพิจารณา
                      </button>
                  </div>

              </div>
          </div>
      )}

    </div>
  );
};

export default ListOfJobApplicants;