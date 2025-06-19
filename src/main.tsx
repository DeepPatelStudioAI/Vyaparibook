import React from 'react';
import ReactDOM from 'react-dom/client';
// **REMOVE** any `import 'bootstrap/dist/css/bootstrap.min.css';`
// because you’re loading via CDN above.

import Auth from './Auth';

ReactDOM.createRoot(
  document.getElementById('root')!
).render(
  <React.StrictMode>
    <Auth />
  </React.StrictMode>
);
