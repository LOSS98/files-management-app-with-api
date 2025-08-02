import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

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

export const authAPI = {
    login: (username: string, password: string) =>
        api.post('/auth/login', { username, password }),
};

export const adminAPI = {
    getUsers: () => api.get('/admin/users'),
    createUser: (userData: { username: string; password: string; role: string }) =>
        api.post('/admin/users', userData),
    deleteUser: (id: string) => api.delete(`/admin/users/${id}`),

    getApplications: () => api.get('/admin/applications'),
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
        convertToSvg: (id: string) => fileAPI.post(`/files/${id}/convert-to-svg`),
        deleteFile: (id: string) => fileAPI.delete(`/files/${id}`),
        downloadFile: (id: string) => fileAPI.get(`/files/${id}/download`, { responseType: 'blob' }),
    };
};

export default api;