import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import enUS from 'antd/locale/en_US';
import '@fontsource/archivo/500.css';
import '@fontsource/archivo/600.css';
import '@fontsource/archivo/700.css';
import '@fontsource/instrument-sans/400.css';
import '@fontsource/instrument-sans/500.css';
import '@fontsource/instrument-sans/600.css';
import '@fontsource/instrument-sans/700.css';
import 'antd/dist/reset.css';
import { antdTheme } from './theme';
import './styles.css'; // after reset.css
import App from './App';
import { DemoLoginGate } from './demo-login/DemoLoginGate';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DemoLoginGate>
      <ConfigProvider theme={antdTheme} locale={enUS}>
        <AntdApp>
          <HashRouter>
            <App />
          </HashRouter>
        </AntdApp>
      </ConfigProvider>
    </DemoLoginGate>
  </React.StrictMode>,
);
