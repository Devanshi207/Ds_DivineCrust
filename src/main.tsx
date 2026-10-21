import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';

// Each screen is loaded only when its address is opened, so the admin and the costing calculator
// (which has its own styles) never slow down or restyle the public site.
const App = lazy(() => import('./App'));
const Admin = lazy(() => import('./admin/Admin'));
const CalcApp = lazy(() => import('./admin/calc/CalcApp'));

const path = window.location.pathname.replace(/\/+$/, '');
const Screen = path === '/admin/calc' ? CalcApp : path === '/admin' ? Admin : App;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Screen />
    </Suspense>
  </StrictMode>,
);
