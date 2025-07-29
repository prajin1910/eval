import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, CheckCircle, AlertTriangle, Edit, Trash2, Play, Pause, RotateCcw, Bell, BellRing } from 'lucide-react';
import { taskAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Task, TaskStats } from '../../types';
import toast from 'react-hot-toast';
import TaskModal from './TaskModal';
// import { webSocketService } from '../../services/websocket';

const TaskManagementSection: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats>({ pending: 0, ongoing: 0, completed: 0, overdue: 0 });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'ongoing' | 'completed' | 'overdue'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [dueSoonTasks, setDueSoonTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchStats();
      
      // Connect to WebSocket for real-time task notifications
      // webSocketService.connect(user.id);
      
      // Listen for task reminder notifications
      const handleTaskNotification = (notification: any) => {
        if (notification.type === 'TASK_REMINDER') {
          // Show toast notification
          const urgencyIcon = notification.minutesUntilDue <= 60 ? '🚨' : '⏰';
          toast.custom((t) => (
            <div className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">{urgencyIcon}</span>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Task Reminder
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {notification.message}
                    </p>
                    <div className="mt-2 flex text-xs text-gray-400">
                      <span>Priority: {notification.priority}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-gray-200">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Close
                </button>
              </div>
            </div>
          ), {
            duration: notification.minutesUntilDue <= 60 ? 10000 : 5000,
          });
          
          // Refresh tasks to show updated status
          fetchTasks();
        }
      };
      
      // webSocketService.onNotification(handleTaskNotification);
      
      // return () => {
      //   webSocketService.removeNotificationCallback(handleTaskNotification);
      // };
    }
  }, [user]);

  useEffect(() => {
    filterTasks();
  }, [tasks, activeTab]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await taskAPI.getAll(user!.id);
      setTasks(response.data);
    } catch (error) {
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await taskAPI.getStats(user!.id);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch task stats');
    }
  };

  const filterTasks = () => {
    let filtered = [...tasks];
    
    switch (activeTab) {
      case 'pending':
        filtered = tasks.filter(task => task.status === 'PENDING');
        break;
      case 'ongoing':
        filtered = tasks.filter(task => task.status === 'ONGOING');
        break;
      case 'completed':
        filtered = tasks.filter(task => task.status === 'COMPLETED');
        break;
      case 'overdue':
        filtered = tasks.filter(task => task.isOverdue && task.status !== 'COMPLETED');
        break;
      default:
        // Show all tasks
        break;
    }
    
    // Sort by priority and due date
    filtered.sort((a, b) => {
      // First sort by overdue status
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      
      // Then by priority
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Finally by end date
      return new Date(a.endDateTime).getTime() - new Date(b.endDateTime).getTime();
    });
    
    setFilteredTasks(filtered);
  };

  const handleCreateTask = async (taskData: any) => {
    try {
      await taskAPI.create(user!.id, taskData);
      toast.success('Task created successfully!');
      setShowModal(false);
      fetchTasks();
      fetchStats();
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleUpdateTask = async (taskData: any) => {
    if (!editingTask) return;
    
    try {
      await taskAPI.update(editingTask.id, user!.id, taskData);
      toast.success('Task updated successfully!');
      setShowModal(false);
      setEditingTask(null);
      fetchTasks();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await taskAPI.delete(taskId, user!.id);
      toast.success('Task deleted successfully!');
      fetchTasks();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleMarkCompleted = async (taskId: string) => {
    try {
      await taskAPI.markCompleted(taskId, user!.id);
      toast.success('Task marked as completed!');
      fetchTasks();
      fetchStats();
    } catch (error) {
      toast.error('Failed to mark task as completed');
    }
  };

  const handleStatusChange = async (taskId: string, status: string) => {
    try {
      await taskAPI.updateStatus(taskId, user!.id, status);
      toast.success(`Task status updated to ${status.toLowerCase()}!`);
      fetchTasks();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update task status');
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-blue-600 bg-blue-100';
      case 'ONGOING': return 'text-yellow-600 bg-yellow-100';
      case 'COMPLETED': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600 bg-red-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
  };

  const getTimeRemaining = (endDateTime: string) => {
    const now = new Date();
    const end = new Date(endDateTime);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return { text: 'Overdue', class: 'text-red-600', urgent: true };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return { text: `${days}d ${hours}h remaining`, class: 'text-gray-600', urgent: false };
    } else if (hours > 1) {
      return { text: `${hours}h ${minutes}m remaining`, class: hours <= 6 ? 'text-yellow-600' : 'text-gray-600', urgent: hours <= 1 };
    } else if (hours === 1) {
      return { text: `1h ${minutes}m remaining`, class: 'text-orange-600', urgent: true };
    } else if (minutes > 15) {
      return { text: `${minutes}m remaining`, class: 'text-orange-600', urgent: true };
    } else {
      return { text: `${minutes}m remaining`, class: 'text-red-600 font-bold', urgent: true };
    }
  };

  const getDueSoonTasks = () => {
    const now = new Date();
    const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    return tasks.filter(task => {
      if (task.status === 'COMPLETED') return false;
      const taskEnd = new Date(task.endDateTime);
      return taskEnd <= oneDayLater && taskEnd > now;
    }).sort((a, b) => new Date(a.endDateTime).getTime() - new Date(b.endDateTime).getTime());
  };

  const renderTaskCard = (task: Task) => (
    <div key={task.id} className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow ${
      task.isOverdue && task.status !== 'COMPLETED' ? 'border-l-4 border-red-500' : ''
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-900 mr-3">{task.title}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
              {task.status}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
          </div>
          {task.description && (
            <p className="text-gray-600 mb-3">{task.description}</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-sm text-gray-600">
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          <span>Start: {formatDateTime(task.startDateTime)}</span>
        </div>
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-2" />
          <span>End: {formatDateTime(task.endDateTime)}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div className={`text-sm font-medium ${
          task.isOverdue && task.status !== 'COMPLETED' ? 'text-red-600' : 'text-gray-600'
        }`}>
          {task.status === 'COMPLETED' ? (
            <span className="flex items-center text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              Completed {task.completedAt ? formatDateTime(task.completedAt) : ''}
            </span>
          ) : (
            <span className="flex items-center">
              {task.isOverdue ? (
                <AlertTriangle className="w-4 h-4 mr-1 text-red-600" />
              ) : (
                <Clock className="w-4 h-4 mr-1" />
              )}
              <span className={getTimeRemaining(task.endDateTime).class}>
                {getTimeRemaining(task.endDateTime).text}
                {getTimeRemaining(task.endDateTime).urgent && (
                  <BellRing className="w-3 h-3 ml-1 inline animate-pulse" />
                )}
              </span>
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {task.status !== 'COMPLETED' && (
            <>
              {task.status === 'PENDING' && (
                <button
                  onClick={() => handleStatusChange(task.id, 'ONGOING')}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Start Task"
                >
                  <Play className="w-4 h-4" />
                </button>
              )}
              {task.status === 'ONGOING' && (
                <button
                  onClick={() => handleStatusChange(task.id, 'PENDING')}
                  className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                  title="Pause Task"
                >
                  <Pause className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => handleMarkCompleted(task.id)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Mark as Completed"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            </>
          )}
          {task.status === 'COMPLETED' && (
            <button
              onClick={() => handleStatusChange(task.id, 'PENDING')}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Reopen Task"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => openEditModal(task)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Task"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteTask(task.id)}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Task Management</h1>
          <p className="text-gray-600">Organize and track your tasks efficiently</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Task
        </button>
      </div>

      {/* Due Soon Notification Bar */}
      {getDueSoonTasks().length > 0 && (
        <div className="mb-6 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <BellRing className="w-5 h-5 text-orange-600 mr-2 animate-pulse" />
            <h3 className="font-semibold text-orange-800">Tasks Due Soon</h3>
          </div>
          <div className="mt-2 space-y-2">
            {getDueSoonTasks().slice(0, 3).map(task => {
              const timeInfo = getTimeRemaining(task.endDateTime);
              return (
                <div key={task.id} className="flex items-center justify-between bg-white rounded p-2 shadow-sm">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      task.priority === 'HIGH' ? 'bg-red-500' : 
                      task.priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <span className="font-medium text-gray-800 truncate max-w-xs">{task.title}</span>
                  </div>
                  <span className={`text-sm font-medium ${timeInfo.class}`}>
                    {timeInfo.text}
                  </span>
                </div>
              );
            })}
            {getDueSoonTasks().length > 3 && (
              <p className="text-sm text-orange-600 text-center">
                +{getDueSoonTasks().length - 3} more tasks due soon
              </p>
            )}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{stats.pending}</h3>
              <p className="text-gray-600">Pending Tasks</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
              <Play className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{stats.ongoing}</h3>
              <p className="text-gray-600">Ongoing Tasks</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{stats.completed}</h3>
              <p className="text-gray-600">Completed Tasks</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{stats.overdue}</h3>
              <p className="text-gray-600">Overdue Tasks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'all', label: 'All Tasks', count: tasks.length },
              { id: 'pending', label: 'Pending', count: stats.pending },
              { id: 'ongoing', label: 'Ongoing', count: stats.ongoing },
              { id: 'completed', label: 'Completed', count: stats.completed },
              { id: 'overdue', label: 'Overdue', count: stats.overdue },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tasks Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-600 mb-6">
            {activeTab === 'all' && 'You haven\'t created any tasks yet.'}
            {activeTab === 'pending' && 'No pending tasks at the moment.'}
            {activeTab === 'ongoing' && 'No ongoing tasks right now.'}
            {activeTab === 'completed' && 'No completed tasks yet.'}
            {activeTab === 'overdue' && 'No overdue tasks - great job!'}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Task
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTasks.map(renderTaskCard)}
        </div>
      )}

      {/* Task Modal */}
      {showModal && (
        <TaskModal
          task={editingTask}
          onClose={closeModal}
          onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        />
      )}
    </div>
  );
};

export default TaskManagementSection;