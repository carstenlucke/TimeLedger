import React from 'react';

const HelloWorld: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Hello World</h1>
        <p className="page-description">
          This is a demo page to showcase the application structure
        </p>
      </div>

      <div className="content-section">
        <div className="card">
          <h2>Welcome to the Electron App Template</h2>
          <p>
            This is a basic Electron application template with the following features:
          </p>
          <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
            <li>React + TypeScript + Vite for modern development</li>
            <li>SQLite database integration</li>
            <li>Backup and restore functionality</li>
            <li>Multiple theme support (10 themes including Dark and Light modes)</li>
            <li>Keyboard shortcuts system</li>
            <li>Admin layout with sidebar navigation</li>
            <li>Production build configuration</li>
            <li>Localization support (i18n)</li>
          </ul>
        </div>

        <div className="card" style={{ marginTop: '20px' }}>
          <h2>Getting Started</h2>
          <p>
            Use this template as a starting point for your Electron applications.
            The sidebar navigation, database layer, and UI components are ready to use.
          </p>
          <p style={{ marginTop: '10px' }}>
            Explore the Dashboard and Settings pages to see more features in action.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HelloWorld;
