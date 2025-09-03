export interface User {
    id: string;
    username: string;
    role: 'admin' | 'user';
    created_at: string;
}

export interface Application {
    id: string;
    name: string;
    api_key: string;
    folder_path: string;
    created_at: string;
}

export interface FileRecord {
    id: string;
    application_id: string;
    original_name: string;
    current_name: string;
    file_path: string;
    file_type: string;
    size: number;
    is_public: boolean;
    created_at: string;
}

export interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    isLoading: boolean;
}