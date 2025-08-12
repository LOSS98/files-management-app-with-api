import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { userAPI, createFileAPI, getErrorMessage } from '../services/api';
import { Application, FileRecord } from '../types';
import { formatDate } from '../utils/dateFormatter';
import { Upload, Download, Edit2, Trash2, Image, AlertCircle } from 'lucide-react';

export function ApplicationFileManager() {
    const { id } = useParams<{ id: string }>();
    const [application, setApplication] = useState<Application | null>(null);
    const [files, setFiles] = useState<FileRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [editingFile, setEditingFile] = useState<{ id: string; name: string } | null>(null);
    const [error, setError] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (id) {
            loadApplication();
        }
    }, [id]);

    const loadApplication = async () => {
        try {
            const appsResponse = await userAPI.getApplications();
            const app = appsResponse.data.applications.find((a: Application) => a.id === id);

            if (app) {
                setApplication(app);
                const fileAPI = createFileAPI(app.api_key);
                const filesResponse = await fileAPI.getFiles();
                setFiles(filesResponse.data.files);
                setError('');
            }
        } catch (error) {
            setError(getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile || !application) return;

        setIsUploading(true);
        setError('');

        try {
            const fileAPI = createFileAPI(application.api_key);
            await fileAPI.uploadFile(uploadFile);
            setUploadFile(null);
            loadApplication();
        } catch (error) {
            setError(getErrorMessage(error));
        } finally {
            setIsUploading(false);
        }
    };

    const handleRenameFile = async (fileId: string, newName: string) => {
        if (!application) return;

        try {
            const fileAPI = createFileAPI(application.api_key);
            await fileAPI.renameFile(fileId, newName);
            setEditingFile(null);
            loadApplication();
            setError('');
        } catch (error) {
            setError(getErrorMessage(error));
        }
    };

    const handleDeleteFile = async (fileId: string) => {
        if (!application || !window.confirm('Are you sure you want to delete this file?')) return;

        try {
            const fileAPI = createFileAPI(application.api_key);
            await fileAPI.deleteFile(fileId);
            loadApplication();
            setError('');
        } catch (error) {
            setError(getErrorMessage(error));
        }
    };

    const handleConvertToWebp = async (fileId: string) => {
        if (!application) return;

        try {
            const fileAPI = createFileAPI(application.api_key);
            await fileAPI.convertToWebp(fileId);
            loadApplication();
            setError('');
        } catch (error) {
            setError(getErrorMessage(error));
        }
    };

    const handleDownloadFile = async (fileId: string, fileName: string) => {
        if (!application) return;

        try {
            const fileAPI = createFileAPI(application.api_key);
            const response = await fileAPI.downloadFile(fileId);

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            setError('');
        } catch (error) {
            setError(getErrorMessage(error));
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    if (!application) {
        return (
            <div className="text-center py-12">
                <div className="text-gray-500">Application not found</div>
            </div>
        );
    }

    return (
        <div className="px-4 py-6 sm:px-0">
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-900">
                    Files for {application.name}
                </h1>
                <p className="mt-2 text-sm text-gray-700">
                    Manage files for this application
                </p>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-6 bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Upload File</h3>
                    <form onSubmit={handleFileUpload} className="mt-5">
                        <div className="flex items-center space-x-4">
                            <input
                                type="file"
                                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            <button
                                type="submit"
                                disabled={!uploadFile || isUploading}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                {isUploading ? 'Uploading...' : 'Upload'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {files.map((file) => (
                        <li key={file.id} className="px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    {editingFile?.id === file.id ? (
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="text"
                                                value={editingFile.name}
                                                onChange={(e) => setEditingFile({ ...editingFile, name: e.target.value })}
                                                className="block w-48 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            />
                                            <button
                                                onClick={() => handleRenameFile(file.id, editingFile.name)}
                                                className="text-green-600 hover:text-green-900"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setEditingFile(null)}
                                                className="text-gray-600 hover:text-gray-900"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {file.current_name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {file.file_type} • {formatFileSize(file.size)} •
                                                {formatDate(file.created_at)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center space-x-2">
                                    {file.file_type.startsWith('image/') && file.file_type !== 'image/webp' && (
                                        <button
                                            onClick={() => handleConvertToWebp(file.id)}
                                            className="text-purple-600 hover:text-purple-900"
                                            title="Convert to WebP"
                                        >
                                            <Image className="h-4 w-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDownloadFile(file.id, file.current_name)}
                                        className="text-blue-600 hover:text-blue-900"
                                        title="Download"
                                    >
                                        <Download className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setEditingFile({
                                            id: file.id,
                                            name: file.current_name.replace(/\.[^.]+$/, '')
                                        })}
                                        className="text-yellow-600 hover:text-yellow-900"
                                        title="Rename"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteFile(file.id)}
                                        className="text-red-600 hover:text-red-900"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
                {files.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-500">No files uploaded yet</div>
                    </div>
                )}
            </div>
        </div>
    );
}