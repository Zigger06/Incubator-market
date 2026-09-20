// Auth utilities for phone number validation and user management
export const validatePhone = (phone) => {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Check if it matches +992 XX XXX XXXX format
  const pattern = /^\+992\d{9}$/;
  return pattern.test(cleaned);
};

export const formatPhone = (phone) => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If starts with 992, add +
  if (digits.startsWith('992')) {
    return `+${digits}`;
  }
  
  // If starts with 92 (after removing first digit), add +992
  if (digits.startsWith('92') && digits.length === 11) {
    return `+992${digits.slice(2)}`;
  }
  
  // If it's a local number (9 digits starting with 9), add +992
  if (digits.length === 9 && digits.startsWith('9')) {
    return `+992${digits}`;
  }
  
  return phone;
};

export const validatePin = (pin) => {
  return /^\d{4}$/.test(pin);
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

// Simple localStorage-based user management
export const authStorage = {
  getUsers: () => {
    const users = localStorage.getItem('incubator_users');
    return users ? JSON.parse(users) : [];
  },
  
  addUser: (user) => {
    const users = authStorage.getUsers();
    users.push(user);
    localStorage.setItem('incubator_users', JSON.stringify(users));
  },
  
  getUserByPhone: (phone) => {
    const users = authStorage.getUsers();
    return users.find(u => u.phone === phone);
  },
  
  getCurrentUser: () => {
    const currentUser = localStorage.getItem('incubator_current_user');
    return currentUser ? JSON.parse(currentUser) : null;
  },
  
  setCurrentUser: (user) => {
    if (user) {
      localStorage.setItem('incubator_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('incubator_current_user');
    }
  },
  
  logout: () => {
    localStorage.removeItem('incubator_current_user');
  }
};
