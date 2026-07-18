'use client'

import React, { useMemo, useRef, useState } from 'react'
import { colors, radius, typography, animation } from '@/design-system'
import { Button, Icon, StatusPill, Badge, Avatar } from '@/components/atoms'
import { Card, SectionLabel } from '@/components/molecules'
import { parseCSV } from '@/utils/csv'
import {
    suggestMappingAction,
    processUploadAction,
    getUploadPeriodsAction,
    getUploadMatchPreviewAction,
} from '@/app/actions/managerUploadActions'
import { addCriterionToGoalAction } from '@/app/actions/goalActions'
import {
    SKIP_COLUMN,
    type UploadGoalSummary,
    type UploadPeriod,
    type MappingSuggestion,
    type ProcessUploadResult,
    type RowMatchPreview,
    type UploadRosterEmployee,
} from '@/app/actions/managerUploadShared'

const ADD_NEW_CRITERION = '__add_new__'
const importanceTargetWeight = { low: 10, medium: 15, high: 22, critical: 33 }
const importanceStyle = {
    low:      { border: colors.text3,  bg: 'rgba(84,93,115,.18)',   text: colors.text2,  label: 'Low' },
    medium:   { border: '#f59e0b',     bg: 'rgba(245,158,11,.12)',  text: '#f59e0b',     label: 'Medium' },
    high:     { border: colors.accent, bg: colors.accentGlow,       text: colors.accent, label: 'High' },
    critical: { border: '#f04438',     bg: 'rgba(240,68,56,.15)',   text: '#f04438',     label: 'Critical' },
}

type Step = 'pick-goal' | 'pick-period' | 'upload' | 'match-check' | 'confirm' | 'results'

interface Props {
    goals: UploadGoalSummary[]
    loadError: string | null
}

export function UploadDataView({ goals, loadError }: Props) {
    const [step, setStep] = useState<Step>('pick-goal')
    const [goalId, setGoalId] = useState<string | null>(null)
    const [periods, setPeriods] = useState<UploadPeriod[]>([])
    const [periodsLoading, setPeriodsLoading] = useState(false)
    const [periodKey, setPeriodKey] = useState<string | null>(null)
    const [fileName, setFileName] = useState<string | null>(null)
    const [headers, setHeaders] = useState<string[]>([])
    const [rows, setRows] = useState<string[][]>([])
    const [mapping, setMapping] = useState<{ header: string; criterion: string }[]>([])
    const [busy, setBusy] = useState(false)
    const [err, setErr] = useState<string | null>(null)
    const [results, setResults] = useState<ProcessUploadResult | null>(null)
    const [effectiveCriteria, setEffectiveCriteria] = useState<{ id: string; name: string; weight: number }[] | null>(null)
    const [addCritModal, setAddCritModal] = useState<{ header: string } | null>(null)
    const [matchPreview, setMatchPreview] = useState<RowMatchPreview[]>([])
    const [roster, setRoster] = useState<UploadRosterEmployee[]>([])
    const [overrides, setOverrides] = useState<Record<number, string>>({})
    const [matchLoading, setMatchLoading] = useState(false)

    const goal = useMemo(() => goals.find(g => g.id === goalId) || null, [goals, goalId])
    const selectedPeriod = useMemo(() => periods.find(p => p.key === periodKey) || null, [periods, periodKey])
    const displayGoal = useMemo(
        () => goal && effectiveCriteria ? { ...goal, criteria: effectiveCriteria } : goal,
        [goal, effectiveCriteria],
    )
    const tangibleGoals = goals.filter(g => g.kind === 'tangible')
    const intangibleGoals = goals.filter(g => g.kind === 'intangible')

    function reset() {
        setStep('pick-goal')
        setGoalId(null)
        setPeriods([])
        setPeriodKey(null)
        setFileName(null)
        setHeaders([])
        setRows([])
        setMapping([])
        setErr(null)
        setResults(null)
        setEffectiveCriteria(null)
        setAddCritModal(null)
        setMatchPreview([])
        setRoster([])
        setOverrides({})
    }

    // Goal chosen → load the goal's open reporting periods, then move to the period step.
    async function handleGoalNext() {
        if (!goalId) return
        setErr(null)
        setPeriodsLoading(true)
        const res = await getUploadPeriodsAction(goalId)
        setPeriodsLoading(false)
        if ('error' in res) {
            setErr(res.error)
            return
        }
        setPeriods(res.periods)
        setPeriodKey(null)
        setStep('pick-period')
    }

    async function handleFile(file: File) {
        setErr(null)
        try {
            const text = await file.text()
            const parsed = parseCSV(text)
            if (parsed.headers.length < 2) {
                setErr('CSV must have at least 2 columns: agent identifier and one criterion column.')
                return
            }
            if (parsed.rows.length === 0) {
                setErr('CSV has no data rows.')
                return
            }
            setFileName(file.name)
            setHeaders(parsed.headers)
            setRows(parsed.rows)
            setOverrides({})

            // Run the identifier match check up front so mismatches surface before
            // any row is scored, not after — in parallel with mapping resolution.
            // Resolves to the matches so we can decide whether to interrupt.
            setMatchLoading(true)
            const matchPromise = getUploadMatchPreviewAction({
                goalId: goal!.id, periodKey: periodKey!, headers: parsed.headers, rows: parsed.rows,
            }).then((res): RowMatchPreview[] => {
                setMatchLoading(false)
                if ('error' in res) {
                    setMatchPreview([])
                    setRoster([])
                    return []
                }
                setMatchPreview(res.matches)
                setRoster(res.roster)
                return res.matches
            })

            // If a saved mapping exists, prefill straight away — same column names → reuse.
            const saved = goal?.savedMapping
            const dataHeaders = parsed.headers.slice(1)
            if (saved) {
                const next = dataHeaders.map(h => {
                    const prev = saved.columns.find(c => c.header === h)
                    return { header: h, criterion: prev?.criterion ?? SKIP_COLUMN }
                })
                setMapping(next)
                setStep(await nextStepAfterMatch(matchPromise))
                return
            }

            // Otherwise ask Gemini.
            setBusy(true)
            const suggest = await suggestMappingAction({ goalId: goal!.id, headers: parsed.headers })
            setBusy(false)
            if ('error' in suggest) {
                // Gemini occasionally returns non-JSON; fall back to all-skip silently.
                setMapping(dataHeaders.map(h => ({ header: h, criterion: SKIP_COLUMN })))
            } else {
                setMapping(suggest.suggestions.map((s: MappingSuggestion) => ({
                    header: s.header, criterion: s.suggestedCriterion,
                })))
            }
            setStep(await nextStepAfterMatch(matchPromise))
        } catch (e: any) {
            setBusy(false)
            setMatchLoading(false)
            setErr(e?.message || 'Could not read file')
        }
    }

    // Only stop at the match-check step when there's something the manager can
    // actually fix there — an unmatched row. If every identifier resolved (exact
    // or via a saved alias), skip straight to mapping; any not-scheduled /
    // already-reported rows are reported at the end anyway.
    async function nextStepAfterMatch(matchPromise: Promise<RowMatchPreview[]>): Promise<Step> {
        const matches = await matchPromise
        return matches.some(m => m.status === 'unmatched') ? 'match-check' : 'confirm'
    }

    async function handleConfirm() {
        if (!goal || !periodKey) return
        setBusy(true)
        setErr(null)
        const res = await processUploadAction({
            goalId: goal.id,
            periodKey,
            headers,
            rows,
            mapping,
            identifierOverrides: overrides,
        })
        setBusy(false)
        setResults(res)
        if (!res.success && res.error) setErr(res.error)
        setStep('results')
    }

    async function handleAddCriterion(name: string, importance: 'low' | 'medium' | 'high' | 'critical', targetDescription: string) {
        if (!goal || !addCritModal) return
        const res = await addCriterionToGoalAction({ goalId: goal.id, name, importance, target_description: targetDescription })
        if ('error' in res) {
            setErr(res.error)
            setAddCritModal(null)
            return
        }
        setEffectiveCriteria(res.criteria)
        const trimmedName = name.trim()
        setMapping(prev => prev.map(m => m.header === addCritModal.header ? { ...m, criterion: trimmedName } : m))
        setAddCritModal(null)
    }

    // ─────────────────────────────────────────────────────────────────────
    // Step renderers
    // ─────────────────────────────────────────────────────────────────────

    const stepperLabels: { id: Step; label: string }[] = [
        { id: 'pick-goal', label: '1. Select goal' },
        { id: 'pick-period', label: '2. Select period' },
        { id: 'upload', label: '3. Upload CSV' },
        { id: 'match-check', label: '4. Check matches' },
        { id: 'confirm', label: '5. Confirm mapping' },
        { id: 'results', label: '6. Results' },
    ]
    const stepOrder: Step[] = ['pick-goal', 'pick-period', 'upload', 'match-check', 'confirm', 'results']

    return (
        <div style={{ padding: '24px', maxWidth: '980px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                    <h1 style={{
                        fontFamily: typography.fonts.display,
                        fontSize: '22px',
                        fontWeight: typography.weight.bold,
                        color: colors.text,
                        margin: 0,
                        letterSpacing: '-0.3px',
                    }}>
                        Submit
                    </h1>
                    <div style={{ color: colors.text2, fontSize: '13px', marginTop: '4px' }}>
                        Bring in your team&apos;s numbers from a spreadsheet. Each row becomes a report and gets scored the same way as a self-submitted one.
                    </div>
                </div>
                {step !== 'pick-goal' && (
                    <Button variant="secondary" size="sm" onClick={reset}>Start over</Button>
                )}
            </div>

            {/* Stepper */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '20px',
                padding: '10px 14px',
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.md,
            }}>
                {stepperLabels.map(s => {
                    const isCurrent = s.id === step
                    const isDone = stepOrder.indexOf(s.id) < stepOrder.indexOf(step)
                    return (
                        <div key={s.id} style={{
                            flex: 1,
                            fontSize: '12px',
                            fontWeight: typography.weight.semibold,
                            color: isCurrent ? colors.accent : isDone ? colors.text2 : colors.text3,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}>
                            {isDone ? <Icon name="check" size={12} color={colors.green} /> : null}
                            {s.label}
                        </div>
                    )
                })}
            </div>

            {loadError && (
                <ErrorBanner message={loadError} />
            )}
            {err && <ErrorBanner message={err} />}

            {step === 'pick-goal' && (
                <PickGoalStep
                    goals={goals}
                    tangibleGoals={tangibleGoals}
                    intangibleGoals={intangibleGoals}
                    selectedId={goalId}
                    onSelect={setGoalId}
                    onNext={handleGoalNext}
                    loading={periodsLoading}
                />
            )}

            {step === 'pick-period' && goal && (
                <PickPeriodStep
                    goal={goal}
                    periods={periods}
                    selectedKey={periodKey}
                    onSelect={setPeriodKey}
                    onNext={() => setStep('upload')}
                    onBack={() => setStep('pick-goal')}
                />
            )}

            {step === 'upload' && goal && (
                <UploadStep
                    goal={goal}
                    period={selectedPeriod}
                    busy={busy}
                    onFile={handleFile}
                    onBack={() => setStep('pick-period')}
                />
            )}

            {step === 'match-check' && goal && (
                <MatchCheckStep
                    matches={matchPreview}
                    roster={roster}
                    overrides={overrides}
                    onOverride={(rowIndex, employeeId) => setOverrides(prev => ({ ...prev, [rowIndex]: employeeId }))}
                    loading={matchLoading}
                    onNext={() => setStep('confirm')}
                    onBack={() => setStep('upload')}
                />
            )}

            {step === 'confirm' && goal && (
                <ConfirmStep
                    goal={displayGoal ?? goal}
                    fileName={fileName}
                    headers={headers}
                    rowCount={rows.length}
                    mapping={mapping}
                    onChange={setMapping}
                    busy={busy}
                    onConfirm={handleConfirm}
                    onBack={() => setStep(matchPreview.some(m => m.status === 'unmatched') ? 'match-check' : 'upload')}
                    onAddNew={(header) => setAddCritModal({ header })}
                />
            )}

            {addCritModal && (
                <AddCriterionModal
                    header={addCritModal.header}
                    currentCriteria={displayGoal?.criteria ?? goal?.criteria ?? []}
                    onConfirm={handleAddCriterion}
                    onCancel={() => setAddCritModal(null)}
                />
            )}

            {step === 'results' && results && (
                <ResultsStep results={results} onDone={reset} />
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
    return (
        <div style={{
            background: colors.dangerGlow,
            border: `1px solid ${colors.danger}`,
            color: colors.danger,
            padding: '10px 14px',
            borderRadius: radius.md,
            fontSize: '13px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
        }}>
            <Icon name="alert" size={14} color={colors.danger} />
            {message}
        </div>
    )
}

function PickGoalStep({
    goals, tangibleGoals, intangibleGoals, selectedId, onSelect, onNext, loading,
}: {
    goals: UploadGoalSummary[]
    tangibleGoals: UploadGoalSummary[]
    intangibleGoals: UploadGoalSummary[]
    selectedId: string | null
    onSelect: (id: string) => void
    onNext: () => void
    loading: boolean
}) {
    if (goals.length === 0) {
        return (
            <Card title="No goals available" icon="goals">
                <div style={{ color: colors.text2, fontSize: '13px' }}>
                    Create an active goal in a project before uploading data. Tangible goals use weekly or
                    bi-weekly project frequency; intangible goals use monthly.
                </div>
            </Card>
        )
    }
    return (
        <>
            {tangibleGoals.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                    <SectionLabel>Tangible — weekly or bi-weekly</SectionLabel>
                    <GoalGrid goals={tangibleGoals} selectedId={selectedId} onSelect={onSelect} />
                </div>
            )}
            {intangibleGoals.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                    <SectionLabel>Intangible — monthly</SectionLabel>
                    <GoalGrid goals={intangibleGoals} selectedId={selectedId} onSelect={onSelect} />
                </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <Button onClick={onNext} disabled={!selectedId} loading={loading} icon="chevronRight">Next</Button>
            </div>
        </>
    )
}

function PickPeriodStep({
    goal, periods, selectedKey, onSelect, onNext, onBack,
}: {
    goal: UploadGoalSummary
    periods: UploadPeriod[]
    selectedKey: string | null
    onSelect: (key: string) => void
    onNext: () => void
    onBack: () => void
}) {
    const freq = (goal.reportFrequency || 'weekly').toLowerCase()
    const selectedPeriod = periods.find(p => p.key === selectedKey) || null
    return (
        <Card title="Which period are these numbers for?" subtitle={`${goal.name} · ${goal.projectName}`} icon="calendar">
            {/* Plain-language definition, anchored to this goal's own cadence */}
            <div style={{
                background: colors.surface2,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.md,
                padding: '12px 14px',
                marginBottom: '14px',
                fontSize: '12px',
                color: colors.text2,
                lineHeight: 1.6,
            }}>
                This goal reports <strong style={{ color: colors.text }}>{freq}</strong>, so Zevian tracks it in{' '}
                <strong style={{ color: colors.text }}>{freq} periods</strong> — each one is a single {freq === 'weekly' ? 'week' : freq === 'monthly' ? 'month' : 'cycle'} that a report covers.
                Pick the period your spreadsheet is for; you upload one period at a time.
                <br />
                <span style={{ color: colors.text3 }}>
                    Select a period to see exactly who still needs a report — those are the ones this upload can fill.
                </span>
            </div>

            {periods.length === 0 ? (
                <div style={{
                    background: colors.surface2,
                    border: `1px dashed ${colors.borderDashed}`,
                    borderRadius: radius.md,
                    padding: '24px',
                    textAlign: 'center',
                    color: colors.text3,
                    fontSize: '13px',
                }}>
                    No open periods for this goal right now. Either every agent already has a report for each
                    period, or this goal hasn&apos;t started its {freq} reporting yet.
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                    {periods.map(p => {
                        const isSelected = p.key === selectedKey
                        return (
                            <button
                                key={p.key}
                                onClick={() => onSelect(p.key)}
                                style={{
                                    textAlign: 'left',
                                    background: isSelected ? colors.accentGlow : colors.surface,
                                    border: `1px solid ${isSelected ? colors.accentBorder : colors.border}`,
                                    borderRadius: radius.md,
                                    padding: '14px 16px',
                                    cursor: 'pointer',
                                    color: colors.text,
                                    transition: `all ${animation.fast}`,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Icon name="calendar" size={14} color={isSelected ? colors.accent : colors.text3} />
                                    <span style={{ fontSize: '13px', fontWeight: typography.weight.semibold }}>{p.label}</span>
                                </div>
                                <div style={{ color: colors.text3, fontSize: '12px', marginTop: '6px' }}>
                                    {p.openCount} of {p.totalCount} still to report
                                </div>
                            </button>
                        )
                    })}
                </div>
            )}

            {selectedPeriod && selectedPeriod.openEmployees.length > 0 && (
                <OpenEmployeesPanel period={selectedPeriod} />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                <Button variant="secondary" size="sm" onClick={onBack}>Back</Button>
                <Button onClick={onNext} disabled={!selectedKey} icon="chevronRight">Next</Button>
            </div>
        </Card>
    )
}

// Full, named list of who still owes a report for the chosen period. Scrolls
// past ~a dozen so a large team stays contained.
function OpenEmployeesPanel({ period }: { period: UploadPeriod }) {
    return (
        <div style={{
            marginTop: '14px',
            background: colors.surface2,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.md,
            padding: '12px 14px',
        }}>
            <div style={{
                fontSize: '11px',
                fontWeight: typography.weight.semibold,
                color: colors.text3,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '10px',
            }}>
                Still to report · {period.label} ({period.openEmployees.length})
            </div>
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                maxHeight: '168px',
                overflowY: 'auto',
            }}>
                {period.openEmployees.map(e => (
                    <div key={e.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                        padding: '4px 10px 4px 4px',
                        background: colors.surface,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '999px',
                    }}>
                        <Avatar name={e.name} src={e.avatarUrl} size="sm" />
                        <span style={{ fontSize: '12px', color: colors.text }}>{e.name}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

function GoalGrid({
    goals, selectedId, onSelect,
}: { goals: UploadGoalSummary[]; selectedId: string | null; onSelect: (id: string) => void }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
            {goals.map(g => {
                const isSelected = g.id === selectedId
                return (
                    <button
                        key={g.id}
                        onClick={() => onSelect(g.id)}
                        style={{
                            textAlign: 'left',
                            background: isSelected ? colors.accentGlow : colors.surface,
                            border: `1px solid ${isSelected ? colors.accentBorder : colors.border}`,
                            borderRadius: radius.md,
                            padding: '14px 16px',
                            cursor: 'pointer',
                            color: colors.text,
                            transition: `all ${animation.fast}`,
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <div style={{ fontSize: '13px', fontWeight: typography.weight.semibold }}>
                                {g.name}
                            </div>
                            <Badge>{g.reportFrequency}</Badge>
                        </div>
                        <div style={{ color: colors.text3, fontSize: '12px', marginTop: '4px' }}>
                            {g.projectName} · {g.criteria.length} criteria
                            {g.savedMapping ? ' · mapping saved' : ''}
                        </div>
                    </button>
                )
            })}
        </div>
    )
}

function UploadStep({
    goal, period, busy, onFile, onBack,
}: { goal: UploadGoalSummary; period: UploadPeriod | null; busy: boolean; onFile: (f: File) => void; onBack: () => void }) {
    const [dragOver, setDragOver] = useState(false)
    const inputRef = useRef<HTMLInputElement | null>(null)

    function openPicker() {
        if (busy) return
        inputRef.current?.click()
    }

    const subtitle = period
        ? `${goal.projectName} · period ${period.label}`
        : `${goal.projectName} · ${goal.reportFrequency}`

    return (
        <Card title={goal.name} subtitle={subtitle} icon="goals">
            <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                style={{ display: 'none' }}
                onChange={e => {
                    const file = e.target.files?.[0]
                    // Reset so the same file can be picked again after a back-and-forth.
                    e.target.value = ''
                    if (file) onFile(file)
                }}
            />

            <div
                role="button"
                tabIndex={0}
                aria-disabled={busy}
                onClick={openPicker}
                onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openPicker()
                    }
                }}
                onDragOver={e => { e.preventDefault(); if (!dragOver) setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => {
                    e.preventDefault()
                    setDragOver(false)
                    const file = e.dataTransfer.files?.[0]
                    if (file) onFile(file)
                }}
                style={{
                    border: `1px dashed ${dragOver ? colors.accent : colors.borderDashed}`,
                    background: dragOver ? colors.accentGlow : colors.surface2,
                    borderRadius: radius.md,
                    padding: '32px',
                    textAlign: 'center',
                    transition: `all ${animation.fast}`,
                    cursor: busy ? 'wait' : 'pointer',
                    outline: 'none',
                }}
            >
                <Icon name="fileText" size={28} color={colors.text3} />
                <div style={{ fontSize: '14px', color: colors.text, marginTop: '10px', fontWeight: typography.weight.semibold }}>
                    Drag a CSV here, or click to browse
                </div>
                <div style={{ fontSize: '12px', color: colors.text3, marginTop: '4px' }}>
                    One row per agent{period ? ` for ${period.label}` : ''}. Column 1 = agent name or email. Remaining columns = your KPI values. No date column needed.
                </div>
                <div style={{ marginTop: '16px' }}>
                    <Button
                        variant="secondary"
                        loading={busy}
                        onClick={e => { e.stopPropagation(); openPicker() }}
                    >
                        {busy ? 'Reading…' : 'Choose CSV'}
                    </Button>
                </div>
                {goal.savedMapping && (
                    <div style={{ marginTop: '14px', fontSize: '11px', color: colors.text2 }}>
                        A saved mapping exists for this goal. It will pre-fill the confirmation step.
                    </div>
                )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                <Button variant="secondary" size="sm" onClick={onBack}>Back</Button>
            </div>
        </Card>
    )
}

const matchStatusStyle: Record<RowMatchPreview['status'], { bg: string; border: string; text: string; label: string }> = {
    'ok':               { bg: 'rgba(34,197,94,.12)',  border: colors.green,  text: colors.green,  label: 'Will import' },
    'unmatched':        { bg: 'rgba(240,68,56,.12)',  border: colors.danger, text: colors.danger, label: 'No match' },
    'no-period':        { bg: 'rgba(245,158,11,.12)', border: '#f59e0b',     text: '#f59e0b',     label: 'Not scheduled' },
    'already-reported': { bg: 'rgba(245,158,11,.12)', border: '#f59e0b',     text: '#f59e0b',     label: 'Already reported' },
}

function MatchCheckStep({
    matches, roster, overrides, onOverride, loading, onNext, onBack,
}: {
    matches: RowMatchPreview[]
    roster: UploadRosterEmployee[]
    overrides: Record<number, string>
    onOverride: (rowIndex: number, employeeId: string) => void
    loading: boolean
    onNext: () => void
    onBack: () => void
}) {
    const resolvedCount = matches.filter(m => m.status === 'ok' || overrides[m.rowIndex]).length
    const attentionCount = matches.length - resolvedCount

    return (
        <Card title="Check agent matches" subtitle="Every row is checked against your roster before anything is scored" icon="check">
            {loading ? (
                <div style={{ padding: '24px', textAlign: 'center', color: colors.text3, fontSize: '13px' }}>
                    Checking rows against your roster…
                </div>
            ) : (
                <>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '12px',
                        marginBottom: '16px',
                    }}>
                        <KpiTile label="Will import" value={resolvedCount} tint={colors.green} />
                        <KpiTile label="Need attention" value={attentionCount} tint={attentionCount > 0 ? colors.warn : colors.text3} />
                    </div>

                    <div style={{ display: 'grid', gap: '6px', marginBottom: '16px' }}>
                        {matches.map(m => {
                            const overrideId = overrides[m.rowIndex]
                            const isResolved = m.status === 'ok' || !!overrideId
                            const style = matchStatusStyle[m.status]
                            return (
                                <div key={m.rowIndex} style={{
                                    display: 'grid',
                                    gridTemplateColumns: '48px 1fr auto',
                                    gap: '10px',
                                    alignItems: 'center',
                                    padding: '8px 12px',
                                    background: colors.surface2,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: radius.md,
                                }}>
                                    <div style={{ fontSize: '11px', color: colors.text3, fontFamily: typography.fonts.mono }}>
                                        Row {m.displayRow}
                                    </div>
                                    <div style={{ fontSize: '12px', color: colors.text }}>
                                        <span>{m.agentIdentifier || '—'}</span>
                                        {overrideId ? (
                                            <span style={{ color: colors.green }}>
                                                {' '}→ assigned to {roster.find(r => r.id === overrideId)?.name ?? overrideId}
                                            </span>
                                        ) : m.reason ? (
                                            <span style={{ color: colors.text3 }}> · {m.reason}</span>
                                        ) : m.matchedEmployeeName ? (
                                            <span style={{ color: colors.text3 }}> · matched {m.matchedEmployeeName}</span>
                                        ) : null}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {!isResolved && (
                                            <select
                                                value={overrideId ?? ''}
                                                onChange={e => { if (e.target.value) onOverride(m.rowIndex, e.target.value) }}
                                                style={{
                                                    background: colors.surface,
                                                    color: colors.text,
                                                    border: `1px solid ${colors.border}`,
                                                    borderRadius: radius.md,
                                                    padding: '5px 8px',
                                                    fontSize: '12px',
                                                    fontFamily: typography.fonts.body,
                                                }}
                                            >
                                                <option value="">Assign to…</option>
                                                {roster.map(r => (
                                                    <option key={r.id} value={r.id}>{r.name}</option>
                                                ))}
                                            </select>
                                        )}
                                        <span style={{
                                            fontSize: '11px',
                                            fontWeight: typography.weight.semibold,
                                            color: isResolved ? colors.green : style.text,
                                            background: isResolved ? 'rgba(34,197,94,.12)' : style.bg,
                                            border: `1px solid ${isResolved ? colors.green : style.border}`,
                                            borderRadius: radius.sm,
                                            padding: '3px 8px',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {isResolved ? 'Will import' : style.label}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                        {matches.length === 0 && (
                            <div style={{ color: colors.text3, fontSize: '13px', padding: '12px 0' }}>No rows to check.</div>
                        )}
                    </div>
                </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button variant="secondary" size="sm" onClick={onBack}>Back</Button>
                <Button onClick={onNext} disabled={loading} icon="chevronRight">
                    {attentionCount > 0 ? `Continue (${attentionCount} will be skipped)` : 'Continue'}
                </Button>
            </div>
        </Card>
    )
}

function ConfirmStep({
    goal, fileName, headers, rowCount, mapping, onChange, busy, onConfirm, onBack, onAddNew,
}: {
    goal: UploadGoalSummary
    fileName: string | null
    headers: string[]
    rowCount: number
    mapping: { header: string; criterion: string }[]
    onChange: (m: { header: string; criterion: string }[]) => void
    busy: boolean
    onConfirm: () => void
    onBack: () => void
    onAddNew: (header: string) => void
}) {
    const dataHeaders = headers.slice(1)
    function setForHeader(header: string, criterion: string) {
        onChange(mapping.map(m => m.header === header ? { ...m, criterion } : m))
    }
    const criterionOptions = goal.criteria.map(c => c.name)

    return (
        <Card title="Confirm column mapping" subtitle={`${fileName ?? 'uploaded file'} · ${rowCount} rows`} icon="sparkles">
            <div style={{ color: colors.text2, fontSize: '12px', marginBottom: '14px' }}>
                The first column is the agent identifier and can't be changed. Map each remaining column to a criterion.
            </div>

            {/* Fixed system column */}
            <div style={{ marginBottom: '16px', display: 'grid', gap: '8px' }}>
                <FixedRow header={headers[0]} label="Agent identifier (name or email)" />
            </div>

            <SectionLabel>Criteria columns ({dataHeaders.length})</SectionLabel>
            <div style={{ display: 'grid', gap: '8px', marginBottom: '20px' }}>
                {dataHeaders.map((h) => {
                    const entry = mapping.find(m => m.header === h)
                    const current = entry?.criterion ?? SKIP_COLUMN
                    return (
                        <div key={h} style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr auto 1fr',
                            gap: '12px',
                            alignItems: 'center',
                            background: colors.surface2,
                            border: `1px solid ${colors.border}`,
                            padding: '10px 12px',
                            borderRadius: radius.md,
                        }}>
                            <div style={{ fontSize: '13px', color: colors.text }}>{h}</div>
                            <Icon name="chevronRight" size={14} color={colors.text3} />
                            <select
                                value={current}
                                onChange={e => {
                                    if (e.target.value === ADD_NEW_CRITERION) {
                                        onAddNew(h)
                                        return
                                    }
                                    setForHeader(h, e.target.value)
                                }}
                                style={{
                                    background: colors.surface,
                                    color: colors.text,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: radius.md,
                                    padding: '8px 10px',
                                    fontSize: '13px',
                                    fontFamily: typography.fonts.body,
                                }}
                            >
                                <option value={SKIP_COLUMN}>— Do not import —</option>
                                {criterionOptions.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                                <option value={ADD_NEW_CRITERION}>+ Add as new criterion…</option>
                            </select>
                        </div>
                    )
                })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button variant="secondary" size="sm" onClick={onBack}>Back</Button>
                <Button onClick={onConfirm} loading={busy} icon="check">
                    {busy ? 'Processing…' : `Process ${rowCount} rows`}
                </Button>
            </div>
        </Card>
    )
}

function FixedRow({ header, label }: { header: string; label: string }) {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: '12px',
            alignItems: 'center',
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            padding: '10px 12px',
            borderRadius: radius.md,
            opacity: 0.85,
        }}>
            <div style={{ fontSize: '13px', color: colors.text2 }}>{header}</div>
            <Icon name="chevronRight" size={14} color={colors.text3} />
            <div style={{
                fontSize: '12px',
                color: colors.text3,
                fontStyle: 'italic',
            }}>{label}</div>
        </div>
    )
}

function ResultsStep({ results, onDone }: { results: ProcessUploadResult; onDone: () => void }) {
    return (
        <Card
            title="Upload results"
            subtitle={results.processedPeriodLabel ? `Period ${results.processedPeriodLabel}` : undefined}
            icon="check"
        >
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                marginBottom: '16px',
            }}>
                <KpiTile label="Reports created" value={results.created} tint={colors.green} />
                <KpiTile label="Rows skipped" value={results.skipped} tint={results.skipped > 0 ? colors.warn : colors.text3} />
            </div>

            {results.rows.length > 0 && (
                <>
                    <SectionLabel>Row outcomes</SectionLabel>
                    <div style={{ display: 'grid', gap: '6px', marginBottom: '16px' }}>
                        {results.rows.map(r => (
                            <div key={r.rowIndex} style={{
                                display: 'grid',
                                gridTemplateColumns: '48px 1fr auto',
                                gap: '10px',
                                alignItems: 'center',
                                padding: '8px 12px',
                                background: colors.surface2,
                                border: `1px solid ${colors.border}`,
                                borderRadius: radius.md,
                            }}>
                                <div style={{ fontSize: '11px', color: colors.text3, fontFamily: typography.fonts.mono }}>
                                    Row {r.rowIndex}
                                </div>
                                <div style={{ fontSize: '12px', color: colors.text }}>
                                    <span>{r.assignedName || r.agentIdentifier || '—'}</span>
                                    {r.assignedName && r.agentIdentifier && r.assignedName !== r.agentIdentifier && (
                                        <span style={{ color: colors.text3 }}> · from “{r.agentIdentifier}”</span>
                                    )}
                                    <span style={{ color: colors.text3 }}> · {r.periodInput || '—'}</span>
                                    {r.reason && (
                                        <span style={{ color: colors.text3 }}> · {r.reason}</span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {r.status === 'created' && r.score != null && (
                                        <span style={{ fontSize: '12px', color: colors.text2 }}>
                                            score {r.score.toFixed(1)}
                                        </span>
                                    )}
                                    <StatusPill status={r.status === 'created' ? 'reviewed' : 'no-data'}>
                                        {r.status === 'created' ? 'Created' : 'Skipped'}
                                    </StatusPill>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={onDone}>Upload another</Button>
            </div>
        </Card>
    )
}

function KpiTile({ label, value, tint }: { label: string; value: number; tint: string }) {
    return (
        <div style={{
            background: colors.surface2,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.md,
            padding: '14px 16px',
        }}>
            <div style={{
                fontSize: '11px',
                color: colors.text3,
                fontWeight: typography.weight.semibold,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
            }}>
                {label}
            </div>
            <div style={{
                fontFamily: typography.fonts.display,
                fontSize: '28px',
                fontWeight: typography.weight.bold,
                color: tint,
                marginTop: '4px',
            }}>
                {value}
            </div>
        </div>
    )
}

function AddCriterionModal({
    header,
    currentCriteria,
    onConfirm,
    onCancel,
}: {
    header: string
    currentCriteria: { name: string; weight: number }[]
    onConfirm: (name: string, importance: 'low' | 'medium' | 'high' | 'critical', targetDescription: string) => Promise<void>
    onCancel: () => void
}) {
    const [name, setName] = React.useState(header)
    const [importance, setImportance] = React.useState<'low' | 'medium' | 'high' | 'critical'>('medium')
    const [targetDescription, setTargetDescription] = React.useState('')
    const [busy, setBusy] = React.useState(false)

    // Live weight preview using same formula as the server action.
    const newCritWeight = importanceTargetWeight[importance]
    const scaleRatio = (100 - newCritWeight) / 100
    const previewRows = [
        ...currentCriteria.map(c => ({ name: c.name, weight: Math.round(c.weight * scaleRatio), isNew: false })),
        { name: name.trim() || header, weight: newCritWeight, isNew: true },
    ]
    const previewSum = previewRows.reduce((s, r) => s + r.weight, 0)
    if (previewSum !== 100 && previewRows.length > 0) {
        previewRows[previewRows.length - 1].weight += (100 - previewSum)
    }

    async function handleConfirm() {
        if (!name.trim()) return
        setBusy(true)
        await onConfirm(name, importance, targetDescription)
        setBusy(false)
    }

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(4px)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: 440,
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radius.md,
                    overflow: 'hidden',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
                }}
            >
                {/* Header */}
                <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontFamily: typography.fonts.display, fontSize: '15px', fontWeight: 700, color: colors.text }}>
                            Add new criterion
                        </div>
                        <div style={{ fontSize: '12px', color: colors.text3, marginTop: '2px', lineHeight: 1.5 }}>
                            This criterion will be added to the KPI and all weights rebalance to 100%.
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        style={{ width: 28, height: 28, borderRadius: '7px', background: colors.surface2, border: `1px solid ${colors.border}`, cursor: 'pointer', color: colors.text3, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                    >
                        <Icon name="x" size={12} />
                    </button>
                </div>

                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Name */}
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: colors.text2, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '6px' }}>
                            Criterion name
                        </div>
                        <input
                            autoFocus
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && name.trim()) handleConfirm() }}
                            style={{
                                width: '100%',
                                padding: '9px 12px',
                                background: colors.surface2,
                                border: `1px solid ${colors.border}`,
                                borderRadius: radius.md,
                                fontSize: '13px',
                                color: colors.text,
                                fontFamily: typography.fonts.display,
                                outline: 'none',
                                boxSizing: 'border-box' as const,
                            }}
                        />
                    </div>

                    {/* Importance */}
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: colors.text2, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '6px' }}>
                            Level of importance
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {(['low', 'medium', 'high', 'critical'] as const).map(lvl => {
                                const s = importanceStyle[lvl]
                                const active = importance === lvl
                                return (
                                    <button
                                        key={lvl}
                                        onClick={() => setImportance(lvl)}
                                        style={{
                                            flex: 1,
                                            padding: '7px 4px',
                                            borderRadius: radius.md,
                                            border: `1.5px solid ${active ? s.border : colors.border}`,
                                            background: active ? s.bg : colors.surface2,
                                            color: active ? s.text : colors.text3,
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: `all ${animation.fast}`,
                                            fontFamily: typography.fonts.display,
                                        }}
                                    >
                                        {s.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Target description */}
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: colors.text2, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '6px' }}>
                            Target (optional, but recommended for KPI scoring)
                        </div>
                        <textarea
                            value={targetDescription}
                            onChange={e => setTargetDescription(e.target.value)}
                            placeholder="e.g. Target: 35+ sits per week. Below 30 is underperforming."
                            rows={2}
                            style={{
                                width: '100%',
                                padding: '9px 12px',
                                background: colors.surface2,
                                border: `1px solid ${colors.border}`,
                                borderRadius: radius.md,
                                fontSize: '12px',
                                color: colors.text,
                                fontFamily: typography.fonts.display,
                                outline: 'none',
                                resize: 'none',
                                boxSizing: 'border-box' as const,
                            }}
                        />
                        <div style={{ fontSize: '11px', color: colors.text3, marginTop: '4px', lineHeight: 1.4 }}>
                            Without a target, uploaded values for this criterion can&apos;t be scored against a threshold.
                        </div>
                    </div>

                    {/* Weight preview */}
                    <div style={{ background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: '12px 14px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: '8px' }}>
                            Weight preview after adding
                        </div>
                        {previewRows.map((r, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '5px 0',
                                borderBottom: i < previewRows.length - 1 ? `1px solid ${colors.border}` : 'none',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: r.isNew ? colors.accent : colors.text2, fontWeight: r.isNew ? 600 : 400 }}>
                                    {r.isNew && (
                                        <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '3px', background: colors.accentGlow, color: colors.accent, fontWeight: 700, letterSpacing: '0.05em' }}>NEW</span>
                                    )}
                                    {r.name || '(unnamed)'}
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: r.isNew ? colors.accent : colors.text3, fontFamily: typography.fonts.display }}>
                                    {r.weight}%
                                </div>
                            </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', marginTop: '2px', borderTop: `1px solid ${colors.border}` }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: colors.text3 }}>Total</div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: colors.green }}>100%</div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '12px 20px 18px', display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: `1px solid ${colors.border}` }}>
                    <Button variant="secondary" size="sm" onClick={onCancel} disabled={busy}>Cancel</Button>
                    <Button size="sm" onClick={handleConfirm} loading={busy} disabled={!name.trim() || busy} icon="plus">
                        Add criterion
                    </Button>
                </div>
            </div>
        </div>
    )
}
