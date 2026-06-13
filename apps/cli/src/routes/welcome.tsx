import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { TextAttributes } from '@opentui/core';
import { createClient } from '@lightcode/api-client';
import type { SessionResponse } from '@lightcode/shared';
import { Banner } from '../components/banner';

export function Welcome() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const client = createClient();
        const data = await client.listSessions();
        setSessions(data);
      } catch {
        // silently ignore — server may not be running yet
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, []);

  function handleSelect(
    _index: number,
    option: { name: string; value?: string } | null,
  ) {
    if (!option?.value) return;
    navigate(`/chat/${option.value}`);
  }

  const options = sessions.map((session) => ({
    name: session.title,
    description: new Date(session.updatedAt).toLocaleString(),
    value: session.id,
  }));

  return (
    <box flexDirection='column' flexGrow={1} alignItems='center' paddingY={2} gap={2}>
      <Banner />

      {!loading && sessions.length === 0 && (
        <text attributes={TextAttributes.DIM}>
          Type a prompt below to start a new conversation.
        </text>
      )}

      {!loading && sessions.length > 0 && (
        <box flexDirection='column' gap={1} width={60}>
          <text fg='cyan' attributes={TextAttributes.BOLD}>
            Recent Sessions
          </text>
          <select
            options={options}
            onSelect={handleSelect}
            focused
            height={12}
            showScrollIndicator
          />
          <text attributes={TextAttributes.DIM}>
            ↵ open session · type a prompt to start new
          </text>
        </box>
      )}

      {loading && (
        <text attributes={TextAttributes.DIM}>Loading sessions...</text>
      )}
    </box>
  );
}
