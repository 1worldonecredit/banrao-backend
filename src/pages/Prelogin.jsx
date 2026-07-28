import React from 'react';



const PreLogin = () => {
  const { t } = useTranslation();

  return (
    <div>
      <TopNavbar />
      <div className="page-center-vh">
        <h1>{t('welcome', 'ຍິນດີຕ້ອນຮັບສູ່ SLAPI')}</h1>

      </div>
    </div>
  );
};

export default PreLogin;