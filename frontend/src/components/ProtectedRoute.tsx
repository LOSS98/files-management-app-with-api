import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle } from 'lucide-react';

interface ProtectedRouteProps {
    children: ReactNode;
    requiredRole?: 'admin' | 'user';
}

export function ProtectedRoute({ children, requiredRole = 'user' }: ProtectedRouteProps) {
    const { user } = useAuth();

    if (!user) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">Access denied</div>
            </div>
        );
    }

    if (requiredRole === 'admin' && user.role !== 'admin') {
        return (
            <div className="px-4 py-6 sm:px-0">
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                                Access Denied
                            </h3>
                            <p className="text-sm text-red-700 mt-2">
                                You need administrator privileges to access this page.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}