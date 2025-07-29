import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: any) => apiClient.post('/auth/register', data),
  login: (data: any) => apiClient.post('/auth/login', data),
  verifyOtp: (data: any) => apiClient.post('/auth/verify-otp', data),
  resendOtp: (data: any) => apiClient.post('/auth/resend-otp', data),
};

// Chat API
export const chatAPI = {
  sendMessage: (data: any) => apiClient.post('/chat/send', data),
  getConversations: () => apiClient.get('/chat/conversations'),
  getMessages: (conversationId: string) => apiClient.get(`/chat/conversations/${conversationId}/messages`),
};

// Alumni API
export const alumniAPI = {
  requestAlumni: (data: any) => apiClient.post('/alumni/request', data),
  getRequests: () => apiClient.get('/alumni/requests'),
  approveRequest: (id: string) => apiClient.put(`/alumni/requests/${id}/approve`),
  rejectRequest: (id: string) => apiClient.put(`/alumni/requests/${id}/reject`),
};

// Assessment API
export const assessmentAPI = {
  createAssessment: (data: any) => apiClient.post('/assessments', data),
  getAssessments: () => apiClient.get('/assessments'),
  getAssessment: (id: string) => apiClient.get(`/assessments/${id}`),
  submitAssessment: (id: string, data: any) => apiClient.post(`/assessments/${id}/submit`, data),
  getResults: (id: string) => apiClient.get(`/assessments/${id}/results`),
};

// AI API
export const aiAPI = {
  generateAssessment: (data: any) => apiClient.post('/ai/generate-assessment', data),
  generateRoadmap: (data: any) => apiClient.post('/ai/generate-roadmap', data),
  evaluateAnswers: (data: any) => apiClient.post('/ai/evaluate-answers', data),
  explainAnswer: (data: any) => apiClient.post('/ai/explain-answer', data),
};

// Task API
export const taskAPI = {
  createTask: (data: any) => apiClient.post('/tasks', data),
  getTasks: () => apiClient.get('/tasks'),
  updateTask: (id: string, data: any) => apiClient.put(`/tasks/${id}`, data),
  deleteTask: (id: string) => apiClient.delete(`/tasks/${id}`),
  markComplete: (id: string) => apiClient.put(`/tasks/${id}/complete`),
};

// User API
export const userAPI = {
  getProfile: () => apiClient.get('/users/profile'),
  updateProfile: (data: any) => apiClient.put('/users/profile', data),
  getUsers: () => apiClient.get('/users'),
};

export default apiClient;