import "./App.css";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import AppRoutes from "./routes/AppRoutes";
import { UserRoleProvider } from './context/UserRoleContext';

const App = () => {
  return (
    <UserRoleProvider>
    <AuthProvider>
      <Layout>
        <AppRoutes />
      </Layout>
    </AuthProvider>
    </UserRoleProvider>
  );
};

export default App;
