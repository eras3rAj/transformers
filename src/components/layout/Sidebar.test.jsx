import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from './Sidebar';

// Mock the AuthContext
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { name: 'Test User', role: 'superadmin' },
    logout: vi.fn()
  })
}));

describe('Sidebar Component', () => {
  const renderSidebar = () => {
    render(
      <BrowserRouter>
        <Sidebar onModuleSelect={() => {}} isOpen={true} toggleSidebar={() => {}} />
      </BrowserRouter>
    );
  };

  it('renders the application title', () => {
    renderSidebar();
    expect(screen.getByText('VoltForge')).toBeInTheDocument();
    expect(screen.getByText('Manufacturing ERP')).toBeInTheDocument();
  });

  it('renders standard navigation links for superadmin', () => {
    renderSidebar();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Purchase Orders')).toBeInTheDocument();
    expect(screen.getByText('Pending Tasks')).toBeInTheDocument();
    expect(screen.getByText('User Management')).toBeInTheDocument();
  });

  it('renders newly added financial modules', () => {
    renderSidebar();
    expect(screen.getByText('Daily Expenses')).toBeInTheDocument();
    expect(screen.getByText('Bank Guarantee & LC')).toBeInTheDocument();
    expect(screen.getByText('Custom Duty')).toBeInTheDocument();
  });
});
