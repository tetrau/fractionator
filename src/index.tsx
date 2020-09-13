import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

if (process.env.REACT_APP_PAGE_VIEW_COUNT_URL) {
  fetch(process.env.REACT_APP_PAGE_VIEW_COUNT_URL);
}

serviceWorker.register();
