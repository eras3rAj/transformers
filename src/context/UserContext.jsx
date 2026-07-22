import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const UserContext = createContext();

export const useUsers = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: true });
    if (!error && data) {
      const mapped = data.map(u => {
        if (u.role === 'admin' && u.modules && u.modules.includes('ROLE_NORMAL')) {
          return { ...u, role: 'normal', modules: u.modules.filter(m => m !== 'ROLE_NORMAL') };
        }
        return u;
      });
      setUsers(mapped);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);



  const addUser = async (newUser) => {
    let dbRole = newUser.role;
    let dbModules = newUser.modules || [];
    if (dbRole === 'normal') {
      dbRole = 'admin';
      dbModules = [...dbModules, 'ROLE_NORMAL'];
    }

    const userToInsert = {
      username: newUser.username,
      password: newUser.password,
      name: newUser.name,
      role: dbRole,
      modules: dbModules
    };

    const { data, error } = await supabase.from('users').insert([userToInsert]).select();
    if (!error && data) {
      let returnedUser = data[0];
      if (returnedUser.role === 'admin' && returnedUser.modules && returnedUser.modules.includes('ROLE_NORMAL')) {
        returnedUser = { ...returnedUser, role: 'normal', modules: returnedUser.modules.filter(m => m !== 'ROLE_NORMAL') };
      }
      setUsers(prev => [...prev, returnedUser]);
      return { success: true, data: returnedUser };
    }
    return { success: false, error: error?.message || 'Unknown database error' };
  };

  const removeUser = async (id) => {
    // Prevent deleting the default superadmin via client logic
    const user = users.find(u => u.id === id);
    if (user && user.username === 'superadmin') return;

    const { error } = await supabase.from('users').delete().eq('id', id);
    if (!error) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  const toggleUserStatus = async (id, newStatus) => {
    const { data, error } = await supabase.from('users').update({ status: newStatus }).eq('id', id).select();
    if (!error && data) {
      setUsers(prev => prev.map(u => u.id === id ? data[0] : u));
    }
  };

  const updateUser = async (id, updatedFields) => {
    const existingUser = users.find(u => u.id === id);
    if (!existingUser) return;

    let dbFields = { ...updatedFields };
    let dbModules = existingUser.modules || [];

    if ('role' in updatedFields) {
      if (updatedFields.role === 'normal') {
        dbFields.role = 'admin';
        if (!dbModules.includes('ROLE_NORMAL')) dbModules.push('ROLE_NORMAL');
      } else {
        dbModules = dbModules.filter(m => m !== 'ROLE_NORMAL');
      }
    }
    
    if ('modules' in updatedFields) {
      dbModules = [...updatedFields.modules];
      if (existingUser.role === 'normal' || updatedFields.role === 'normal') {
        if (!dbModules.includes('ROLE_NORMAL')) dbModules.push('ROLE_NORMAL');
      }
    }

    if ('role' in updatedFields || 'modules' in updatedFields) {
      dbFields.modules = dbModules;
    }

    const { data, error } = await supabase.from('users').update(dbFields).eq('id', id).select();
    if (!error && data) {
      let returnedUser = data[0];
      if (returnedUser.role === 'admin' && returnedUser.modules && returnedUser.modules.includes('ROLE_NORMAL')) {
        returnedUser = { ...returnedUser, role: 'normal', modules: returnedUser.modules.filter(m => m !== 'ROLE_NORMAL') };
      }
      setUsers(prev => prev.map(u => u.id === id ? returnedUser : u));
    }
  };

  const checkCredentials = (username, password) => {
    return users.find(u => u.username === username && u.password === password);
  };

  return (
    <UserContext.Provider value={{ users, addUser, removeUser, updateUser, toggleUserStatus, checkCredentials }}>
      {children}
    </UserContext.Provider>
  );
};
