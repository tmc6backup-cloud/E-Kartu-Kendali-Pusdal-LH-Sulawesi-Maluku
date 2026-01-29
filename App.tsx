
import React, { useContext } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import NewRequest from './pages/NewRequest';
import RequestList from './pages/RequestList';
import RequestDetail from './pages/RequestDetail';
import UserManagement from './pages/UserManagement';
import AdminPagu from './pages/AdminPagu';
import LoginPage from './pages/LoginPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { AuthContext } from './context/AuthContext';

const App: React.FC = () => {
    const { isLoggedIn, user } = useContext(AuthContext);

    return (
        <HashRouter>
            <Routes>
                {/* Rute Login */}
                <Route path="/login" element={!isLoggedIn ? <LoginPage /> : <Navigate to="/" replace />} />
                
                {/* Rute Aplikasi Utama */}
                <Route path="/*" element={
                    isLoggedIn ? (
                        <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC]">
                            <Sidebar />
                            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                                <Header />
                                <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
                                    <Routes>
                                        <Route path="/" element={<Dashboard />} />
                                        <Route path="/requests" element={<RequestList />} />
                                        <Route path="/requests/new" element={<NewRequest />} />
                                        <Route path="/requests/edit/:id" element={<NewRequest />} />
                                        <Route path="/requests/:id" element={<RequestDetail />} />
                                        <Route path="/users" element={user?.role === 'admin' ? <UserManagement /> : <Navigate to="/" replace />} />
                                        <Route path="/ceilings" element={user?.role === 'admin' ? <AdminPagu /> : <Navigate to="/" replace />} />
                                        <Route path="*" element={<Navigate to="/" replace />} />
                                    </Routes>
                                </main>
                            </div>
                        </div>
                    ) : <Navigate to="/login" replace />
                } />
            </Routes>
        </HashRouter>
    );
};

export default App;
