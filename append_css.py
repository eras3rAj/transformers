with open('src/index.css', 'a', encoding='utf-8') as f:
    f.write("""
/* UI/UX Improvements */

/* Glassmorphism */
.glass-panel {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

[data-theme='dark'] .glass-panel {
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.modal-backdrop {
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  background-color: rgba(15, 23, 42, 0.4);
}

/* Micro-animations */
.card {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
}

[data-theme='dark'] .card:hover {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
}

.btn {
  transition: all 0.2s ease-in-out;
}

.btn:active {
  transform: scale(0.97);
}

/* Mobile Sidebar Overrides */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -280px;
    top: 0;
    bottom: 0;
    z-index: 100;
    transition: left 0.3s ease-in-out;
    box-shadow: none;
  }
  
  .sidebar.mobile-open {
    left: 0;
    box-shadow: 4px 0 24px rgba(0,0,0,0.15);
  }
  
  .main-content {
    margin-left: 0 !important;
    width: 100%;
  }

  .mobile-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(2px);
    z-index: 90;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }

  .mobile-overlay.open {
    opacity: 1;
    pointer-events: auto;
  }
  
  .mobile-header-toggle {
    display: flex !important;
  }
}

.mobile-header-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  padding: 0.5rem;
  margin-right: 1rem;
}
""")
