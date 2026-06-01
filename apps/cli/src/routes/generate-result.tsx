import { TextAttributes } from '@opentui/core';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { createClient } from '@lightcode/api-client';

export function GenerateResult() {
  const location = useLocation();
  const prompt = (location.state as { prompt?: string } | null)?.prompt ?? '';
  const [text, setText] = useState('Generating...');

  useEffect(() => {
    if (!prompt) {
      setText('Please provide a prompt.');
      return;
    }

    const ctrl = new AbortController();

    async function run() {
      try {
        const client = createClient();
        let accumulated = '';
        for await (const chunk of client.streamGenerate(prompt, { signal: ctrl.signal })) {
          if (ctrl.signal.aborted) break;
          accumulated += chunk;
          setText(accumulated);
        }
      } catch (err) {
        if (ctrl.signal.aborted) return;
        const message = err instanceof Error ? err.message : String(err);
        setText(`Error: ${message}`);
      }
    }

    run();

    return () => {
      ctrl.abort();
    };
  }, [prompt]);

  return (
    <box flexDirection='column' flexGrow={1} padding={2} gap={1}>
      <text fg='cyan' attributes={TextAttributes.BOLD}>
        Assistant
      </text>
      <box flexGrow={1} paddingY={1}>
        <text wrapMode='word'>{text}</text>
      </box>
    </box>
  );
}