import { Routes, Route } from 'react-router-dom';
import { Navigation } from './Navigation';
import { UsersManagement } from './UsersManagement';
import { ApplicationsManagement } from './ApplicationsManagement';
import { ApplicationFileManager } from './ApplicationFileManager';
import { ProtectedRoute } from './ProtectedRoute';

export function Dashboard() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <Routes>
                    <Route path="/" element={<DashboardHome />} />
                    <Route path="/users" element={
                        <ProtectedRoute requiredRole="admin">
                            <UsersManagement />
                        </ProtectedRoute>
                    } />
                    <Route path="/applications" element={<ApplicationsManagement />} />
                    <Route path="/applications/:id/files" element={<ApplicationFileManager />} />
                </Routes>
            </main>
        </div>
    );
}

function DashboardHome() {
    return (
        <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">File Management System</h1>
                    <p className="mt-2 text-gray-600">Select an option from the navigation menu</p>
                </div>
            </div>
        </div>
    );
}