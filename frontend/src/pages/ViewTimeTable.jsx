import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import SearchableSelect from "../components/SearchableSelect";
import academicData from "../assets/academicData.json";
import { useNavigate } from 'react-router-dom';
import { RefreshCcw } from "lucide-react";
import clsx from 'clsx';

const ViewTimeTable = () => {
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

  // State to track if semester was auto-selected
  const [isSemesterAutoSelected, setIsSemesterAutoSelected] = useState(false);

  // State for loading and error handling
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoadingLectures, setIsLoadingLectures] = useState(false);

  const navigate = useNavigate();

  // API Endpoints
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
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
    const uniqueTimeSlots = new Set(); // Start with empty set to only include time slots with lectures

    lectures.forEach(lecture => {
      const timeSlot = `${lecture.StartTime}-${lecture.EndTime}`;
      uniqueTimeSlots.add(timeSlot); // Only add time slots that have lectures

      const key = `${lecture.DayOfWeek}-${timeSlot}`;
      const lectureData = {
        id: lecture.ID,
        subject: subjects.find(sub => sub.ID === lecture.SubjectID)?.Name || 'N/A',
        code: subjects.find(sub => sub.ID === lecture.SubjectID)?.Code || 'N/A',
        faculty: faculties.find(fac => fac.ID === lecture.FacultyID)?.Name || 'N/A',
        room: rooms.find(room => room.ID === lecture.RoomID)?.Name || 'N/A',
        startTime: lecture.StartTime,
        endTime: lecture.EndTime
      };

      // Handle multiple lectures in the same timeslot
      if (grid[key]) {
        // Convert to array if not already
        if (!Array.isArray(grid[key])) {
          grid[key] = [grid[key]];
        }
        grid[key].push(lectureData);
      } else {
        grid[key] = lectureData;
      }
    });

    // Convert Set to array and sort time slots - only includes slots with lectures
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
      // Find the selected objects based on their IDs/names
      const selectedCourse = courses.find(c => c.ID === parseInt(selectedFilters.course));

      // Find batch based on both the Year-Section format AND the selected course
      const selectedBatch = batches.find(b => {
        const batchValue = `${b.Year}-${b.Section}`;
        const matchesFormat = batchValue === selectedFilters.batch;
        const matchesCourse = selectedFilters.course ? b.CourseID === parseInt(selectedFilters.course) : true;

        console.log('Checking batch:', batchValue, 'CourseID:', b.CourseID, 'Selected Course ID:', selectedFilters.course);
        console.log('Matches format:', matchesFormat, 'Matches course:', matchesCourse);

        return matchesFormat && matchesCourse;
      });

      const selectedFaculty = faculties.find(f => f.ID === parseInt(selectedFilters.faculty));
      const selectedRoom = rooms.find(r => r.ID === parseInt(selectedFilters.room));

      // Debug logging
      console.log('=== FETCH LECTURES DEBUG ===');
      console.log('Selected filters:', selectedFilters);
      console.log('Found course:', selectedCourse);
      console.log('Found batch:', selectedBatch);
      console.log('Found faculty:', selectedFaculty);
      console.log('Found room:', selectedRoom);

      // Validate that the batch belongs to the selected course
      if (selectedBatch && selectedCourse && selectedBatch.CourseID !== selectedCourse.ID) {
        console.error('MISMATCH: Selected batch does not belong to selected course!');
        console.error('Batch CourseID:', selectedBatch.CourseID, 'Selected Course ID:', selectedCourse.ID);
        setError('Selected batch does not belong to the selected course. Please reselect.');
        return;
      }

      // Convert semester to integer if it's a string
      let semesterNumber;
      if (selectedFilters.semester !== undefined && selectedFilters.semester !== null) {
        // If semester is already a number, use it; otherwise convert from roman numeral
        semesterNumber = typeof selectedFilters.semester === 'number'
          ? selectedFilters.semester
          : (isNaN(selectedFilters.semester)
            ? romanToInteger(selectedFilters.semester)
            : parseInt(selectedFilters.semester));
      }

      // Build query parameters
      const queryParams = new URLSearchParams();

      // Log for debugging
      console.log('Selected batch object:', selectedBatch);
      console.log('Semester number:', semesterNumber);

      if (selectedFaculty) {
        queryParams.append('faculty_id', selectedFaculty.ID);
        console.log('Using faculty filter - Faculty ID:', selectedFaculty.ID);
      } else if (selectedRoom) {
        queryParams.append('room_id', selectedRoom.ID);
        console.log('Using room filter - Room ID:', selectedRoom.ID);
      } else if (selectedBatch && semesterNumber !== undefined && selectedCourse) {
        // Double-check that batch belongs to the course
        if (selectedBatch.CourseID === selectedCourse.ID) {
          queryParams.append('batch_id', selectedBatch.ID);
          queryParams.append('semester', semesterNumber);
          console.log('Using batch filter - Batch ID:', selectedBatch.ID, 'Semester:', semesterNumber);
          console.log('Batch belongs to Course:', selectedCourse.Name, 'ID:', selectedCourse.ID);
          if (selectedBatch.Section) {
            queryParams.append('section', selectedBatch.Section);
            console.log('Added section:', selectedBatch.Section);
          }
        } else {
          console.error('ERROR: Batch CourseID mismatch!');
          console.error('Batch CourseID:', selectedBatch.CourseID, 'Selected Course ID:', selectedCourse.ID);
          setError('Data inconsistency detected. Please refresh and try again.');
          return;
        }
      } else {
        console.error('No valid filter combination found!');
        console.log('selectedBatch exists:', !!selectedBatch);
        console.log('selectedCourse exists:', !!selectedCourse);
        console.log('semesterNumber defined:', semesterNumber !== undefined);
        setError('Please ensure all required fields are selected properly.');
        return;
      }

      console.log('Final query params:', queryParams.toString());
      console.log('=== END DEBUG ===');

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
        console.log('Fetched lectures:', filteredLectures);
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
    setIsSemesterAutoSelected(false);
  };

  const handleBatchChange = (value) => {
    if (value === "placeholder") {
      setSelectedFilters(prev => ({
        ...prev,
        batch: null,
        semester: null,
        faculty: null,
        room: null
      }));
      setIsSemesterAutoSelected(false);
    } else {
      // Extract batch year from the batch value (format: "YYYY-Section")
      const [batchYear, section] = value.split('-');

      // Calculate and auto-select current semester
      const currentSemester = calculateCurrentSemester(batchYear);

      // Log for debugging
      console.log('Selected batch:', value);
      console.log('Batch year:', batchYear);
      console.log('Calculated semester:', currentSemester);

      setSelectedFilters(prev => ({
        ...prev,
        batch: value,
        semester: currentSemester,
        faculty: null,
        room: null
      }));
      setIsSemesterAutoSelected(true);
    }
  };

  const handleSemesterChange = (value) => {
    setSelectedFilters(prev => ({
      ...prev,
      semester: value === "placeholder" ? null : value,
      faculty: null,
      room: null
    }));
    // Clear auto-selected flag when manually changing semester
    setIsSemesterAutoSelected(false);
  };

  const handleFacultyChange = (value) => {
    setSelectedFilters({
      faculty: value === "placeholder" ? null : value,
      course: null,
      batch: null,
      semester: null,
      room: null
    });
    setIsSemesterAutoSelected(false);
  };

  const handleRoomChange = (value) => {
    setSelectedFilters({
      room: value === "placeholder" ? null : value,
      course: null,
      batch: null,
      semester: null,
      faculty: null
    });
    setIsSemesterAutoSelected(false);
  };

  // Button handlers
  const handleGenerateTimetable = () => {
    if (selectedFilters.faculty !== null ||
      selectedFilters.room !== null ||
      (selectedFilters.course !== null &&
        selectedFilters.batch !== null &&
        selectedFilters.semester !== null)) {
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
    setIsSemesterAutoSelected(false);
    setLectures([]);
    setGridData({});
    setAllTimeSlots(Array.isArray(academicData.timeSlots) ? sortTimeSlots(academicData.timeSlots) : []);
  };

  // Utility functions
  const calculateCurrentSemester = (batchYear) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11, so add 1

    // Calculate academic year - if current month is before June (6), we're still in the previous academic year
    const academicYear = currentMonth >= 6 ? currentYear : currentYear - 1;

    // Calculate years since batch started
    const yearsSinceStart = academicYear - parseInt(batchYear);

    // Calculate semester based on years and current month
    // If current month is June-December (6-12), it's odd semester (1, 3, 5, 7)
    // If current month is January-May (1-5), it's even semester (2, 4, 6, 8)
    let semester;
    if (currentMonth >= 6) {
      // Odd semester (July-December)
      semester = (yearsSinceStart * 2) + 1;
    } else {
      // Even semester (January-June)
      semester = (yearsSinceStart * 2);
    }

    // Ensure semester is within valid range (1-10 based on academicData)
    semester = Math.max(1, Math.min(10, semester));

    // Return the semester in the same format as your academicData.semesters
    // Check if your semesters use roman numerals or numbers
    return semester.toString();
  };

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
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex justify-between items-center rounded-t-2xl">
            <div>
              <h1 className="text-xl font-bold text-white">View Timetable</h1>
              <p className="text-indigo-100 text-sm mt-1">View academic schedules</p>
            </div>
            {/* <div>
              <Button
                className="bg-gradient-to-l from-indigo-600 to-blue-600 border-1 text-white px-2 py-2 rounded-lg transition-colors duration-200 text-sm font-medium md:px-4"
                onClick={() => navigate("/dashboard")}
              >
                <span className="hidden sm:inline">Back to DashBoard</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </div> */}
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Course Select */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Course</label>
                <SearchableSelect
                  value={selectedFilters.course}
                  onSelect={handleCourseChange}
                  placeholder="Select course"
                  disabled={loading}
                  options={[
                    { value: "placeholder", label: "" },
                    ...courses.map((course) => ({
                      value: course.ID.toString(),
                      label: course.Name,
                    })),
                  ]}
                />
              </div>

              {/* Batch Select */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Batch</label>
                <SearchableSelect
                  disabled={!selectedFilters.course || loading}
                  value={selectedFilters.batch}
                  onSelect={handleBatchChange}
                  placeholder="Select batch"
                  options={[
                    { value: "placeholder", label: "" },
                    ...batches
                      .filter((batch) =>
                        selectedFilters.course
                          ? batch.CourseID === parseInt(selectedFilters.course)
                          : false
                      )
                      .sort((a, b) => {
                        if (a.Year !== b.Year) return a.Year - b.Year;
                        return a.Section.localeCompare(b.Section);
                      })
                      .map((batch) => ({
                        value: `${batch.Year}-${batch.Section}`,
                        label: `Batch ${batch.Year} - Section ${batch.Section}`,
                      })),
                  ]}
                />
              </div>

              {/* Semester Select */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Semester</label>
                <SearchableSelect
                  value={selectedFilters.semester}
                  onSelect={handleSemesterChange}
                  disabled={!selectedFilters.batch}
                  placeholder="Select semester"
                  options={[
                    { value: "placeholder", label: "" },
                    ...semesters.map((semester) => ({
                      value: semester.id || semester.number?.toString(),
                      label: semester.id || semester.number.toString(),
                    })),
                  ]}
                />
                {isSemesterAutoSelected && selectedFilters.batch && selectedFilters.semester && (
                  <div className="text-xs text-indigo-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Auto-selected current semester
                  </div>
                )}
              </div>

              {/* Faculty Select */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Faculty</label>
                <SearchableSelect
                  value={selectedFilters.faculty}
                  onSelect={handleFacultyChange}
                  disabled={loading}
                  placeholder="Select faculty"
                  options={[
                    { value: "placeholder", label: "" },
                    ...faculties.map((faculty) => ({
                      value: faculty.ID.toString(),
                      label: faculty.Name,
                    })),
                  ]}
                />
              </div>

              {/* Room Select */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Room</label>
                <SearchableSelect
                  value={selectedFilters.room}
                  onSelect={handleRoomChange}
                  disabled={loading}
                  placeholder="Select room"
                  options={[
                    { value: "placeholder", label: "" },
                    ...rooms.map((room) => ({
                      value: room.ID.toString(),
                      label: room.Name,
                    })),
                  ]}
                />
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

                  // Only show days that have lectures
                  if (dayLectures.length === 0) {
                    return null;
                  }

                  // Group lectures by timeslot for this day
                  const lecturesByTimeSlot = {};
                  dayLectures.forEach(lecture => {
                    const timeSlot = `${lecture.StartTime}-${lecture.EndTime}`;
                    if (!lecturesByTimeSlot[timeSlot]) {
                      lecturesByTimeSlot[timeSlot] = [];
                    }
                    lecturesByTimeSlot[timeSlot].push({
                      id: lecture.ID,
                      subject: subjects.find(sub => sub.ID === lecture.SubjectID)?.Name || 'N/A',
                      code: subjects.find(sub => sub.ID === lecture.SubjectID)?.Code || 'N/A',
                      faculty: faculties.find(fac => fac.ID === lecture.FacultyID)?.Name || 'N/A',
                      room: rooms.find(room => room.ID === lecture.RoomID)?.Name || 'N/A',
                    });
                  });

                  return (
                    <div key={day} className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-bold text-indigo-700 mb-3 text-lg">{day}</h3>
                      <div className="space-y-2">
                        {Object.entries(lecturesByTimeSlot)
                          .sort(([timeA], [timeB]) => {
                            const [startA] = timeA.split('-');
                            const [startB] = timeB.split('-');
                            return parseTimeToMinutes(startA) - parseTimeToMinutes(startB);
                          })
                          .map(([timeSlot, lectures]) => (
                            <div
                              key={`${day}-${timeSlot}`}
                              className="bg-white rounded-lg p-3 border-2 border-gray-200"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="text-sm font-semibold text-gray-600 mb-1">
                                    {timeSlot}
                                  </div>
                                  {lectures.length > 0 ? (
                                    <div className="space-y-2">
                                      {lectures.map((lecture, index) => (
                                        <div key={index}>
                                          {index > 0 && (
                                            <div className="flex items-center my-2">
                                              <div className="flex-1 h-px bg-blue-300"></div>
                                              <div className="px-2 text-xs text-blue-600 font-medium">•</div>
                                              <div className="flex-1 h-px bg-blue-300"></div>
                                            </div>
                                          )}
                                          <div className={`${lectures.length > 1 ? 'border-l-2 border-indigo-300 pl-2 text-center' : ''}`}>
                                            <div className="font-semibold text-indigo-700 text-sm mb-1">
                                              {lecture.subject}
                                              {lectures.length > 1 && <span className="ml-1 text-xs text-gray-500">({index + 1})</span>}
                                            </div>
                                            <div className="text-xs text-gray-600 mb-1">
                                              {lecture.code}
                                            </div>
                                            <div className="text-xs text-gray-500 mb-1">
                                              {lecture.faculty}
                                            </div>
                                            {lecture.room && (
                                              <div className="text-xs text-gray-500">
                                                Room: {lecture.room}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-gray-400 text-sm">No class</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
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
                    {days
                      .filter(day => lectures.some(lec => lec.DayOfWeek === day)) // Only include days with lectures
                      .map((day, dayIndex) => {
                        const groupedLectures = groupConsecutiveTimeSlots(lectures, [day], allTimeSlots);

                        return (
                          <tr key={day} className={dayIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="border-r border-gray-200 p-4 font-bold text-indigo-700 bg-gradient-to-r from-indigo-50 to-blue-50 text-center">
                              {day}
                            </td>
                            {allTimeSlots.map((time, timeIndex) => {
                              const cellKey = `${day}-${time}`;
                              const cellData = gridData[cellKey];
                              const lectures = Array.isArray(cellData) ? cellData : (cellData ? [cellData] : []);
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
                                    colSpan > 1 ? "bg-blue-50" : "",
                                    lectures.length > 1 ? "bg-gradient-to-br from-indigo-50 to-purple-50" : ""
                                  )}
                                  colSpan={colSpan}
                                >
                                  {lectures.length > 0 ? (
                                    <div>
                                      {lectures.map((lecture, index) => (
                                        <div key={index}>
                                          {index > 0 && (
                                            <div className="flex items-center my-1">
                                              <div className="flex-1 h-px bg-blue-400"></div>
                                              <div className="px-1 text-xs text-blue-600 font-bold">•</div>
                                              <div className="flex-1 h-px bg-blue-400"></div>
                                            </div>
                                          )}
                                          <div className={`${lectures.length > 1 ? 'text-center' : ''}`}>
                                            <div className="font-semibold text-indigo-700 text-sm leading-tight">
                                              {lecture.subject}
                                              {lectures.length > 1 && <span className="ml-1 text-xs text-gray-500">({index + 1})</span>}
                                            </div>
                                            <div className="text-xs text-gray-600 font-medium">
                                              {lecture.code}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                              {lecture.faculty}
                                            </div>
                                            {lecture.room && (
                                              <div className="text-xs text-gray-400">
                                                {lecture.room}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                      {colSpan > 1 && (
                                        <div className="text-xs text-gray-400 mt-1">
                                          {time.split('-')[0]} to {groupedLecture.timeSlots[groupedLecture.timeSlots.length - 1].split('-')[1]}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    // This case should rarely occur now since we only show time slots with lectures
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

export default ViewTimeTable;
