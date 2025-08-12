import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Users, Folder, LogOut } from 'lucide-react';

export function Navigation() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(path);
    };

    return (
        <nav className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <h1 className="text-xl font-bold text-gray-900">File Manager</h1>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            {user?.role === 'admin' && (
                                <Link
                                    to="/users"
                                    className={`${
                                        isActive('/users')
                                            ? 'border-blue-500 text-gray-900'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                                >
                                    <Users className="h-4 w-4 mr-2" />
                                    Users
                                </Link>
                            )}
                            <Link
                                to="/applications"
                                className={`${
                                    isActive('/applications')
                                        ? 'border-blue-500 text-gray-900'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                            >
                                <Folder className="h-4 w-4 mr-2" />
                                Applications
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-700">
                            Hello, {user?.username} 
                            <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user?.role === 'admin' 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-gray-100 text-gray-800'
                            }`}>
                                {user?.role}
                            </span>
                        </span>
                        <button
                            onClick={logout}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}