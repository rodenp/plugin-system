import React from 'react';
import { createRoot } from 'react-dom/client';
import { SkoolCloneStarterApp } from './skool-clone-starter';
import './index.css';

// Main entry point for Skool clone starter
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<SkoolCloneStarterApp />);
}