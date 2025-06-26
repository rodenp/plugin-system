import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { SkoolPluginsDemo } from './components/SkoolPluginsDemo';
import './index.css';
// Create root element for plugin demo
const container = document.getElementById('plugin-demo-root');
if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(_jsx(React.StrictMode, { children: _jsx(SkoolPluginsDemo, {}) }));
}
else {
    console.error('Plugin demo root element not found');
}
