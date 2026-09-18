import React from 'react';



const Profile = () => {
  const { t } = useTranslation();

  return (
    <div>
      <TopNavbar />
      <div className="page-center-vh">
        <h1>{t('welcome', 'Profile')}</h1>

      </div>
    </div>
  );
};

export default Profile;