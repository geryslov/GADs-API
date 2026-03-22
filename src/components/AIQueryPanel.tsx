import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Sparkles, Code2, ChevronDown, ChevronUp, Table2, Download } from 'lucide-react'
import type { QueryResult } from '../types'
import { exportCsv } from '../utils/exportCsv'

const SUGGESTIONS = [
  'Show me search terms wasting budget (high cost, no conversions)',
  'Which campaigns have the best CTR?',
  'What are my top keywords by spend this week?',
  'Show campaigns with the highest cost per conversion',
  'Which ad groups have the lowest conversion rate?',
  'What should I pause and why?',
]

interface Message {
  role: 'user' | 'assistant'
  content: string
  result?: QueryResult
  error?: string
}

// Minimal markdown renderer: bold, italics, inline code, line breaks
function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />

        // Heading
        if (line.startsWith('### ')) return <p key={i} className="text-slate-100 font-semibold text-sm">{renderInline(line.slice(4))}</p>
        if (line.startsWith('## ')) return <p key={i} className="text-slate-100 font-semibold">{renderInline(line.slice(3))}</p>

        // Bullet
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2 text-sm text-slate-300">
              <span className="text-slate-500 mt-0.5 flex-shrink-0">•</span>
              <span>{renderInline(line.slice(2))}</span>
            </div>
          )
        }

        return <p key={i} className="text-sm text-slate-300 leading-relaxed">{renderInline(line)}</p>
      })}
    </div>
  )
}

function renderInline(text: string): React.ReactNode {
  // Split by **bold**, *italic*, `code`
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-slate-100 font-semibold">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="font-mono text-xs bg-slate-700 text-blue-300 px-1 py-0.5 rounded">{part.slice(1, -1)}</code>
    }
    return part
  })
}

function ResultTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows.length) return <p className="text-slate-500 text-xs">No rows returned.</p>
  const keys = Object.keys(rows[0])
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-600">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-700/60 border-b border-slate-600">
            {keys.map((k) => (
              <th key={k} className="text-left text-slate-400 px-3 py-1.5 uppercase tracking-wider whitespace-nowrap">
                {k.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20">
              {keys.map((k) => (
                <td key={k} className="px-3 py-1.5 text-slate-200 font-mono whitespace-nowrap">
                  {String(row[k] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AssistantMessage({ result, error }: { result?: QueryResult; error?: string }) {
  const [showTable, setShowTable] = useState(false)
  const [showGaql, setShowGaql] = useState(false)

  if (error) {
    return (
      <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg p-3">
        {error}
      </div>
    )
  }
  if (!result) return null

  return (
    <div className="space-y-3">
      {/* The actual Claude answer */}
      <MarkdownText text={result.answer} />

      {/* Secondary: collapsible data + GAQL */}
      <div className="flex items-center gap-3 pt-1 flex-wrap">
        {result.rows.length > 0 && (
          <button
            onClick={() => setShowTable(!showTable)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Table2 size={12} />
            {showTable ? 'Hide' : 'Show'} data ({result.count} rows)
            {showTable ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        )}
        {result.rows.length > 0 && (
          <button
            onClick={() => exportCsv(result.rows, `query-${Date.now()}`)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-green-400 transition-colors"
          >
            <Download size={12} />
            Export CSV
          </button>
        )}
        <button
          onClick={() => setShowGaql(!showGaql)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <Code2 size={12} />
          {showGaql ? 'Hide' : 'Show'} query
          {showGaql ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>
      </div>

      {showTable && <ResultTable rows={result.rows} />}

      {showGaql && (
        <pre className="text-xs font-mono bg-slate-900 border border-slate-700 rounded-lg p-3 text-blue-300 overflow-x-auto whitespace-pre-wrap">
          {result.gaql}
        </pre>
      )}
    </div>
  )
}

interface Props {
  accountId: string
  accountName: string
  onQuery: (accountId: string, accountName: string, question: string) => Promise<void>
  loading: boolean
  result: QueryResult | null
  error: string | null
  onReset: () => void
}

export function AIQueryPanel({ accountId, accountName, onQuery, loading, result, error, onReset }: Props) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const submit = async (question: string) => {
    if (!question.trim() || loading) return
    setMessages((prev) => [...prev, { role: 'user', content: question }])
    setInput('')
    onReset()
    await onQuery(accountId, accountName, question)
  }

  useEffect(() => {
    if (!loading && (result || error)) {
      setMessages((prev) => {
        if (prev[prev.length - 1]?.role === 'assistant') return prev
        return [...prev, { role: 'assistant', content: '', result: result ?? undefined, error: error ?? undefined }]
      })
    }
  }, [loading, result, error])

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit(input)
    }
  }

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-700 rounded-xl overflow-hidden h-full min-h-[420px]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700 bg-slate-800/50 flex-shrink-0">
        <Sparkles size={14} className="text-blue-400" />
        <span className="text-sm font-medium text-slate-200">Ask about {accountName}</span>
        {messages.length > 0 && (
          <button
            onClick={() => { setMessages([]); onReset() }}
            className="ml-auto text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-slate-500 text-sm">Ask anything about this account in plain English.</p>
            <div className="grid gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="text-left text-xs text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg px-3 py-2 transition-all cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'user' ? (
              <div className="bg-blue-600/20 border border-blue-600/30 rounded-xl rounded-tr-sm px-3 py-2 max-w-[90%]">
                <p className="text-sm text-blue-100">{msg.content}</p>
              </div>
            ) : (
              <div className="bg-slate-800 border border-slate-700 rounded-xl rounded-tl-sm px-3 py-3 w-full">
                <AssistantMessage result={msg.result} error={msg.error} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-slate-700 rounded-xl rounded-tl-sm px-3 py-2.5 flex items-center gap-2">
              <Loader2 size={13} className="animate-spin text-blue-400" />
              <span className="text-xs text-slate-400">Fetching data &amp; analyzing…</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-700 p-3 bg-slate-800/30 flex-shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask a question… (Enter to send)"
            rows={2}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            onClick={() => submit(input)}
            disabled={!input.trim() || loading}
            className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors flex-shrink-0 cursor-pointer"
          >
            {loading ? <Loader2 size={16} className="animate-spin text-white" /> : <Send size={16} className="text-white" />}
          </button>
        </div>
      </div>
    </div>
  )
}
