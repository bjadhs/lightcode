import { useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useKeyboard, useRenderer, useTerminalDimensions } from '@opentui/react';
import { TextAttributes } from '@opentui/core';
import type { TextareaRenderable } from '@opentui/core';
import { useGeneration } from '../contexts/generation';

export function PromptInput() {
  const textareaRef = useRef<TextareaRenderable>(null);
  const { width } = useTerminalDimensions();
  const navigate = useNavigate();
  const location = useLocation();
  const renderer = useRenderer();
  const { usage } = useGeneration();

  useEffect(() => {
    textareaRef.current?.focus();
  }, [location.pathname]);

  const containerWidth = Math.min(width - 8, 100);

  useKeyboard((key) => {
    if (key.name === 'return' && !key.shift) {
      handleSubmit();
      return;
    }

    if (key.name === 'return' && key.shift) {
      textareaRef.current?.newLine();
      return;
    }

    if (key.name === 'escape') {
      textareaRef.current?.clear();
      return;
    }

    if (key.name === 'c' && (key.ctrl || key.meta)) {
      renderer.destroy();
      return;
    }
  });

  function handleSubmit() {
    const value = textareaRef.current?.plainText.trim() ?? '';
    if (!value) return;

    // Slash commands
    if (value === '/new') {
      textareaRef.current?.clear();
      navigate('/chat');
      return;
    }
    if (value === '/back') {
      textareaRef.current?.clear();
      navigate('/');
      return;
    }
    if (value === '/exit') {
      renderer.destroy();
      return;
    }

    // Extract session ID from URL if on /chat/:id
    const sessionMatch = location.pathname.match(/^\/chat\/(.+)$/);
    const sessionId = sessionMatch ? sessionMatch[1] : undefined;

    textareaRef.current?.clear();
    if (sessionId) {
      navigate(`/chat/${sessionId}`, { state: { prompt: value } });
    } else {
      navigate('/chat', { state: { prompt: value } });
    }
  }

  return (
    <box flexDirection='column' alignItems='center' gap={1}>
      <box flexDirection='row' gap={1} padding={1} width={containerWidth}>
        <box width={1} backgroundColor='#4FC3F7' />
        <textarea
          ref={textareaRef}
          placeholder='Ask anything...'
          onSubmit={handleSubmit}
          focused
          width={containerWidth - 4}
          height={6}
          wrapMode='word'
          attributes={TextAttributes.BOLD}
          backgroundColor='#2a2a2a'
          paddingTop={1}
          paddingLeft={1}
        />
      </box>
      <box flexDirection='row' gap={3}>
        <text attributes={TextAttributes.DIM}>↵ submit</text>
        <text attributes={TextAttributes.DIM}>shift+↵ new line</text>
        <text attributes={TextAttributes.DIM}>esc clear</text>
        <text attributes={TextAttributes.DIM}>pgup/pgdn scroll</text>
        <text attributes={TextAttributes.DIM}>/new  /back  /exit</text>
      </box>
      {usage && (
        <box flexDirection='row' gap={3}>
          <text attributes={TextAttributes.DIM}>in {usage.promptTokens}</text>
          <text attributes={TextAttributes.DIM}>out {usage.completionTokens}</text>
          <text attributes={TextAttributes.DIM}>ctx {usage.totalTokens}</text>
          <text attributes={TextAttributes.DIM}>cost ${usage.cost?.toFixed(6) ?? '-'}</text>
        </box>
      )}
    </box>
  );
}
