import React from 'react';

const Profile = () => {
  return (
    <div className="profile">
      <h2>Profile</h2>
      <p>Profile page coming soon!</p>
      <p>Token: {localStorage.getItem('token') ? 'Available' : ' Missing'}</p>
    </div>
  );
};

export default Profile;