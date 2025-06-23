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
  const [subjects, setSubjects] = useState([]); // Keep subjects to display names in timetable
  const [faculties, setFaculties] = useState([]);
  const [rooms, setRooms] = useState([]);

  // State for the currently displayed lectures (timetable data)
  const [lectures, setLectures] = useState([]);

  // State for the selected filter criteria by the user
  const [selectedFilters, setSelectedFilters] = useState({
    course: undefined,
    batch: undefined,
    semester: undefined,
    faculty: undefined,
    room: undefined
  });

  // State for loading and error handling
  const [loading, setLoading] = useState(false); // For initial data loading
  const [error, setError] = useState(null);
  const [isLoadingLectures, setIsLoadingLectures] = useState(false); // For lecture data loading

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
  };

  // Effect to fetch initial data (courses, batches, etc.) on component mount
  useEffect(() => {
    fetchAllData();
  }, []);


  // --- Data Fetching Functions ---
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
    } catch (err) {
      setError('Failed to fetch initial data');
      console.error('Error fetching initial data:', err);
    } finally {
      setLoading(false);
    }
  };

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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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


  // --- Function to Fetch Lectures based on the current selectedFilters state ---
  const fetchLectures = async () => {
    setIsLoadingLectures(true);
    setError(null);
    setLectures([]); // Clear previous lectures while loading

    try {
      // Find the selected objects based on their names
      const selectedCourse = courses.find(c => c.Name === selectedFilters.course);
      const selectedBatch = batches.find(b => b.Year === selectedFilters.batch);
      const selectedFaculty = faculties.find(f => f.Name === selectedFilters.faculty);
      const selectedRoom = rooms.find(r => r.Name === selectedFilters.room);
      const semesterNumber = selectedFilters.semester !== undefined ? romanToInteger(selectedFilters.semester) : undefined;


      // Fetch all lectures without parameters (similar to CreateTable.jsx)
      const response = await fetch(API_ENDPOINTS.LECTURE, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          setLectures([]); // No lectures found is not an error in this view
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } else {
        const allLectures = await response.json();
        let filteredLectures = [];

        // Filter lectures based on selected criteria (similar to loadExistingLectures in CreateTable.jsx)
        if (selectedFaculty) {
          // Filter by Faculty ID
          filteredLectures = allLectures.filter(lecture =>
            lecture.FacultyID === selectedFaculty.ID
          );
          console.log('Filtered lectures for faculty:', selectedFaculty.Name, filteredLectures);
        } 
        else if (selectedRoom) {
          // Filter by Room ID
          filteredLectures = allLectures.filter(lecture =>
            lecture.RoomID === selectedRoom.ID
          );
          console.log('Filtered lectures for room:', selectedRoom.Name, filteredLectures);
        } 
        else if (selectedBatch && semesterNumber !== undefined) {
          // Filter by Batch ID and Semester
          filteredLectures = allLectures.filter(lecture =>
            lecture.BatchID === selectedBatch.ID &&
            lecture.Semester === semesterNumber
          );
          console.log('Filtered lectures for batch:', selectedBatch.Year, 'semester:', semesterNumber, filteredLectures);
        }

        setLectures(filteredLectures);
      }
    } catch (err) {
      setError('Failed to fetch lectures');
      console.error('Error fetching lectures:', err);
      setLectures([]); // Clear lectures on error
    } finally {
      setIsLoadingLectures(false);
    }
  };

  // --- Handlers for Select Changes ---
  // These handlers update the selectedFilters state
  const handleCourseChange = (value) => {
    setSelectedFilters({
      course: value,
      batch: undefined,
      semester: undefined,
      faculty: undefined,
      room: undefined
    });
  };

  const handleBatchChange = (value) => {
    setSelectedFilters(prevFilters => ({
      ...prevFilters,
      batch: value,
      semester: undefined,
      faculty: undefined,
      room: undefined
    }));
  };

  const handleSemesterChange = (value) => {
    setSelectedFilters(prevFilters => ({
      ...prevFilters,
      semester: value,
      faculty: undefined,
      room: undefined
    }));
  };

  const handleFacultyChange = (value) => {
     // When faculty is selected, reset other main filters
    setSelectedFilters({
      faculty: value,
      course: undefined,
      batch: undefined,
      semester: undefined,
      room: undefined
    });
  };

  const handleRoomChange = (value) => {
     // When room is selected, reset other main filters
    setSelectedFilters({
      room: value,
      course: undefined,
      batch: undefined,
      semester: undefined,
      faculty: undefined
    });
  };

  // --- Button Handlers ---
   const handleGenerateTimetable = () => {
       // Allow fetching if faculty or room is selected OR if course+batch+semester are selected
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
       // Reset all filters and clear the displayed timetable
       setSelectedFilters({
           course: undefined,
           batch: undefined,
           semester: undefined,
           faculty: undefined,
           room: undefined
       });
       setLectures([]);
   };


  // --- Filtering Options for Dropdowns ---
  const getFilteredBatches = () => {
    if (selectedFilters.course === undefined) return [];
    const selectedCourse = courses.find(course => course.Name === selectedFilters.course);
    if (!selectedCourse) return [];
    return batches.filter(batch => batch.CourseID === selectedCourse.ID);
  };

  const getFilteredSemesters = () => {
     // Filter semesters based on selected course and batch if necessary
     // Assuming semesters are linked to batches or courses in academicData
      if (selectedFilters.course === undefined || selectedFilters.batch === undefined) return semesters;
      // Add logic to filter semesters based on selected course and batch if needed
      return semesters; // Return all semesters for now if no specific filtering logic exists
  };

  const getFilteredFaculties = () => {
      // Filter faculties based on selected course, batch, semester if necessary
      // For now, return all faculties
      return faculties;
  };

   const getFilteredRooms = () => {
      // Filter rooms based on selected course, batch, semester if necessary
      // For now, return all rooms
      return rooms;
  };


  // --- Utility Functions ---
  // Converts Roman numerals to integers (used for semester)
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
      } else {
          console.warn(`Invalid Roman numeral character: ${romanStr[i]}`);
      }
    }

    return result;
  };

  // Parses time strings (HH:MM) into minutes for comparison
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

  // Get days of the week and time slots from academicData.json
  const days = Array.isArray(academicData.days) ? academicData.days : [];
  const timeSlots = Array.isArray(academicData.timeSlots) ? academicData.timeSlots : [];


  // --- Render JSX ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header and Error Handling */}
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
                <span className="sm:hidden ">Back</span>
              </Button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Course Select */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Course</label>
                <Select value={selectedFilters.course} onValueChange={handleCourseChange}>
                   <SelectTrigger className="w-full h-12 border-2 border-gray-200 rounded-xl hover:border-indigo-300 focus:border-indigo-500 transition-colors">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 shadow-lg">
                     <SelectItem value={undefined}>Select course</SelectItem>
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
                <Select value={selectedFilters.batch} onValueChange={handleBatchChange} disabled={selectedFilters.course === undefined}>
                   <SelectTrigger className="w-full h-12 border-2 border-gray-200 rounded-xl hover:border-indigo-300 focus:border-indigo-500 transition-colors">
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 shadow-lg">
                     <SelectItem value={undefined}>Select batch</SelectItem>
                    {getFilteredBatches().map((batch) => (
                      <SelectItem key={batch.ID} value={batch.Year} className="rounded-lg">
                        <div className="flex flex-col">
                          <span className="font-medium">{batch.Year}</span>
                          {batch.Section && (
                            <span className="text-xs text-gray-500">Section: {batch.Section}</span>
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
                 <Select value={selectedFilters.semester} onValueChange={handleSemesterChange} disabled={selectedFilters.batch === undefined}>
                   <SelectTrigger className="w-full h-12 border-2 border-gray-200 rounded-xl hover:border-indigo-300 focus:border-indigo-500 transition-colors">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 shadow-lg">
                     <SelectItem value={undefined}>Select semester</SelectItem>
                    {getFilteredSemesters().map((semester) => (
                      <SelectItem key={semester.id} value={semester.id || semester.number?.toString()} className="rounded-lg">
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
                <Select value={selectedFilters.faculty} onValueChange={handleFacultyChange} disabled={loading}>
                   <SelectTrigger className="w-full h-12 border-2 border-gray-200 rounded-xl hover:border-indigo-300 focus:border-indigo-500 transition-colors">
                    <SelectValue placeholder="Select faculty" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 shadow-lg">
                     <SelectItem value={undefined}>Select faculty</SelectItem>
                    {getFilteredFaculties().map((faculty) => (
                      <SelectItem key={faculty.ID} value={faculty.Name} className="rounded-lg">
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
                 <Select value={selectedFilters.room} onValueChange={handleRoomChange} disabled={loading}>
                   <SelectTrigger className="w-full h-12 border-2 border-gray-200 rounded-xl hover:border-indigo-300 focus:border-indigo-500 transition-colors">
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 shadow-lg">
                    <SelectItem value={undefined}>Select room</SelectItem>
                    {getFilteredRooms().map((room) => (
                      <SelectItem key={room.ID} value={room.Name} className="rounded-lg">
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
                       selectedFilters.course !== undefined && selectedFilters.batch !== undefined && selectedFilters.semester !== undefined && !loading && !isLoadingLectures,
                     "bg-gray-200 text-gray-500 cursor-not-allowed":
                       selectedFilters.course === undefined || selectedFilters.batch === undefined || selectedFilters.semester === undefined || loading || isLoadingLectures,
                   }
                 )}
                onClick={handleGenerateTimetable}
                disabled={
                  (selectedFilters.course === undefined || 
                   selectedFilters.batch === undefined || 
                   selectedFilters.semester === undefined) && 
                  selectedFilters.faculty === undefined && 
                  selectedFilters.room === undefined || 
                  loading || 
                  isLoadingLectures
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

      {/* Loading State for Lectures */}
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


      {/* Timetable Grid (View Only) */}
      {lectures.length > 0 && !isLoadingLectures && (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
             <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
                 <h2 className="text-xl font-bold text-white">Timetable</h2>
             </div>

            {/* Mobile Timetable View */}
            <div className="lg:hidden">
              <div className="p-4 space-y-4">
                {days.map((day) => (
                  <div key={day} className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-bold text-indigo-700 mb-3 text-lg">{day}</h3>
                    <div className="space-y-2">
                      {sortTimeSlots([...timeSlots]).map((time) => {
                        const lecture = lectures.find(lec =>
                          lec.DayOfWeek === day &&
                          `${lec.StartTime}-${lec.EndTime}` === time
                        );
                        return (
                          <div
                            key={`${day}-${time}`}
                            className="bg-white rounded-lg p-3 border-2 border-gray-200"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="text-sm font-semibold text-gray-600 mb-1">{time}</div>
                                {lecture ? (
                                  <div>
                                    <div className="font-semibold text-indigo-700 text-sm mb-1">
                                      {subjects.find(sub => sub.ID === lecture.SubjectID)?.Name || 'N/A'}
                                    </div>
                                    <div className="text-xs text-gray-600 mb-1">
                                        {subjects.find(sub => sub.ID === lecture.SubjectID)?.Code || 'N/A'}
                                    </div>
                                     <div className="text-xs text-gray-500">
                                      {faculties.find(fac => fac.ID === lecture.FacultyID)?.Name || 'N/A'}
                                    </div>
                                     <div className="text-xs text-gray-500">
                                        {rooms.find(room => room.ID === lecture.RoomID)?.Name || 'N/A'}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-gray-400 text-sm">No class</div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
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
                      {sortTimeSlots([...timeSlots]).map((time, index) => (
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
                    {days.map((day, dayIndex) => (
                      <tr key={day} className={dayIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="border-r border-gray-200 p-4 font-bold text-indigo-700 bg-gradient-to-r from-indigo-50 to-blue-50 text-center">
                          {day}
                        </td>
                        {sortTimeSlots([...timeSlots]).map((time) => {
                           const lecture = lectures.find(lec =>
                            lec.DayOfWeek === day &&
                            `${lec.StartTime}-${lec.EndTime}` === time
                          );
                          return (
                            <td
                              key={`${day}-${time}`}
                              className="border-r border-gray-200 p-3 text-center h-24 min-w-[140px]"
                            >
                              {lecture ? (
                                <div className="space-y-1">
                                   <div className="font-semibold text-indigo-700 text-sm leading-tight">
                                      {subjects.find(sub => sub.ID === lecture.SubjectID)?.Name || 'N/A'}
                                    </div>
                                    <div className="text-xs text-gray-600 font-medium">
                                        {subjects.find(sub => sub.ID === lecture.SubjectID)?.Code || 'N/A'}
                                    </div>
                                     <div className="text-xs text-gray-500">
                                      {faculties.find(fac => fac.ID === lecture.FacultyID)?.Name || 'N/A'}
                                    </div>
                                     <div className="text-xs text-gray-500">
                                        {rooms.find(room => room.ID === lecture.RoomID)?.Name || 'N/A'}
                                    </div>
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Display message based on selection state */}
      {!isLoadingLectures && lectures.length === 0 && (
          <div className="flex justify-center items-center py-8">
             <div className="bg-white rounded-xl shadow-lg p-6 text-center max-w-md mx-4">
               {selectedFilters.course !== undefined || selectedFilters.batch !== undefined || selectedFilters.semester !== undefined || selectedFilters.faculty !== undefined || selectedFilters.room !== undefined ? (
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
