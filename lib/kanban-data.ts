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
  id: 'fortune-app',
  name: 'Fortune Teller App',
  description: 'AI-powered Eastern decision guidance platform',
  status: 'active',
  startDate: '2026-01-24',
  tasks: [
    {
      id: 't1',
      title: 'Fix Google OAuth redirect loop',
      description: 'OAuth callback redirects to localhost:3000 instead of 11263.com',
      status: 'in_progress',
      priority: 'high',
      assignee: 'Jarvis',
      createdAt: '2026-01-29',
      updatedAt: '2026-01-29',
      tags: ['bug', 'auth', 'deployment'],
    },
    {
      id: 't2',
      title: 'Add Stripe payment integration',
      description: 'Implement subscription and single purchase payment flow',
      status: 'todo',
      priority: 'high',
      assignee: 'Jarvis',
      createdAt: '2026-01-25',
      updatedAt: '2026-01-25',
      tags: ['feature', 'payments'],
    },
    {
      id: 't3',
      title: 'User profile management',
      description: 'Birth date/time, gender, timezone settings',
      status: 'done',
      priority: 'medium',
      assignee: 'Jarvis',
      createdAt: '2026-01-24',
      updatedAt: '2026-01-28',
      tags: ['feature', 'profile'],
    },
    {
      id: 't4',
      title: 'Deploy to Google Cloud',
      description: 'Set up GCP VM, Nginx, SSL, PM2 deployment',
      status: 'done',
      priority: 'high',
      assignee: 'Jarvis',
      createdAt: '2026-01-24',
      updatedAt: '2026-01-27',
      tags: ['deployment', 'infrastructure'],
    },
    {
      id: 't5',
      title: 'Add consultation credits system',
      description: 'Users can buy credits for AI consultations',
      status: 'todo',
      priority: 'medium',
      assignee: 'Jarvis',
      createdAt: '2026-01-26',
      updatedAt: '2026-01-26',
      tags: ['feature', 'payments'],
    },
    {
      id: 't6',
      title: 'Multi-language support',
      description: 'Chinese (Simplified/Traditional) and English',
      status: 'done',
      priority: 'medium',
      assignee: 'Jarvis',
      createdAt: '2026-01-25',
      updatedAt: '2026-01-27',
      tags: ['feature', 'i18n'],
    },
  ],
};

// 待办事项（不在项目内）
export const backlogTasks: Task[] = [
  {
    id: 'b1',
    title: 'Add email notifications',
    description: 'Send email for password reset, consultation results',
    status: 'todo',
    priority: 'low',
    assignee: 'Jarvis',
    createdAt: '2026-01-25',
    updatedAt: '2026-01-25',
    tags: ['feature', 'email'],
  },
  {
    id: 'b2',
    title: 'Add ad video reward system',
    description: 'Users can watch ads to unlock daily fortune',
    status: 'review',
    priority: 'medium',
    assignee: 'Jarvis',
    createdAt: '2026-01-26',
    updatedAt: '2026-01-28',
    tags: ['feature', 'revenue'],
  },
  {
    id: 'b3',
    title: 'Mobile responsive design',
    description: 'Optimize UI for mobile devices',
    status: 'done',
    priority: 'medium',
    assignee: 'Jarvis',
    createdAt: '2026-01-25',
    updatedAt: '2026-01-27',
    tags: ['feature', 'ui'],
  },
];

// 当前工作会话状态
export const currentSession = {
  startTime: new Date().toISOString(),
  activeTask: 't1',
  lastActivity: new Date().toISOString(),
  notes: [
    'Working on OAuth redirect issue - Nginx proxy headers not being respected',
    'Tried trustHost config, still redirecting to localhost',
    'Need to check if Next.js is using the correct host header',
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
