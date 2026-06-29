'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { colors, typography, radius, animation, shadows, aiGradient, gradientBorderBackground } from '@/design-system'
import { Icon } from '@/components/atoms'
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

// Chat bubble — reference Ask recipe. Model answers carry their citations *inside* the bubble
// as fileText pills (each links to the cited report), exactly as the reference renders them.
function MessageBubble({ msg }: { msg: AskMessage }) {
    const isUser = msg.role === 'user'
    const cites = msg.citations
    return (
        <div style={{
            display: 'flex',
            justifyContent: isUser ? 'flex-end' : 'flex-start',
            marginBottom: 12,
        }}>
            <div style={{
                maxWidth: '78%',
                padding: '11px 15px',
                borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: isUser ? colors.accent : colors.surface2,
                color: colors.text,
                fontSize: '13.5px',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                border: isUser ? 'none' : `1px solid ${colors.border}`,
            }}>
                {msg.text}
                {cites && cites.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                        <span style={{ fontSize: '10.5px', color: colors.text3, alignSelf: 'center' }}>Based on:</span>
                        {cites.map(c => (
                            <Link
                                key={c.reportId}
                                href={`/reports/${c.reportId}`}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    padding: '3px 9px',
                                    borderRadius: radius.full,
                                    border: `1px solid ${colors.border}`,
                                    background: colors.surface,
                                    color: colors.text2,
                                    fontSize: '10.5px',
                                    textDecoration: 'none',
                                }}
                            >
                                <Icon name="fileText" size={10} color={colors.text3} />
                                <span>{c.employeeName} · {fmtDate(c.date)}{c.goalName ? ` · ${c.goalName}` : ''}</span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// The conversational input — the reference AskBar: a pill with a real accent→teal gradient
// border (subtle at rest, strong + glow on focus), a teal sparkles glyph, and an accent send
// button. Suggestions echo the same gradient at lower intensity. Wraps a textarea so the
// product keeps multi-line + Enter-to-send / Shift+Enter behaviour.
function AskBar({ value, onChange, onSubmit, suggestions, loading, textareaRef }: {
    value: string
    onChange: (v: string) => void
    onSubmit: (v: string) => void
    suggestions?: string[]
    loading?: boolean
    textareaRef?: React.RefObject<HTMLTextAreaElement>
}) {
    const [focus, setFocus] = useState(false)
    const canSend = !!value.trim() && !loading
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 10,
                padding: '12px 14px',
                border: '1px solid transparent',
                borderRadius: radius.lg,
                background: gradientBorderBackground(focus ? aiGradient.strong : aiGradient.subtle, colors.surface),
                boxShadow: focus ? '0 0 24px rgba(91,127,255,0.12)' : 'none',
                transition: `box-shadow ${animation.base}`,
            }}>
                <span style={{ display: 'flex', flexShrink: 0, paddingBottom: 5 }}>
                    <Icon name="sparkles" size={18} color={colors.teal} />
                </span>
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onFocus={() => setFocus(true)}
                    onBlur={() => setFocus(false)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(value) }
                    }}
                    placeholder="Ask anything about your team…"
                    rows={1}
                    disabled={loading}
                    style={{
                        flex: 1,
                        background: 'none',
                        border: 'none',
                        outline: 'none',
                        resize: 'none',
                        color: colors.text,
                        fontSize: '14px',
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
                    onClick={() => onSubmit(value)}
                    disabled={!canSend}
                    aria-label="Ask"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        flexShrink: 0,
                        borderRadius: radius.md,
                        background: canSend ? colors.accent : colors.surface3,
                        border: 'none',
                        cursor: canSend ? 'pointer' : 'not-allowed',
                        boxShadow: canSend ? shadows.accentGlow : 'none',
                    }}
                >
                    <Icon name="arrowUp" size={16} color={canSend ? '#fff' : colors.text3} />
                </button>
            </div>
            {suggestions && suggestions.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {suggestions.map(s => (
                        <button
                            key={s}
                            onClick={() => onSubmit(s)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: radius.full,
                                border: '1px solid transparent',
                                background: gradientBorderBackground(aiGradient.subtle, colors.surface),
                                color: colors.text2,
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: `color ${animation.fast}`,
                            }}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}
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
                padding: isEmpty ? 0 : '24px',
                display: 'flex',
                flexDirection: 'column',
            }}>
                {isEmpty ? (
                    <div className="animate-fade-up" style={{ margin: 'auto', width: '100%', maxWidth: 560, padding: 24 }}>
                        {/* Teal sparkles tile — radius-lg, teal glow (the reference Ask mark) */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                            <div style={{
                                width: 52,
                                height: 52,
                                borderRadius: radius.lg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: colors.tealGlow,
                                border: '1px solid rgba(0,212,170,0.25)',
                            }}>
                                <Icon name="sparkles" size={24} color={colors.teal} />
                            </div>
                        </div>

                        <h2 style={{
                            fontFamily: typography.fonts.display,
                            fontSize: 20,
                            fontWeight: 800,
                            textAlign: 'center',
                            letterSpacing: '-0.3px',
                            color: colors.text,
                            margin: '0 0 6px',
                        }}>
                            Ask about your team
                        </h2>
                        <p style={{ fontSize: 13, color: colors.text3, textAlign: 'center', margin: '0 0 22px', lineHeight: 1.6 }}>
                            Grounded in every report your team has submitted. Answers cite the reports they used.
                        </p>

                        <AskBar
                            value={question}
                            onChange={setQuestion}
                            onSubmit={submit}
                            suggestions={suggestions}
                            loading={loading}
                            textareaRef={textareaRef}
                        />
                    </div>
                ) : (
                    <div style={{ maxWidth: 720, margin: '0 auto', width: '100%' }}>
                        {messages.map((msg, i) => {
                            if (msg.role === 'user') return <MessageBubble key={i} msg={msg} />
                            return (
                                <div key={i}>
                                    {msg.resolvedScope && (
                                        <ScopeLine ctx={ctx} scope={msg.resolvedScope} prominent={!!msg.scopeChanged} />
                                    )}
                                    <MessageBubble msg={msg} />
                                </div>
                            )
                        })}
                        {loading && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: colors.text3, fontSize: 13, marginBottom: 12 }}>
                                <Icon name="sparkles" size={14} color={colors.teal} /> Reading reports…
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
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* ── Input bar — only once the thread has started; in the empty state the AskBar is
                centred above. Mirrors the reference's 720px-wide footer AskBar. */}
            {!isEmpty && (
                <div style={{
                    flexShrink: 0,
                    padding: '14px 24px',
                    borderTop: `1px solid ${colors.border}`,
                    background: colors.surface,
                }}>
                    <div style={{ maxWidth: 720, margin: '0 auto' }}>
                        <AskBar
                            value={question}
                            onChange={setQuestion}
                            onSubmit={submit}
                            loading={loading}
                            textareaRef={textareaRef}
                        />
                    </div>
                </div>
            )}
        </div>
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
