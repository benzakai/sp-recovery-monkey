import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

let widget = document.getElementById('CartKeeper-AIChat-Widget');

if (!widget) {
  widget = document.createElement('div');
  widget.id = 'CartKeeper-AIChat-Widget';
  document.body.appendChild(widget);
}

createRoot(widget).render(
  <StrictMode>
    <App />
  </StrictMode>
);
