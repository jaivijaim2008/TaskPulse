import React from 'react';

export interface UrgencyDetails {
  level: 'ok' | 'soon' | 'urgent';
  label: string;
  pct: number;
  color: string;
  emoji: string;
}

export interface CategoryTheme {
  icon: string;
  emoji: string;
  label: string;
  bg: string;
  text: string;
}

export const getUrgencyDetails = (deadlineStr: string): UrgencyDetails => {
  const now = new Date();
  const due = new Date(deadlineStr);
  if (isNaN(due.getTime())) {
    return {
      level: 'ok',
      label: 'No deadline',
      pct: 20,
      color: '#2DD4BF', // Premium Mint/Teal
      emoji: '🟢'
    };
  }
  const diffMs = due.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 0) {
    return {
      level: 'urgent',
      label: 'OVERDUE',
      pct: 100,
      color: '#EF4444', // Crimson Rose
      emoji: '🚨'
    };
  }
  if (diffHours < 24) {
    return {
      level: 'urgent',
      label: `${Math.round(diffHours)}h left`,
      pct: 95,
      color: '#F43F5E', // Rose Red
      emoji: '🔴'
    };
  }
  if (diffHours < 72) {
    const days = Math.round(diffHours / 24);
    return {
      level: 'soon',
      label: `${days}d left`,
      pct: 65,
      color: '#F59E0B', // Bright Amber
      emoji: '🟡'
    };
  }
  const days = Math.round(diffHours / 24);
  const pct = Math.max(15, 50 - days * 2);
  return {
    level: 'ok',
    label: `${days}d left`,
    pct: pct,
    color: '#10B981', // Emerald Green
    emoji: '🟢'
  };
};

export const getCategoryTheme = (category: string) => {
  switch (category) {
    case 'work':
      return {
        icon: '💼',
        emoji: '💼',
        label: 'Work',
        bg: 'rgba(99,102,241,0.15)', // Indigo
        text: '#818CF8'
      };
    case 'study':
      return {
        icon: '📚',
        emoji: '📚',
        label: 'Study',
        bg: 'rgba(245,158,11,0.15)', // Amber
        text: '#FBBF24'
      };
    case 'personal':
      return {
        icon: '🏠',
        emoji: '🏠',
        label: 'Personal',
        bg: 'rgba(45,212,191,0.15)', // Teal
        text: '#2DD4BF'
      };
    case 'health':
      return {
        icon: '💪',
        emoji: '💪',
        label: 'Health',
        bg: 'rgba(16,185,129,0.15)', // Emerald
        text: '#34D399'
      };
    case 'finance':
      return {
        icon: '💰',
        emoji: '💰',
        label: 'Finance',
        bg: 'rgba(236,72,153,0.15)', // Pink
        text: '#F472B6'
      };
    default:
      return {
        icon: '📌',
        emoji: '📌',
        label: 'General',
        bg: 'rgba(156,163,175,0.15)', // Gray
        text: '#9CA3AF'
      };
  }
};
