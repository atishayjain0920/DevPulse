import { useMutation, useQuery } from "@tanstack/react-query";
import { Bot, Send } from "lucide-react";
import { FormEvent, useState } from "react";
import { api } from "../app/api";
import { Badge, Button, Card, LoadingState } from "../components/ui";

type WeeklySummary = { disclaimer: string; sections: Record<string, string | string[]> };
type ChatResponse = { answer: string; links: string[]; disclaimer: string };

export function AiPage() {
  const [messages, setMessages] = useState<Array<{ sender: "user" | "assistant"; content: string }>>([]);
  const [question, setQuestion] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["weekly-summary"], queryFn: () => api<WeeklySummary>("/ai/weekly-summary") });
  const chat = useMutation({
    mutationFn: (body: { question: string }) => api<ChatResponse>("/ai/chat", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (response) => setMessages((items) => [...items, { sender: "assistant", content: response.answer }])
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!question.trim()) return;
    setMessages((items) => [...items, { sender: "user", content: question }]);
    chat.mutate({ question });
    setQuestion("");
  }

  if (isLoading || !data) return <LoadingState label="Loading AI intelligence" />;

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <h1>AI Assistant</h1>
          <p>Answers are grounded in structured analytics, not repository source code.</p>
        </div>
        <Badge tone="info">Provider agnostic</Badge>
      </div>
      <div className="grid chat-layout">
        <Card title="Conversation">
          <div className="chat-window">
            {messages.length === 0 && <p className="lead">Ask about stale pull requests, failed builds, repository churn, or weekly engineering activity.</p>}
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.sender}`}>
                <Bot size={16} />
                <span>{message.content}</span>
              </div>
            ))}
          </div>
          <form className="chat-form" onSubmit={submit}>
            <input value={question} onChange={(event) => setQuestion(event.target.value)} aria-label="Ask DevPulse AI" />
            <Button type="submit">
              <Send size={16} /> Send
            </Button>
          </form>
        </Card>
        <Card title="Weekly Summary">
          {Object.entries(data.sections).map(([key, value]) => (
            <p key={key}><strong>{key}:</strong> {Array.isArray(value) ? value.join(", ") : value}</p>
          ))}
          <small>{data.disclaimer}</small>
        </Card>
      </div>
    </div>
  );
}
