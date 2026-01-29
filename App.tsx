
import React, { useContext } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.tsx';
import NewRequest from './pages/NewRequest.tsx';
import RequestList from './pages/RequestList.tsx';
import RequestDetail from './pages/RequestDetail.tsx';
import UserManagement from './pages/UserManagement.tsx';
import AdminPagu from './pages/AdminPagu.tsx';
import LoginPage from './pages/LoginPage.tsx';
import Sidebar from './components/Sidebar.tsx';
import Header from './components/Header.tsx';
import { AuthContext } from './context/AuthContext.tsx';

const App: React.FC = () => {
    const { isLoggedIn } = useContext(AuthContext);

    return (
        <HashRouter>
            <Routes>
                <Route path="/login" element={!isLoggedIn ? <LoginPage /> : <Navigate to="/" replace />} />
                <Route path="/*" element={
                    isLoggedIn ? (
                        <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
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
                                        <Route path="/users" element={<UserManagement />} />
                                        <Route path="/ceilings" element={<AdminPagu />} />
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
