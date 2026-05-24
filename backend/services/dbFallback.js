const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = process.env.VERCEL 
  ? '/tmp' 
  : path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const INCIDENTS_FILE = path.join(DATA_DIR, 'incidents.json');

// Ensure data directory and files exist
const initFiles = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    // Attempt to seed from local repository file if available during build
    const seedPath = path.join(__dirname, '..', 'data', 'users.json');
    if (fs.existsSync(seedPath)) {
      try {
        fs.copyFileSync(seedPath, USERS_FILE);
      } catch (err) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
      }
    } else {
      fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
    }
  }
  if (!fs.existsSync(INCIDENTS_FILE)) {
    const seedPath = path.join(__dirname, '..', 'data', 'incidents.json');
    if (fs.existsSync(seedPath)) {
      try {
        fs.copyFileSync(seedPath, INCIDENTS_FILE);
      } catch (err) {
        fs.writeFileSync(INCIDENTS_FILE, JSON.stringify([], null, 2));
      }
    } else {
      fs.writeFileSync(INCIDENTS_FILE, JSON.stringify([], null, 2));
    }
  }
};

const readData = (filePath) => {
  initFiles();
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return [];
  }
};

const writeData = (filePath, data) => {
  initFiles();
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error writing to ${filePath}:`, err);
  }
};

// Users functions
const userFallback = {
  find: async () => {
    return readData(USERS_FILE);
  },

  findOne: async (query) => {
    const users = readData(USERS_FILE);
    return users.find(u => {
      for (let key in query) {
        if (u[key] !== query[key]) return false;
      }
      return true;
    });
  },

  findById: async (id) => {
    const users = readData(USERS_FILE);
    const user = users.find(u => u._id === id);
    if (!user) return null;
    // Return with a comparePassword helper function
    return {
      ...user,
      comparePassword: async function(enteredPassword) {
        return bcrypt.compare(enteredPassword, this.password);
      }
    };
  },

  create: async (userData) => {
    const users = readData(USERS_FILE);
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    const newUser = {
      _id: 'u_' + Math.random().toString(36).substr(2, 9),
      name: userData.name,
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      role: userData.role || 'staff',
      storeLocation: userData.storeLocation,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    writeData(USERS_FILE, users);
    
    // Return user with method
    return {
      ...newUser,
      comparePassword: async function(enteredPassword) {
        return bcrypt.compare(enteredPassword, this.password);
      }
    };
  }
};

// Incidents functions
const incidentFallback = {
  find: async (queryFilters = {}) => {
    let incidents = readData(INCIDENTS_FILE);
    const users = readData(USERS_FILE);

    // Apply filters
    if (queryFilters.category) {
      incidents = incidents.filter(i => i.category === queryFilters.category);
    }
    if (queryFilters.severity) {
      incidents = incidents.filter(i => i.severity === queryFilters.severity);
    }
    if (queryFilters.status) {
      incidents = incidents.filter(i => i.status === queryFilters.status);
    }
    if (queryFilters.storeLocation) {
      incidents = incidents.filter(i => i.storeLocation.toLowerCase() === queryFilters.storeLocation.toLowerCase());
    }
    if (queryFilters.search) {
      const searchLower = queryFilters.search.toLowerCase();
      incidents = incidents.filter(i => 
        i.title.toLowerCase().includes(searchLower) || 
        i.description.toLowerCase().includes(searchLower)
      );
    }

    // Sort by Active Critical status first, then by dateTime descending (latest first)
    incidents.sort((a, b) => {
      const aActiveCritical = (a.severity === 'Critical' && a.status !== 'Resolved' && a.status !== 'Closed') ? 1 : 0;
      const bActiveCritical = (b.severity === 'Critical' && b.status !== 'Resolved' && b.status !== 'Closed') ? 1 : 0;

      if (aActiveCritical !== bActiveCritical) {
        return bActiveCritical - aActiveCritical; // Active critical first
      }

      return new Date(b.dateTime) - new Date(a.dateTime); // Secondary sort by date descending
    });

    // Populate reporter info
    return incidents.map(inc => {
      const rep = users.find(u => u._id === inc.reporter);
      return {
        ...inc,
        reporter: rep ? { _id: rep._id, name: rep.name, email: rep.email, role: rep.role, storeLocation: rep.storeLocation } : null
      };
    });
  },

  findById: async (id) => {
    const incidents = readData(INCIDENTS_FILE);
    const users = readData(USERS_FILE);
    
    const incident = incidents.find(i => i._id === id);
    if (!incident) return null;

    const rep = users.find(u => u._id === incident.reporter);
    const resolvedUser = incident.resolvedBy ? users.find(u => u._id === incident.resolvedBy) : null;

    return {
      ...incident,
      reporter: rep ? { _id: rep._id, name: rep.name, email: rep.email, role: rep.role, storeLocation: rep.storeLocation } : null,
      resolvedBy: resolvedUser ? { _id: resolvedUser._id, name: resolvedUser.name, email: resolvedUser.email } : null
    };
  },

  create: async (incidentData) => {
    const incidents = readData(INCIDENTS_FILE);
    
    const newIncident = {
      _id: 'i_' + Math.random().toString(36).substr(2, 9),
      title: incidentData.title,
      category: incidentData.category,
      description: incidentData.description,
      storeLocation: incidentData.storeLocation,
      severity: incidentData.severity,
      status: incidentData.status || 'Open',
      dateTime: incidentData.dateTime ? new Date(incidentData.dateTime).toISOString() : new Date().toISOString(),
      reporter: incidentData.reporter,
      managerNotes: incidentData.managerNotes || '',
      resolutionActions: incidentData.resolutionActions || [],
      image: incidentData.image || '',
      aiSolution: incidentData.aiSolution || '',
      resolvedAt: null,
      resolvedBy: null,
      createdAt: new Date().toISOString()
    };

    incidents.push(newIncident);
    writeData(INCIDENTS_FILE, incidents);
    return newIncident;
  },

  findByIdAndUpdate: async (id, updateData) => {
    const incidents = readData(INCIDENTS_FILE);
    const index = incidents.findIndex(i => i._id === id);
    if (index === -1) return null;

    // Merge updates
    const current = incidents[index];
    const updated = {
      ...current,
      ...updateData,
      // Handle MongoDB format properties if updated directly
      resolvedAt: updateData.resolvedAt !== undefined ? updateData.resolvedAt : current.resolvedAt,
      resolvedBy: updateData.resolvedBy !== undefined ? updateData.resolvedBy : current.resolvedBy,
      resolutionActions: updateData.resolutionActions !== undefined ? updateData.resolutionActions : (current.resolutionActions || [])
    };

    incidents[index] = updated;
    writeData(INCIDENTS_FILE, incidents);

    // Fetch the updated one with populated reporter
    return incidentFallback.findById(id);
  },

  findByIdAndDelete: async (id) => {
    const incidents = readData(INCIDENTS_FILE);
    const filtered = incidents.filter(i => i._id !== id);
    if (filtered.length === incidents.length) return null;
    writeData(INCIDENTS_FILE, filtered);
    return { _id: id };
  }
};

module.exports = {
  UserFallback: userFallback,
  IncidentFallback: incidentFallback
};
