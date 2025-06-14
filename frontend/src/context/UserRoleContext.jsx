import { createContext, useContext, useState } from 'react';

const UserRoleContext = createContext();

export const UserRoleProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(null);

  // Function to fetch user role based on username
  const fetchUserRole = async (role) => {
    setUserRole(role);
  };

  return (
    <UserRoleContext.Provider value={{ userRole, fetchUserRole }}>
      {children}
    </UserRoleContext.Provider>
  );
};

export const useUserRole = () => useContext(UserRoleContext);

