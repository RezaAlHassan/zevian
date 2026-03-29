'use client'

import React, { useState } from 'react'
import { colors, radius, animation } from '@/design-system'
import { Icon } from '@/components/atoms/Icon'

interface AccordionItem {
  title: string
  content: React.ReactNode
}

interface AccordionProps {
  items: AccordionItem[]
  allowMultiple?: boolean
  initialOpenIndices?: number[]
}

export function Accordion({ items, allowMultiple = false, initialOpenIndices = [] }: AccordionProps) {
  const [openIndices, setOpenIndices] = useState<number[]>(initialOpenIndices)

  const toggleIndex = (index: number) => {
    if (allowMultiple) {
      setOpenIndices(prev => 
        prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
      )
    } else {
      setOpenIndices(prev => prev.includes(index) ? [] : [index])
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {items.map((item, idx) => {
        const isOpen = openIndices.includes(idx)
        return (
          <div 
            key={idx} 
            style={{ 
              background: colors.surface2, 
              border: `1px solid ${isOpen ? colors.accent : colors.border}`, 
              borderRadius: radius.md,
              overflow: 'hidden',
              transition: `border-color ${animation.fast} ease`
            }}
          >
            <button
              onClick={() => toggleIndex(idx)}
              style={{
                width: '100%',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                color: isOpen ? colors.accent : colors.text2,
                fontWeight: 700,
                fontSize: '12.5px',
                transition: `color ${animation.fast} ease`
              }}
            >
              <span>{item.title}</span>
              <div 
                style={{ 
                  transform: `rotate(${isOpen ? 180 : 0}deg)`, 
                  transition: `transform ${animation.base} ease`,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Icon name="chevronDown" size={14} color={isOpen ? colors.accent : colors.text3} />
              </div>
            </button>
            <div 
              style={{ 
                maxHeight: isOpen ? '1200px' : '0',
                overflow: 'hidden', 
                transition: `max-height ${animation.base} ease`,
                background: colors.surface
              }}
            >
              <div style={{ padding: '0 14px 14px 14px', fontSize: '12px', color: colors.text2, lineHeight: 1.6 }}>
                {item.content}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
