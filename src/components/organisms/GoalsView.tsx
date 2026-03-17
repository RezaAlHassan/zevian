'use client'

import { colors, radius, typography, animation, layout, shadows, getAvatarGradient, getInitials, getScoreColor } from '@/design-system'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import { ScoreDisplay } from '@/components/atoms/Score'
import { StatusPill } from '@/components/atoms/StatusPill'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AddGoalSheet } from '@/components/organisms/AddGoalSheet'
import { MetaSection } from '@/components/molecules'

import { deleteGoalAction, updateGoalStatusAction } from '@/app/actions/goalActions'

interface GoalsProps {
  goals: any[]
  projects: any[]
  employees: any[]
  readOnly?: boolean
  basePath?: string
}

export function GoalsView({ goals: initialGoals, projects, employees, readOnly = false, basePath = '/goals' }: GoalsProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'Table' | 'Grid'>('Table')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProject, setSelectedProject] = useState('All')
  const [isCompletedOpen, setIsCompletedOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  // Filter goals
  const activeGoals = initialGoals.filter(g => g.status !== 'completed' && g.status !== 'done')
  const completedGoals = initialGoals.filter(g => g.status === 'completed' || g.status === 'done')

  const filteredGoals = activeGoals.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesProject = selectedProject === 'All' || g.project?.name === selectedProject
    return matchesSearch && matchesProject
  })

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this goal?')) return

    setLoading(id)
    try {
      const res = await deleteGoalAction(id)
      if (res.success) {
        router.refresh()
      } else {
        alert(res.error || 'Failed to delete goal')
      }
    } finally {
      setLoading(null)
    }
  }

  const openEdit = (goal: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingGoal(goal)
    setIsAddOpen(true)
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.bg }}>

      <main style={{ padding: layout.contentPadding }}>
        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '24px' }}>
          {/* Left: Search & Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 12px',
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.md,
              width: '240px'
            }}>
              <Icon name="search" size={13} color={colors.text3} />
              <input
                type="text"
                placeholder="Search goals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: 'none', border: 'none', outline: 'none', fontSize: '13px', color: colors.text, width: '100%', fontFamily: typography.fonts.body }}
              />
            </div>

            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              style={{
                padding: '7px 12px',
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.md,
                fontSize: '12.5px',
                color: colors.text2,
                outline: 'none',
                cursor: 'pointer',
                fontFamily: typography.fonts.body
              }}
            >
              <option value="All">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>

          {/* Right: Count & View Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="font-numeric" style={{ fontSize: '12.5px', color: colors.text3, fontWeight: 500 }}>
              {filteredGoals.length} goals
            </div>

            {!readOnly && (
              <Button variant="primary" size="sm" onClick={() => setIsAddOpen(true)} icon="plus">
                New Goal
              </Button>
            )}

            <div style={{ display: 'flex', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: '2px', gap: '2px' }}>
              <button
                onClick={() => setViewMode('Grid')}
                title="Grid View"
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  background: viewMode === 'Grid' ? colors.surface2 : 'transparent',
                  color: viewMode === 'Grid' ? colors.accent : colors.text3,
                  border: 'none',
                  transition: `all ${animation.fast}`,
                }}
              >
                <Icon name="layoutGrid" size={14} />
              </button>
              <button
                onClick={() => setViewMode('Table')}
                title="Table View"
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  background: viewMode === 'Table' ? colors.surface2 : 'transparent',
                  color: viewMode === 'Table' ? colors.accent : colors.text3,
                  border: 'none',
                  transition: `all ${animation.fast}`,
                }}
              >
                <Icon name="list" size={14} />
              </button>
            </div>
          </div>
        </div>

        {filteredGoals.length === 0 ? (
          <div style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.xl,
            padding: '80px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{ width: '56px', height: '56px', borderRadius: radius.xl, background: colors.accentGlow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="target" size={24} color={colors.accent} />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: colors.text }}>No goals found</div>
              <div style={{ fontSize: '13.5px', color: colors.text3, marginTop: '4px' }}>Create your first goal to start tracking progress.</div>
            </div>
            {!readOnly && <Button variant="primary" icon="plus" onClick={() => setIsAddOpen(true)}>Create First Goal</Button>}
          </div>
        ) : viewMode === 'Table' ? (
          <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.xl, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  {['Goal', 'Project', 'Status', 'Criteria', 'Assigned To', 'Avg Score', 'Due', ''].map((h, idx) => (
                    <th key={h} style={{
                      padding: (idx === 0) ? '10px 20px' : '10px 14px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: colors.text3,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em'
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredGoals.map((goal, i) => (
                  <tr
                    key={goal.id}
                    onClick={() => router.push(`${basePath}/${goal.id}`)}
                    style={{ borderBottom: i === filteredGoals.length - 1 ? 'none' : `1px solid ${colors.border}`, cursor: 'pointer' }}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: typography.weight.semibold, fontSize: '13.5px', color: colors.text, letterSpacing: '-0.1px' }}>{goal.name}</div>
                      <div style={{ fontSize: '11.5px', color: colors.text3 }}><span style={{ fontFamily: typography.fonts.numeric, fontWeight: typography.weight.heavy, fontVariantNumeric: 'tabular-nums lining-nums' }}>{goal.report_count}</span> reports</div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: colors.surface2, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', color: colors.text2, width: 'fit-content', border: `1px solid ${colors.border}` }}>
                        <span>{goal.project?.emoji || '🖥️'}</span>
                        <span>{goal.project?.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <StatusPill status={goal.status} />
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '140px' }}>
                        {goal.criteria?.slice(0, 3).map((crit: any) => (
                          <div key={crit.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ fontSize: '10px', color: colors.text3, width: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{crit.name}</div>
                            <div style={{ flex: 1, height: '3px', background: colors.surface3, borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${crit.weight}%`, background: colors.accent }} />
                            </div>
                            <div style={{ fontSize: '10px', color: colors.text3, width: '25px', textAlign: 'right', fontFamily: typography.fonts.numeric, fontWeight: typography.weight.heavy }}>{crit.weight}%</div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex' }}>
                        {(goal.goal_members?.length > 0 ? goal.goal_members : (goal.project?.project_members || [])).map((m: any, i: number) => (
                          <div
                            key={i}
                            title={m.employee.full_name}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              background: getAvatarGradient(m.employee.full_name),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '9px',
                              fontWeight: 700,
                              color: '#fff',
                              border: `2px solid ${colors.surface}`,
                              marginLeft: i === 0 ? 0 : '-6px'
                            }}
                          >
                            {getInitials(m.employee.full_name)}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <ScoreDisplay score={goal.avg_score} size="sm" />
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '12px', color: colors.text3 }}>
                      {goal.deadline ? new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <Button variant="secondary" size="sm" onClick={() => router.push(`${basePath}/${goal.id}`)}>
                        {readOnly ? 'View' : 'Manage'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {filteredGoals.map(goal => (
              <div
                key={goal.id}
                onClick={() => router.push(`${basePath}/${goal.id}`)}
                style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.xl, overflow: 'hidden', cursor: 'pointer', transition: `all ${animation.fast}` }}
              >
                <div style={{ height: '4px', background: `linear-gradient(90deg, ${colors.accent}, ${colors.teal})` }} />
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontFamily: typography.fonts.display, fontSize: '15px', fontWeight: 700, color: colors.text }}>{goal.name}</div>
                      <div style={{ fontSize: '12px', color: colors.text3, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                        <span>{goal.project?.emoji}</span> {goal.project?.name}
                      </div>
                      <MetaSection 
                        items={[
                          {
                            icon: 'calendar',
                            text: `Created on ${goal.createdAt ? new Date(goal.createdAt).toLocaleDateString() : '—'}`
                          },
                          {
                            icon: 'clock',
                            text: `${goal.project?.reportFrequency || (goal.project as any)?.frequency || goal.project?.report_frequency || 'Weekly'} reports`
                          }
                        ]}
                        fontSize="11px"
                      />
                    </div>
                    <StatusPill status={goal.status} />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '10.5px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Criteria weight</div>
                    <div style={{ display: 'flex', height: '5px', borderRadius: '3px', overflow: 'hidden', gap: '1px' }}>
                      {goal.criteria?.map((crit: any, i: number) => (
                        <div key={crit.id} style={{ width: `${crit.weight}%`, background: i === 0 ? colors.accent : i === 1 ? colors.teal : colors.purple }} />
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '16px', borderTop: `1px solid ${colors.border}` }}>
                    <div>
                      <div style={{ fontSize: '10.5px', fontWeight: 600, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Avg Score</div>
                      <ScoreDisplay score={goal.avg_score} size="sm" />
                    </div>
                    <div>
                      <div style={{ fontSize: '10.5px', fontWeight: 600, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Reports</div>
                      <div style={{ fontSize: '14px', fontWeight: typography.weight.black, color: colors.text2, fontFamily: typography.fonts.numeric }}>{goal.report_count}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Completed Accordion */}
      {completedGoals.length > 0 && (
        <div style={{ padding: '0 28px 28px' }}>
          <div
            onClick={() => setIsCompletedOpen(!isCompletedOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.lg,
              cursor: 'pointer',
              transition: `all ${animation.fast}`
            }}
          >
            <Icon name={isCompletedOpen ? 'chevronDown' : 'chevronRight'} size={14} color={colors.text3} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: colors.text2 }}>Completed Goals (<span style={{ fontFamily: typography.fonts.numeric, fontWeight: typography.weight.black, fontVariantNumeric: 'tabular-nums lining-nums' }}>{completedGoals.length}</span>)</span>
          </div>

          {isCompletedOpen && (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {completedGoals.map(goal => (
                <div
                  key={goal.id}
                  onClick={() => router.push(`${basePath}/${goal.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 20px',
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radius.xl,
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: colors.greenGlow,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon name="check" size={14} color={colors.green} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: colors.text, opacity: 0.7 }}>{goal.name}</div>
                    <div style={{ fontSize: '11px', color: colors.text3 }}>{goal.project?.name}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {!readOnly ? (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon="edit"
                          onClick={(e) => openEdit(goal, e)}
                        >{null}</Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon="trash"
                          style={{ color: colors.danger }}
                          onClick={(e) => handleDelete(goal.id, e)}
                        >{null}</Button>
                      </>
                    ) : (
                      <Button variant="secondary" size="sm">View</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <AddGoalSheet
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false)
          setEditingGoal(null)
        }}
        projects={projects}
        employees={employees}
        goal={editingGoal}
      />
    </div>
  )
}
