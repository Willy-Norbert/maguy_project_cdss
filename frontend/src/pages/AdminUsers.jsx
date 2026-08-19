import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { UserCheck, ShieldAlert, Activity, UserX, UserPlus } from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', username: '', password: '', role: 'NURSE' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/users', newUser);
      setNewUser({ name: '', username: '', password: '', role: 'NURSE' });
      await fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, isActive) => {
    if (!window.confirm(`Are you sure you want to ${isActive ? 'deactivate' : 'reactivate'} this user?`)) return;
    try {
      await api.patch(`/users/${id}/toggle-status`);
      await fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update user status');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p>Create and manage system access for doctors and nurses.</p>
        </div>
      </div>

      <div className="grid cols-3 gap-8">
        <div className="col-span-2 card">
          <h3 className="mb-4">System Users</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ opacity: u.isActive ? 1 : 0.6 }}>
                    <td className="font-medium">{u.name}</td>
                    <td>{u.username}</td>
                    <td>
                      {u.role === 'ADMIN' && <ShieldAlert size={14} className="inline mr-1" />}
                      {u.role === 'DOCTOR' && <Activity size={14} className="inline mr-1" />}
                      {u.role === 'NURSE' && <UserCheck size={14} className="inline mr-1" />}
                      {u.role}
                    </td>
                    <td>
                      {u.isActive ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge badge-neutral">Inactive</span>
                      )}
                    </td>
                    <td>
                      {u.role !== 'ADMIN' && (
                        <button 
                          className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => handleToggleStatus(u.id, u.isActive)}
                        >
                          {u.isActive ? <><UserX size={14}/> Deactivate</> : <><UserCheck size={14}/> Reactivate</>}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card h-fit">
          <h3 className="mb-4">Add New Provider</h3>
          <form onSubmit={handleCreate}>
            <div className="input-group">
              <label>Full Name</label>
              <input type="text" className="input" required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Username</label>
              <input type="text" className="input" required value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input type="password" className="input" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Role</label>
              <select className="input" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                <option value="NURSE">Nurse / Midwife</option>
                <option value="DOCTOR">Doctor / Obstetrician</option>
                <option value="ADMIN">System Administrator</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary mt-2" style={{ width: '100%' }} disabled={isSubmitting}>
              <UserPlus size={16} /> Create Account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
