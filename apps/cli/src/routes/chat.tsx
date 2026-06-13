import { TextAttributes, type ScrollBoxRenderable } from '@opentui/core';
import { useTerminalDimensions, useKeyboard } from '@opentui/react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router';
import { createClient } from '@lightcode/api-client';
import type { SessionDetailResponse, MessageResponse } from '@lightcode/shared';
import type { ToolName } from '@lightcode/tools';
import { executeTool } from '../tools/index';
import { useGeneration } from '../contexts/generation';
import { useToast } from '../contexts/toast';

type AgentMessage =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string }
  | {
      role: 'assistant';
      content: Array<
        | { type: 'text'; text: string }
        | {
            type: 'tool-call';
            toolCallId: string;
            toolName: string;
            input: unknown;
          }
      >;
    }
  | {
      role: 'tool';
      content: Array<{
        type: 'tool-result';
        toolCallId: string;
        toolName: string;
        output: { type: 'text'; value: string };
      }>;
    };

function dbMessagesToAgentMessages(
  messages: MessageResponse[],
): AgentMessage[] {
  return messages.map((m) => {
    if (m.role === 'user') return { role: 'user' as const, content: m.content };
    return { role: 'assistant' as const, content: m.content };
  });
}

export function Chat() {
  const { id: urlSessionId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { width, height } = useTerminalDimensions();
  const { setUsage } = useGeneration();
  const { addToast } = useToast();
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [loading, setLoading] = useState(!!urlSessionId);
  const [error, setError] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState('New Chat');
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollboxRef = useRef<ScrollBoxRenderable>(null);
  const processedKeyRef = useRef<string | undefined>(undefined);
  const sessionIdRef = useRef<string | undefined>(urlSessionId);

  useKeyboard((key) => {
    const box = scrollboxRef.current;
    if (!box) return;
    if (key.name === 'pageup') box.scrollTop = Math.max(0, box.scrollTop - 10);
    if (key.name === 'pagedown') box.scrollTop = Math.min(box.scrollHeight, box.scrollTop + 10);
  });

  const containerWidth = Math.min(width - 8, 100);
  // 1 status-bar + 1 toast + 12 prompt-input + 4 paddingY + 1 title + 1 prompt + 1 gap
  const scrollboxHeight = Math.max(1, height - 21);

  useEffect(() => {
    sessionIdRef.current = urlSessionId;
    async function fetchSession() {
      if (!urlSessionId) {
        setMessages([]);
        setSessionTitle('New Chat');
        setCurrentPrompt('');
        setLoading(false);
        return;
      }
      try {
        const client = createClient();
        const data: SessionDetailResponse =
          await client.getSession(urlSessionId);
        setMessages(data.messages);
        setSessionTitle(data.title);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      }
    }
    setLoading(!!urlSessionId);
    fetchSession();
  }, [urlSessionId]);

  const handleAgent = useCallback(
    async (prompt: string, priorMessages: MessageResponse[]) => {
      const tempUserId = `temp-user-${Date.now()}`;
      const tempAssistantId = `temp-assistant-${Date.now()}`;
      const client = createClient();

      setCurrentPrompt(prompt);
      setMessages((prev) => [
        ...prev,
        {
          id: tempUserId,
          role: 'user',
          content: prompt,
          createdAt: new Date().toISOString(),
        },
      ]);
      setIsStreaming(true);
      setUsage(null);

      // Build initial AI SDK message history
      let agentMessages: AgentMessage[] = [
        ...dbMessagesToAgentMessages(priorMessages),
        { role: 'user', content: prompt },
      ];

      let displayContent = '';
      let finalSessionId: string | undefined;

      try {
        while (true) {
          let stepText = '';
          const toolCalls: Array<{
            id: string;
            name: string;
            input: unknown;
          }> = [];

          for await (const chunk of client.streamGenerate(agentMessages)) {
            if (chunk.type === 'text') {
              stepText += chunk.delta;
              displayContent += chunk.delta;
              setMessages((prev) => {
                const filtered = prev.filter((m) => m.id !== tempAssistantId);
                return [
                  ...filtered,
                  {
                    id: tempAssistantId,
                    role: 'assistant',
                    content: displayContent,
                    createdAt: new Date().toISOString(),
                  },
                ];
              });
            } else if (chunk.type === 'tool_call') {
              toolCalls.push({
                id: chunk.id,
                name: chunk.name,
                input: chunk.input,
              });
              displayContent += `\n\n⚙ ${chunk.name}(${JSON.stringify(chunk.input, null, 0)})`;
              setMessages((prev) => {
                const filtered = prev.filter((m) => m.id !== tempAssistantId);
                return [
                  ...filtered,
                  {
                    id: tempAssistantId,
                    role: 'assistant',
                    content: displayContent,
                    createdAt: new Date().toISOString(),
                  },
                ];
              });
            } else if (chunk.type === 'usage') {
              setUsage((prev) => {
                const next = {
                  promptTokens: chunk.promptTokens,
                  completionTokens: chunk.completionTokens,
                  totalTokens: chunk.totalTokens,
                  cost: chunk.cost ?? undefined,
                };
                if (!prev) return next;
                return {
                  promptTokens: prev.promptTokens + next.promptTokens,
                  completionTokens: prev.completionTokens + next.completionTokens,
                  totalTokens: prev.totalTokens + next.totalTokens,
                  cost: (prev.cost ?? 0) + (next.cost ?? 0),
                };
              });
            }
          }

          if (toolCalls.length === 0) {
            break;
          }

          // Append assistant turn with tool calls to agent history
          const assistantContent: AgentMessage & { role: 'assistant' } = {
            role: 'assistant',
            content: [
              ...(stepText ? [{ type: 'text' as const, text: stepText }] : []),
              ...toolCalls.map((tc) => ({
                type: 'tool-call' as const,
                toolCallId: tc.id,
                toolName: tc.name,
                input: tc.input,
              })),
            ],
          };
          agentMessages = [...agentMessages, assistantContent];

          // Execute tools and collect results
          const toolResults = await Promise.all(
            toolCalls.map(async (tc) => {
              let output: string;
              try {
                output = await executeTool(tc.name as ToolName, tc.input);
              } catch (err) {
                output = `Error: ${err instanceof Error ? err.message : String(err)}`;
              }

              displayContent += `\n  → ${output.slice(0, 120)}${output.length > 120 ? '…' : ''}`;
              setMessages((prev) => {
                const filtered = prev.filter((m) => m.id !== tempAssistantId);
                return [
                  ...filtered,
                  {
                    id: tempAssistantId,
                    role: 'assistant',
                    content: displayContent,
                    createdAt: new Date().toISOString(),
                  },
                ];
              });

              return {
                type: 'tool-result' as const,
                toolCallId: tc.id,
                toolName: tc.name,
                output: { type: 'text' as const, value: output },
              };
            }),
          );

          displayContent += '\n';
          agentMessages = [
            ...agentMessages,
            { role: 'tool', content: toolResults },
          ];
        }

        // Persist final user + assistant messages
        const { sessionId } = await client.finalizeSession({
          sessionId: sessionIdRef.current,
          userContent: prompt,
          assistantContent: displayContent,
        });
        sessionIdRef.current = sessionId;
        finalSessionId = sessionId;

        // Refresh display from DB
        const data = await client.getSession(sessionId);
        setMessages(data.messages);
        setSessionTitle(data.title);
        addToast('Session saved', 'success');
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempAssistantId),
          {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: `Error: ${message}`,
            createdAt: new Date().toISOString(),
          },
        ]);
        addToast(message, 'error');
      }

      setIsStreaming(false);

      // Update URL to /chat/:id so follow-up messages work
      if (finalSessionId && !urlSessionId) {
        navigate(`/chat/${finalSessionId}`, { replace: true });
      }
    },
    [navigate, urlSessionId, addToast],
  );

  // Handle incoming prompt from global input
  useEffect(() => {
    const state = location.state as { prompt?: string } | null;
    const prompt = state?.prompt;
    if (!prompt || isStreaming || processedKeyRef.current === location.key)
      return;

    processedKeyRef.current = location.key;
    handleAgent(prompt, messages);
  }, [location.state, location.key, isStreaming, handleAgent, messages]);

  // Auto-scroll to bottom on every message update and streaming chunks
  useEffect(() => {
    const scrollbox = scrollboxRef.current;
    if (scrollbox) {
      scrollbox.scrollTop = scrollbox.scrollHeight;
    }
  }, [messages, isStreaming]);

  if (loading) {
    return (
      <box flexDirection='column' flexGrow={1} alignItems='center' paddingY={2}>
        <box flexDirection='column' width={containerWidth} flexGrow={1} gap={1}>
          <text attributes={TextAttributes.DIM}>Loading session...</text>
        </box>
      </box>
    );
  }

  if (error) {
    return (
      <box flexDirection='column' flexGrow={1} alignItems='center' paddingY={2}>
        <box flexDirection='column' width={containerWidth} flexGrow={1} gap={1}>
          <text fg='red'>Error: {error}</text>
        </box>
      </box>
    );
  }

  return (
    <box flexDirection='column' flexGrow={1} alignItems='center' paddingY={2}>
      <box flexDirection='column' width={containerWidth} flexGrow={1} gap={1}>
        <box
          flexDirection='row'
          justifyContent='space-between'
          alignItems='center'
        >
          <text fg='cyan' attributes={TextAttributes.BOLD}>
            {sessionTitle}
          </text>
          {isStreaming && (
            <text fg='yellow' attributes={TextAttributes.DIM}>
              thinking…
            </text>
          )}
        </box>

        {currentPrompt ? (
          <text attributes={TextAttributes.DIM}>
            {currentPrompt.length > 60
              ? currentPrompt.slice(0, 60) + '…'
              : currentPrompt}
          </text>
        ) : null}

        <scrollbox ref={scrollboxRef} height={scrollboxHeight}>
          <box flexDirection='column' gap={1}>
            {messages.map((message) => (
              <box key={message.id} flexDirection='row'>
                <box
                  width={1}
                  backgroundColor={
                    message.role === 'user' ? '#4FC3F7' : '#666666'
                  }
                />
                <box
                  flexGrow={1}
                  flexDirection='column'
                  paddingX={1}
                  paddingY={1}
                  backgroundColor={
                    message.role === 'user' ? '#333333' : '#2d3748'
                  }
                >
                  <box flexDirection='row' gap={1} marginBottom={1}>
                    <text
                      fg={message.role === 'user' ? '#4FC3F7' : '#e2e8f0'}
                      attributes={TextAttributes.BOLD}
                    >
                      {message.role === 'user' ? 'You' : 'Assistant'}
                    </text>
                  </box>
                  <text
                    wrapMode='word'
                    fg={message.role === 'assistant' ? '#e2e8f0' : undefined}
                  >
                    {message.content}
                  </text>
                </box>
              </box>
            ))}
          </box>
        </scrollbox>
      </box>
    </box>
  );
}
