import axios from 'axios';
import config from '../config';

const API_BASE_URL = config.getApiBaseUrl();

const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export const getErrorMessage = (error: any): string => {
    if (error.response?.data?.error) {
        return error.response.data.error;
    }
    if (error.response?.data?.message) {
        return error.response.data.message;
    }
    if (error.message) {
        return error.message;
    }
    return 'An unexpected error occurred';
};

export const authAPI = {
    login: (username: string, password: string) =>
        api.post('/auth/login', { username, password }),
};

export const userAPI = {
    getApplications: () => api.get('/user/applications'),
};

export const adminAPI = {
    getUsers: () => api.get('/admin/users'),
    createUser: (userData: { username: string; password: string; role: string }) =>
        api.post('/admin/users', userData),
    deleteUser: (id: string) => api.delete(`/admin/users/${id}`),

    createApplication: (name: string) => api.post('/admin/applications', { name }),
    deleteApplication: (id: string) => api.delete(`/admin/applications/${id}`),
    regenerateApiKey: (id: string) => api.put(`/admin/applications/${id}/regenerate-key`),
};

export const createFileAPI = (apiKey: string) => {
    const fileAPI = axios.create({
        baseURL: `${API_BASE_URL}/files`,
        headers: {
            'X-API-Key': apiKey,
        },
    });

    return {
        uploadFile: (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            return fileAPI.post('/upload', formData);
        },
        getFiles: () => fileAPI.get('/files'),
        renameFile: (id: string, newName: string) =>
            fileAPI.put(`/files/${id}/rename`, { new_name: newName }),
        convertToWebp: (id: string) => fileAPI.post(`/files/${id}/convert-to-webp`),
        deleteFile: (id: string) => fileAPI.delete(`/files/${id}`),
        downloadFile: (id: string) => fileAPI.get(`/files/${id}/download`, { responseType: 'blob' }),
    };
};

export default api;