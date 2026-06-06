import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const UserContext = createContext();

export const useUsers = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: true });
    if (!error && data) {
      setUsers(data);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);



  const addUser = async (newUser) => {
    // Generate UUID if not provided
    const userToInsert = {
      username: newUser.username,
      password: newUser.password,
      name: newUser.name,
      role: newUser.role,
      modules: newUser.modules || []
    };

    const { data, error } = await supabase.from('users').insert([userToInsert]).select();
    if (!error && data) {
      setUsers(prev => [...prev, data[0]]);
    }
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
    const { data, error } = await supabase.from('users').update(updatedFields).eq('id', id).select();
    if (!error && data) {
      setUsers(prev => prev.map(u => u.id === id ? data[0] : u));
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
