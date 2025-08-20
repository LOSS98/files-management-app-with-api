import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userAPI, adminAPI, getErrorMessage } from '../services/api';
import { Application } from '../types';
import { formatDate } from '../utils/dateFormatter';
import { Plus, Trash2, Key, Files, Copy, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function ApplicationsManagement() {
    const { user } = useAuth();
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newAppName, setNewAppName] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        loadApplications();
    }, []);

    const loadApplications = async () => {
        try {
            const response = await userAPI.getApplications();
            setApplications(response.data.applications);
            setError('');
        } catch (error) {
            setError(getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateApplication = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAppName.trim()) {
            setError('Application name is required');
            return;
        }
        
        setIsSubmitting(true);
        setError('');
        
        try {
            await adminAPI.createApplication(newAppName);
            setNewAppName('');
            setShowCreateForm(false);
            loadApplications();
        } catch (error) {
            setError(getErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteApplication = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this application?')) {
            try {
                await adminAPI.deleteApplication(id);
                loadApplications();
                setError('');
            } catch (error) {
                setError(getErrorMessage(error));
            }
        }
    };

    const handleRegenerateApiKey = async (id: string) => {
        if (window.confirm('Are you sure you want to regenerate the API key?')) {
            try {
                await adminAPI.regenerateApiKey(id);
                loadApplications();
                setError('');
            } catch (error) {
                setError(getErrorMessage(error));
            }
        }
    };

    const copyApiKey = (apiKey: string) => {
        navigator.clipboard.writeText(apiKey);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    return (
        <div className="px-4 py-6 sm:px-0">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-xl font-semibold text-gray-900">Applications</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        {isAdmin ? 'Manage applications and their API keys.' : 'View applications and manage files.'}
                    </p>
                </div>
                {isAdmin && (
                    <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Application
                        </button>
                    </div>
                )}
            </div>

            {error && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {isAdmin && showCreateForm && (
                <div className="mt-6 bg-white shadow sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Create New Application</h3>
                        <form onSubmit={handleCreateApplication} className="mt-5 space-y-4">
                            <div>
                                <input
                                    type="text"
                                    placeholder="Application Name"
                                    required
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    value={newAppName}
                                    onChange={(e) => setNewAppName(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Creating...' : 'Create Application'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateForm(false);
                                        setError('');
                                        setNewAppName('');
                                    }}
                                    disabled={isSubmitting}
                                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {applications.map((app) => (
                    <div key={app.id} className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">{app.name}</h3>
                                {isAdmin && (
                                    <button
                                        onClick={() => handleDeleteApplication(app.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            <div className="mt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-500">API Key:</span>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => copyApiKey(app.api_key)}
                                            className="text-blue-600 hover:text-blue-900"
                                            title="Copy API Key"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </button>
                                        {isAdmin && (
                                            <button
                                                onClick={() => handleRegenerateApiKey(app.id)}
                                                className="text-orange-600 hover:text-orange-900"
                                                title="Regenerate API Key"
                                            >
                                                <Key className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <code className="text-xs bg-gray-100 p-2 rounded block break-all">
                                    {app.api_key}
                                </code>
                            </div>
                            <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Created: {formatDate(app.created_at)}
                </span>
                                <Link
                                    to={`/applications/${app.id}/files`}
                                    className="inline-flex items-center text-blue-600 hover:text-blue-900"
                                >
                                    <Files className="h-4 w-4 mr-1" />
                                    Manage Files
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}