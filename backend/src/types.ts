export interface User {
    id: string;
    username: string;
    password: string;
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
    created_at: string;
}

export interface AuthToken {
    userId: string;
    username: string;
    role: string;
}