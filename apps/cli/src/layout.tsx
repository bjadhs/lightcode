import { TextAttributes } from '@opentui/core';
import { Outlet, useLocation } from 'react-router';
import { useEffect, useState } from 'react';
import { createClient } from '@lightcode/api-client';
import { PromptInput } from './components/prompt-input';
import { GenerationProvider } from './contexts/generation';
import { ToastProvider, useToast } from './contexts/toast';

function ToastDisplay() {
  const { toasts } = useToast();
  const toast = toasts[toasts.length - 1];
  if (!toast) return null;
  return (
    <box
      height={1}
      paddingX={2}
      alignItems='center'
      backgroundColor={toast.type === 'success' ? '#2d5a2d' : '#5a2d2d'}
    >
      <text fg={toast.type === 'success' ? '#a8d5a8' : '#d5a8a8'}>
        {toast.type === 'success' ? '✓ ' : '✗ '}
        {toast.message}
      </text>
    </box>
  );
}

function StatusBar() {
  const location = useLocation();
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const client = createClient();
    async function check() {
      try {
        await client.health();
        setOnline(true);
      } catch {
        setOnline(false);
      }
    }
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <box height={1} paddingX={1} flexDirection='row' justifyContent='space-between' alignItems='center'>
      <text fg={online === null ? '#888888' : online ? '#4caf50' : '#f44336'}>
        {online === null ? '○ connecting' : online ? '● connected' : '○ offline'}
      </text>
      <text attributes={TextAttributes.DIM}>{location.pathname}</text>
    </box>
  );
}

export function RootLayout() {
  return (
    <ToastProvider>
      <GenerationProvider>
        <box flexDirection='column' flexGrow={1}>
          <StatusBar />
          <box flexGrow={1} overflow='hidden'>
            <Outlet />
          </box>
          <ToastDisplay />
          <PromptInput />
        </box>
      </GenerationProvider>
    </ToastProvider>
  );
}
