import { NextResponse } from 'next/server';
import { currentProject, backlogTasks, currentSession } from '@/lib/kanban-data';

export async function GET() {
  const now = new Date();
  const sessionStart = new Date(currentSession.startTime);
  const sessionDurationMs = now.getTime() - sessionStart.getTime();
  const sessionMinutes = Math.floor(sessionDurationMs / 60000);
  const sessionHours = Math.floor(sessionMinutes / 60);
  const sessionRemainingMinutes = sessionMinutes % 60;
  
  const duration = sessionHours > 0 
    ? `${sessionHours}h ${sessionRemainingMinutes}m`
    : `${sessionMinutes}m`;

  // Calculate progress
  const totalTasks = currentProject.tasks.length;
  const completedTasks = currentProject.tasks.filter(t => t.status === 'done').length;
  const progress = Math.round((completedTasks / totalTasks) * 100);

  // Get current active task
  const activeTask = currentProject.tasks.find(t => t.id === currentSession.activeTask);

  // Recent activity (simulated based on session notes)
  const recentActivity = currentSession.notes.slice(-3).map((note, index) => ({
    taskId: currentSession.activeTask,
    taskTitle: activeTask?.title || 'Unknown',
    action: note.substring(0, 50) + (note.length > 50 ? '...' : ''),
    time: new Date(Date.now() - index * 3600000).toISOString(), // Simulated timestamps
  }));

  // Backlog summary
  const backlogHighPriority = backlogTasks.filter(t => t.priority === 'high').length;

  const response: any = {
    project: {
      name: currentProject.name,
      status: currentProject.status,
      progress,
      activeTasks: currentProject.tasks.filter(t => t.status === 'in_progress').length,
      completedTasks,
      totalTasks,
    },
    currentTask: activeTask ? {
      id: activeTask.id,
      title: activeTask.title,
      description: activeTask.description,
      status: activeTask.status,
      priority: activeTask.priority,
      assignee: activeTask.assignee,
      tags: activeTask.tags,
    } : null,
    recentActivity,
    backlogSummary: {
      total: backlogTasks.length,
      highPriority: backlogHighPriority,
    },
    sessionInfo: {
      duration,
      lastActivity: currentSession.lastActivity,
    },
  };

  // Telegram markdown format
  const telegramText = formatTelegramMarkdown(response);
  
  return NextResponse.json({
    json: response,
    telegram: telegramText,
  });
}

function formatTelegramMarkdown(data: any): string {
  const lines = [
    '📊 *项目看板状态*',
    '',
    `🎯 *${data.project.name}*`,
    `📈 进度: ${data.project.progress}% (${data.project.completedTasks}/${data.project.totalTasks} 任务)`,
    `🔄 活跃任务: ${data.project.activeTasks}`,
    '',
    '━━━━━━━━━━━━━━━━',
    '',
  ];

  if (data.currentTask) {
    const statusEmoji: Record<string, string> = {
      'todo': '📋',
      'in_progress': '🔄',
      'review': '👀',
      'done': '✅',
    };
    const priorityEmoji: Record<string, string> = {
      'high': '🔴',
      'medium': '🟡',
      'low': '🟢',
    };

    const statusKey = String(data.currentTask.status ?? '');
    const priorityKey = String(data.currentTask.priority ?? '');
    const emoji = statusEmoji[statusKey] || '📌';
    const priorityEmo = priorityEmoji[priorityKey] || '⚪';

    lines.push(
      `${emoji} *当前任务*`,
      `${priorityEmo} ${data.currentTask.title}`,
      `📝 ID: \`${data.currentTask.id}\``,
      `👤 负责人: ${data.currentTask.assignee}`,
      ''
    );
  }

  lines.push('━━━━━━━━━━━━━━━━');
  lines.push('');
  lines.push('📋 *待办任务*');
  
  const todoTasks = currentProject.tasks.filter(t => t.status === 'todo').slice(0, 5);
  todoTasks.forEach(task => {
    const emoji = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢';
    lines.push(`${emoji} ${task.title}`);
  });

  if (todoTasks.length === 0) {
    lines.push('✅ 所有任务已完成！');
  }

  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━');
  lines.push('');
  lines.push(`📦 *积压任务*: ${data.backlogSummary.total} (高优先级: ${data.backlogSummary.highPriority})`);
  lines.push(`⏱️ *会话时长*: ${data.sessionInfo.duration}`);
  lines.push('');
  lines.push('🔗 查看详情: https://11263.com/dashboard');

  return lines.join('\n');
}
