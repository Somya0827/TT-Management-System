import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import academicData from "../assets/academicData.json";
import { useNavigate } from 'react-router-dom';
import { RefreshCcw } from "lucide-react";
import clsx from 'clsx';

const ClassTimeTable = () => {
  // State for fetched data from APIs (courses, batches, etc.)
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [rooms, setRooms] = useState([]);

  // State for the currently displayed lectures (timetable data)
  const [lectures, setLectures] = useState([]);
  const [gridData, setGridData] = useState({});
  const [allTimeSlots, setAllTimeSlots] = useState([]);

  // State for the selected filter criteria by the user
  const [selectedFilters, setSelectedFilters] = useState({
    course: null,
    batch: null,
    semester: null,
    faculty: null,
    room: null
  });

  // State for loading and error handling
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoadingLectures, setIsLoadingLectures] = useState(false);

  const navigate = useNavigate();

  // API Endpoints
  const API_BASE_URL = "http://localhost:8080/api/v1";
  const API_ENDPOINTS = {
    GET_COURSE: `${API_BASE_URL}/course`,
    GET_BATCH: `${API_BASE_URL}/batch`,
    GET_SEMESTER: `${API_BASE_URL}/semester`,
    GET_SUBJECT: `${API_BASE_URL}/subject`,
    GET_FACULTY: `${API_BASE_URL}/faculty`,
    GET_ROOM: `${API_BASE_URL}/room`,
    LECTURE: `${API_BASE_URL}/lecture`,
    LECTURE_QUERY: `${API_BASE_URL}/lecture/query`,
  };

  // Effect to fetch initial data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Function to group consecutive time slots for the same lecture
  const groupConsecutiveTimeSlots = (lectures, days, timeSlots) => {
    const groupedData = {};

    days.forEach(day => {
      let currentGroup = null;

      timeSlots.forEach((time, timeIndex) => {
        const [startTime, endTime] = time.split('-');
        const lecture = lectures.find(lec =>
          lec.DayOfWeek === day &&
          lec.StartTime === startTime &&
          lec.EndTime === endTime
        );

        if (lecture) {
          const subjectName = subjects.find(sub => sub.ID === lecture.SubjectID)?.Name || 'N/A';
          const facultyName = faculties.find(fac => fac.ID === lecture.FacultyID)?.Name || 'N/A';
          const groupKey = `${day}-${subjectName}-${facultyName}`;

          if (currentGroup && currentGroup.groupKey === groupKey &&
              currentGroup.endIndex === timeIndex - 1) {
            // Continue current group
            currentGroup.timeSlots.push(time);
            currentGroup.endIndex = timeIndex;
            groupedData[`${day}-${time}`] = currentGroup;
          } else {
            // Start new group
            currentGroup = {
              ...lecture,
              groupKey,
              subject: subjectName,
              faculty: facultyName,
              code: subjects.find(sub => sub.ID === lecture.SubjectID)?.Code || 'N/A',
              room: rooms.find(room => room.ID === lecture.RoomID)?.Name || 'N/A',
              timeSlots: [time],
              startIndex: timeIndex,
              endIndex: timeIndex,
              isGrouped: true
            };
            groupedData[`${day}-${time}`] = currentGroup;
          }
        } else {
          // No lecture, reset current group
          currentGroup = null;
        }
      });
    });

    return groupedData;
  };

  // Convert lectures to grid data format and collect all unique time slots
  const convertLecturesToGridData = (lectures) => {
    const grid = {};
    const uniqueTimeSlots = new Set(academicData.timeSlots);

    lectures.forEach(lecture => {
      const timeSlot = `${lecture.StartTime}-${lecture.EndTime}`;
      uniqueTimeSlots.add(timeSlot);

      const key = `${lecture.DayOfWeek}-${timeSlot}`;
      grid[key] = {
        id: lecture.ID,
        subject: subjects.find(sub => sub.ID === lecture.SubjectID)?.Name || 'N/A',
        code: subjects.find(sub => sub.ID === lecture.SubjectID)?.Code || 'N/A',
        faculty: faculties.find(fac => fac.ID === lecture.FacultyID)?.Name || 'N/A',
        room: rooms.find(room => room.ID === lecture.RoomID)?.Name || 'N/A',
        startTime: lecture.StartTime,
        endTime: lecture.EndTime
      };
    });

    // Convert Set to array and sort time slots
    const sortedTimeSlots = sortTimeSlots([...uniqueTimeSlots]);
    setAllTimeSlots(sortedTimeSlots);

    return grid;
  };

  // Parse time strings (HH:MM) into minutes for comparison
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Sorts time slots chronologically
  const sortTimeSlots = (slots) => {
    if (!Array.isArray(slots)) return [];
    return slots.slice().sort((a, b) => {
      const [startA] = a.split('-');
      const [startB] = b.split('-');
      return parseTimeToMinutes(startA) - parseTimeToMinutes(startB);
    });
  };

  // Fetch all initial data
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchCourses(),
        fetchBatches(),
        fetchSubjects(),
        fetchFaculties(),
        fetchRooms()
      ]);
      setSemesters(Array.isArray(academicData.semesters) ? academicData.semesters : []);
      setAllTimeSlots(Array.isArray(academicData.timeSlots) ? sortTimeSlots(academicData.timeSlots) : []);
    } catch (err) {
      setError('Failed to fetch initial data');
      console.error('Error fetching initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Individual data fetching functions
  const fetchCourses = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.GET_COURSE, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to fetch courses');
      setCourses([]);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.GET_BATCH, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setBatches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching batches:', error);
      setError('Failed to fetch batches');
      setBatches([]);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.GET_SUBJECT, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setSubjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setError('Failed to fetch subjects');
      setSubjects([]);
    }
  };

  const fetchFaculties = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.GET_FACULTY, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setFaculties(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching faculties:', error);
      setError('Failed to fetch faculties');
      setFaculties([]);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.GET_ROOM, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setRooms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setError('Failed to fetch rooms');
      setRooms([]);
    }
  };

  // Fetch lectures based on filters
  const fetchLectures = async () => {
    setIsLoadingLectures(true);
    setError(null);
    setLectures([]);
    setGridData({});

    try {
      // Find the selected objects based on their names
      const selectedCourse = courses.find(c => c.Name === selectedFilters.course);
      const selectedBatch = batches.find(b => `${b.Year}-${b.Section}` === selectedFilters.batch);
      const selectedFaculty = faculties.find(f => f.Name === selectedFilters.faculty);
      const selectedRoom = rooms.find(r => r.Name === selectedFilters.room);
      const semesterNumber = selectedFilters.semester !== undefined ? romanToInteger(selectedFilters.semester) : undefined;

      // Build query parameters
      const queryParams = new URLSearchParams();

      if (selectedFaculty) {
        queryParams.append('faculty_id', selectedFaculty.ID);
      } else if (selectedRoom) {
        queryParams.append('room_id', selectedRoom.ID);
      } else if (selectedBatch && semesterNumber !== undefined) {
        queryParams.append('batch_id', selectedBatch.ID);
        queryParams.append('semester', semesterNumber);
        if (selectedBatch.Section) {
          queryParams.append('section', selectedBatch.Section);
        }
      }

      // Fetch lectures
      const response = await fetch(`${API_ENDPOINTS.LECTURE_QUERY}?${queryParams}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          setLectures([]);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } else {
        const filteredLectures = await response.json();
        setLectures(filteredLectures);

        // Convert to grid data format and update time slots
        const gridData = convertLecturesToGridData(filteredLectures);
        setGridData(gridData);
      }
    } catch (err) {
      setError('Failed to fetch lectures');
      console.error('Error fetching lectures:', err);
    } finally {
      setIsLoadingLectures(false);
    }
  };

  // Filter handlers
  const handleCourseChange = (value) => {
    setSelectedFilters({
      course: value === "placeholder" ? null : value,
      batch: null,
      semester: null,
      faculty: null,
      room: null
    });
  };

  const handleBatchChange = (value) => {
    setSelectedFilters(prev => ({
      ...prev,
      batch: value === "placeholder" ? null : value,
      semester: null,
      faculty: null,
      room: null
    }));
  };

  const handleSemesterChange = (value) => {
    setSelectedFilters(prev => ({
      ...prev,
      semester: value === "placeholder" ? null : value,
      faculty: null,
      room: null
    }));
  };

  const handleFacultyChange = (value) => {
    setSelectedFilters({
      faculty: value === "placeholder" ? null : value,
      course: null,
      batch: null,
      semester: null,
      room: null
    });
  };

  const handleRoomChange = (value) => {
    setSelectedFilters({
      room: value === "placeholder" ? null : value,
      course: null,
      batch: null,
      semester: null,
      faculty: null
    });
  };

  // Button handlers
  const handleGenerateTimetable = () => {
    if (selectedFilters.faculty !== undefined ||
      selectedFilters.room !== undefined ||
      (selectedFilters.course !== undefined &&
        selectedFilters.batch !== undefined &&
        selectedFilters.semester !== undefined)) {
      fetchLectures();
    } else {
      alert("Please select either Faculty, Room, or complete Course+Batch+Semester combination to generate timetable.");
    }
  };

  const handleReset = () => {
    setSelectedFilters({
      course: null,
      batch: null,
      semester: null,
      faculty: null,
      room: null
    });
    setLectures([]);
    setGridData({});
    setAllTimeSlots(Array.isArray(academicData.timeSlots) ? sortTimeSlots(academicData.timeSlots) : []);
  };

  // Utility functions
  const romanToInteger = (roman) => {
    if (typeof roman === 'number' || !isNaN(roman)) {
      return parseInt(roman);
    }

    const romanMap = {
      'I': 1, 'V': 5, 'X': 10, 'L': 50,
      'C': 100, 'D': 500, 'M': 1000
    };

    let result = 0;
    const romanStr = roman?.toString().toUpperCase() || '';

    for (let i = 0; i < romanStr.length; i++) {
      const current = romanMap[romanStr[i]];
      const next = romanMap[romanStr[i + 1]];

      if (next && current < next) {
        result += next - current;
        i++;
      } else if (current) {
        result += current;
      }
    }

    return result;
  };

  // Get days from academicData
  const days = Array.isArray(academicData.days) ? academicData.days : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Error Display */}
      {error && (
        <div className="flex justify-center items-center py-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center max-w-md mx-4">
            <div className="mb-4">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <Button
              onClick={fetchAllData}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-white">View Timetable</h1>
              <p className="text-indigo-100 text-sm mt-1">View academic schedules</p>
            </div>
            <div>
              <Button
                className="bg-gradient-to-l from-indigo-600 to-blue-600 border-1 text-white px-2 py-2 rounded-lg transition-colors duration-200 text-sm font-medium md:px-4"
                onClick={() => navigate("/dashboard")}
              >
                <span className="hidden sm:inline">Back to DashBoard</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Course Select */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Course</label>
                <Select
                  value={selectedFilters.course ?? ""}
                  onValueChange={handleCourseChange}
                >
                  <SelectTrigger className="w-full h-12 border-2 border-gray-200 rounded-xl hover:border-indigo-300 focus:border-indigo-500 transition-colors">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 shadow-lg">
                    <SelectItem value="placeholder">Select course</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.ID} value={course.Name} className="rounded-lg">
                        <div className="flex flex-col">
                          <span className="font-medium">{course.Name}</span>
                          {course.Code && (
                            <span className="text-xs text-gray-500">{course.Code}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Batch Select */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Batch</label>
                <Select
                  disabled={!selectedFilters.course || loading}
                  value={selectedFilters.batch ?? ""}
                  onValueChange={handleBatchChange}
                >
                  <SelectTrigger className="w-full h-12 border-2 border-gray-200 rounded-xl hover:border-indigo-300 focus:border-indigo-500 transition-colors">
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 shadow-lg">
                    <SelectItem value="placeholder">Select batch</SelectItem>
                    {batches
                      .filter(batch => {
                        const selectedCourse = courses.find(c => c.Name === selectedFilters.course);
                        return selectedCourse ? batch.CourseID === selectedCourse.ID : false;
                      })
                      .sort((a, b) => {
                        if (a.Year !== b.Year) return a.Year - b.Year;
                        return a.Section.localeCompare(b.Section);
                      })
                      .map((batch) => (
                        <SelectItem
                          key={batch.ID}
                          value={`${batch.Year}-${batch.Section}`}
                          className="rounded-lg"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">Batch {batch.Year} - Section {batch.Section}</span>
                            {batch.Course?.Name && (
                              <span className="text-xs text-gray-500">{batch.Course.Name}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Semester Select */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Semester</label>
                <Select
                  value={selectedFilters.semester ?? ""}
                  onValueChange={handleSemesterChange}
                  disabled={!selectedFilters.batch}
                >
                  <SelectTrigger className="w-full h-12 border-2 border-gray-200 rounded-xl hover:border-indigo-300 focus:border-indigo-500 transition-colors">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 shadow-lg">
                    <SelectItem value="placeholder">Select semester</SelectItem>
                    {semesters.map((semester) => (
                      <SelectItem
                        key={semester.id}
                        value={semester.id || semester.number?.toString()}
                        className="rounded-lg"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{semester.id || semester.number}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Faculty Select */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Faculty</label>
                <Select
                  value={selectedFilters.faculty ?? ""}
                  onValueChange={handleFacultyChange}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full h-12 border-2 border-gray-200 rounded-xl hover:border-indigo-300 focus:border-indigo-500 transition-colors">
                    <SelectValue placeholder="Select faculty" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 shadow-lg">
                    <SelectItem value="placeholder">Select faculty</SelectItem>
                    {faculties.map((faculty) => (
                      <SelectItem
                        key={faculty.ID}
                        value={faculty.Name}
                        className="rounded-lg"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{faculty.Name}</span>
                          {faculty.Email && (
                            <span className="text-xs text-gray-500">{faculty.Email}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Room Select */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Room</label>
                <Select
                  value={selectedFilters.room ?? ""}
                  onValueChange={handleRoomChange}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full h-12 border-2 border-gray-200 rounded-xl hover:border-indigo-300 focus:border-indigo-500 transition-colors">
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 shadow-lg">
                    <SelectItem value="placeholder">Select room</SelectItem>
                    {rooms.map((room) => (
                      <SelectItem
                        key={room.ID}
                        value={room.Name}
                        className="rounded-lg"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{room.Name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Generate Timetable and Reset Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button
                className={clsx(
                  "w-full sm:w-auto h-12 font-semibold rounded-xl shadow-lg transition-all duration-300",
                  {
                    "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white transform hover:scale-[1.02]":
                      (selectedFilters.course && selectedFilters.batch && selectedFilters.semester) ||
                      selectedFilters.faculty ||
                      selectedFilters.room,
                    "bg-gray-200 text-gray-500 cursor-not-allowed":
                      !(selectedFilters.course && selectedFilters.batch && selectedFilters.semester) &&
                      !selectedFilters.faculty &&
                      !selectedFilters.room
                  }
                )}
                onClick={handleGenerateTimetable}
                disabled={
                  !(selectedFilters.course && selectedFilters.batch && selectedFilters.semester) &&
                  !selectedFilters.faculty &&
                  !selectedFilters.room
                }
              >
                Generate Timetable
              </Button>
              <Button
                className="w-full sm:w-auto h-12 font-semibold rounded-xl shadow-lg transition-all duration-300 bg-gray-300 hover:bg-gray-400 text-gray-800 flex items-center justify-center gap-2"
                onClick={handleReset}
                disabled={loading || isLoadingLectures}
              >
                <RefreshCcw size={18} />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {(isLoadingLectures || loading) && (
        <div className="flex justify-center items-center py-8">
          <div className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            <p className="text-gray-700 font-medium">
              {loading ? 'Loading initial data...' : 'Loading timetable...'}
            </p>
          </div>
        </div>
      )}

      {/* Timetable Grid */}
      {lectures.length > 0 && !isLoadingLectures && (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Timetable</h2>
                  <p className="text-indigo-100 text-sm">View your class schedule</p>
                </div>
              </div>
            </div>

            {/* Mobile Timetable View */}
            <div className="lg:hidden">
              <div className="p-4 space-y-4">
                {days.map((day) => {
                  // Get all lectures for this day
                  const dayLectures = lectures.filter(lec => lec.DayOfWeek === day);

                  return (
                    <div key={day} className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-bold text-indigo-700 mb-3 text-lg">{day}</h3>
                      <div className="space-y-2">
                        {/* Show all lectures for this day, not just predefined time slots */}
                        {dayLectures.map((lecture) => {
                          const timeSlot = `${lecture.StartTime}-${lecture.EndTime}`;
                          const subjectName = subjects.find(sub => sub.ID === lecture.SubjectID)?.Name || 'N/A';
                          const facultyName = faculties.find(fac => fac.ID === lecture.FacultyID)?.Name || 'N/A';
                          const roomName = rooms.find(room => room.ID === lecture.RoomID)?.Name || 'N/A';
                          const subjectCode = subjects.find(sub => sub.ID === lecture.SubjectID)?.Code || 'N/A';

                          return (
                            <div
                              key={`${day}-${lecture.ID}`}
                              className="bg-white rounded-lg p-3 border-2 border-gray-200"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="text-sm font-semibold text-gray-600 mb-1">
                                    {timeSlot}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-indigo-700 text-sm mb-1">
                                      {subjectName}
                                    </div>
                                    <div className="text-xs text-gray-600 mb-1">
                                      {subjectCode}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {facultyName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {roomName}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop Timetable Table */}
            <div className="hidden lg:block p-6">
              <div className="overflow-x-auto rounded-xl border-2 border-gray-200">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-50 to-blue-50">
                      <th className="border-r border-gray-200 p-4 text-center font-bold text-indigo-700 bg-white">
                        Day / Time
                      </th>
                      {allTimeSlots.map((time, index) => (
                        <th
                          key={index}
                          className="border-r border-gray-200 p-3 text-center font-semibold text-indigo-700 relative min-w-[140px]"
                        >
                          <span className="text-sm font-medium">{time}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {days.map((day, dayIndex) => {
                      const groupedLectures = groupConsecutiveTimeSlots(lectures, [day], allTimeSlots);

                      // Also get all lectures for this day that might not be in predefined slots
                      const allDayLectures = lectures.filter(lec => lec.DayOfWeek === day);

                      return (
                        <tr key={day} className={dayIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="border-r border-gray-200 p-4 font-bold text-indigo-700 bg-gradient-to-r from-indigo-50 to-blue-50 text-center">
                            {day}
                          </td>
                          {allTimeSlots.map((time, timeIndex) => {
                            const cellKey = `${day}-${time}`;
                            const groupedLecture = groupedLectures[cellKey];

                            // Skip rendering if this is part of a group but not the first in the group
                            if (groupedLecture?.isGrouped && groupedLecture.timeSlots[0] !== time) {
                              return null;
                            }

                            // Calculate colSpan for grouped lectures
                            const colSpan = groupedLecture?.isGrouped
                              ? groupedLecture.timeSlots.length
                              : 1;

                            return (
                              <td
                                key={cellKey}
                                className={clsx(
                                  "border-r border-gray-200 p-3 text-center h-24 min-w-[140px]",
                                  groupedLecture?.isGrouped ? "bg-blue-50" : ""
                                )}
                                colSpan={colSpan}
                              >
                                {groupedLecture ? (
                                  <div className="space-y-1">
                                    <div className="font-semibold text-indigo-700 text-sm leading-tight">
                                      {groupedLecture.subject}
                                    </div>
                                    <div className="text-xs text-gray-600 font-medium">
                                      {groupedLecture.code}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {groupedLecture.faculty}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {groupedLecture.room}
                                    </div>
                                    {colSpan > 1 && (
                                      <div className="text-xs text-gray-400 mt-1">
                                        {time.split('-')[0]} to {groupedLecture.timeSlots[groupedLecture.timeSlots.length - 1].split('-')[1]}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-gray-400 text-sm font-medium">
                                    No class
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoadingLectures && lectures.length === 0 && (
        <div className="flex justify-center items-center py-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center max-w-md mx-4">
            {selectedFilters.course || selectedFilters.batch || selectedFilters.semester || selectedFilters.faculty || selectedFilters.room ? (
              <p className="text-gray-700 font-medium">No timetable found for the selected criteria.</p>
            ) : (
              <p className="text-gray-700 font-medium">Please select criteria to view timetable.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassTimeTable;
