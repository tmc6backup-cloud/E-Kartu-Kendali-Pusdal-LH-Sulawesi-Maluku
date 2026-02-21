import React from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-800 text-white transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
      <div className="p-4">
        <h2 className="text-xl font-bold">Sidebar</h2>
        <button onClick={onClose} className="absolute top-2 right-2 text-white">
          X
        </button>
      </div>
      <nav className="mt-4">
        <ul>
          <li className="px-4 py-2 hover:bg-gray-700"><a href="#">Dashboard</a></li>
          <li className="px-4 py-2 hover:bg-gray-700"><a href="#">Requests</a></li>
          <li className="px-4 py-2 hover:bg-gray-700"><a href="#">Users</a></li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
