import { createRoot } from 'react-dom/client';
import { StarterPageApp } from './starter-page';
import './index.css';

// Main entry point for starter page
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<StarterPageApp />);
}