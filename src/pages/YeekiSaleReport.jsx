import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock, Wallet, Users, Ban, PlayCircle, ChevronLeft, Lock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const YeekiSaleReport = () => {
  const [roundsData, setRoundsData] = useState([]);
  const [overallTotal, setOverallTotal] = useState({ thb: 0, lak: 0 });
  const [activeRoundTotal, setActiveRoundTotal] = useState({ thb: 0, lak: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [viewingRound, setViewingRound] = useState(null); 

  const fetchReportData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/yeeki/sales-report`);
      const data = await res.json();
      
      if (data.success) {
        setRoundsData(data.rounds);
        setOverallTotal(data.overallTotal);
        setActiveRoundTotal(data.activeRoundTotal);
        
        if (viewingRound) {
          const updatedRound = data.rounds.find(r => r.round_id === viewingRound.round_id);
          if (updatedRound) setViewingRound(updatedRound);
        }
      }
    } catch (err) {
      console.error("Error fetching report:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
    const interval = setInterval(fetchReportData, 10000); 
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingRound]);

  const formatCurrency = (num) => Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div style={{ paddingBottom: '30px' }}>
      
      {viewingRound ? (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          
          <div style={{ backgroundColor: '#9d174d', padding: '15px', color: 'white', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button onClick={() => setViewingRound(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
              <ChevronLeft size={28} />
            </button>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px' }}>รายละเอียดรอบที่ {viewingRound.round_number}</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', opacity: 0.8 }}>
                สถานะ: {viewingRound.status === 'open' ? 'เปิดรับแทง' : viewingRound.status === 'ended' ? 'ปิดรับแทงแล้ว' : 'รอเปิด'}
              </p>
            </div>
            <button onClick={fetchReportData} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
              <RefreshCw size={14} /> อัปเดต
            </button>
          </div>

          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', backgroundColor: '#fdf2f8', padding: '15px', borderRadius: '10px', border: '1px solid #fbcfe8' }}>
              <div>
                <h4 style={{ margin: '0 0 10px 0', color: '#9d174d' }}>เวลาของรอบนี้</h4>
                <div style={{ fontSize: '13px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span>เปิดขาย: <strong style={{color: '#16a34a'}}>{viewingRound.open_time} น.</strong></span>
                  <span>ปิดรับแทง: <strong style={{ color: '#ef4444' }}>{viewingRound.close_time} น.</strong></span>
                  <span>ออกผล: <strong style={{color: '#d97706'}}>{viewingRound.draw_time} น.</strong></span>
                </div>
              </div>

              {/* 🌟 ส่วนที่ปรับแก้เพื่อแสดงผลรางวัลแยกทีละตัว */}
              {viewingRound.status === 'ended' ? (
                <div style={{ backgroundColor: '#fffbeb', padding: '15px 25px', borderRadius: '8px', border: '1px solid #fde68a', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#b45309', fontWeight: 'bold' }}>ผลรางวัลที่ออก</p>
                  
                  {(() => {
                      const res6 = viewingRound.result_8_super || '-'; 
                      const res4 = viewingRound.result_4_top || '-';
                      const res3 = viewingRound.result_3_top || (res4 !== '-' ? res4.slice(-3) : '-');
                      const res2top = res4 !== '-' ? res4.slice(-2) : '-';
                      const res2bot = viewingRound.result_2_bottom || '-';
                      
                      // Fallback เผื่อ API เก่ายังส่งแค่ winning_result
                      if (res6 === '-' && viewingRound.winning_result) {
                          return <h2 style={{ margin: 0, color: '#d97706', letterSpacing: '2px', fontSize: '24px' }}>{viewingRound.winning_result}</h2>;
                      }

                      return (
                          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', fontSize: '15px', fontWeight: 'bold', color: '#1e40af' }}>
                              <span style={{ background: '#fef3c7', padding: '4px 8px', borderRadius: '6px' }}>6 ตัว: <span style={{ color: '#ef4444' }}>{res6}</span></span>
                              <span style={{ background: '#fef3c7', padding: '4px 8px', borderRadius: '6px' }}>4 ตัว: <span style={{ color: '#ef4444' }}>{res4}</span></span>
                              <span style={{ background: '#fef3c7', padding: '4px 8px', borderRadius: '6px' }}>3 บน: <span style={{ color: '#ef4444' }}>{res3}</span></span>
                              <span style={{ background: '#fef3c7', padding: '4px 8px', borderRadius: '6px' }}>2 บน: <span style={{ color: '#ef4444' }}>{res2top}</span></span>
                              <span style={{ background: '#fef3c7', padding: '4px 8px', borderRadius: '6px' }}>2 ล่าง: <span style={{ color: '#ef4444' }}>{res2bot}</span></span>
                          </div>
                      );
                  })()}
                </div>
              ) : viewingRound.status === 'open' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 'bold', padding: '15px' }}>
                  <PlayCircle size={24} /> กำลังเปิดรับแทง...
                </div>
              ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontWeight: 'bold', padding: '15px' }}>
                  <Clock size={24} /> ยังไม่ออกผล
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px', backgroundColor: '#f0f9ff', padding: '15px', borderRadius: '8px', border: '1px solid #bae6fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#0369a1', fontWeight: 'bold' }}>ยอดขาย (THB)</span>
                <span style={{ color: '#0284c7', fontSize: '20px', fontWeight: '900' }}>{formatCurrency(viewingRound.total_thb)} ฿</span>
              </div>
              <div style={{ flex: 1, minWidth: '200px', backgroundColor: '#f0fdf4', padding: '15px', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#166534', fontWeight: 'bold' }}>ยอดขาย (LAK)</span>
                <span style={{ color: '#15803d', fontSize: '20px', fontWeight: '900' }}>{formatCurrency(viewingRound.total_lak)} ₭</span>
              </div>
            </div>

            <h4 style={{ margin: '0 0 15px 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} /> รายการสั่งซื้อ ({viewingRound.orders ? viewingRound.orders.length : 0} รายการ)
            </h4>
            
            <div style={{ overflowX: 'auto', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px' }}>ผู้ใช้</th>
                    <th style={{ padding: '12px' }}>ประเภท</th>
                    <th style={{ padding: '12px' }}>ตัวเลข</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>ราคา</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>สกุลเงิน</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingRound.orders && viewingRound.orders.length > 0 ? (
                    viewingRound.orders.map((order, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#334155' }}>{order.username}</td>
                        <td style={{ padding: '12px', color: '#64748b' }}>{order.type}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ backgroundColor: '#fce7f3', color: '#be185d', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                            {order.number}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#111' }}>
                          {formatCurrency(order.price)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{ fontSize: '11px', backgroundColor: order.currency === 'THB' || order.currency === '฿' ? '#e0f2fe' : '#dcfce7', color: order.currency === 'THB' || order.currency === '฿' ? '#0369a1' : '#166534', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                            {order.currency}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{ fontSize: '12px', color: order.status === 'Completed' || order.status === 'Win' ? '#10b981' : order.status === 'Lose' ? '#ef4444' : '#f59e0b', fontWeight: 'bold' }}>
                            {order.status === 'Win' ? '🎉 ถูกรางวัล' : order.status === 'Lose' ? 'ไม่ถูกรางวัล' : order.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                        ยังไม่มีรายการสั่งซื้อในรอบนี้
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>

      ) : (

        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={28} color="#db2777" /> รายงานขาย ยี่กี (Real-time)
            </h2>
            <button onClick={fetchReportData} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', color: '#475569', fontWeight: 'bold' }}>
              <RefreshCw size={16} className={isLoading ? "spin-icon" : ""} /> รีเฟรช
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '25px' }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #db2777', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <p style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>ยอดขายรวมวันนี้ (ทุกรอบ)</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#9d174d', fontSize: '24px' }}>{formatCurrency(overallTotal.thb)} ฿</h3>
                  <h3 style={{ margin: '5px 0 0 0', color: '#be185d', fontSize: '18px' }}>{formatCurrency(overallTotal.lak)} ₭</h3>
                </div>
                <Wallet size={36} color="#fbcfe8" />
              </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #10b981', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <p style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>ยอดขายรอบที่กำลังเปิดรับแทง</p>
              {activeRoundTotal.thb > 0 || activeRoundTotal.lak > 0 ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#047857', fontSize: '24px' }}>{formatCurrency(activeRoundTotal.thb)} ฿</h3>
                    <h3 style={{ margin: '5px 0 0 0', color: '#059669', fontSize: '18px' }}>{formatCurrency(activeRoundTotal.lak)} ₭</h3>
                  </div>
                  <PlayCircle size={36} color="#d1fae5" />
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', height: '50px', color: '#94a3b8', fontSize: '14px' }}>
                  กำลังรอเปิดรอบใหม่ หรือยังไม่มียอดขาย
                </div>
              )}
            </div>
          </div>

          {isLoading && roundsData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>กำลังโหลดข้อมูลรายงาน...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' }}>
              {roundsData.map(round => (
                <div key={round.round_id} 
                  onClick={() => setViewingRound(round)}
                  style={{ 
                    backgroundColor: 'white', borderRadius: '16px', padding: '15px', 
                    boxShadow: round.status === 'open' ? '0 8px 25px rgba(219, 39, 119, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                    border: round.status === 'open' ? '2px solid #db2777' : '1px solid #e2e8f0',
                    opacity: round.status === 'ended' ? 0.7 : 1,
                    transform: round.status === 'open' ? 'translateY(-3px)' : 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    position: 'relative', overflow: 'hidden'
                  }}
                >
                  {round.status === 'open' && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '5px', backgroundColor: '#db2777' }}></div>}
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {round.status === 'ended' && <Ban size={18} color="#94a3b8" />}
                      {round.status === 'open' && <PlayCircle size={18} color="#db2777" />}
                      {round.status === 'upcoming' && <Lock size={18} color="#cbd5e1" />}
                      <span style={{ fontWeight: '900', color: round.status === 'open' ? '#9d174d' : '#475569', fontSize: '15px' }}>
                        รอบที่ {round.round_number}
                      </span>
                    </div>
                    {round.orders && round.orders.length > 0 && (
                       <span style={{ fontSize: '11px', backgroundColor: '#f1f5f9', color: '#64748b', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                         {round.orders.length} บิล
                       </span>
                    )}
                  </div>
                  
                  <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', paddingBottom: '4px' }}>
                      <span>เปิดขาย:</span>
                      <strong style={{ color: '#16a34a' }}>{round.open_time} น.</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', paddingBottom: '4px' }}>
                      <span>ปิดรับแทง:</span>
                      <strong style={{ color: '#dc2626' }}>{round.close_time} น.</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>ออกผล:</span>
                      <strong style={{ color: '#d97706' }}>{round.draw_time} น.</strong>
                    </div>
                  </div>

                  {(round.total_thb > 0 || round.total_lak > 0) && (
                    <div style={{ marginTop: '12px', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px dashed #cbd5e1', fontSize: '12px' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0369a1', fontWeight: 'bold' }}>
                         <span>ยอด (THB)</span>
                         <span>{formatCurrency(round.total_thb)}</span>
                       </div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534', fontWeight: 'bold', marginTop: '2px' }}>
                         <span>ยอด (LAK)</span>
                         <span>{formatCurrency(round.total_lak)}</span>
                       </div>
                    </div>
                  )}

                  {round.status === 'open' && <div style={{ marginTop: '10px', color: '#db2777', fontWeight: 'bold', fontSize: '12px', textAlign: 'center' }}>คลิกดูรายละเอียด & ยอดขาย</div>}
                  {round.status === 'ended' && <div style={{ marginTop: '10px', color: '#94a3b8', fontWeight: 'bold', fontSize: '12px', textAlign: 'center' }}>คลิกดูผลรางวัล & ยอดขาย</div>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default YeekiSaleReport;