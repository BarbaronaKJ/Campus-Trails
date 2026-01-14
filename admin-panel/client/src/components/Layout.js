import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

function Layout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>Campus Trails</h2>
          <p>Admin Panel</p>
        </div>
        <div className="user-info">
          <p>{user?.email}</p>
          <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
        </div>
        <ul className="sidebar-menu">
          <li><Link to="/">Dashboard</Link></li>
          <li><Link to="/pins">Pins</Link></li>
          <li><Link to="/users">Users</Link></li>
          <li><Link to="/campuses">Campuses</Link></li>
          <li><Link to="/notifications">Notifications</Link></li>
          <li><Link to="/feedbacks">Feedbacks</Link></li>
          <li><Link to="/developers">Developers</Link></li>
        </ul>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
