import { TextAttributes } from '@opentui/core';
import { useTerminalDimensions } from '@opentui/react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { createClient } from '@lightcode/api-client';

export function GenerateResult() {
  const location = useLocation();
  const { width } = useTerminalDimensions();
  const state = location.state as { prompt?: string; conversationId?: string } | null;
  const prompt = state?.prompt ?? '';
  const conversationId = state?.conversationId;
  const [text, setText] = useState('Generating...');

  // Industry-standard responsive width: full width with margins on small screens,
  // capped at 100 cols on larger screens (max-width container pattern)
  const containerWidth = Math.min(width - 8, 100);

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
        for await (const chunk of client.streamGenerate(prompt, { signal: ctrl.signal, conversationId })) {
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
  }, [prompt, conversationId]);

  return (
    <box flexDirection='column' flexGrow={1} alignItems='center' paddingY={2}>
      <box flexDirection='column' width={containerWidth} gap={1}>
        {prompt && (
          <box flexDirection='row'>
            <box width={1} backgroundColor='#4FC3F7' />
            <box flexGrow={1} flexDirection='column' paddingX={1} paddingY={1} backgroundColor='#333333'>
              <text fg='#4FC3F7' attributes={TextAttributes.BOLD}>You</text>
              <text wrapMode='word'>{prompt}</text>
            </box>
          </box>
        )}
        <box flexDirection='row' flexGrow={1}>
          <box width={1} backgroundColor='#666666' />
          <box flexGrow={1} flexDirection='column' paddingX={1} paddingY={1} backgroundColor='#2d3748'>
            <text fg='#e2e8f0' attributes={TextAttributes.BOLD}>Assistant</text>
            <text wrapMode='word' fg='#e2e8f0'>{text}</text>
          </box>
        </box>
      </box>
    </box>
  );
}