import axios from 'axios';

// Configuração para ambiente local
const API_URL = 'http://localhost:8000';
const AUTH_KEY = '@veramo_auth_local';

export async function login(email, password) {
  try {
    const response = await axios.post(`${API_URL}/auth/jwt/create/`, {
      email,
      password,
    });
    const { access, refresh } = response.data;
    
    // Salvar tokens inicialmente
    localStorage.setItem(AUTH_KEY, JSON.stringify({ access, refresh }));
    
    // Buscar informações do usuário
    try {
      const userResponse = await axios.get(`${API_URL}/auth/users/me/`, {
        headers: { Authorization: `Bearer ${access}` },
      });
      setUserInfo(userResponse.data);
    } catch (userError) {
      console.error('Erro ao buscar informações do usuário:', userError);
    }

    return { access, refresh };
  } catch (error) {
    throw error;
  }
}

export async function fetchUserInfo() {
  const tokens = getToken();
  if (!tokens?.access) return null;
  try {
    const response = await axios.get(`${API_URL}/auth/users/me/`, {
      headers: { Authorization: `Bearer ${tokens.access}` },
    });
    setUserInfo(response.data);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      logout();
      window.location.href = '/login';
    }
    return null;
  }
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
}

export function getToken() {
  const json = localStorage.getItem(AUTH_KEY);
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    return parsed;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  const tokens = getToken();
  return !!tokens?.access;
}

export function setUserInfo(user) {
  const tokens = getToken();
  if (tokens) {
    // Remove access/refresh do objeto user antes de salvar
    const { access, refresh, union, ...userSafe } = user;
    localStorage.setItem(AUTH_KEY, JSON.stringify({
      access: tokens.access,
      refresh: tokens.refresh,
      union: typeof union === 'object' && union !== null ? union.id : union,
      ...userSafe
    }));
  }
}

export function getUserInfo() {
  const tokens = getToken();
  if (!tokens) return null;
  // Espera-se que role, nome, etc estejam juntos
  return tokens;
}

export async function refreshToken() {
  const tokens = getToken();
  if (!tokens?.refresh) return null;
  try {
    const response = await axios.post(`${API_URL}/auth/jwt/refresh/`, {
      refresh: tokens.refresh,
    });
    const { access } = response.data;
    localStorage.setItem(AUTH_KEY, JSON.stringify({ ...tokens, access }));
    console.log('[DEBUG] Novo access token após refresh:', access);
    return access;
  } catch (error) {
    console.error('[DEBUG] Erro ao renovar token:', error);
    logout();
    return null;
  }
}

export async function authFetch(url, options = {}) {
  const tokens = getToken();
  if (!tokens?.access) {
    logout();
    window.location.href = '/login';
    throw new Error('Token não encontrado');
  }
  const headers = {
    ...(options.headers || {}),
    'Authorization': `Bearer ${tokens.access}`,
    'Content-Type': 'application/json',
  };
  try {
    const resp = await fetch(url, { ...options, headers });
    if (resp.status === 401) {
      logout();
      window.location.href = '/login';
      throw new Error('Token expirado ou inválido');
    }
    return resp;
  } catch (err) {
    logout();
    window.location.href = '/login';
    throw err;
  }
}
