import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useKeyboard, useRenderer, useTerminalDimensions } from '@opentui/react';
import { TextAttributes } from '@opentui/core';
import type { SelectOption, TextareaRenderable } from '@opentui/core';

const ROUTES: SelectOption[] = [
  { name: 'Home', description: 'Welcome screen', value: '/' },
  { name: 'About', description: 'About this app', value: '/about' },
  { name: 'Settings', description: 'App settings', value: '/settings' },
  { name: 'History', description: 'Past conversations', value: '/history' },
  { name: 'Result', description: 'Last generation result', value: '/result' },
];

export function PromptInput() {
  const textareaRef = useRef<TextareaRenderable>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const { width } = useTerminalDimensions();
  const navigate = useNavigate();
  const location = useLocation();
  const renderer = useRenderer();

  // Industry-standard responsive width: full width with margins on small screens,
  // capped at 100 cols on larger screens (max-width container pattern)
  const containerWidth = Math.min(width - 8, 100);

  useKeyboard((key) => {
    // Return -> submit (unless shift is held)
    if (key.name === 'return' && !key.shift) {
      handleSubmit();
      return;
    }

    // Shift+Return -> insert new line
    if (key.name === 'return' && key.shift) {
      textareaRef.current?.newLine();
      return;
    }

    // Escape -> clear textarea and close dropdown
    if (key.name === 'escape') {
      textareaRef.current?.clear();
      setShowDropdown(false);
      return;
    }

    // Ctrl+C or Cmd+C (meta) -> quit
    if (key.name === 'c' && (key.ctrl || key.meta)) {
      renderer.destroy();
      return;
    }
  });

  function handleContentChange() {
    const text = textareaRef.current?.plainText ?? '';
    setShowDropdown(text.startsWith('/'));
  }

  function handleSubmit() {
    const value = textareaRef.current?.plainText.trim() ?? '';
    if (!value) return;
    if (value.startsWith('/')) {
      navigate(value);
      textareaRef.current?.clear();
      setShowDropdown(false);
      return;
    }

    // Extract conversation ID if on a conversation page
    const conversationMatch = location.pathname.match(/^\/conversation\/(.+)$/);
    const conversationId = conversationMatch ? conversationMatch[1] : undefined;

    textareaRef.current?.clear();
    setShowDropdown(false);
    navigate('/result', { state: { prompt: value, conversationId } });
  }

  function handleSelect(_index: number, option: SelectOption | null) {
    if (!option) return;
    navigate(String(option.value));
    textareaRef.current?.clear();
    setShowDropdown(false);
  }

  return (
    <box flexDirection='column' alignItems='center' gap={1}>
      {showDropdown && (
        <box width={containerWidth}>
          <select
            options={ROUTES}
            onSelect={handleSelect}
            focused
            height={6}
            width={containerWidth}
          />
        </box>
      )}
      <box flexDirection='row' gap={1} padding={1} width={containerWidth}>
        <box width={1} backgroundColor='#4FC3F7' />
        <textarea
          ref={textareaRef}
          placeholder='Ask anything…'
          onSubmit={handleSubmit}
          onContentChange={handleContentChange}
          focused={!showDropdown}
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
        <text attributes={TextAttributes.DIM}>ctrl+c quit</text>
      </box>
    </box>
  );
}
