import React from 'react';
import TopNavbar from '../components/TopNavbar';
import BottomNavbar from '../components/BottomNavbar';

const DailySales = () => {
  return (
    <div className="app-container">
      <TopNavbar />
      <div className="main-content">
        <h2>รายงานยอดขายประจำวัน (DailySales)</h2>
        <p>กำลังพัฒนาโครงสร้างส่วนนี้...</p>
      </div>
      <BottomNavbar /> 
    </div>
  );
};

export default DailySales;