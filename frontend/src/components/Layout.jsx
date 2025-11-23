// frontend/src/components/Layout.jsx
import React, { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Common/Sidebar';
import Header from './Common/Header';

const Layout = () => {
  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
