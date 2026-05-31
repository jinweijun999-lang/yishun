// 看板任务数据
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  tags: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;
  tasks: Task[];
}

// 当前项目状态
export const currentProject: Project = {
  id: 'yishun-launch',
  name: 'YiShun Launch Readiness',
  description: 'Consumer-grade Eastern timing and decision companion',
  status: 'active',
  startDate: '2026-01-24',
  tasks: [
    {
      id: 't1',
      title: 'Verify paid report fulfillment',
      description: 'Confirm test-mode checkout, webhook fulfillment, and entitlement recovery before launch.',
      status: 'in_progress',
      priority: 'high',
      assignee: 'YiShun Ops',
      createdAt: '2026-01-29',
      updatedAt: '2026-05-31',
      tags: ['payments', 'entitlements', 'release'],
    },
    {
      id: 't2',
      title: 'Run production health smoke',
      description: 'Keep homepage, reading start, membership, privacy, terms, and health checks verified.',
      status: 'review',
      priority: 'high',
      assignee: 'YiShun Ops',
      createdAt: '2026-01-25',
      updatedAt: '2026-05-31',
      tags: ['monitoring', 'health'],
    },
    {
      id: 't3',
      title: 'Keep profile and report history stable',
      description: 'Maintain saved reports, daily cards, and entitlement-aware report access.',
      status: 'done',
      priority: 'medium',
      assignee: 'YiShun Ops',
      createdAt: '2026-01-24',
      updatedAt: '2026-05-31',
      tags: ['retention', 'reports'],
    },
    {
      id: 't4',
      title: 'Maintain deployment release checks',
      description: 'Deploy only through the established CI runner and verify release SHA through health.',
      status: 'done',
      priority: 'high',
      assignee: 'YiShun Ops',
      createdAt: '2026-01-24',
      updatedAt: '2026-05-31',
      tags: ['deployment', 'release'],
    },
    {
      id: 't5',
      title: 'Monitor ask-credit recovery',
      description: 'Verify consultation credits stay webhook-driven and visible in entitlement status.',
      status: 'review',
      priority: 'medium',
      assignee: 'YiShun Ops',
      createdAt: '2026-01-26',
      updatedAt: '2026-05-31',
      tags: ['credits', 'payments'],
    },
    {
      id: 't6',
      title: 'Keep bilingual core journey polished',
      description: 'Preserve English and Chinese launch copy across the first-reading journey.',
      status: 'done',
      priority: 'medium',
      assignee: 'YiShun Ops',
      createdAt: '2026-01-25',
      updatedAt: '2026-05-31',
      tags: ['i18n', 'copy'],
    },
  ],
};

// 待办事项（不在项目内）
export const backlogTasks: Task[] = [
  {
    id: 'b1',
    title: 'Prepare revisit reminders',
    description: 'Design consent-based reminders for daily timing and saved report follow-up.',
    status: 'todo',
    priority: 'low',
    assignee: 'YiShun Ops',
    createdAt: '2026-01-25',
    updatedAt: '2026-05-31',
    tags: ['retention', 'lifecycle'],
  },
  {
    id: 'b2',
    title: 'Track growth content performance',
    description: 'Compare source, share, and conversion metrics from launch content experiments.',
    status: 'review',
    priority: 'medium',
    assignee: 'YiShun Ops',
    createdAt: '2026-01-26',
    updatedAt: '2026-05-31',
    tags: ['growth', 'analytics'],
  },
  {
    id: 'b3',
    title: 'Protect mobile first-reading path',
    description: 'Keep the 390px mobile journey tappable from landing to preview and paywall.',
    status: 'done',
    priority: 'medium',
    assignee: 'YiShun Ops',
    createdAt: '2026-01-25',
    updatedAt: '2026-05-31',
    tags: ['mobile', 'activation'],
  },
];

// 当前工作会话状态
export const currentSession = {
  startTime: new Date().toISOString(),
  activeTask: 't1',
  lastActivity: new Date().toISOString(),
  notes: [
    'Production health, Stripe, analytics, and database checks are part of the release gate.',
    'Paid report access is restored from webhook fulfillment history.',
    'Daily reporting reconciles checkout analytics with webhook fulfillment outcomes.',
  ],
};

// API 返回格式
export interface KanbanStatusResponse {
  project: {
    name: string;
    status: string;
    progress: number; // percentage
    activeTasks: number;
    completedTasks: number;
    totalTasks: number;
  };
  currentTask: {
    id: string;
    title: string;
    status: string;
    priority: string;
    assignee: string;
  };
  recentActivity: {
    taskId: string;
    taskTitle: string;
    action: string;
    time: string;
  }[];
  backlogSummary: {
    total: number;
    highPriority: number;
  };
  sessionInfo: {
    duration: string;
    lastActivity: string;
  };
}
