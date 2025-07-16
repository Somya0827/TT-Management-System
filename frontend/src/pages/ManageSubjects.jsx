import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import Heading from "../components/Heading";
import { FaEdit, FaTrash, FaPlus, FaTimes, FaBook, FaGraduationCap, FaSpinner, FaSearch } from "react-icons/fa";
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

const ManageSubjects = () => {
    const [subjects, setSubjects] = useState([]);
    const [filteredSubjects, setFilteredSubjects] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [addingSubject, setAddingSubject] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [newSubject, setNewSubject] = useState({
        name: "",
        code: "",
        course_code: "",
        course_id: ""
    });
    const { userRole } = useUserRole();

    const navigate = useNavigate();

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const API_ENDPOINTS = {
        GET_SUBJECTS: `${API_BASE_URL}/subject`,
        GET_COURSES: `${API_BASE_URL}/course`,
        ADD_SUBJECT: `${API_BASE_URL}/subject`,
        DELETE_SUBJECT: (id) => `${API_BASE_URL}/subject/${id}`,
        UPDATE_SUBJECT: (id) => `${API_BASE_URL}/subject/${id}`
    };

    const fetchCourses = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.GET_COURSES, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Failed to fetch courses');
            const data = await response.json();
            setCourses(data);
        } catch (err) {
            console.error('Error fetching courses:', err);
        }
    };

    const fetchSubjects = async () => {
        try {
            setLoading(true);
            setError(null);

            const [subjectsResponse] = await Promise.all([
                fetch(API_ENDPOINTS.GET_SUBJECTS, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                }),
                fetchCourses()
            ]);

            if (!subjectsResponse.ok) {
                throw new Error(`HTTP error! status: ${subjectsResponse.status}`);
            }

            const subjectsData = await subjectsResponse.json();
            const formattedSubjects = subjectsData.map(subject => ({
                id: subject.ID,
                name: subject.Name,
                code: subject.Code,
                course_code: subject.Course?.Code || '',
                course_id: subject.CourseID
            }));

            setSubjects(formattedSubjects);
            setFilteredSubjects(formattedSubjects);

        } catch (err) {
            console.error('Error fetching subjects:', err);
            setError('Failed to load subjects. Please try again.');
            setSubjects([]);
            setFilteredSubjects([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    useEffect(() => {
        const results = subjects.filter(subject =>
            subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (subject.course_code && subject.course_code.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredSubjects(results);
    }, [searchTerm, subjects]);

const handleSaveNewSubject = async () => {
    if (!newSubject.name.trim() || !newSubject.code.trim() || !newSubject.course_id) {
        toast.error('Please fill in all required fields');
        return;
    }

    try {
        setAddingSubject(true);

        const subjectData = {
            name: newSubject.name.trim(),
            code: newSubject.code.trim().toUpperCase(),
            CourseID: Number(newSubject.course_id)
        };

        // Determine if we're updating or creating
        const isUpdate = !!newSubject.id;
        const endpoint = isUpdate
            ? API_ENDPOINTS.UPDATE_SUBJECT(newSubject.id)
            : API_ENDPOINTS.ADD_SUBJECT;
        const method = isUpdate ? 'PUT' : 'POST';

        const response = await fetch(endpoint, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(subjectData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || JSON.stringify(errorData));
        }

        await fetchSubjects();
        setNewSubject({ name: "", code: "", course_code: "", course_id: "" });
        setShowAddDialog(false);
        toast.success(`Subject ${newSubject.id ? 'updated' : 'added'} successfully!`);

    } catch (err) {
        console.error('Full error:', err);
        let errorMessage = err.message;
        toast.error(`Failed to ${newSubject.id ? 'update' : 'add'} subject: ${errorMessage}`);
    } finally {
        setAddingSubject(false);
    }
};

 const handleDelete = async (id) => {
        toast.info(
            <div>
                <div className="mb-2">Are you sure you want to delete this subject?</div>
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
    };
    const performDelete = async (id) => {

        try {
            const response = await fetch(API_ENDPOINTS.DELETE_SUBJECT(id), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            setSubjects(subjects.filter(subject => subject.id !== id));
            setFilteredSubjects(filteredSubjects.filter(subject => subject.id !== id));
            toast.success('Subject deleted successfully!');

        } catch (err) {
            console.error('Error deleting subject:', err);
            toast.error(`Failed to delete subject: ${err.message}`);
        }
    };

const handleEdit = (id) => {
    const subjectToEdit = subjects.find(subject => subject.id === id);
    if (subjectToEdit) {
        setNewSubject({
            id: subjectToEdit.id,  // Add the id to newSubject state
            name: subjectToEdit.name,
            code: subjectToEdit.code,
            course_code: subjectToEdit.course_code,
            course_id: subjectToEdit.course_id
        });
        setShowAddDialog(true);
    }
};
    const handleAddNewSubject = () => {
        setNewSubject({ name: "", code: "", course_code: "", course_id: "" });
        setShowAddDialog(true);
    };

    const handleCancelAdd = () => {
        setNewSubject({ name: "", code: "", course_code: "", course_id: "" });
        setShowAddDialog(false);
    };

    const getCoursesDisplay = (subject) => {
        const course = courses.find(c => c.ID === subject.course_id);
        return course ? `${course.Code} - ${course.Name}` : "General Course";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
                <div className="flex items-center justify-center h-64">
                    <div className="flex items-center space-x-3">
                        <FaSpinner className="animate-spin text-blue-500 text-2xl" />
                        <span className="text-slate-600 text-lg">Loading subjects...</span>
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
                            onClick={fetchSubjects}
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
            {/* Toast Container */}
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
                        <Heading text={userRole === "admin" ? "Manage Subjects" : "View Subjects"} />
      <p className="text-slate-600 mt-2 text-sm sm:text-base">
        {userRole === "admin" ? " Add, edit, and manage course subjects" : "View course subjects"}
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
                            <div className="bg-gradient-to-r from-orange-500 to-red-600 p-2 rounded-lg">
                                <FaBook className="text-white text-lg" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">Course Subjects</h2>
                                <p className="text-sm text-slate-600">{filteredSubjects.length} of {subjects.length} subjects</p>
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
                                    placeholder="Search subjects..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                />
                            </div>
                          )}
                            {userRole === "admin" && (
                            <button
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm font-medium"
                                onClick={handleAddNewSubject}
                            >
                                <FaPlus className="text-sm" />
                                <span>Add Subject</span>
                            </button>
                             )}
                        </div>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-800 text-white">
                  <th className="px-6 py-4 text-left font-semibold w-1/4">
                    Subject Code
                  </th>
                                    <th className="px-6 py-4 text-left font-semibold w-1/3">Subject Name</th>
                                    <th className="px-6 py-4 text-left font-semibold w-1/3">Course</th>
                                    {userRole === "admin" && (
                                    <th className="px-6 py-4 text-center font-semibold">Actions</th>
                                      )}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSubjects.map((subject) => (
                                    <tr
                                        key={`desktop-${subject.id}`}
                                        className="hover:bg-blue-50 transition-colors duration-150"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-mono font-medium">
                                                {subject.code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 w-1/3">
                                            <div className="font-medium text-slate-800">{subject.name}</div>
                                        </td>
                                        <td className="px-6 py-4 w-1/3">
                                            <div className="text-slate-600">{getCoursesDisplay(subject)}</div>
                                        </td>
                                       {userRole === "admin" && (
                      <td className="px-6 py-4 w-1/6">
                        <div className="flex justify-center space-x-2">
                          <button
                            className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg transition-colors duration-200 shadow-sm"
                            onClick={() => handleEdit(subject.id)}
                            title="Edit Subject"
                          >
                            <FaEdit className="text-sm" />
                          </button>
                          <button
                            className="bg-rose-500 hover:bg-rose-600 text-white p-2 rounded-lg transition-colors duration-200 shadow-sm"
                            onClick={() => handleDelete(subject.id)}
                            title="Delete Subject"
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
                        {filteredSubjects.map((subject) => (
                            <div
                                key={`mobile-${subject.id}`}
                                className="p-4 hover:bg-slate-50 transition-colors duration-150"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-mono font-medium">
                                        {subject.code}
                                    </span>
                                    <div className="flex space-x-2">
                    <button
                      className={`bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg transition-colors duration-200 ${
                        userRole === "user"
                          ? "pointer-events-none opacity-50"
                          : ""
                      }`}
                      onClick={() => handleEdit(subject.id)}
                    >
                      <FaEdit className="text-sm" />
                    </button>
                    <button
                      className={`bg-rose-500 hover:bg-rose-600 text-white p-2 rounded-lg transition-colors duration-200 ${
                        userRole === "user"
                          ? "pointer-events-none opacity-50"
                          : ""
                      }`}
                      onClick={() => handleDelete(subject.id)}
                    >
                      <FaTrash className="text-sm" />
                    </button>
                  </div>
                                </div>
                                <div className="font-medium text-slate-800 mb-1">{subject.name}</div>
                                <div className="text-sm text-slate-600">{getCoursesDisplay(subject)}</div>
                            </div>
                        ))}
                    </div>

                    {/* Empty State */}
                    {filteredSubjects.length === 0 && !loading && (
                        <div className="text-center py-12">
                            <FaBook className="mx-auto text-slate-400 text-4xl mb-4" />
                            <h3 className="text-lg font-medium text-slate-800 mb-2">
                                {searchTerm ? "No matching subjects found" : "No Subjects Found"}
                            </h3>
                            <p className="text-slate-600 mb-4">
                                {searchTerm ? "Try a different search term" : "Get started by adding your first subject."}
                            </p>
                            {!searchTerm && (
                                <button
                                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2 mx-auto shadow-sm font-medium"
                                    onClick={handleAddNewSubject}
                                >
                                    <FaPlus />
                                    <span>Add First Subject</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Subject Dialog */}
            {showAddDialog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-slate-200 rounded-t-xl">
                            <h3 className="text-lg font-semibold text-slate-800">
                                {newSubject.id ? "Edit Subject" : "Add New Subject"}
                            </h3>
                            <button
                                onClick={handleCancelAdd}
                                className="text-slate-400 hover:text-slate-600 transition-colors duration-200"
                                disabled={addingSubject}
                            >
                                <FaTimes className="text-xl" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label htmlFor="subjectName" className="block text-sm font-medium text-slate-700 mb-2">
                                    Subject Name *
                                </label>
                                <input
                                    id="subjectName"
                                    type="text"
                                    value={newSubject.name}
                                    onChange={(e) => setNewSubject(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter subject name"
                                    disabled={addingSubject}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label htmlFor="subjectCode" className="block text-sm font-medium text-slate-700 mb-2">
                                    Subject Code *
                                </label>
                                <input
                                    id="subjectCode"
                                    type="text"
                                    value={newSubject.code}
                                    onChange={(e) => setNewSubject(prev => ({ ...prev, code: e.target.value }))}
                                    placeholder="Enter subject code (e.g., CS101)"
                                    disabled={addingSubject}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label htmlFor="course_id" className="block text-sm font-medium text-slate-700 mb-2">
                                    Course *
                                </label>
                                <select
                                    id="course_id"
                                    value={newSubject.course_id}
                                    onChange={(e) => setNewSubject(prev => ({
                                        ...prev,
                                        course_id: e.target.value,
                                        course_code: courses.find(c => c.ID == e.target.value)?.Code || ""
                                    }))}
                                    disabled={addingSubject || courses.length === 0}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                >
                                    <option value="">Select a course</option>
                                    {courses.map(course => (
                                        <option key={course.ID} value={course.ID}>
                                            {course.Code} - {course.Name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    onClick={handleSaveNewSubject}
                                    disabled={!newSubject.name.trim() || !newSubject.code.trim() || !newSubject.course_id || addingSubject}
                                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 text-white py-3 px-4 rounded-lg transition-all duration-200 font-medium disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                >
                                    {addingSubject ? (
                                        <>
                                            <FaSpinner className="animate-spin" />
                                            <span>{newSubject.id ? "Updating..." : "Adding..."}</span>
                                        </>
                                    ) : (
                                        <span>{newSubject.id ? "Update Subject" : "Add Subject"}</span>
                                    )}
                                </button>
                                <button
                                    onClick={handleCancelAdd}
                                    disabled={addingSubject}
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

export default ManageSubjects;
