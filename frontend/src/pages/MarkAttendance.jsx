import React, { useState, useEffect, useRef } from "react";
import SearchableSelect from "../components/SearchableSelect";
import {
  Calendar,
  Clock,
  Users,
  BookOpen,
  MapPin,
  Check,
  X,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  ArrowLeft,
  ChevronUp,
} from "lucide-react";
import { GiTeacher } from "react-icons/gi";
import academicData from "../assets/academicData.json";
const Spinner = ({ className = "w-12 h-12" }) => (
  <svg
    className={`animate-spin text-blue-500 ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

const StatusBadge = ({ status, onClick, disabled = false }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'held':
        return {
          label: 'Present',
          icon: Check,
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          hoverColor: 'hover:bg-green-200',
          borderColor: 'border-green-300',
        };
      case 'cancelled':
        return {
          label: 'Absent',
          icon: X,
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          hoverColor: 'hover:bg-red-200',
          borderColor: 'border-red-300',
        };
      default:
        return {
          label: 'Not Marked',
          icon: AlertTriangle,
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          hoverColor: 'hover:bg-yellow-200',
          borderColor: 'border-yellow-300',
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${disabled
          ? 'opacity-50 cursor-not-allowed'
          : `cursor-pointer hover:scale-105 hover:shadow-md ${config.hoverColor}`
        } ${config.bgColor} ${config.textColor} ${config.borderColor}`}
    >
      <Icon className="w-4 h-4" />
      {config.label}
    </button>
  );
};

const StatusModal = React.memo(({ session, onClose, onUpdate }) => {
  const [selectedStatus, setSelectedStatus] = useState(session.status || 'held');
  const statusModalRef = useRef(null);

  const statusOptions = [
    { value: 'held', label: 'Class Taken', color: 'green', icon: Check },
    { value: 'cancelled', label: 'Class Missed', color: 'red', icon: X },
    { value: "", label: 'No Entry', color: 'yellow', icon: AlertTriangle },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        ref={statusModalRef}
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Update Attendance Status</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-2">
            <span className="font-semibold">Subject:</span> {session.subject || 'N/A'}
          </p>
          <p className="text-gray-700 mb-2">
            <span className="font-semibold">Time:</span> {session.start_time}-{session.end_time}
          </p>
          <p className="text-gray-700 mb-2">
            <span className="font-semibold">Faculty:</span> {session.faculty || 'N/A'}
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">Room:</span> {session.room || 'N/A'}
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {statusOptions.map((option) => (
            <div
              key={option.value}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedStatus(option.value);
              }}
              className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${selectedStatus === option.value
                ? `border-${option.color}-500 bg-${option.color}-50`
                : 'border-gray-200 hover:bg-gray-50'
                }`}
            >
              <option.icon className={`w-5 h-5 text-${option.color}-600`} />
              <span className="font-medium">{option.label}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate(session.session_id, selectedStatus);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            Update Status
          </button>
        </div>
      </div>
    </div>
  );
});

function MarkLectures() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [expandedSession, setExpandedSession] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedSessionForModal, setSelectedSessionForModal] = useState(null);

  // Filter and Course data
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [selectedFaculty, setSelectedFaculty] = useState("all");
  const [initialLoading, setInitialLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false); // State for search toggle

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const API_ENDPOINTS = {
    GET_COURSE: `${API_BASE_URL}/course`,
    GET_FACULTY: `${API_BASE_URL}/faculty`,
    CALENDAR_DAY: `${API_BASE_URL}/calendar/day`,
    SESSION: `${API_BASE_URL}/session`,
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch sessions when date or filters change
  useEffect(() => {
    if (!initialLoading) {
      fetchSessions();
    }
  }, [selectedDate, selectedCourse, selectedSemester, selectedFaculty, initialLoading]);

  // Apply filters to sessions
  useEffect(() => {
    applyFilters();
  }, [sessions, searchTerm, statusFilter, timeFilter]);

  const fetchInitialData = async () => {
    setInitialLoading(true);
    try {
      await Promise.all([fetchCourses(), fetchFaculties()]);
      setSemesters(academicData.semesters || []);
    } catch (err) {
      setError("Failed to fetch initial data");
      console.error("Error fetching initial data:", err);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.GET_COURSE, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    }
  };

  const fetchFaculties = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.GET_FACULTY, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setFaculties(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching faculties:', error);
      setFaculties([]);
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ date: selectedDate });
      if (selectedCourse !== "all") params.append('course_id', selectedCourse);
      if (selectedSemester !== "all") params.append('semester', selectedSemester);
      if (selectedFaculty !== "all") params.append('faculty_id', selectedFaculty);

      const response = await fetch(`${API_ENDPOINTS.CALENDAR_DAY}?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 500) {
          setSessions([]);
          setError(null);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const sessionData = Array.isArray(data) ? data : (data.data || []);

      // Sort sessions by start time
      const sortedSessions = sessionData.sort((a, b) => {
        const timeA = a.start_time || '00:00';
        const timeB = b.start_time || '00:00';
        return timeA.localeCompare(timeB);
      });

      setSessions(sortedSessions);
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError(`Failed to fetch sessions: ${err.message}`);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...sessions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(session =>
        (session.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (session.faculty || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (session.course_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (session.room || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(session => {
        if (statusFilter === "marked") {
          return session.status === 'held' || session.status === 'cancelled';
        } else if (statusFilter === "unmarked") {
          return !session.status || session.status === '';
        } else {
          return session.status === statusFilter;
        }
      });
    }

    // Time filter
    if (timeFilter !== "all") {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      filtered = filtered.filter(session => {
        const startTime = session.start_time || '00:00';
        const endTime = session.end_time || '23:59';

        if (timeFilter === "current") {
          return currentTime >= startTime && currentTime <= endTime;
        } else if (timeFilter === "upcoming") {
          return currentTime < startTime;
        } else if (timeFilter === "past") {
          return currentTime > endTime;
        }
        return true;
      });
    }

    setFilteredSessions(filtered);
  };

  const markLectures = async (sessionId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/session/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      // Update local state
      setSessions(prevSessions =>
        prevSessions.map(session =>
          session.session_id === sessionId
            ? { ...session, status: newStatus }
            : session
        )
      );

      setError(null);
      setShowStatusModal(false);
      setSelectedSessionForModal(null);
    } catch (err) {
      console.error("Error marking lectures:", err);
      setError(`Failed to mark lectures: ${err.message}`);
    }
  };

  const handleStatusBadgeClick = (session) => {
    setSelectedSessionForModal(session);
    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setSelectedSessionForModal(null);
  };

  const getTimeStatus = (startTime, endTime) => {
    const today = new Date();
    const sessionDate = new Date(selectedDate);


    today.setHours(0, 0, 0, 0);
    sessionDate.setHours(0, 0, 0, 0);

    const currentTime = `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`;

    if (sessionDate.getTime() > today.getTime()) {
      return 'upcoming';
    } else if (sessionDate.getTime() < today.getTime()) {
      return 'past';
    } else {
      if (currentTime < startTime) return 'upcoming';
      if (currentTime > endTime) return 'past';
      return 'current';
    }
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    const [hours, minutes] = time.split(':');
    const hour12 = hours % 12 || 12;
    const ampm = hours < 12 ? 'AM' : 'PM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  const toggleSessionExpansion = (sessionId) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
        <Spinner />
        <p className="mt-4 text-lg text-gray-600">Loading Mark Lectures...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="relative z-10 bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-800 flex items-center gap-2 sm:gap-3">
                Mark Lectures
              </h1>
            </div>

            {/* Date Selector */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-600 mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 bg-white shadow-sm"
                />
              </div>
              <button
                onClick={fetchSessions}
                disabled={loading}
                className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col gap-4 mt-6">
            {/* Top row for filters and search toggle */}
            <div className="flex flex-wrap items-end gap-4">
              {/* Search Toggle Button */}
              <button
                onClick={() => setShowSearch(prev => !prev)}
                className="px-3 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                title="Toggle Search Bar"
              >
                <Search className="w-5 h-5 text-gray-600" />
              </button>

              {/* Course Filter */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-600 mb-1">Course</label>
                <SearchableSelect
                  value={selectedCourse}
                  onSelect={setSelectedCourse}
                  placeholder="Select Course"
                  options={[
                    { value: "all", label: "" },
                    ...courses.map(c => ({
                      value: c.ID,
                      label: c.Name
                    }))
                  ]}
                />
              </div>

              {/* Semester Filter */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-600 mb-1">Semester</label>
                <SearchableSelect
                  value={selectedSemester}
                  onSelect={setSelectedSemester}
                  placeholder="Select Semester"
                  options={[
                    { value: "all", label: "" },
                    ...semesters.map(s => ({
                      value: s.ID || s.number,
                      label: s.Name || `Semester ${s.number}`
                    }))
                  ]}
                />
              </div>

              {/* Faculty Filter */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-600 mb-1">Faculty</label>
                <SearchableSelect
                  value={selectedFaculty}
                  onSelect={setSelectedFaculty}
                  placeholder="Select Faculty"
                  options={[
                    { value: "all", label: "" },
                    ...faculties.map(f => ({
                      value: f.ID,
                      label: f.Name
                    }))
                  ]}
                />
              </div>
              <div className="flex-grow"></div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-600 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 bg-white shadow-sm min-w-[140px]"
                >
                  <option value="all">All Status</option>
                  <option value="marked">Marked</option>
                  <option value="unmarked">Not Marked</option>
                  <option value="held">Present</option>
                  <option value="cancelled">Absent</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-600 mb-1">Time</label>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 bg-white shadow-sm min-w-[140px]"
                >
                  <option value="all">All Times</option>
                  <option value="current">Current</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past</option>
                </select>
              </div>
            </div>

            {/* Conditionally rendered search bar */}
            {showSearch && (
              <div className="w-full">
                <label className="text-sm font-semibold text-gray-600 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by subject, faculty, course..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 bg-white shadow-sm w-full"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sessions List */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Spinner />
              <p className="mt-4 text-gray-600">Loading sessions...</p>
            </div>
          ) : filteredSessions.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredSessions.map((session, index) => {
                const timeStatus = getTimeStatus(session.start_time, session.end_time);
                const isExpanded = expandedSession === session.session_id;

                return (
                  <div key={session.session_id || index} className="p-6 hover:bg-gray-50/50 transition-colors duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <h3 className="text-xl font-semibold text-gray-800">
                            {session.subject || 'Subject N/A'}
                          </h3>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${timeStatus === 'current'
                              ? 'bg-green-100 text-green-800'
                              : timeStatus === 'upcoming'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                            {timeStatus === 'current' ? 'Ongoing' : timeStatus === 'upcoming' ? 'Upcoming' : 'Completed'}
                          </div>
                        </div>

                        {/* Main Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-red-500" />
                            <span>{formatTime(session.start_time)} - {formatTime(session.end_time)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <GiTeacher  className="w-4 h-4 text-blue-500" />
                            <span>{session.faculty || 'Faculty N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-orange-500" />
                            <span>{session.room || 'Room N/A'}</span>
                          </div>
                        </div>

                        {/* Additional Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-purple-500" />
                            <span>Course : {session.course_name || 'Course N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-indigo-500" />
                            <span>Semester : {session.semester || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-teal-500" />
                            <span>
                              Batch : {`${session.batch_year || ''} ${session.batch_section || ''}`.trim() || 'Batch N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <StatusBadge
                          status={session.status}
                          onClick={() => handleStatusBadgeClick(session)}
                        />

                        <button
                          onClick={() => toggleSessionExpansion(session.session_id)}
                          className="p-2 hover:bg-gray-200 rounded-full transition-colors duration-200"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-600" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-600" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details - Database IDs Only */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Database Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <strong className="text-gray-700">Session ID:</strong>
                            <p className="text-gray-600 mt-1 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                              {session.session_id || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <strong className="text-gray-700">Lecture ID:</strong>
                            <p className="text-gray-600 mt-1 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                              {session.lecture_id || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <strong className="text-gray-700">Course ID:</strong>
                            <p className="text-gray-600 mt-1 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                              {session.course_id || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Sessions Found</h3>
              <p>No sessions are scheduled for the selected date and filters.</p>
              <p className="text-sm mt-2">Try changing the date or removing some filters.</p>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {filteredSessions.length > 0 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              {
                label: 'Total Sessions',
                value: filteredSessions.length,
                icon: Calendar,
                color: 'blue'
              },
              {
                label: 'Marked Present',
                value: filteredSessions.filter(s => s.status === 'held').length,
                icon: Check,
                color: 'green'
              },
              {
                label: 'Marked Absent',
                value: filteredSessions.filter(s => s.status === 'cancelled').length,
                icon: X,
                color: 'red'
              },
              {
                label: 'Not Marked',
                value: filteredSessions.filter(s => !s.status || s.status === '').length,
                icon: AlertTriangle,
                color: 'yellow'
              },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className={`bg-gradient-to-tr from-${color}-100 to-${color}-200 p-4 rounded-xl shadow-md`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white rounded-full shadow-sm">
                    <Icon className={`w-5 h-5 text-${color}-600`} />
                  </div>
                  <span className={`font-semibold text-${color}-800 text-sm`}>{label}</span>
                </div>
                <p className={`text-3xl font-bold text-${color}-700`}>{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* StatusModal */}
      {showStatusModal && selectedSessionForModal && (
        <StatusModal
          session={selectedSessionForModal}
          onClose={closeStatusModal}
          onUpdate={markLectures}
        />
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-5 right-5 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-lg flex items-center animate-bounce">
          <AlertTriangle className="w-6 h-6 mr-3" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-600 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default MarkLectures;
