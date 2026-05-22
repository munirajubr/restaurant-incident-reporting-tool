const API_BASE = 'https://restaurant-incident-reporting-tool.vercel.app';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  let data = {};
  
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = { error: await response.text() };
  }

  if (!response.ok) {
    throw new Error(data.error || 'Request failed. Please try again.');
  }
  return data;
};

export const api = {
  // Authentication services
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  register: async (userData) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me?_t=${Date.now()}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Incident reporting services
  getIncidents: async (filters = {}) => {
    const query = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        query.append(key, filters[key]);
      }
    });
    query.append('_t', Date.now());
    
    const queryString = query.toString();
    const url = `${API_BASE}/incidents${queryString ? `?${queryString}` : ''}`;
    
    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getIncidentById: async (id) => {
    const res = await fetch(`${API_BASE}/incidents/${id}?_t=${Date.now()}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  createIncident: async (incidentData) => {
    const res = await fetch(`${API_BASE}/incidents`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(incidentData),
    });
    return handleResponse(res);
  },

  updateIncidentStatus: async (id, status, managerNotes, resolutionActions) => {
    const res = await fetch(`${API_BASE}/incidents/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status, managerNotes, resolutionActions }),
    });
    return handleResponse(res);
  },

  deleteIncident: async (id) => {
    const res = await fetch(`${API_BASE}/incidents/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getIncidentStats: async () => {
    const res = await fetch(`${API_BASE}/incidents/stats?_t=${Date.now()}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};
