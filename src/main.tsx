import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(
  (() => {
    const app = document.createElement('div');
    app.id = 'skyscanner-car_rental';
    document.body.append(app);
    return app;
  })(),
).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
