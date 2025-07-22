import { Routes, Route } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import Dashboard from "../pages/Dashboard";
import CreateTable from "../pages/CreateTimeTable";
import ViewTable from "../pages/ViewCalendar";
import Subjects from "../pages/ManageSubjects";
import Rooms from "../pages/ManageRooms";
import PrivateRoute from "../components/PrivateRoute";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "../components/LoadingScreen";
import AdminDashboard from "../pages/logPage/AdminDashboard";
import FacultyDashboard from "../pages/logPage/FacultyDashboard";
import UpdateTimeTable from "../pages/ViewCalendar";
import ManageCourses from "../pages/ManageCourses";
import ManageFaculty from "../pages/ManageFaculty";
import ManageBatches from "../pages/ManageBatches";
import Attendence from "../pages/MarkAttendance";
import ClassTimeTable from "../pages/ViewTimeTable";
import ViewCalendar from "../pages/ViewCalendar";
import ViewTimeTable from "../pages/ViewTimeTable";
import CreateTimeTable from "../pages/CreateTimeTable";


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
            <CreateTimeTable />
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
        path="/view-calendar"
        element={
          //<PrivateRoute requiredRoles={["Admin", "Faculty"]}>
            <ViewCalendar />
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
        path="/view-timetable"
        element={
          //<PrivateRoute requiredRoles={["Admin", "Faculty"]}>
            <ViewTimeTable />
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
