'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { colors, typography, radius } from '@/design-system'
import { askQuestionAction } from '@/app/actions/askActions'
import type { AskContext, AskScope, AskMessage, AskSession } from '@/app/actions/askActions'

interface Props {
    initialContext: AskContext
    initialSession: AskSession | null
}

function todayStr() {
    return new Date().toISOString().slice(0, 10)
}
function daysAgoStr(n: number) {
    const d = new Date()
    d.setDate(d.getDate() - n)
    return d.toISOString().slice(0, 10)
}

function defaultScope(): AskScope {
    return {
        employeeIds: [],
        startDate: daysAgoStr(30),
        endDate: todayStr(),
        goalId: null,
    }
}

function getSuggestions(ctx: AskContext, scope: AskScope): string[] {
    if (scope.employeeIds.length === 1) {
        const emp = ctx.employees.find(e => e.id === scope.employeeIds[0])
        const name = emp?.name || 'this employee'
        return [
            `How is ${name} performing overall?`,
            `What are ${name}'s weakest criteria?`,
            `Has ${name} improved compared to earlier?`,
            `What coaching would you suggest for ${name}?`,
        ]
    }
    return [
        'Who has the highest average score this period?',
        'Which criteria have the lowest scores across the team?',
        'Who might benefit most from coaching right now?',
        'Give me an overview of team performance.',
    ]
}

function fmtDate(s: string): string {
    const d = new Date(s + 'T00:00:00')
    if (isNaN(d.getTime())) return s
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

function formatScope(ctx: AskContext, s: AskScope): string {
    const who = s.employeeIds.length === 0
        ? 'All employees'
        : s.employeeIds.map(id => ctx.employees.find(e => e.id === id)?.name || 'Unknown').join(', ')
    const range = `${fmtDate(s.startDate)} to ${fmtDate(s.endDate)}`
    const goal = s.goalId ? ctx.goals.find(g => g.id === s.goalId)?.name : null
    return [who, range, goal].filter(Boolean).join(', ')
}

function scopeEq(a: AskScope, b: AskScope): boolean {
    return a.startDate === b.startDate &&
        a.endDate === b.endDate &&
        (a.goalId ?? null) === (b.goalId ?? null) &&
        a.employeeIds.length === b.employeeIds.length &&
        a.employeeIds.every(id => b.employeeIds.includes(id))
}

function ScopeLine({ ctx, scope, prominent }: { ctx: AskContext; scope: AskScope; prominent: boolean }) {
    return (
        <div style={{
            margin: '0 0 8px 2px',
            fontSize: prominent ? typography.size.sm : typography.size.xs,
            color: prominent ? colors.text2 : colors.text3,
            fontWeight: prominent ? 600 : 400,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
        }}>
            <span style={{ color: colors.text3, fontWeight: 400 }}>Showing:</span>
            <span>{formatScope(ctx, scope)}</span>
        </div>
    )
}

function Citations({ citations }: { citations: NonNullable<AskMessage['citations']> }) {
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '8px 0 16px 2px', maxWidth: '78%' }}>
            <span style={{ fontSize: typography.size.xs, color: colors.text3, alignSelf: 'center', marginRight: 2 }}>
                Based on:
            </span>
            {citations.map(c => (
                <Link
                    key={c.reportId}
                    href={`/reports/${c.reportId}`}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '3px 9px',
                        borderRadius: 20,
                        border: `1px solid ${colors.border}`,
                        background: colors.surface,
                        color: colors.text2,
                        fontSize: typography.size.xs,
                        textDecoration: 'none',
                        transition: 'border-color 0.15s, color 0.15s',
                    }}
                >
                    <svg viewBox="0 0 16 16" fill="none" width={11} height={11} style={{ flexShrink: 0 }}>
                        <path d="M4 2h5l4 4v8H4z" stroke={colors.text3} strokeWidth="1.3" strokeLinejoin="round" />
                        <path d="M9 2v4h4" stroke={colors.text3} strokeWidth="1.3" strokeLinejoin="round" />
                    </svg>
                    <span>{c.employeeName} · {fmtDate(c.date)}{c.goalName ? ` · ${c.goalName}` : ''}</span>
                </Link>
            ))}
        </div>
    )
}

interface MessageBubbleProps {
    msg: AskMessage
}

function MessageBubble({ msg }: MessageBubbleProps) {
    const isUser = msg.role === 'user'
    return (
        <div style={{
            display: 'flex',
            justifyContent: isUser ? 'flex-end' : 'flex-start',
            marginBottom: 12,
        }}>
            <div style={{
                maxWidth: '78%',
                padding: '10px 14px',
                borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: isUser ? colors.accent : colors.surface2,
                color: colors.text,
                fontSize: typography.size.base,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                border: isUser ? 'none' : `1px solid ${colors.border}`,
            }}>
                {msg.text}
            </div>
        </div>
    )
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function AskView({ initialContext, initialSession }: Props) {
    const ctx = initialContext
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    // An incoming question (?q=) always takes precedence and starts a clean thread; only
    // when there's no incoming question do we restore the prior session (filters + thread).
    const hasIncomingQ = !!searchParams.get('q')?.trim()

    // Seed the scope from incoming URL params so the dashboard (or any deep link) can
    // hand Ask a known employee / date range / scorecard without re-resolving it.
    const scopeFromParams = (): AskScope => {
        const employee = searchParams.get('employee')
        const start = searchParams.get('start')
        const end = searchParams.get('end')
        const goal = searchParams.get('goal')
        const base = defaultScope()
        return {
            employeeIds: employee && ctx.employees.some(e => e.id === employee) ? [employee] : base.employeeIds,
            startDate: start && DATE_RE.test(start) ? start : base.startDate,
            endDate: end && DATE_RE.test(end) ? end : base.endDate,
            goalId: goal && ctx.goals.some(g => g.id === goal) ? goal : base.goalId,
        }
    }

    const initialScope = (): AskScope => {
        if (!hasIncomingQ && initialSession) return initialSession.scope
        return scopeFromParams()
    }

    const [scope, setScopeRaw] = useState<AskScope>(initialScope)
    const [messages, setMessages] = useState<AskMessage[]>(
        !hasIncomingQ && initialSession ? initialSession.messages : []
    )
    const [question, setQuestion] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    function setScope(next: AskScope) {
        setScopeRaw(next)
        setMessages([])
        setError(null)
    }

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading])

    const submit = useCallback(async (q: string) => {
        const text = q.trim()
        if (!text || loading) return

        const userMsg: AskMessage = { role: 'user', text }
        setMessages(prev => [...prev, userMsg])
        setQuestion('')
        setLoading(true)
        setError(null)

        const result = await askQuestionAction({
            question: text,
            history: messages,
            scope,
            context: ctx,
        })

        setLoading(false)

        if ('error' in result) {
            setError(result.error)
            return
        }

        const scopeChanged = result.resolvedScope ? !scopeEq(scope, result.resolvedScope) : false
        setMessages(prev => [...prev, {
            role: 'model',
            text: result.answer,
            resolvedScope: result.resolvedScope,
            citations: result.citations,
            scopeChanged,
        }])

        // Update scope to what Gemini resolved (now surfaced via the "Showing:" line)
        if (result.resolvedScope) {
            setScopeRaw(result.resolvedScope)
        }
    }, [loading, messages, scope, ctx])

    // Auto-submit an initial question handed in via the URL (?q=…), once, on mount.
    const didAutoSubmit = useRef(false)
    useEffect(() => {
        if (didAutoSubmit.current) return
        const q = searchParams.get('q')
        if (q && q.trim()) {
            didAutoSubmit.current = true
            submit(q)
            // Consume the incoming question by stripping ?q from the URL. Otherwise the q
            // lingers for the whole session, and navigating back here (Back button or the
            // sidebar) would re-treat it as a fresh incoming question — restarting a clean
            // thread with only this one question and dropping any follow-ups. With q removed,
            // a return lands as plain entry and restores the full thread from the log.
            const params = new URLSearchParams(searchParams.toString())
            params.delete('q')
            const qs = params.toString()
            router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
        }
    }, [searchParams, submit, router, pathname])

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit(question)
        }
    }

    const selectedEmployee = scope.employeeIds.length === 1
        ? ctx.employees.find(e => e.id === scope.employeeIds[0])
        : null

    const suggestions = getSuggestions(ctx, scope)
    const isEmpty = messages.length === 0

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: colors.bg,
        }}>
            {/* ── Scope filter bar ─────────────────────────────────────── */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 20px',
                borderBottom: `1px solid ${colors.border}`,
                background: colors.surface,
                flexShrink: 0,
                flexWrap: 'wrap',
            }}>
                <span style={{ fontSize: typography.size.sm, color: colors.text3, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Scope
                </span>

                {/* Employee selector */}
                <select
                    value={scope.employeeIds.length === 1 ? scope.employeeIds[0] : ''}
                    onChange={e => setScope({
                        ...scope,
                        employeeIds: e.target.value ? [e.target.value] : [],
                        goalId: null,
                    })}
                    style={selectStyle}
                >
                    <option value="">All employees</option>
                    {ctx.employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                </select>

                <span style={{ color: colors.text3, fontSize: typography.size.sm }}>from</span>
                <input
                    type="date"
                    value={scope.startDate}
                    max={scope.endDate}
                    onChange={e => setScope({ ...scope, startDate: e.target.value })}
                    style={dateInputStyle}
                />
                <span style={{ color: colors.text3, fontSize: typography.size.sm }}>to</span>
                <input
                    type="date"
                    value={scope.endDate}
                    min={scope.startDate}
                    max={todayStr()}
                    onChange={e => setScope({ ...scope, endDate: e.target.value })}
                    style={dateInputStyle}
                />

                {/* Goal selector — only when 1 employee selected */}
                {selectedEmployee && ctx.goals.length > 0 && (
                    <>
                        <span style={{ color: colors.text3, fontSize: typography.size.sm }}>KPI</span>
                        <select
                            value={scope.goalId ?? ''}
                            onChange={e => setScope({ ...scope, goalId: e.target.value || null })}
                            style={selectStyle}
                        >
                            <option value="">All KPIs</option>
                            {ctx.goals.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </>
                )}

                {/* Reset link */}
                {(scope.employeeIds.length > 0 || scope.goalId || scope.startDate !== daysAgoStr(30) || scope.endDate !== todayStr()) && (
                    <button
                        onClick={() => setScope(defaultScope())}
                        style={{
                            marginLeft: 'auto',
                            background: 'none',
                            border: 'none',
                            color: colors.text3,
                            fontSize: typography.size.sm,
                            cursor: 'pointer',
                            padding: '2px 6px',
                        }}
                    >
                        Reset
                    </button>
                )}
            </div>

            {/* ── Messages area ────────────────────────────────────────── */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
            }}>
                {isEmpty ? (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 24,
                        paddingBottom: 40,
                    }}>
                        {/* Prompt icon */}
                        <div style={{
                            width: 52,
                            height: 52,
                            borderRadius: '50%',
                            background: colors.accentGlow,
                            border: `1px solid ${colors.accentBorder}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <svg viewBox="0 0 20 20" fill="none" width={22} height={22} stroke={colors.accent} strokeWidth="1.6">
                                <circle cx="10" cy="10" r="8" />
                                <path d="M7.5 8c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5c0 1.5-1.5 2-2.5 2.5" strokeLinecap="round" />
                                <circle cx="10" cy="14.5" r="0.75" fill={colors.accent} stroke="none" />
                            </svg>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: typography.size.xl, fontWeight: 600, color: colors.text, margin: '0 0 6px' }}>
                                Ask about your team
                            </p>
                            <p style={{ fontSize: typography.size.base, color: colors.text2, margin: 0 }}>
                                {scope.employeeIds.length === 1 && selectedEmployee
                                    ? `Viewing ${selectedEmployee.name} · ${scope.startDate} → ${scope.endDate}`
                                    : `Viewing all employees · ${scope.startDate} → ${scope.endDate}`}
                            </p>
                        </div>

                        {/* Suggested questions */}
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 8,
                            justifyContent: 'center',
                            maxWidth: 560,
                        }}>
                            {suggestions.map(s => (
                                <button
                                    key={s}
                                    onClick={() => submit(s)}
                                    style={{
                                        padding: '7px 14px',
                                        borderRadius: 20,
                                        border: `1px solid ${colors.border}`,
                                        background: colors.surface,
                                        color: colors.text2,
                                        fontSize: typography.size.sm,
                                        cursor: 'pointer',
                                        transition: 'border-color 0.15s, color 0.15s',
                                    }}
                                    onMouseEnter={e => {
                                        (e.target as HTMLButtonElement).style.borderColor = colors.accentBorder
                                        ;(e.target as HTMLButtonElement).style.color = colors.text
                                    }}
                                    onMouseLeave={e => {
                                        (e.target as HTMLButtonElement).style.borderColor = colors.border
                                        ;(e.target as HTMLButtonElement).style.color = colors.text2
                                    }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, i) => {
                            if (msg.role === 'user') return <MessageBubble key={i} msg={msg} />
                            return (
                                <div key={i}>
                                    {msg.resolvedScope && (
                                        <ScopeLine ctx={ctx} scope={msg.resolvedScope} prominent={!!msg.scopeChanged} />
                                    )}
                                    <MessageBubble msg={msg} />
                                    {msg.citations && msg.citations.length > 0 && (
                                        <Citations citations={msg.citations} />
                                    )}
                                </div>
                            )
                        })}
                        {loading && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
                                <div style={{
                                    padding: '10px 16px',
                                    borderRadius: '16px 16px 16px 4px',
                                    background: colors.surface2,
                                    border: `1px solid ${colors.border}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                }}>
                                    <ThinkingDots />
                                </div>
                            </div>
                        )}
                        {error && (
                            <div style={{
                                padding: '10px 14px',
                                borderRadius: radius.md,
                                background: colors.dangerGlow,
                                border: `1px solid ${colors.danger}33`,
                                color: colors.danger,
                                fontSize: typography.size.sm,
                                marginBottom: 12,
                            }}>
                                {error}
                            </div>
                        )}
                    </>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* ── Input bar ────────────────────────────────────────────── */}
            <div style={{
                padding: '12px 20px 16px',
                borderTop: `1px solid ${colors.border}`,
                background: colors.surface,
                flexShrink: 0,
            }}>
                <div style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-end',
                    background: colors.surface2,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radius.lg,
                    padding: '8px 8px 8px 14px',
                    transition: 'border-color 0.15s',
                }}>
                    <textarea
                        ref={textareaRef}
                        value={question}
                        onChange={e => setQuestion(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything about your team's performance…"
                        rows={1}
                        disabled={loading}
                        style={{
                            flex: 1,
                            background: 'none',
                            border: 'none',
                            outline: 'none',
                            resize: 'none',
                            color: colors.text,
                            fontSize: typography.size.base,
                            lineHeight: 1.6,
                            fontFamily: 'inherit',
                            maxHeight: 120,
                            overflow: 'auto',
                        }}
                        onInput={e => {
                            const el = e.target as HTMLTextAreaElement
                            el.style.height = 'auto'
                            el.style.height = Math.min(el.scrollHeight, 120) + 'px'
                        }}
                    />
                    <button
                        onClick={() => submit(question)}
                        disabled={!question.trim() || loading}
                        style={{
                            flexShrink: 0,
                            width: 34,
                            height: 34,
                            borderRadius: radius.md,
                            background: question.trim() && !loading ? colors.accent : colors.surface3,
                            border: 'none',
                            cursor: question.trim() && !loading ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.15s',
                        }}
                    >
                        <svg viewBox="0 0 16 16" fill="none" width={16} height={16}>
                            <path d="M2 8h12M8 2l6 6-6 6" stroke={question.trim() && !loading ? '#fff' : colors.text3} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: typography.size.xs, color: colors.text3, textAlign: 'center' }}>
                    Enter to send · Shift+Enter for new line
                </p>
            </div>
        </div>
    )
}

function ThinkingDots() {
    return (
        <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {[0, 1, 2].map(i => (
                <span
                    key={i}
                    style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: colors.text3,
                        display: 'inline-block',
                        animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }}
                />
            ))}
            <style>{`@keyframes pulse{0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}`}</style>
        </span>
    )
}

const selectStyle: React.CSSProperties = {
    background: colors.surface2,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    color: colors.text,
    fontSize: typography.size.sm,
    padding: '4px 8px',
    outline: 'none',
    cursor: 'pointer',
}

const dateInputStyle: React.CSSProperties = {
    background: colors.surface2,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    color: colors.text,
    fontSize: typography.size.sm,
    padding: '4px 8px',
    outline: 'none',
    colorScheme: 'dark',
}
