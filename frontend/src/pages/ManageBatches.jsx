import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Heading from "../components/Heading";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaTimes,
  FaCalendar,
  FaSpinner,
  FaSearch,
  FaBook,
} from "react-icons/fa";
import { useUserRole } from "../context/UserRoleContext";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const toastCustomStyles = `
  @media (max-width: 480px) {
    .Toastify__toast {
      margin: 20px ;
      width: calc(100% - 40px);
      padding: 14px ;
      border-radius: 8px;
    }
  }
`;

const ManageBatches = () => {
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addingBatch, setAddingBatch] = useState(false);
  const [editingBatch, setEditingBatch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newBatch, setNewBatch] = useState({
    ID: "",
    year: "",
    section: "",
    course_id: "",
  });
  const { userRole } = useUserRole();

  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const API_ENDPOINTS = {
    GET_BATCHES: `${API_BASE_URL}/batch`,
    GET_COURSES: `${API_BASE_URL}/course`,
    ADD_BATCH: `${API_BASE_URL}/batch`,
    UPDATE_BATCH: (id) => `${API_BASE_URL}/batch/${id}`,
    DELETE_BATCH: (id) => `${API_BASE_URL}/batch/${id}`,
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.GET_COURSES, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch courses");
      const data = await response.json();
      setCourses(data);
      console.log(userRole);
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  };

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);

      const [batchesResponse] = await Promise.all([
        fetch(API_ENDPOINTS.GET_BATCHES, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }),
        fetchCourses(),
      ]);

      if (!batchesResponse.ok) {
        throw new Error(`HTTP error! status: ${batchesResponse.status}`);
      }

      const batchesData = await batchesResponse.json();

      const formattedBatches = batchesData.map((batch) => ({
        id: batch.ID,
        year: batch.Year.toString(), // Store as string in frontend
        section: batch.Section,
        course_id: batch.CourseID,
      }));

      setBatches(formattedBatches);
      setFilteredBatches(formattedBatches);
    } catch (err) {
      console.error("Error fetching batches:", err);
      setError("Failed to load batches. Please try again.");
      setBatches([]);
      setFilteredBatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    const results = batches.filter(
      (batch) =>
        (batch.year &&
          batch.year
            .toString()
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (batch.section &&
          batch.section.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (batch.course_id &&
          batch.course_id
            .toString()
            .toLowerCase()
            .includes(searchTerm.toLowerCase()))
    );
    setFilteredBatches(results);
  }, [searchTerm, batches]);

  const handleSaveNewBatch = async () => {
    if (
      !newBatch.year.trim() ||
      !newBatch.section.trim() ||
      !newBatch.course_id
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate year is a valid number
    const yearNumber = parseInt(newBatch.year.trim());
    if (isNaN(yearNumber)) {
      toast.error("Please enter a valid year (numbers only)");
      return;
    }

    try {
      setAddingBatch(true);

      const batchData = {
        Year: yearNumber, // Convert to number for backend
        Section: newBatch.section.trim().toUpperCase(),
        CourseID: Number(newBatch.course_id),
      };

      const isUpdate = !!newBatch.id;
      const endpoint = isUpdate
        ? API_ENDPOINTS.UPDATE_BATCH(newBatch.id)
        : API_ENDPOINTS.ADD_BATCH;
      const method = isUpdate ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(batchData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || JSON.stringify(errorData));
      }

      await fetchBatches();
      setNewBatch({ year: "", section: "", course_id: "" });
      setShowAddDialog(false);
      toast.success(`Batch ${newBatch.id ? 'updated' : 'added'} successfully!`);

    } catch (err) {
      console.error("Full error:", err);
      let errorMessage = err.message;
      toast.error(
        `Failed to ${newBatch.id ? "update" : "add"} batch: ${errorMessage}`
      );
    } finally {
      setAddingBatch(false);
    }
  };
  const handleDelete = async (id) => {
    toast.info(
      <div>
        <div className="mb-2">Are you sure you want to delete this batch?</div>
        <div className="flex justify-end space-x-2 mt-2">
          <button
            onClick={() => {
              toast.dismiss();
              performDelete(id);
            }}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss()}
            className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>,
      {
        autoClose: false,
        closeButton: false,
        position:  'top-right',
        // className: 'mt-4 my-2 sm:mt-2 mx-2', // Responsive margins
      }
    );
  };

  const performDelete = async (id) => {

    try {
      const response = await fetch(API_ENDPOINTS.DELETE_BATCH(id), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });


      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setBatches(batches.filter((batch) => batch.id !== id));
      setFilteredBatches(filteredBatches.filter((batch) => batch.id !== id));
       toast.success('Batch deleted successfully!');
    } catch (err) {
      console.error("Error deleting batch:", err);
      toast.error(`Failed to delete batch: ${err.message}`);
    }
  };

  const handleEdit = (id) => {
    const batchToEdit = batches.find((batch) => batch.id === id);
    if (batchToEdit) {
      setNewBatch({
        id: batchToEdit.id,
        year: batchToEdit.year.toString(), // Ensure year is string
        section: batchToEdit.section,
        course_id: batchToEdit.course_id,
      });
      setShowAddDialog(true);
    }
  };

  const handleAddNewBatch = () => {
    setNewBatch({ year: "", section: "", course_id: "" });
    setShowAddDialog(true);
  };

  const handleCancelAdd = () => {
    setNewBatch({ year: "", section: "", course_id: "" });
    setShowAddDialog(false);
  };

  const getCoursesDisplay = (batch) => {
    const course = courses.find((c) => c.ID === batch.course_id);
    return course ? `${course.Code} - ${course.Name}` : "General Course";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <FaSpinner className="animate-spin text-blue-500 text-2xl" />
            <span className="text-slate-600 text-lg">Loading batches...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-lg mb-4">{error}</div>
            <button
              onClick={fetchBatches}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
       <style dangerouslySetInnerHTML={{ __html: toastCustomStyles }} />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
    />
      {/* Header Section */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Heading text={userRole === "admin" ? "Manage Batches" : "View Batches"} />
      <p className="text-slate-600 mt-2 text-sm sm:text-base">
        {userRole === "admin" ? "Add, edit, and manage course batches" : "View course batches"}
      </p>
          </div>
          {/* <button
            onClick={() => navigate("/dashboard")}
            className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
          >
            Back to Dashboard
          </button> */}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50 px-6 py-4 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-orange-500 to-red-600 p-2 rounded-lg">
                <FaBook className="text-white text-lg" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Batch Management
                </h2>
                <p className="text-sm text-slate-600">
                  {filteredBatches.length} of {batches.length} batches
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {userRole === 'admin' && (
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search batches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                />
              </div>
              )}
               {userRole === "admin" && (
              <button
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm font-medium"
                onClick={handleAddNewBatch}
              >
                <FaPlus className="text-sm" />
                <span>Add Batch</span>
              </button>
               )}
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className={`px-6 py-4 text-left font-semibold ${userRole === 'admin' ? 'w-1/4' : 'w-1/3'}`}>Year</th>
                  <th className={`px-6 py-4 text-left font-semibold ${userRole === 'admin' ? 'w-1/4' : 'w-1/3'}`}>Section</th>
                  <th className={`px-6 py-4 text-left font-semibold ${userRole === 'admin' ? 'w-1/4' : 'w-1/3'}`}>Course ID</th>
                  {userRole === "admin" && (
                    <th className="px-6 py-4 text-center font-semibold w-1/4">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map((batch) => (
                  <tr
                    key={`desktop-${batch.id}`}
                    className="hover:bg-blue-50 transition-colors duration-150"
                  >
                    <td className={`px-6 py-4 ${userRole === 'admin' ? 'w-1/4' : 'w-1/3'}`}>{batch.year}</td>
                    <td className={`px-6 py-4 ${userRole === 'admin' ? 'w-1/4' : 'w-1/3'}`}>{batch.section}</td>
                    <td className={`px-6 py-4 ${userRole === 'admin' ? 'w-1/4' : 'w-1/3'}`}>{getCoursesDisplay(batch)}</td>
                    {userRole === "admin" && (
                      <td className="px-6 py-4 w-1/4">
                        <div className="flex justify-center space-x-2">
                          <button
                            className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg"
                            onClick={() => handleEdit(batch.id)}
                            title="Edit Batch"
                          >
                            <FaEdit className="text-sm" />
                          </button>
                          <button
                            className="bg-rose-500 hover:bg-rose-600 text-white p-2 rounded-lg"
                            onClick={() => handleDelete(batch.id)}
                            title="Delete Batch"
                          >
                            <FaTrash className="text-sm" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-slate-200">
            {filteredBatches.map((batch) => (
              <div
                key={`mobile-${batch.id}`}
                className="p-4 hover:bg-slate-50 transition-colors duration-150"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-mono font-medium">
                    {batch.id}
                  </span>
                  {userRole === "admin" && (
                    <div className="flex space-x-2">
                      <button
                        className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg"
                        onClick={() => handleEdit(batch.id)}
                      >
                        <FaEdit className="text-sm" />
                      </button>
                      <button
                        className="bg-rose-500 hover:bg-rose-600 text-white p-2 rounded-lg"
                        onClick={() => handleDelete(batch.id)}
                      >
                        <FaTrash className="text-sm" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="font-medium text-slate-800 mb-1">
                  Year: {batch.year}
                </div>
                <div className="text-sm text-slate-600">
                  Section: {batch.section}
                </div>
                <div className="text-sm text-slate-600">
                  Course ID: {batch.course_id}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredBatches.length === 0 && (
            <div className="text-center py-12">
              <FaBook className="mx-auto text-slate-400 text-4xl mb-4" />
              <h3 className="text-lg font-medium text-slate-800 mb-2">
                {searchTerm ? "No matching batches found" : "No Batches Found"}
              </h3>
              <p className="text-slate-600 mb-4">
                {searchTerm
                  ? "Try a different search term"
                  : "Get started by adding your first batch."}
              </p>
              {!searchTerm && (
                <button
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2 mx-auto shadow-sm font-medium"
                  onClick={handleAddNewBatch}
                >
                  <FaPlus />
                  <span>Add First Batch</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Batch Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-slate-200 rounded-t-xl">
              <h3 className="text-lg font-semibold text-slate-800">
                {newBatch.id ? "Edit Batch" : "Add New Batch"}
              </h3>
              <button
                onClick={handleCancelAdd}
                className="text-slate-400 hover:text-slate-600 transition-colors duration-200"
                disabled={addingBatch}
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Year */}
              <div>
                <label
                  htmlFor="batchYear"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Year *
                </label>
                <input
                  id="batchYear"
                  type="text"
                  value={newBatch.year}
                  onChange={(e) => {
                    const value = e.target.value
                    setNewBatch((prev) => ({ ...prev, year: value }))
                  }}
                  placeholder="Enter batch year (e.g., 2023)"
                  disabled={addingBatch}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Section */}
              <div>
                <label
                  htmlFor="batchSection"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Section *
                </label>
                <input
                  id="batchSection"
                  type="text"
                  value={newBatch.section}
                  onChange={(e) =>
                    setNewBatch((prev) => ({
                      ...prev,
                      section: e.target.value,
                    }))
                  }
                  placeholder="Enter section (e.g., A, B)"
                  disabled={addingBatch}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Course ID */}
              <div>
                <label
                  htmlFor="course_id"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Course *
                </label>
                <select
                  id="course_id"
                  value={newBatch.course_id}
                  onChange={(e) =>
                    setNewBatch((prev) => ({
                      ...prev,
                      course_id: e.target.value,
                    }))
                  }
                  disabled={addingBatch || courses.length === 0}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.ID} value={course.ID}>
                      {course.Code} - {course.Name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleSaveNewBatch}
                  disabled={
                    !newBatch.year ||
                    !newBatch.section.trim() ||
                    !newBatch.course_id ||
                    addingBatch
                  }
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 text-white py-3 px-4 rounded-lg transition-all duration-200 font-medium disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {addingBatch ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      <span>{newBatch.id ? "Updating..." : "Adding..."}</span>
                    </>
                  ) : (
                    <span>{newBatch.id ? "Update Batch" : "Add Batch"}</span>
                  )}
                </button>
                <button
                  onClick={handleCancelAdd}
                  disabled={addingBatch}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-700 py-3 px-4 rounded-lg transition-colors duration-200 font-medium disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBatches;
