import { useState } from 'react';

const Sidebar = ({
  error,
  loading,
  sidebarItems,
  activeSection,
  setActiveSection,
  refreshData,
  isInitialized,
  collapsed,
  setCollapsed,
}) => {

  return (
    <nav
      className={`bg-white border-end p-3 custom-sidebar d-flex flex-column ${
        collapsed ? 'collapsed-sidebar' : ''
      }`}
      style={{ width: collapsed ? '80px' : '250px', transition: 'width 0.3s' }}
      role="navigation"
    >
      {/* Collapse Button */}
      <button
        className="btn btn-light btn-sm align-self-end mb-3"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <i className={`bi ${collapsed ? 'bi-chevron-double-right' : 'bi-chevron-double-left'}`}></i>
      </button>

      {/* Error Message */}
      {error && !collapsed && (
        <div className="alert alert-danger alert-sm mb-3" role="alert">
          <small>{error}</small>
          <button
            className="btn btn-sm btn-outline-danger mt-2 w-100"
            onClick={refreshData}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Sidebar Items */}
      {sidebarItems.map((item) => (
        <button
          key={item.key}
          className={`btn d-flex align-items-center mb-2 w-100 ${
            activeSection === item.key ? 'btn-success' : 'btn-outline-success'
          } ${collapsed ? 'justify-content-center' : 'justify-content-between text-start'}`}
          onClick={() => setActiveSection(item.key)}
          disabled={loading}
          aria-label={item.label}
          title={collapsed ? item.label : ''}
        >
          <span className="d-flex align-items-center position-relative">
            <i className={`bi ${item.icon} fs-5`}></i>

            {/* Count badge for collapsed mode */}
            {collapsed &&
              (loading ? (
                <span
                  className="position-absolute top-0 start-100 translate-middle spinner-border spinner-border-sm text-light"
                  style={{ width: '0.8rem', height: '0.8rem' }}
                  role="status"
                ></span>
              ) : (
                <span
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-light text-dark"
                  style={{ fontSize: '0.6rem' }}
                >
                  {item.count}
                </span>
              ))}
          </span>

          {/* Expanded label and count */}
          {!collapsed && (
            <>
              <span className="ms-2 flex-grow-1">{item.label}</span>
              <span className="badge bg-light text-dark ms-auto">
                {loading ? (
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                ) : (
                  item.count
                )}
              </span>
            </>
          )}
        </button>
      ))}

    </nav>
  );
};

export default Sidebar;