import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (userData: any) => api.post('/auth/register', userData),
  verifyOTP: (email: string, otp: string) => api.post('/auth/verify-otp', { email, otp }),
  login: (credentials: any) => api.post('/auth/login', credentials),
  resendOTP: (email: string) => api.post('/auth/resend-otp', { email }),
};

export const alumniAPI = {
  requestApproval: (alumniData: any) => api.post('/alumni/request-approval', alumniData),
  getPendingRequests: (professorId: string) => api.get(`/alumni/pending-requests/${professorId}`),
  approveRequest: (requestId: string) => api.put(`/alumni/approve/${requestId}`),
  rejectRequest: (requestId: string) => api.put(`/alumni/reject/${requestId}`),
};

export const assessmentAPI = {
  create: (assessmentData: any) => api.post('/assessments', assessmentData),
  getById: (assessmentId: string) => api.get(`/assessments/${assessmentId}`),
  getByStudent: (studentId: string) => api.get(`/assessments/student/${studentId}`),
  getByProfessor: (professorId: string) => api.get(`/assessments/professor/${professorId}`),
  submit: (assessmentId: string, submissionData: any) => 
    api.post(`/assessments/${assessmentId}/submit`, submissionData),
  getResults: (assessmentId: string) => api.get(`/assessments/${assessmentId}/results`),
  getStudentResults: (studentId: string) => api.get(`/assessments/results/student/${studentId}`),
  getStatus: (assessmentId: string) => api.get(`/assessments/${assessmentId}/status`),
};

export const chatAPI = {
  sendMessage: (messageData: any) => api.post('/chat/send', messageData),
  getMessages: (userId1: string, userId2: string) => 
    api.get(`/chat/messages/${userId1}/${userId2}`),
  getConversations: (userId: string) => api.get(`/chat/conversations/${userId}`),
  findUser: (query: string) => api.get(`/users/search?q=${query}`),
};

export const aiAPI = {
  generateRoadmap: (data: any) => api.post('/ai/roadmap', data),
  generateAssessment: (data: any) => api.post('/ai/assessment', data),
  explainAnswer: (question: string, correctAnswer: string) => 
    api.post('/ai/explain', { question, correctAnswer }),
  evaluateAnswers: (assessmentData: any) => api.post('/ai/evaluate', assessmentData),
};

export const taskAPI = {
  create: (studentId: string, taskData: any) => 
    api.post(`/tasks?studentId=${studentId}`, taskData),
  getAll: (studentId: string) => api.get(`/tasks/student/${studentId}`),
  getByStatus: (studentId: string, status: string) => 
    api.get(`/tasks/student/${studentId}/status/${status}`),
  getById: (taskId: string, studentId: string) => 
    api.get(`/tasks/${taskId}?studentId=${studentId}`),
  update: (taskId: string, studentId: string, taskData: any) => 
    api.put(`/tasks/${taskId}?studentId=${studentId}`, taskData),
  delete: (taskId: string, studentId: string) => 
    api.delete(`/tasks/${taskId}?studentId=${studentId}`),
  markCompleted: (taskId: string, studentId: string) => 
    api.put(`/tasks/${taskId}/complete?studentId=${studentId}`),
  updateStatus: (taskId: string, studentId: string, status: string) => 
    api.put(`/tasks/${taskId}/status?studentId=${studentId}&status=${status}`),
  getStats: (studentId: string) => api.get(`/tasks/student/${studentId}/stats`),
  getOverdue: (studentId: string) => api.get(`/tasks/student/${studentId}/overdue`),
};

export default api;