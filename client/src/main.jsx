import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App as AntApp, ConfigProvider } from 'antd';
import 'antd/dist/reset.css';

import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { GuidelinesProvider } from './components/GuidelinesModal';
import { LanguageProvider, useLang, ANTD_LOCALES } from './i18n';
import { themeConfig } from './theme';

function Root() {
  const { lang } = useLang();
  return (
    <ConfigProvider theme={themeConfig} locale={ANTD_LOCALES[lang]}>
      <AntApp>
        <BrowserRouter>
          <AuthProvider>
            <ErrorBoundary>
              <GuidelinesProvider>
                <App />
              </GuidelinesProvider>
            </ErrorBoundary>
          </AuthProvider>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <Root />
    </LanguageProvider>
  </React.StrictMode>,
);
