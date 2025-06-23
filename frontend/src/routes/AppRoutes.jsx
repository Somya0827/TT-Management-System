import { Routes, Route } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import Dashboard from "../pages/Dashboard";
import CreateTable from "../pages/CreateTable";
import ViewTable from "../pages/ViewTimeTable";
import Subjects from "../pages/ManageSubjects";
import Rooms from "../pages/ManageRooms";
import PrivateRoute from "../components/PrivateRoute";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "../components/LoadingScreen";
import AdminDashboard from "../pages/logPage/AdminDashboard";    // for future use
import FacultyDashboard from "../pages/logPage/FacultyDashboard";
import UpdateTimeTable from "../pages/ViewTimeTable";
import ManageCourses from "../pages/ManageCourses";
import ManageFaculty from "../pages/ManageFaculty";
import ManageBatches from "../pages/ManageBatches";
import Attendence from "../pages/MarkAttendance";
import ClassTimeTable from "../pages/ClassTimeTable";


const AppRoutes = () => {
  const { loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          // <PrivateRoute requiredRoles={["Admin"]}>
            <Dashboard />
          // </PrivateRoute>
        }
      />
      <Route
        path="/faculty-dashboard"
        element={
          //<PrivateRoute requiredRoles={["Faculty"]}>
            <FacultyDashboard />
          //</PrivateRoute>
        }
      />
      <Route
        path="/create-timetable"
        element={
          //<PrivateRoute requiredRoles={["Admin"]}>
            <CreateTable />
          //</PrivateRoute>
        }
      />
      <Route
        path="/update-timetable"
        element={
          //<PrivateRoute requiredRoles={["Admin"]}>
            <UpdateTimeTable />
          //</PrivateRoute>
        }
      />
      <Route
        path="/view-timetable"
        element={
          //<PrivateRoute requiredRoles={["Admin", "Faculty"]}>
            <ViewTable />
          //</PrivateRoute>
        }
      />
      <Route
        path="/manage-subjects"
        element={
          //<PrivateRoute requiredRoles={["Admin"]}>
            <Subjects />
          //</PrivateRoute>
        }
      />
      <Route
        path="/manage-rooms"
        element={
          //<PrivateRoute requiredRoles={["Admin"]}>
            <Rooms />
          //</PrivateRoute>
        }
      />

      <Route
        path="/manage-courses"
        element={
          //<PrivateRoute requiredRoles={["Admin"]}>
            <ManageCourses/>
          //</PrivateRoute>
        }
      />
      <Route
        path="/manage-faculty"
        element={
          //<PrivateRoute requiredRoles={["Admin"]}>
            <ManageFaculty/>
          //</PrivateRoute>
        }
      />
      <Route
        path="/UpdateTimeTable"
        element={
          //<PrivateRoute requiredRoles={["Admin"]}>
            <UpdateTimeTable/>
          //</PrivateRoute>
        }
      />

      <Route
        path="/class-timetable"
        element={
          //<PrivateRoute requiredRoles={["Admin", "Faculty"]}>
            <ClassTimeTable />
          //</PrivateRoute>
        }
      />

      <Route
        path="/manage-batches"
        element={
          //<PrivateRoute requiredRoles={["Admin"]}>
            <ManageBatches/>
          //</PrivateRoute>
        }
        />
      <Route
        path="/attencendance"
        element={
          //<PrivateRoute requiredRoles={["Admin"]}>
            <Attendence/>
          //</PrivateRoute>
        }
        />
    </Routes>

  );
};

export default AppRoutes;
