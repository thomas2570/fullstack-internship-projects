import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load initial session
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          // Parallelize profile and workspaces fetch for 2x faster page boot
          const [userRes, wsRes] = await Promise.all([
            client.get('/api/auth/me/'),
            client.get('/api/workspaces/'),
          ]);
          setUser(userRes.data);

          const wsList = wsRes.data.results || wsRes.data || [];
          setWorkspaces(wsList);

          // Restore or select active workspace
          const savedWsId = localStorage.getItem('active_workspace_id');
          let activeWs = wsList.find((w) => w.id === savedWsId) || wsList[0] || null;
          
          if (activeWs) {
            setCurrentWorkspace(activeWs);
            localStorage.setItem('active_workspace_id', activeWs.id);
            await fetchProjects(activeWs.id);
          }
        } catch (err) {
          console.error('Session initialization failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const fetchProjects = async (workspaceId) => {
    try {
      const res = await client.get('/api/projects/', {
        headers: { 'X-Workspace-ID': workspaceId },
      });
      const projList = res.data.results || res.data || [];
      setProjects(projList);

      const savedProjId = localStorage.getItem('active_project_id');
      const activeProj = projList.find((p) => p.id === savedProjId) || projList[0] || null;
      if (activeProj) {
        setCurrentProject(activeProj);
        localStorage.setItem('active_project_id', activeProj.id);
      } else {
        setCurrentProject(null);
        localStorage.removeItem('active_project_id');
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
      setProjects([]);
      setCurrentProject(null);
    }
  };

  const login = async (email, password) => {
    const res = await client.post('/api/auth/login/', { email, password });
    const { access, refresh, user: loggedUser, workspaces: wsList } = res.data;

    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    setUser(loggedUser);
    setWorkspaces(wsList);

    if (wsList && wsList.length > 0) {
      const activeWs = wsList[0];
      setCurrentWorkspace(activeWs);
      localStorage.setItem('active_workspace_id', activeWs.id);
      await fetchProjects(activeWs.id);
    }

    return res.data;
  };

  const register = async (payload) => {
    const res = await client.post('/api/auth/register/', payload);
    const { access, refresh, user: newUser, workspaces: wsList } = res.data;

    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    setUser(newUser);
    setWorkspaces(wsList);

    if (wsList && wsList.length > 0) {
      const activeWs = wsList[0];
      setCurrentWorkspace(activeWs);
      localStorage.setItem('active_workspace_id', activeWs.id);
      await fetchProjects(activeWs.id);
    }

    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('active_workspace_id');
    localStorage.removeItem('active_project_id');
    setUser(null);
    setWorkspaces([]);
    setCurrentWorkspace(null);
    setProjects([]);
    setCurrentProject(null);
  };

  const switchWorkspace = async (workspaceId) => {
    const targetWs = workspaces.find((w) => w.id === workspaceId);
    if (targetWs) {
      setCurrentWorkspace(targetWs);
      localStorage.setItem('active_workspace_id', targetWs.id);
      await fetchProjects(targetWs.id);
    }
  };

  const switchProject = (projectId) => {
    const targetProj = projects.find((p) => p.id === projectId);
    if (targetProj) {
      setCurrentProject(targetProj);
      localStorage.setItem('active_project_id', targetProj.id);
    }
  };

  const refreshWorkspaces = async () => {
    const res = await client.get('/api/workspaces/');
    const wsList = res.data.results || res.data || [];
    setWorkspaces(wsList);
    if (currentWorkspace) {
      const updated = wsList.find((w) => w.id === currentWorkspace.id);
      if (updated) setCurrentWorkspace(updated);
    }
  };

  const userRole = currentWorkspace?.current_user_role || currentWorkspace?.role || 'member';
  const isAdmin = userRole === 'owner' || userRole === 'admin';
  const isOwner = userRole === 'owner';

  return (
    <AuthContext.Provider
      value={{
        user,
        workspaces,
        currentWorkspace,
        projects,
        currentProject,
        userRole,
        isAdmin,
        isOwner,
        loading,
        login,
        register,
        logout,
        switchWorkspace,
        switchProject,
        refreshWorkspaces,
        refreshProjects: () => currentWorkspace && fetchProjects(currentWorkspace.id),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
