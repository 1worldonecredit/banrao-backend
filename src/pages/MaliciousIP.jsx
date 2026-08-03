import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Ban, Unlock, RefreshCw, Search, ShieldCheck } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const MaliciousIP = () => {
  const [ips, setIps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchIps = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/malicious-ips`);
      const data = await res.json();
      if (data.success) {
        setIps(data.ips);
      }
    } catch (err) {
      console.error("Failed to fetch IPs", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIps();
  }, []);

  const handleToggleBlock = async (ipAddress, currentStatus) => {
    const actionText = currentStatus ? "ปลดบล็อก" : "บล็อก";
    const confirmAction = window.confirm(`คุณต้องการ ${actionText} IP: ${ipAddress} ใช่หรือไม่?`);
    
    if (!confirmAction) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/toggle-block-ip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ip_address: ipAddress, 
          is_blocked: !currentStatus,
          reason: !currentStatus ? 'Manual Block by Admin' : '' 
        })
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ ทำรายการ ${actionText} สำเร็จ`);
        fetchIps(); // โหลดข้อมูลใหม่
      } else {
        alert('❌ เกิดข้อผิดพลาดในการทำรายการ');
      }
    } catch (err) {
      console.error(err);
      alert('⚠️ เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว');
    }
  };

  const filteredIps = ips.filter(item => item.ip_address.includes(searchTerm));

  return (
    <div style={{ padding: '20px', minHeight: '100vh', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#1e293b', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldAlert size={28} color="#ef4444" /> ระบบเฝ้าระวังและบล็อก IP อันตราย
        </h2>
        <button 
          onClick={fetchIps}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', color: '#475569', fontWeight: 'bold' }}
        >
          <RefreshCw size={16} /> รีเฟรชข้อมูล
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '25px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #ef4444', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ backgroundColor: '#fee2e2', padding: '15px', borderRadius: '50%' }}>
              <Ban size={28} color="#ef4444" />
            </div>
            <div>
              <p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>IP ที่ถูกบล็อกปัจจุบัน</p>
              <h3 style={{ margin: 0, fontSize: '24px', color: '#ef4444' }}>
                {ips.filter(ip => ip.is_blocked).length} <span style={{fontSize:'14px', color:'#94a3b8'}}>รายการ</span>
              </h3>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #10b981', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ backgroundColor: '#dcfce7', padding: '15px', borderRadius: '50%' }}>
              <ShieldCheck size={28} color="#10b981" />
            </div>
            <div>
              <p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>ระบบป้องกันอัตโนมัติ</p>
              <h3 style={{ margin: 0, fontSize: '20px', color: '#10b981' }}>กำลังทำงาน <span style={{fontSize:'12px', color:'#22c55e'}}>●</span></h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>บล็อกทันทีเมื่อ Login ผิด > 10 ครั้ง/นาที</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h4 style={{ margin: 0, color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} color="#f59e0b" /> รายการ IP เฝ้าระวัง
          </h4>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="ค้นหา IP..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '8px 15px 8px 35px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', width: '200px' }}
            />
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>กำลังโหลดข้อมูล...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', color: '#475569', fontSize: '14px' }}>
                  <th style={{ padding: '12px 15px', borderBottom: '2px solid #e2e8f0' }}>IP Address</th>
                  <th style={{ padding: '12px 15px', borderBottom: '2px solid #e2e8f0' }}>สาเหตุ (Reason)</th>
                  <th style={{ padding: '12px 15px', borderBottom: '2px solid #e2e8f0' }}>วันที่ถูกบันทึก</th>
                  <th style={{ padding: '12px 15px', borderBottom: '2px solid #e2e8f0' }}>สถานะ</th>
                  <th style={{ padding: '12px 15px', borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredIps.length > 0 ? filteredIps.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 15px', fontWeight: 'bold', color: item.is_blocked ? '#ef4444' : '#334155' }}>
                      {item.ip_address}
                    </td>
                    <td style={{ padding: '12px 15px', color: '#64748b', fontSize: '13px' }}>{item.reason}</td>
                    <td style={{ padding: '12px 15px', color: '#64748b', fontSize: '13px' }}>
                      {new Date(item.created_at).toLocaleString('th-TH')}
                    </td>
                    <td style={{ padding: '12px 15px' }}>
                      {item.is_blocked ? (
                        <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>โดนบล็อก</span>
                      ) : (
                        <span style={{ backgroundColor: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>ปลดบล็อกแล้ว</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleToggleBlock(item.ip_address, item.is_blocked)}
                        style={{ 
                          backgroundColor: item.is_blocked ? '#10b981' : '#ef4444', 
                          color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', 
                          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 'bold' 
                        }}
                      >
                        {item.is_blocked ? <><Unlock size={14} /> ปลดบล็อก</> : <><Ban size={14} /> บล็อก IP นี้</>}
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>ไม่มีรายการ IP ในระบบเฝ้าระวัง</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaliciousIP;