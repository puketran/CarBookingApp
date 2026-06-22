import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Modal, Typography } from 'antd';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../i18n';
import { GUIDELINES, GUIDE_TITLE_KEY } from '../config/guidelines';

const { Title } = Typography;

const GuidelinesContext = createContext({ show: () => {} });
export const useGuidelines = () => useContext(GuidelinesContext);

function Bullets({ mark, color, items }) {
  if (!items?.length) return null;
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0 12px' }}>
      {items.map((line, i) => (
        <li key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', lineHeight: 1.5 }}>
          <span style={{ color }}>{mark}</span>
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}

// Provider: renders children + a role-based guidelines Modal. Opens on every app
// open (mount with a logged-in user) and after login; show() reopens it on demand.
export function GuidelinesProvider({ children }) {
  const { user } = useAuth();
  const { lang, t } = useLang();
  const [open, setOpen] = useState(false);
  const show = useCallback(() => setOpen(true), []);

  const role = user?.role;
  // Show whenever a logged-in user mounts / changes (i.e. every app open + login).
  useEffect(() => { if (role && GUIDELINES[role]) setOpen(true); }, [user?.user_id]);

  const content = role && GUIDELINES[role] ? (GUIDELINES[role][lang] || GUIDELINES[role].en) : null;

  return (
    <GuidelinesContext.Provider value={{ show }}>
      {children}
      <Modal
        open={open && !!content}
        onCancel={() => setOpen(false)}
        onOk={() => setOpen(false)}
        okText={t('guide.gotIt')}
        cancelButtonProps={{ style: { display: 'none' } }}
        title={role ? t(GUIDE_TITLE_KEY[role]) : ''}
      >
        {content && (
          <>
            <Bullets mark="✅" color="#389e0d" items={content.dos} />
            {content.donts?.length > 0 && (
              <>
                <Title level={5} style={{ marginTop: 4 }}>—</Title>
                <Bullets mark="❌" color="#cf1322" items={content.donts} />
              </>
            )}
          </>
        )}
      </Modal>
    </GuidelinesContext.Provider>
  );
}
