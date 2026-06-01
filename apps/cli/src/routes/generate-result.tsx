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
      setText('Please provide a prompt to generate a song.');
      return;
    }
    let cancelled = false;
    async function run() {
      try {
        const client = createClient();
        let accumulated = '';
        for await (const chunk of client.streamGenerate(prompt)) {
          if (cancelled) break;
          accumulated += chunk;
          setText(accumulated);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : String(err);
          setText(`Error: ${message}`);
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [prompt]);

  return (
    <box flexDirection='column' flexGrow={1} padding={2} gap={1}>
      <text fg='cyan' attributes={TextAttributes.BOLD}>
        Generated Song
      </text>
      <box flexGrow={1} paddingY={1}>
        <text wrapMode='word'>{text}</text>
      </box>
    </box>
  );
}
