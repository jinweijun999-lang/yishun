"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  tags: string[];
}

interface KanbanData {
  project: {
    name: string;
    status: string;
    progress: number;
    activeTasks: number;
    completedTasks: number;
    totalTasks: number;
  };
  currentTask: Task | null;
  recentActivity: any[];
  backlogSummary: {
    total: number;
    highPriority: number;
  };
  sessionInfo: {
    duration: string;
    lastActivity: string;
  };
}

const STATUS_COLORS: Record<string, string> = {
  todo: "bg-gray-500/20 border-gray-500/30 text-gray-400",
  in_progress: "bg-blue-500/20 border-blue-500/30 text-blue-400",
  review: "bg-yellow-500/20 border-yellow-500/30 text-yellow-400",
  done: "bg-green-500/20 border-green-500/30 text-green-400",
};

const STATUS_LABELS: Record<string, string> = {
  todo: "待办",
  in_progress: "进行中",
  review: "审核",
  done: "已完成",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "text-red-400",
  medium: "text-yellow-400",
  low: "text-green-400",
};

export default function DashboardPage() {
  const [data, setData] = useState<KanbanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/kanban/status")
      .then((res) => res.json())
      .then((result) => {
        setData(result.json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white">加载中...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-red-400">错误: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 sm:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-glow">📊 项目看板</h1>
            <p className="text-gray-400 mt-1">{data.project.name}</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-400">进度</div>
              <div className="text-2xl font-bold text-secondary">
                {data.project.progress}%
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">会话</div>
              <div className="text-2xl font-bold">{data.sessionInfo.duration}</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-secondary to-accent"
              initial={{ width: 0 }}
              animate={{ width: `${data.project.progress}%` }}
              transition={{ duration: 1 }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-400">
            <span>{data.project.completedTasks} 已完成</span>
            <span>{data.project.activeTasks} 进行中</span>
            <span>{data.project.totalTasks - data.project.completedTasks - data.project.activeTasks} 待办</span>
          </div>
        </div>

        {/* Current Task */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            🎯 当前任务
          </h2>
          <AnimatePresence mode="wait">
            {data.currentTask ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`rounded-2xl border p-6 ${STATUS_COLORS[data.currentTask.status]}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold">{data.currentTask.title}</h3>
                    <p className="text-gray-400 mt-2">{data.currentTask.description}</p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {data.currentTask.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-white/10 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 text-sm">
                    <span className={`font-bold ${PRIORITY_COLORS[data.currentTask.priority]}`}>
                      优先级: {data.currentTask.priority.toUpperCase()}
                    </span>
                    <span>负责人: {data.currentTask.assignee}</span>
                    <span>ID: {data.currentTask.id}</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="text-gray-400">暂无进行中的任务</div>
            )}
          </AnimatePresence>
        </div>

        {/* Kanban Board */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["todo", "in_progress", "review", "done"].map((status) => {
            // We'll filter tasks in the component
            return null;
          })}
        </div>

        {/* Backlog Summary */}
        <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/10">
          <h3 className="text-lg font-bold mb-4">📦 积压任务</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{data.backlogSummary.total}</div>
              <div className="text-sm text-gray-400">总待办</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400">{data.backlogSummary.highPriority}</div>
              <div className="text-sm text-gray-400">高优先级</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{data.project.completedTasks}</div>
              <div className="text-sm text-gray-400">已完成</div>
            </div>
          </div>
        </div>

        {/* Telegram Link */}
        <div className="mt-8 text-center">
          <a
            href="https://11263.com/api/kanban/status"
            target="_blank"
            className="inline-block px-6 py-3 bg-secondary/20 border border-secondary/30 rounded-xl text-secondary hover:bg-secondary/30 transition-colors"
          >
            📱 Telegram API 格式
          </a>
        </div>
      </div>
    </div>
  );
}
