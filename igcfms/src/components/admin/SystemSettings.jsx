import React from "react";
import "../../assets/admin.css";

const SystemSettings = () => {
  return (
    <div className="admin-page">
      <div className="card">
        <h2>System Settings</h2>
        <p>Configure application preferences and appearance.</p>

        <section className="settings-section">
          <h3>Appearance</h3>
          <div className="settings-group">
            <label htmlFor="mode-switcher">Theme</label>
            <div id="mode-switcher" className="theme-toggle">
              <input type="radio" name="theme" id="light" value="light" defaultChecked />
              <label htmlFor="light" className="toggle-option">Light</label>

              <input type="radio" name="theme" id="dark" value="dark" />
              <label htmlFor="dark" className="toggle-option">Dark</label>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SystemSettings;
