import { createContext, useContext, useState,useEffect } from 'react';

const UserRoleContext = createContext();

export const UserRoleProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('userRole') || null;
  });

  // Function to fetch user role based on username
  const fetchUserRole = async (role) => {
    setUserRole(role);
    localStorage.setItem('userRole', role);
  };

  const clearUserRole = () => {
    setUserRole(null);
    localStorage.removeItem('userRole');
  };

  return (
    <UserRoleContext.Provider value={{ userRole, fetchUserRole }}>
      {children}
    </UserRoleContext.Provider>
  );
};

export const useUserRole = () => useContext(UserRoleContext);

