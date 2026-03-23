'use client'

import { colors, radius, typography, animation, shadows, layout } from '@/design-system'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import { ProjectCard } from '@/components/molecules/ProjectCard'
import { ProjectRow } from '@/components/molecules/ProjectRow'
import { AddProjectSheet } from '@/components/organisms/AddProjectSheet'
import { upsertProjectAction, deleteProjectAction, updateProjectStatusAction } from '@/app/actions/projectActions'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ProjectsViewProps {
  projects: any[]
  employees: any[]
  readOnly?: boolean
  basePath?: string
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.round(diffMs / 60000)
  
  if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`
  const diffHours = Math.round(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.round(diffHours / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  const diffWeeks = Math.round(diffDays / 7)
  if (diffWeeks < 4) return `${diffWeeks}w ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ProjectsView({ projects, employees, readOnly = false, basePath = '/projects' }: ProjectsViewProps) {
  const router = useRouter()
  const [localProjects, setLocalProjects] = useState(projects)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCompletedOpen, setIsCompletedOpen] = useState(false)

  // Confirmation Modal State
  const [confModal, setConfModal] = useState<{
    show: boolean;
    type: 'complete' | 'delete';
    projectId: string | null;
    projectName: string;
  }>({ show: false, type: 'complete', projectId: null, projectName: '' })

  const activeProjects = localProjects.filter(p => p.status !== 'completed' && p.status !== 'done')
  const completedProjects = localProjects.filter(p => p.status === 'completed' || p.status === 'done')

  const filteredProjects = activeProjects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleComplete = (id: string, name: string, e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    setConfModal({ show: true, type: 'complete', projectId: id, projectName: name })
  }

  const handleEdit = (project: any, e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    setEditingProject(project)
    setIsAddOpen(true)
  }

  const handleDelete = (id: string, name: string, e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    setConfModal({ show: true, type: 'delete', projectId: id, projectName: name })
  }

  const confirmAction = async () => {
    if (!confModal.projectId) return
    setLoading(true)

    try {
      if (confModal.type === 'complete') {
        await updateProjectStatusAction(confModal.projectId, 'completed')
      } else {
        await deleteProjectAction(confModal.projectId)
      }
      router.refresh()
    } catch (err) {
      console.error('Project Action Error:', err)
    } finally {
      setLoading(false)
      setConfModal({ show: false, type: 'complete', projectId: null, projectName: '' })
    }
  }

  const handleSaveProject = async (updatedProject: any) => {
    setLoading(true)
    try {
      const res = await upsertProjectAction(updatedProject)
      if (res.success) {
        setIsAddOpen(false)
        setEditingProject(null)
        router.refresh()
      } else {
        alert(res.error || 'Failed to save project')
      }
    } catch (err) {
      console.error('Save Project Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.bg }}>

      <div style={{ padding: layout.contentPadding }}>
        {/* Filters and View Toggle */}
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
              width: '220px',
            }}>
              <Icon name="search" size={13} color={colors.text3} />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: 'none', border: 'none', outline: 'none', fontSize: '13px', color: colors.text, width: '100%', fontFamily: typography.fonts.body }}
              />
            </div>

            <select style={{
              padding: '7px 12px',
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.md,
              fontSize: '12.5px',
              color: colors.text2,
              cursor: 'pointer',
              fontFamily: typography.fonts.body,
              outline: 'none',
            }}>
              <option>All Categories</option>
              <option>Engineering</option>
              <option>Design</option>
              <option>Marketing</option>
            </select>

            <select style={{
              padding: '7px 12px',
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.md,
              fontSize: '12.5px',
              color: colors.text2,
              cursor: 'pointer',
              fontFamily: typography.fonts.body,
              outline: 'none',
            }}>
              <option>All Status</option>
              <option>Active</option>
              <option>At Risk</option>
              <option>Review</option>
            </select>
          </div>

          {/* Right: Count & View Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="font-numeric" style={{ fontSize: '13px', color: colors.text3, fontWeight: 500 }}>
              {filteredProjects.length} projects
            </div>

            {!readOnly && (
              <Button variant="primary" size="sm" onClick={() => setIsAddOpen(true)} icon="plus">
                New Project
              </Button>
            )}

            <div style={{ display: 'flex', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: '2px', gap: '2px' }}>
              <button
                onClick={() => setViewMode('grid')}
                title="Grid View"
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  background: viewMode === 'grid' ? colors.surface2 : 'transparent',
                  color: viewMode === 'grid' ? colors.accent : colors.text3,
                  border: 'none',
                  transition: `all ${animation.fast}`,
                }}
              >
                <Icon name="layoutGrid" size={14} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                title="List View"
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  background: viewMode === 'list' ? colors.surface2 : 'transparent',
                  color: viewMode === 'list' ? colors.accent : colors.text3,
                  border: 'none',
                  transition: `all ${animation.fast}`,
                }}
              >
                <Icon name="list" size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radius['2xl'],
            padding: '64px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: radius.xl,
              background: 'rgba(91,127,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              color: colors.accent,
            }}>
              <Icon name="briefcase" size={26} />
            </div>
            <div style={{ fontFamily: typography.fonts.display, fontSize: '16px', fontWeight: 700, color: colors.text, marginBottom: '6px' }}>
              No projects found
            </div>
            <div style={{ fontSize: '13px', color: colors.text3, maxWidth: '300px', lineHeight: 1.65, marginBottom: '20px' }}>
              Projects help you organize goals and track progress. Try adjusting your filters or create a new one.
            </div>
            {!readOnly && (
              <Button variant="primary" onClick={() => setIsAddOpen(true)} icon="plus">
                Create First Project
              </Button>
            )}
          </div>
        )}

        {/* Content - Grid */}
        {viewMode === 'grid' && filteredProjects.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
            {filteredProjects.map((p, i) => (
              <div key={p.id} className="fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <ProjectCard
                  id={p.id}
                  name={p.name}
                  category={p.category || 'General'}
                  frequency={p.frequency || 'Weekly'}
                  status={p.status || 'active'}
                  score={p.avg_score}
                  reportCount={p.report_count || 0}
                  goalCount={p.goal_count || 0}
                  lastReport={p.last_report_at ? formatRelativeTime(p.last_report_at) : 'No reports'}
                  emoji={p.emoji}
                  members={p.project_members || []}
                  onComplete={(e) => handleComplete(p.id, p.name, e)}
                  onDelete={(e) => handleDelete(p.id, p.name, e)}
                  onEdit={(e) => handleEdit(p, e)}
                  readOnly={readOnly}
                  basePath={basePath}
                />
              </div>
            ))}
          </div>
        )}

        {/* Content - List */}
        {viewMode === 'list' && filteredProjects.length > 0 && (
          <div style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radius['2xl'],
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <th style={tableHeaderStyle}>Project</th>
                  <th style={tableHeaderStyle}>Category</th>
                  <th style={tableHeaderStyle}>Status</th>
                  <th style={tableHeaderStyle}>Team</th>
                  <th style={tableHeaderStyle}>Avg Score</th>
                  <th style={tableHeaderStyle}>Reports</th>
                  <th style={tableHeaderStyle}>Frequency</th>
                  <th style={tableHeaderStyle}>Last Activity</th>
                  <th style={tableHeaderStyle}></th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map(p => (
                  <ProjectRow
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    description={p.description || 'No description provided.'}
                    category={p.category || 'General'}
                    frequency={p.frequency || 'Weekly'}
                    status={p.status || 'active'}
                    score={p.avg_score}
                    reportCount={p.report_count || 0}
                    lastActivity={p.last_report_at ? formatRelativeTime(p.last_report_at) : 'Just created'}
                    members={p.project_members || []}
                    onComplete={(e) => handleComplete(p.id, p.name, e)}
                    onDelete={(e) => handleDelete(p.id, p.name, e)}
                    onEdit={(e) => handleEdit(p, e)}
                    readOnly={readOnly}
                    basePath={basePath}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Completed Projects Accordion */}
        {completedProjects.length > 0 && (
          <div style={{ marginTop: '40px' }}>
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
                transition: `all ${animation.fast}`,
                color: colors.text2,
              }}
            >
              <Icon name={isCompletedOpen ? 'chevronDown' : 'chevronRight'} size={14} color={colors.text3} />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Completed Projects ({completedProjects.length})</span>
            </div>

            {isCompletedOpen && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {completedProjects.map(p => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 20px',
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: radius.xl,
                      opacity: 0.8,
                    }}
                  >
                    <div style={{ fontSize: '20px' }}>{p.emoji || '✅'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: colors.text }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: colors.text3 }}>{p.category} · Completed</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {!readOnly && (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon="trash"
                          style={{ color: colors.danger }}
                          onClick={(e) => handleDelete(p.id, p.name, e)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {confModal.show && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            width: '400px',
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.xl,
            padding: '24px',
            boxShadow: shadows.cardHover,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: radius.lg,
                background: confModal.type === 'complete' ? colors.greenGlow : colors.dangerGlow,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: confModal.type === 'complete' ? colors.green : colors.danger,
              }}>
                <Icon name={confModal.type === 'complete' ? 'check' : 'trash'} size={24} />
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: colors.text }}>
                  {confModal.type === 'complete' ? 'Complete Project?' : 'Delete Project?'}
                </div>
                <div style={{ fontSize: '13.5px', color: colors.text3, marginTop: '8px', lineHeight: 1.5 }}>
                  Are you sure you want to {confModal.type} <b>{confModal.projectName}</b>? <br />
                  <div style={{ marginTop: '10px', padding: '10px', background: `${colors.danger}10`, border: `1px solid ${colors.danger}20`, borderRadius: radius.md, fontSize: '12px', color: colors.danger }}>
                    <Icon name="alert" size={12} style={{ marginRight: '6px' }} />
                    <strong>Cascading Action:</strong> This will also {confModal.type === 'complete' ? 'mark all' : 'permanently delete'} associated goals and reports.
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
                <Button variant="secondary" onClick={() => setConfModal(prev => ({ ...prev, show: false }))} style={{ flex: 1 }}>Cancel</Button>
                <Button
                  variant="primary"
                  onClick={confirmAction}
                  style={{ flex: 1, background: confModal.type === 'delete' ? colors.danger : colors.green }}
                >
                  Confirm {confModal.type === 'complete' ? 'Completion' : 'Deletion'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AddProjectSheet
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false)
          setEditingProject(null)
        }}
        employees={employees}
        project={editingProject}
        onSave={handleSaveProject}
      />

      <style jsx>{`
        .fade-in {
          animation: fadeUp 0.3s ease both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

const tableHeaderStyle: React.CSSProperties = {
  padding: '10px 14px',
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: 700,
  color: colors.text3,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}
