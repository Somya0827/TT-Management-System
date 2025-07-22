import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import Heading from "../components/Heading";
import { FaEdit, FaTrash, FaPlus, FaTimes, FaUserTie, FaSpinner, FaSearch } from "react-icons/fa";
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

const ManageFaculty = () => {
    const [faculties, setFaculties] = useState([]);
    const [filteredFaculties, setFilteredFaculties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [addingFaculty, setAddingFaculty] = useState(false);
    const [editingFaculty, setEditingFaculty] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [newFaculty, setNewFaculty] = useState({
        ID: "",
        Name: ""
    });
    const { userRole } = useUserRole();

    const navigate = useNavigate();

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const API_ENDPOINTS = {
        GET_FACULTIES: `${API_BASE_URL}/faculty`,
        ADD_FACULTY: `${API_BASE_URL}/faculty`,
        UPDATE_FACULTY: (id) => `${API_BASE_URL}/faculty/${id}`,
        DELETE_FACULTY: (id) => `${API_BASE_URL}/faculty/${id}`
    };

    const fetchFaculties = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(API_ENDPOINTS.GET_FACULTIES, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include' // Include cookies for session management
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            // Sort faculty names alphabetically
            const sortedData = data.sort((a, b) => a.Name.localeCompare(b.Name));
            setFaculties(sortedData);
            setFilteredFaculties(sortedData);
        } catch (err) {
            console.error('Error fetching faculties:', err);
            setError('Failed to load faculties. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFaculties();
    }, []);

    useEffect(() => {
        const results = faculties.filter(faculty =>
            faculty.Name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        // Sort filtered results alphabetically
        const sortedResults = results.sort((a, b) => a.Name.localeCompare(b.Name));
        setFilteredFaculties(sortedResults);
    }, [searchTerm, faculties]);

    const handleSaveFaculty = async () => {
        if (!newFaculty.Name.trim()) {
            toast.error('Please enter a faculty name');
            return;
        }

        try {
            editingFaculty ? setEditingFaculty(true) : setAddingFaculty(true);

            const endpoint = editingFaculty
                ? API_ENDPOINTS.UPDATE_FACULTY(newFaculty.ID)
                : API_ENDPOINTS.ADD_FACULTY;

            const method = editingFaculty ? 'PUT' : 'POST';

            const facultyData = {
                Name: newFaculty.Name.trim()
            };

            if (editingFaculty) {
                facultyData.ID = newFaculty.ID;
            }

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Include cookies for session management
                body: JSON.stringify(facultyData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to ${editingFaculty ? 'update' : 'add'} faculty`);
            }

            await fetchFaculties();
            resetForm();
            setShowAddDialog(false);
            toast.success(`Faculty ${editingFaculty ? 'updated' : 'added'} successfully!`);

        } catch (err) {
            console.error(`Error ${editingFaculty ? 'updating' : 'adding'} faculty:`, err);
            toast.error(`Failed to ${editingFaculty ? 'update' : 'add'} faculty: ${err.message}`);
        } finally {
            setAddingFaculty(false);
            setEditingFaculty(false);
        }
    };

    const handleDelete = async (id) => {
        toast.info(
            <div>
                <div className="mb-2">Are you sure you want to delete this faculty member?</div>
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
                position: 'top-center',
            }
        );
    }
    const performDelete = async (id) => {

        try {
            const response = await fetch(API_ENDPOINTS.DELETE_FACULTY(id), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include' // Include cookies for session management
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            setFaculties(faculties.filter(faculty => faculty.ID !== id));
            setFilteredFaculties(filteredFaculties.filter(faculty => faculty.ID !== id).sort((a, b) => a.Name.localeCompare(b.Name)));
            toast.success("Faculty Deleted Successfully");
        } catch (err) {
            console.error('Error deleting faculty:', err);
            toast.error(`Failed to delete faculty: ${err.message}`);
        }
    };

    const handleEdit = (faculty) => {
        setNewFaculty({
            ID: faculty.ID,
            Name: faculty.Name
        });
        setEditingFaculty(true);
        setShowAddDialog(true);
    };

    const handleAddNewFaculty = () => {
        resetForm();
        setShowAddDialog(true);
    };

    const handleCancel = () => {
        resetForm();
        setShowAddDialog(false);
    };

    const resetForm = () => {
        setNewFaculty({
            ID: "",
            Name: ""
        });
        setEditingFaculty(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
                <div className="flex items-center justify-center h-64">
                    <div className="flex items-center space-x-3">
                        <FaSpinner className="animate-spin text-blue-500 text-2xl" />
                        <span className="text-slate-600 text-lg">Loading faculties...</span>
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
                            onClick={fetchFaculties}
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
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
            {/* Header Section */}
            <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                         <Heading text={userRole === "admin" ? "Manage Faculty" : "View Faculty "} />
                          <p className="text-slate-600 mt-2 text-sm sm:text-base">
                            {userRole === "admin" ? "Add, edit, and manage Faculty members" : "View Faculty members"}
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

                    {/* Table Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50 px-6 py-4 border-b border-slate-200">
                        <div className="flex items-center space-x-3">
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-2 rounded-lg">
                                <FaUserTie className="text-white text-lg" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">Faculty Management</h2>
                                <p className="text-sm text-slate-600">{filteredFaculties.length} of {faculties.length} members</p>
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
                                    placeholder="Search faculty..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                />
                            </div>
                          )}
                            {userRole === "admin" && (
                            <button
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm font-medium"
                                onClick={handleAddNewFaculty}
                            >
                                <FaPlus className="text-sm" />
                                <span>Add Faculty</span>
                            </button>
                            )}
                        </div>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-800 text-white">
                                    <th className="px-6 py-4 text-left font-semibold">Faculty Name</th>
                                    {userRole === "admin" && (
                                    <th className="px-6 py-4 text-center font-semibold">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFaculties.map((faculty) => (
                                    <tr
                                        key={`desktop-${faculty.ID}`}
                                        className="hover:bg-blue-50 transition-colors duration-150"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-800">{faculty.Name}</div>
                                        </td>
                                        {userRole === "admin" && (
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center space-x-2">
                                                <button
                                                    className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg transition-colors duration-200 shadow-sm"
                                                    onClick={() => handleEdit(faculty)}
                                                    title="Edit Faculty"
                                                >
                                                    <FaEdit className="text-sm" />
                                                </button>
                                                <button
                                                    className="bg-rose-500 hover:bg-rose-600 text-white p-2 rounded-lg transition-colors duration-200 shadow-sm"
                                                    onClick={() => handleDelete(faculty.ID)}
                                                    title="Delete Faculty"
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
                        {filteredFaculties.map((faculty) => (
                            <div
                                key={`mobile-${faculty.ID}`}
                                className="p-4 hover:bg-slate-50 transition-colors duration-150"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="font-medium text-slate-800">{faculty.Name}</div>
                                    {userRole === "admin" && (
                                    <div className="flex space-x-2">
                                        <button
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg transition-colors duration-200"
                                            onClick={() => handleEdit(faculty)}
                                        >
                                            <FaEdit className="text-sm" />
                                        </button>
                                        <button
                                            className="bg-rose-500 hover:bg-rose-600 text-white p-2 rounded-lg transition-colors duration-200"
                                            onClick={() => handleDelete(faculty.ID)}
                                        >
                                            <FaTrash className="text-sm" />
                                        </button>
                                    </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Empty State */}
                    {filteredFaculties.length === 0 && !loading && (
                        <div className="text-center py-12">
                            <FaUserTie className="mx-auto text-slate-400 text-4xl mb-4" />
                            <h3 className="text-lg font-medium text-slate-800 mb-2">
                                {searchTerm ? "No matching faculty found" : "No Faculty Members Found"}
                            </h3>
                            <p className="text-slate-600 mb-4">
                                {searchTerm ? "Try a different search term" : "Get started by adding your first faculty member."}
                            </p>
                            {!searchTerm && userRole === "admin" && (
                                <button
                                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2 mx-auto shadow-sm font-medium"
                                    onClick={handleAddNewFaculty}
                                >
                                    <FaPlus />
                                    <span>Add First Faculty</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Faculty Dialog */}
            {showAddDialog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-slate-200 rounded-t-xl">
                            <h3 className="text-lg font-semibold text-slate-800">
                                {editingFaculty ? "Edit Faculty" : "Add New Faculty"}
                            </h3>
                            <button
                                onClick={handleCancel}
                                className="text-slate-400 hover:text-slate-600 transition-colors duration-200"
                                disabled={addingFaculty}
                            >
                                <FaTimes className="text-xl" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label htmlFor="facultyName" className="block text-sm font-medium text-slate-700 mb-2">
                                    Faculty Name *
                                </label>
                                <input
                                    id="facultyName"
                                    type="text"
                                    value={newFaculty.Name}
                                    onChange={(e) => setNewFaculty(prev => ({ ...prev, Name: e.target.value }))}
                                    placeholder="Enter faculty name"
                                    disabled={addingFaculty}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                    autoFocus
                                />
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    onClick={handleSaveFaculty}
                                    disabled={!newFaculty.Name.trim() || addingFaculty}
                                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 text-white py-3 px-4 rounded-lg transition-all duration-200 font-medium disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                >
                                    {addingFaculty ? (
                                        <>
                                            <FaSpinner className="animate-spin" />
                                            <span>{editingFaculty ? "Updating..." : "Adding..."}</span>
                                        </>
                                    ) : (
                                        <span>{editingFaculty ? "Update Faculty" : "Add Faculty"}</span>
                                    )}
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={addingFaculty}
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

export default ManageFaculty;
