import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import Heading from "../components/Heading";
import { FaEdit, FaTrash, FaPlus, FaTimes, FaBuilding, FaSpinner, FaSearch } from "react-icons/fa";
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

const ManageRooms = () => {
    const [rooms, setRooms] = useState([]);
    const [filteredRooms, setFilteredRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [addingRoom, setAddingRoom] = useState(false);
    const [editingRoom, setEditingRoom] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [newRoom, setNewRoom] = useState({
        ID: "",
        Name: "",
        Capacity: ""
    });
    const { userRole } = useUserRole();

    const navigate = useNavigate();

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const API_ENDPOINTS = {
        GET_ROOMS: `${API_BASE_URL}/room`,
        ADD_ROOM: `${API_BASE_URL}/room`,
        UPDATE_ROOM: (id) => `${API_BASE_URL}/room/${id}`,
        DELETE_ROOM: (id) => `${API_BASE_URL}/room/${id}`
    };

    const fetchRooms = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(API_ENDPOINTS.GET_ROOMS, {
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
            console.log('API Response:', data);
            setRooms(data);
            setFilteredRooms(data);
        } catch (err) {
            console.error('Error fetching rooms:', err);
            setError('Failed to load rooms. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    useEffect(() => {
        const results = rooms.filter(room =>
            room.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            room.Capacity.toString().includes(searchTerm)
        );
        setFilteredRooms(results);
    }, [searchTerm, rooms]);

    const handleSaveRoom = async () => {
        if (!newRoom.Name.trim() || !newRoom.Capacity) {
             toast.warning('Please fill in all required fields');
            return;
        }

        try {
            editingRoom ? setEditingRoom(true) : setAddingRoom(true);

            const endpoint = editingRoom
                ? API_ENDPOINTS.UPDATE_ROOM(newRoom.ID)
                : API_ENDPOINTS.ADD_ROOM;

            const method = editingRoom ? 'PUT' : 'POST';

            const roomData = {
                Name: newRoom.Name.trim(),
                Capacity: parseInt(newRoom.Capacity)
            };

            if (editingRoom) {
                roomData.ID = newRoom.ID;
            }

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Include cookies for session management
                body: JSON.stringify(roomData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to ${editingRoom ? 'update' : 'add'} room`);
            }

            await fetchRooms();
            resetForm();
            setShowAddDialog(false);
            toast.success(editingRoom ? 'Room updated successfully!' : 'Room added successfully!');


        } catch (err) {
            console.error(`Error ${editingRoom ? 'updating' : 'adding'} room:`, err);
            toast.error(`Failed to ${editingRoom ? 'update' : 'add'} room: ${err.message}`);
        } finally {
            setAddingRoom(false);
            setEditingRoom(false);
        }
    };

    const handleDelete = async (id) => {
        toast.info(
            <div>
                <div className="mb-2">Are you sure you want to delete this room?</div>
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
            const response = await fetch(API_ENDPOINTS.DELETE_ROOM(id), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include' // Include cookies for session management
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            setRooms(rooms.filter(room => room.ID !== id));
            setFilteredRooms(filteredRooms.filter(room => room.ID !== id));
             toast.success('Room deleted successfully!');

        } catch (err) {
            console.error('Error deleting room:', err);
            toast.error(`Failed to delete room: ${err.message}`);
        }
    };

    const handleEdit = (room) => {
        setNewRoom({
            ID: room.ID,
            Name: room.Name,
            Capacity: room.Capacity
        });
        setEditingRoom(true);
        setShowAddDialog(true);
    };

    const handleAddNewRoom = () => {
        resetForm();
        setShowAddDialog(true);
    };

    const handleCancel = () => {
        resetForm();
        setShowAddDialog(false);
    };

    const resetForm = () => {
        setNewRoom({
            ID: "",
            Name: "",
            Capacity: ""
        });
        setEditingRoom(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
                <div className="flex items-center justify-center h-64">
                    <div className="flex items-center space-x-3">
                        <FaSpinner className="animate-spin text-blue-500 text-2xl" />
                        <span className="text-slate-600 text-lg">Loading rooms...</span>
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
                            onClick={fetchRooms}
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
                        <Heading text={userRole === "admin" ? "Manage Rooms" : "View Rooms "} />
                         <p className="text-slate-600 mt-2 text-sm sm:text-base">
                           {userRole === "admin" ? "Add, edit, and manage room capacities" : "View rooms and their capacities"}
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
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg">
                                <FaBuilding className="text-white text-lg" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">Room Management</h2>
                                <p className="text-sm text-slate-600">{filteredRooms.length} of {rooms.length} rooms</p>
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
                                    placeholder="Search rooms..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                />
                            </div>
                          )}
                          {userRole === 'admin' && (
                            <button
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm font-medium"
                                onClick={handleAddNewRoom}
                            >
                                <FaPlus className="text-sm" />
                                <span>Add Room</span>
                            </button>
                          )}
                        </div>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-800 text-white">
                                    <th className="px-6 py-4 text-left font-semibold">Room Name</th>
                                    <th className="px-6 py-4 text-left font-semibold">Capacity</th>
                                   {userRole === "admin" && (
                    <th className="px-6 py-4 text-center font-semibold w-1/4">
                      Actions
                    </th>
                  )}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRooms.map((room) => (
                                    <tr
                                        key={`desktop-${room.ID}`}
                                        className="hover:bg-blue-50 transition-colors duration-150"
                                    >
                                        <td className="px-6 py-4 w-1/2">
                                            <div className="font-medium text-slate-800">{room.Name}</div>
                                        </td>
                                         <td className="px-6 py-4 w-1/4">
                                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                                                {room.Capacity} seats
                                            </span>
                                        </td>
                                        {userRole === "admin" && (
                                       <td className="px-6 py-4 w-1/4">
                                            <div className="flex justify-center space-x-2">
                                                <button
                                                    className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg transition-colors duration-200 shadow-sm"
                                                    onClick={() => handleEdit(room)}
                                                    title="Edit Room"
                                                >
                                                    <FaEdit className="text-sm" />
                                                </button>
                                                <button
                                                    className="bg-rose-500 hover:bg-rose-600 text-white p-2 rounded-lg transition-colors duration-200 shadow-sm"
                                                    onClick={() => handleDelete(room.ID)}
                                                    title="Delete Room"
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
                        {filteredRooms.map((room) => (
                            <div
                                key={`mobile-${room.ID}`}
                                className="p-4 hover:bg-slate-50 transition-colors duration-150"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="font-medium text-slate-800">{room.Name}</div>
                                     {userRole === "admin" && (
                                    <div className="flex space-x-2">
                                        <button
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg transition-colors duration-200"
                                            onClick={() => handleEdit(room)}
                                        >
                                            <FaEdit className="text-sm" />
                                        </button>
                                        <button
                                            className="bg-rose-500 hover:bg-rose-600 text-white p-2 rounded-lg transition-colors duration-200"
                                            onClick={() => handleDelete(room.ID)}
                                        >
                                            <FaTrash className="text-sm" />
                                        </button>
                                    </div>
                                     )}
                                </div>
                                <div className="text-sm text-slate-600">
                                    <span>{room.Capacity} seats</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Empty State */}
                    {filteredRooms.length === 0 && !loading && (
                        <div className="text-center py-12">
                            <FaBuilding className="mx-auto text-slate-400 text-4xl mb-4" />
                            <h3 className="text-lg font-medium text-slate-800 mb-2">
                                {searchTerm ? "No matching rooms found" : "No Rooms Found"}
                            </h3>
                            <p className="text-slate-600 mb-4">
                                {searchTerm ? "Try a different search term" : "Get started by adding your first room."}
                            </p>
                            {!searchTerm && userRole === "admin" && (
                                <button
                                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2 mx-auto shadow-sm font-medium"
                                    onClick={handleAddNewRoom}
                                >
                                    <FaPlus />
                                    <span>Add First Room</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Room Dialog */}
            {showAddDialog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-slate-200 rounded-t-xl">
                            <h3 className="text-lg font-semibold text-slate-800">
                                {editingRoom ? "Edit Room" : "Add New Room"}
                            </h3>
                            <button
                                onClick={handleCancel}
                                className="text-slate-400 hover:text-slate-600 transition-colors duration-200"
                                disabled={addingRoom}
                            >
                                <FaTimes className="text-xl" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label htmlFor="roomName" className="block text-sm font-medium text-slate-700 mb-2">
                                    Room Name *
                                </label>
                                <input
                                    id="roomName"
                                    type="text"
                                    value={newRoom.Name}
                                    onChange={(e) => setNewRoom(prev => ({ ...prev, Name: e.target.value }))}
                                    placeholder="Enter room name (e.g., Room 101)"
                                    disabled={addingRoom}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label htmlFor="roomCapacity" className="block text-sm font-medium text-slate-700 mb-2">
                                    Capacity *
                                </label>
                                <input
                                    id="roomCapacity"
                                    type="number"
                                    min="1"
                                    value={newRoom.Capacity}
                                    onChange={(e) => setNewRoom(prev => ({ ...prev, Capacity: e.target.value }))}
                                    placeholder="Enter room capacity"
                                    disabled={addingRoom}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                />
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    onClick={handleSaveRoom}
                                    disabled={!newRoom.Name.trim() || !newRoom.Capacity || addingRoom}
                                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 text-white py-3 px-4 rounded-lg transition-all duration-200 font-medium disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                >
                                    {addingRoom ? (
                                        <>
                                            <FaSpinner className="animate-spin" />
                                            <span>{editingRoom ? "Updating..." : "Adding..."}</span>
                                        </>
                                    ) : (
                                        <span>{editingRoom ? "Update Room" : "Add Room"}</span>
                                    )}
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={addingRoom}
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

export default ManageRooms;
