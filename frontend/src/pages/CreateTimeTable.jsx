import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Save, RefreshCw, Trash } from "lucide-react";
import academicData from "../assets/academicData.json";

const groupConsecutiveTimeSlots = (gridData, days, timeSlots) => {
  const groupedData = {};

  days.forEach(day => {
    let currentGroup = null;

    timeSlots.forEach((time, timeIndex) => {
      const key = `${day}-${time}`;
      const lecture = gridData[key];

      if (lecture) {
        const groupKey = `${day}-${lecture.subject}-${lecture.faculty}`;

        if (currentGroup && currentGroup.groupKey === groupKey &&
          currentGroup.endIndex === timeIndex - 1) {
          // Continue current group
          currentGroup.timeSlots.push(time);
          currentGroup.endIndex = timeIndex;
          groupedData[key] = currentGroup;
        } else {
          // Start new group
          currentGroup = {
            ...lecture,
            groupKey,
            timeSlots: [time],
            startIndex: timeIndex,
            endIndex: timeIndex,
            isGrouped: true
          };
          groupedData[key] = currentGroup;
        }
      } else {
        // No lecture, reset current group
        currentGroup = null;
      }
    });
  });

  return groupedData;
};

const CreateTimeTable = () => {
  const [gridData, setGridData] = useState({});
  const [selectedCell, setSelectedCell] = useState(null);
  const [dialogData, setDialogData] = useState({ subject: "", code: "", faculty: "", room: "" });
  const [showTimetable, setShowTimetable] = useState(false);
  const [batchDetails, setBatchDetails] = useState({
    course: "",
    batch: "",
    semester: "",
  });
  const [isLocked, setIsLocked] = useState(false);
  const [predefinedTimeSlots] = useState([
    "09:00-10:00",
    "10:00-11:00",
    "11:00-12:00",
    "12:00-13:00",
    "13:00-14:00",
    "14:00-15:00",
    "15:00-16:00",
    "16:00-17:00"
  ]);

  // Initialize timeSlots with predefinedTimeSlots
  const [timeSlots, setTimeSlots] = useState([...predefinedTimeSlots]);
  const [showAddTimeSlotDialog, setShowAddTimeSlotDialog] = useState(false);
  const [newTimeSlot, setNewTimeSlot] = useState("");
  const [editTimeSlotDialog, setEditTimeSlotDialog] = useState(false);
  const [editingTimeSlot, setEditingTimeSlot] = useState({ index: -1, value: "" });

  // New state variables for timetable management
  const [timetableState, setTimetableState] = useState({
    id: null,
    gridData: {},
    timeSlots: [...academicData.timeSlots],
    lastSaved: null,
    isExisting: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // API Data States
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [lastUsedRoom, setLastUsedRoom] = useState("");

  // State to track if semester was auto-selected
  const [isSemesterAutoSelected, setIsSemesterAutoSelected] = useState(false);

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

  useEffect(() => {
    fetchAllData();
  }, []);

  // Debug function removed for production

  useEffect(() => {
    if (allDetailsSelected() &&
      batches.length > 0 &&
      courses.length > 0 &&
      subjects.length > 0 &&
      faculties.length > 0) {
      loadExistingLectures();
    }
  }, [batchDetails.course, batchDetails.batch, batchDetails.semester, batches, courses, subjects, faculties]);

  useEffect(() => {
    setTimetableState(prev => ({
      ...prev,
      gridData: gridData,
      timeSlots: timeSlots
    }));
  }, [gridData, timeSlots]);

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
      setSemesters(academicData.semesters || []);
    } catch (err) {
      setError('Failed to fetch data from server');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.GET_COURSE, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Include credentials for CORS requests
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // console.log('Courses API Response:', data);   //Commented out for now
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.GET_SUBJECT, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Include credentials for CORS requests
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // console.log('Subjects API Response:', data);   //Commented out for now
      setSubjects(data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchFaculties = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.GET_FACULTY, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Include credentials for CORS requests
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setFaculties(data);
    } catch (error) {
      console.error('Error fetching faculties:', error);
    }
  };

  // No Use of this right now But still Implimented as may be needed in future
  const fetchRooms = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.GET_ROOM, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Include credentials for CORS requests
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.GET_BATCH, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Include credentials for CORS requests
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // console.log('Batches API Response Data:', data);  //Commented out for now
      setBatches(data);
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const loadExistingLectures = async () => {
    if (!allDetailsSelected()) return;

    setIsLoading(true);
    try {
      const [year, section] = batchDetails.batch.split('-');
      const selectedCourse = courses.find(course => course.Name === batchDetails.course);
      
      // Find batch by year, section AND course ID
      const selectedBatch = batches.find(batch =>
        batch.Year === parseInt(year) && 
        batch.Section === section &&
        batch.CourseID === selectedCourse?.ID
      );

      if (!selectedBatch || !selectedCourse) {
        // Batch or course not found
        return;
      }

      const semesterNumber = romanToInteger(batchDetails.semester);
      const queryParams = new URLSearchParams();
      queryParams.append('batch_id', selectedBatch.ID);
      queryParams.append('semester', semesterNumber);
      queryParams.append('section', selectedBatch.Section);

      const response = await fetch(`${API_ENDPOINTS.LECTURE_QUERY}?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        const filteredLectures = await response.json();

        if (filteredLectures && filteredLectures.length > 0) {
          const reconstructedGridData = {};
          const timeSlotsSet = new Set();
          let mostRecentRoom = "";

          filteredLectures.forEach(lecture => {
            const timeSlot = `${lecture.StartTime}-${lecture.EndTime}`;
            const key = `${lecture.DayOfWeek}-${timeSlot}`;

            reconstructedGridData[key] = {
              id: lecture.ID,
              subject: lecture.Subject?.Name || '',
              code: lecture.Subject?.Code || '',
              faculty: lecture.Faculty?.Name || '',
              room: lecture.Room?.Name || ''
            };

            // Track the most recent room for pre-selection
            if (lecture.Room?.Name) {
              mostRecentRoom = lecture.Room.Name;
            }

            timeSlotsSet.add(timeSlot);
          });

          // Set the last used room from existing lectures
          if (mostRecentRoom) {
            setLastUsedRoom(mostRecentRoom);
          }

          // Include default time slots if they don't exist
          academicData.timeSlots.forEach(slot => timeSlotsSet.add(slot));

          const sortedTimeSlots = sortTimeSlots([...timeSlotsSet]);

          setGridData(reconstructedGridData);
          setTimeSlots(sortedTimeSlots);
          setTimetableState({
            id: null,
            gridData: reconstructedGridData,
            timeSlots: sortedTimeSlots,
            lastSaved: new Date().toISOString(),
            isExisting: true
          });
        } else {
          resetTimetableState();
        }
      } else if (response.status === 404) {
        resetTimetableState();
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading lectures:', error);
      resetTimetableState();
    } finally {
      setIsLoading(false);
    }
  };

  const resetTimetableState = () => {
    const defaultTimeSlots = [...academicData.timeSlots];
    setGridData({});
    setTimeSlots(defaultTimeSlots);
    setLastUsedRoom(""); // Clear last used room when resetting
    setIsSemesterAutoSelected(false); // Reset auto-selected semester flag
    setTimetableState({
      id: null,
      gridData: {},
      timeSlots: defaultTimeSlots,
      lastSaved: null,
      isExisting: false
    });
  };

  const saveLectures = async () => {
    if (!allDetailsSelected()) {
      alert('Please select course, batch, and semester');
      return;
    }

    setIsSaving(true);
    try {
      const [year, section] = batchDetails.batch.split('-');
      const selectedCourse = courses.find(course => course.Name === batchDetails.course);
      const selectedBatch = batches.find(batch =>
        batch.Year === parseInt(year) && 
        batch.Section === section &&
        batch.CourseID === selectedCourse?.ID
      );

      if (!selectedBatch || !selectedCourse) {
        throw new Error('Selected batch or course not found');
      }

      const semesterNumber = romanToInteger(batchDetails.semester);

      // Get all existing lectures for this batch and semester
      const queryParams = new URLSearchParams();
      queryParams.append('batch_id', selectedBatch.ID);
      queryParams.append('semester', semesterNumber);
      queryParams.append('section', selectedBatch.Section);

      const getResponse = await fetch(`${API_ENDPOINTS.LECTURE_QUERY}?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!getResponse.ok) {
        throw new Error(`Failed to fetch existing lectures: ${getResponse.status}`);
      }

      const existingLectures = await getResponse.json();

      // Create a map of existing lectures by their composite key
      const existingLecturesMap = new Map();
      existingLectures.forEach(lecture => {
        const key = `${lecture.DayOfWeek}-${lecture.StartTime}-${lecture.EndTime}`;
        existingLecturesMap.set(key, lecture);
      });

      // Process current grid data
      const lecturesToProcess = Object.entries(timetableState.gridData)
        .map(([key, entry]) => {
          const [day, startTime, endTime] = key.split('-');
          const subject = subjects.find(sub => sub.Name === entry.subject);
          const faculty = faculties.find(fac => fac.Name === entry.faculty);
          const room = rooms.find(r => r.Name === entry.room);

          if (!subject || !faculty || !room) return null;

          // CRITICAL FIX: Only treat as existing lecture if it belongs to current batch
          let lectureID = null;
          let isValidExistingLecture = false;
          
          if (entry.id) {
            // Check if this lecture ID exists in the current batch's existing lectures
            const existingLecture = existingLectures.find(el => el.ID === entry.id);
            if (existingLecture && existingLecture.BatchID === selectedBatch.ID) {
              // This is a valid existing lecture for this batch
              lectureID = entry.id;
              isValidExistingLecture = true;
            } else if (existingLecture) {
              // This lecture belongs to a different batch - treat as new lecture
              console.warn(`Lecture ID ${entry.id} belongs to different batch (${existingLecture.BatchID} vs ${selectedBatch.ID}) - creating new lecture`);
              lectureID = null;
              isValidExistingLecture = false;
            }
          }

          return {
            key,
            data: {
              ID: lectureID, // Only use ID if it's a valid existing lecture for this batch
              DayOfWeek: day,
              StartTime: startTime,
              EndTime: endTime,
              SubjectID: subject.ID,
              FacultyID: faculty.ID,
              BatchID: selectedBatch.ID, // Always use current batch ID
              Semester: semesterNumber,
              RoomID: room.ID
            },
            isValidExisting: isValidExistingLecture
          };
        })
        .filter(lecture => lecture !== null);

      // Separate into creates and updates
      const lecturesToUpdate = [];
      const lecturesToCreate = [];

      lecturesToProcess.forEach(({ key, data, isValidExisting }) => {
        const existingLecture = existingLecturesMap.get(key);

        if (existingLecture && existingLecture.BatchID === selectedBatch.ID) {
          // This is a lecture that exists in the same time slot for the current batch
          // Check if any fields have changed (including times)
          const hasChanges = (
            existingLecture.SubjectID !== data.SubjectID ||
            existingLecture.FacultyID !== data.FacultyID ||
            existingLecture.RoomID !== data.RoomID ||
            existingLecture.StartTime !== data.StartTime ||
            existingLecture.EndTime !== data.EndTime
          );

          if (hasChanges) {
            lecturesToUpdate.push({
              ...data,
              ID: existingLecture.ID // Use the existing lecture ID
            });
          }
        } else if (data.ID && isValidExisting) {
          // This is an existing lecture that had its timeslot changed within the same batch
          lecturesToUpdate.push(data);
        } else {
          // This is a new lecture (no ID or ID belongs to different batch)
          const { ID, ...lectureDataWithoutId } = data; // Remove ID for new lectures
          lecturesToCreate.push(lectureDataWithoutId);
        }
      });

      // Find lectures to delete (exist in DB but not in current grid)
      const currentKeys = new Set(lecturesToProcess.map(l => l.key));
      const lecturesToDelete = existingLectures.filter(lecture => {
        const key = `${lecture.DayOfWeek}-${lecture.StartTime}-${lecture.EndTime}`;

        // Don't delete if this lecture was updated (has matching ID in updates)
        const wasUpdated = lecturesToUpdate.some(update => update.ID === lecture.ID);

        return !currentKeys.has(key) && !wasUpdated;
      });

      // Execute updates first
      if (lecturesToUpdate.length > 0) {
        const updatePromises = lecturesToUpdate.map(lecture =>
          fetch(`${API_ENDPOINTS.LECTURE}/${lecture.ID}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(lecture)
          })
        );

        const updateResponses = await Promise.all(updatePromises);
        const updateFailed = updateResponses.some(res => !res.ok);

        if (updateFailed) {
          const errors = await Promise.all(
            updateResponses.map(async (res, index) => {
              if (!res.ok) {
                const error = await res.json().catch(() => ({}));
                return {
                  status: res.status,
                  message: error.message || res.statusText,
                  lectureData: lecturesToUpdate[index]
                };
              }
              return null;
            })
          );
          const errorMessages = errors.filter(e => e)
            .map(e => `Lecture ${e.lectureData.ID}: ${e.message}`)
            .join('\n');
          throw new Error(`Some updates failed:\n${errorMessages}`);
        }
      }

      // Execute creates only if there are truly new lectures
      if (lecturesToCreate.length > 0) {
        const createResponses = await Promise.all(lecturesToCreate.map(lecture =>
          fetch(API_ENDPOINTS.LECTURE, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(lecture)
          })
        ));

        const createErrors = await Promise.all(createResponses.map(async (res, index) => {
          if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            return {
              status: res.status,
              message: error.message || res.statusText,
              lectureData: lecturesToCreate[index]
            };
          }
          return null;
        }));

        if (createErrors.some(e => e)) {
          const errorMessages = createErrors.filter(e => e)
            .map(e => `Lecture ${JSON.stringify(e.lectureData)}: ${e.message}`)
            .join('\n');
          throw new Error(`Some creates failed:\n${errorMessages}`);
        }
      }

      // Execute deletes last (only for lectures that weren't updated)
      if (lecturesToDelete.length > 0) {
        const deleteResponses = await Promise.all(lecturesToDelete.map(lecture =>
          fetch(`${API_ENDPOINTS.LECTURE}/${lecture.ID}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include'
          })
        ));

        const deleteErrors = await Promise.all(deleteResponses.map(async (res, index) => {
          if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            return {
              status: res.status,
              message: error.message || res.statusText,
              lectureData: lecturesToDelete[index]
            };
          }
          return null;
        }));

        if (deleteErrors.some(e => e)) {
          console.warn('Some deletes failed:', deleteErrors.filter(e => e));
        }
      }

      // Reload the timetable to get the latest data with IDs
      await loadExistingLectures();

      // Show success message
      const messageParts = [];
      if (lecturesToCreate.length) messageParts.push(`${lecturesToCreate.length} created`);
      if (lecturesToUpdate.length) messageParts.push(`${lecturesToUpdate.length} updated`);
      if (lecturesToDelete.length) messageParts.push(`${lecturesToDelete.length} deleted`);

      const message = messageParts.length
        ? `Timetable saved successfully! (${messageParts.join(', ')})`
        : 'No changes detected';

      alert(message);

    } catch (error) {
      console.error('Error saving lectures:', error);
      alert(`Failed to save timetable: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getFilteredBatches = () => {
    if (!batchDetails.course) return batches;
    const selectedCourse = courses.find(course => course.Name === batchDetails.course);
    
    if (!selectedCourse) {
      return [];
    }

    return batches
      .filter(batch => batch.CourseID === selectedCourse.ID)
      .sort((a, b) => {
        if (a.Year !== b.Year) return a.Year - b.Year;
        return a.Section.localeCompare(b.Section);
      });
  };

  const getFilteredSemesters = () => {
    if (!batchDetails.course && !batchDetails.batch) return semesters;
    return semesters.filter(semester => true);
  };

  const getFilteredSubjects = () => {
    if (!batchDetails.course) return subjects;
    const selectedCourse = courses.find(course => course.Name === batchDetails.course);
    
    if (!selectedCourse) {
      return [];
    }

    return subjects.filter(subject => subject.CourseID === selectedCourse.ID);
  };

  // Calculate current semester based on batch year and current date
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
    
    return semester.toString();
  };

  const parseTimeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const sortTimeSlots = (slots) => {
    return slots.sort((a, b) => {
      const [startA] = a.split('-');
      const [startB] = b.split('-');
      return parseTimeToMinutes(startA) - parseTimeToMinutes(startB);
    });
  };

  const validateTimeSlot = (timeSlot) => {
    const timeSlotRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])-([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    return timeSlotRegex.test(timeSlot);
  };

  const formatTimeSlot = (timeSlot) => {
    if (!validateTimeSlot(timeSlot)) return null;
    const [startTime, endTime] = timeSlot.split('-');
    const formatTime = (time) => {
      const [hours, minutes] = time.split(':');
      return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    };
    return `${formatTime(startTime)}-${formatTime(endTime)}`;
  };

  const checkTimeSlotOverlap = (newTimeSlot, existingSlots, excludeIndex = -1) => {
    const [newStart, newEnd] = newTimeSlot.split('-');
    const newStartMinutes = parseTimeToMinutes(newStart);
    const newEndMinutes = parseTimeToMinutes(newEnd);

    if (newEndMinutes <= newStartMinutes) {
      return { hasOverlap: true, message: "End time must be after start time!" };
    }

    for (let i = 0; i < existingSlots.length; i++) {
      if (i === excludeIndex) continue;

      const [existingStart, existingEnd] = existingSlots[i].split('-');
      const existingStartMinutes = parseTimeToMinutes(existingStart);
      const existingEndMinutes = parseTimeToMinutes(existingEnd);

      const hasOverlap = (
        (newStartMinutes >= existingStartMinutes && newStartMinutes < existingEndMinutes) ||
        (newEndMinutes > existingStartMinutes && newEndMinutes <= existingEndMinutes) ||
        (newStartMinutes <= existingStartMinutes && newEndMinutes >= existingEndMinutes)
      );

      if (hasOverlap) {
        return {
          hasOverlap: true,
          message: `Time slot overlaps with existing slot: ${existingSlots[i]}`
        };
      }
    }

    return { hasOverlap: false };
  };

  const days = academicData.days;

  const allDetailsSelected = () => {
    return batchDetails.course && batchDetails.batch && batchDetails.semester;
  };

  const handleCellClick = (day, time) => {
    setSelectedCell({ day, time });
    const existingData = gridData[`${day}-${time}`];
    
    if (existingData) {
      // If editing existing lecture, validate that the subject belongs to the current course
      const filteredSubjects = getFilteredSubjects();
      const isSubjectValidForCourse = filteredSubjects.some(sub => sub.Name === existingData.subject);
      
      if (isSubjectValidForCourse) {
        // Use the current data if subject is valid for the course
        setDialogData(existingData);
      } else {
        // Clear subject data if it doesn't belong to current course, but keep room
        setDialogData({ 
          subject: "", 
          code: "", 
          faculty: "", 
          room: existingData.room || lastUsedRoom 
        });
      }
    } else {
      // If adding new lecture, pre-select last used room
      setDialogData({ 
        subject: "", 
        code: "", 
        faculty: "", 
        room: lastUsedRoom 
      });
    }
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
    const romanStr = roman.toString().toUpperCase();

    for (let i = 0; i < romanStr.length; i++) {
      const current = romanMap[romanStr[i]];
      const next = romanMap[romanStr[i + 1]];

      if (next && current < next) {
        result += next - current;
        i++;
      } else {
        result += current;
      }
    }

    return result;
  };


  const handleSaveEntry = () => {
    if (!selectedCell) return;

    const key = `${selectedCell.day}-${selectedCell.time}`;
    const newGridData = { ...gridData };

    if (dialogData.subject && dialogData.faculty && dialogData.room) {
      newGridData[key] = { ...dialogData };
      // Update last used room when saving a lecture
      setLastUsedRoom(dialogData.room);
    } else {
      delete newGridData[key];
    }

    setGridData(newGridData);
    setSelectedCell(null);
    setTimetableState(prev => ({
      ...prev,
      gridData: newGridData
    }));
  };

  const handleClearCell = (day, time) => {
    const key = `${day}-${time}`;
    const newGridData = { ...gridData };
    delete newGridData[key];
    setGridData(newGridData);
    setTimetableState(prev => ({
      ...prev,
      gridData: newGridData
    }));
  };


  const handleDialogInputChange = (field, value) => {
    if (field === "subject") {
      const filteredSubjects = getFilteredSubjects();
      const selectedSubject = filteredSubjects.find((sub) => sub.Name === value);
      setDialogData({
        subject: selectedSubject?.Name || "",
        code: selectedSubject?.Code || "",
        faculty: "",
        room: lastUsedRoom // Keep the last used room when changing subject
      });
    } else {
      setDialogData({ ...dialogData, [field]: value });
    }
  };

  const clearTimetable = () => {
    if (window.confirm('Are you sure you want to clear the entire timetable? This action cannot be undone.')) {
      const defaultGridData = {};
      const defaultTimeSlots = [...academicData.timeSlots];

      setGridData(defaultGridData);
      setTimeSlots(defaultTimeSlots);
      setLastUsedRoom(""); // Clear last used room when clearing timetable
      setIsSemesterAutoSelected(false); // Reset auto-selected semester flag
      setTimetableState({
        id: null,
        gridData: defaultGridData,
        timeSlots: defaultTimeSlots,
        lastSaved: null,
        isExisting: false
      });
    }
  };

  const handleGenerateTimetable = () => {
    if (allDetailsSelected()) {
      setShowTimetable(true);
      setIsLocked(true);
    }
  };

  const handleAddTimeSlot = () => {
    if (!newTimeSlot.trim()) return;

    const formattedTimeSlot = formatTimeSlot(newTimeSlot.trim());
    if (!formattedTimeSlot) {
      alert("Please enter a valid time slot format (e.g., 9:00-10:00 or 17:30-18:30)");
      return;
    }

    if (timeSlots.includes(formattedTimeSlot)) {
      alert("This time slot already exists!");
      return;
    }

    const overlapCheck = checkTimeSlotOverlap(formattedTimeSlot, timeSlots);
    if (overlapCheck.hasOverlap) {
      alert(overlapCheck.message);
      return;
    }

    const newTimeSlots = [...timeSlots, formattedTimeSlot];
    const sortedTimeSlots = sortTimeSlots(newTimeSlots);

    setTimeSlots(sortedTimeSlots);
    setNewTimeSlot("");
    setShowAddTimeSlotDialog(false);

    setTimetableState(prev => ({
      ...prev,
      timeSlots: sortedTimeSlots
    }));
  };

  const handleDeleteTimeSlot = (index) => {
    const timeSlotToDelete = timeSlots[index];

    // Create new grid data without entries for this time slot
    const newGridData = Object.keys(gridData).reduce((acc, key) => {
      const [day, time] = key.split('-');
      if (time !== timeSlotToDelete) {
        acc[key] = gridData[key];
      }
      return acc;
    }, {});

    const newTimeSlots = timeSlots.filter((_, i) => i !== index);

    setGridData(newGridData);
    setTimeSlots(newTimeSlots);

    setTimetableState(prev => ({
      ...prev,
      gridData: newGridData,
      timeSlots: newTimeSlots
    }));
  };

  const handleEditTimeSlot = (index) => {
    setEditTimeSlotDialog(true);
    setEditingTimeSlot({
      index,
      value: timeSlots[index]
    });
  };

  const handleSaveEditTimeSlot = () => {
    if (!editingTimeSlot.value.trim()) return;

    const formattedTimeSlot = formatTimeSlot(editingTimeSlot.value.trim());
    if (!formattedTimeSlot) {
      alert("Please enter a valid time slot format (e.g., 9:00-10:00 or 17:30-18:30)");
      return;
    }

    // Check if the new time slot already exists (excluding the current one being edited)
    if (timeSlots.some((slot, i) => i !== editingTimeSlot.index && slot === formattedTimeSlot)) {
      alert("This time slot already exists!");
      return;
    }

    const [newStart, newEnd] = formattedTimeSlot.split('-');
    const newStartMin = parseTimeToMinutes(newStart);
    const newEndMin = parseTimeToMinutes(newEnd);

    if (newEndMin <= newStartMin) {
      alert("End time must be after start time!");
      return;
    }

    const oldTimeSlot = timeSlots[editingTimeSlot.index];

    // Create new time slots array
    let newTimeSlots = [...timeSlots];

    // Update the edited slot
    newTimeSlots[editingTimeSlot.index] = formattedTimeSlot;

    // Filter out any predefined slots that are fully contained within the new slot
    newTimeSlots = newTimeSlots.filter(slot => {
      // Keep the slot if:
      // 1. It's the new slot we just edited
      if (slot === formattedTimeSlot) return true;

      // 2. It's not a predefined slot
      if (!predefinedTimeSlots.includes(slot)) return true;

      // 3. It's a predefined slot but not fully contained in the new slot
      const [slotStart, slotEnd] = slot.split('-');
      const slotStartMin = parseTimeToMinutes(slotStart);
      const slotEndMin = parseTimeToMinutes(slotEnd);

      return !(slotStartMin >= newStartMin && slotEndMin <= newEndMin);
    });

    const sortedTimeSlots = sortTimeSlots(newTimeSlots);

    // Update grid data - remove any entries in deleted slots
    const newGridData = {};
    Object.keys(gridData).forEach(key => {
      const [day, currentStart, currentEnd] = key.split('-');
      const currentTimeSlot = `${currentStart}-${currentEnd}`;

      if (currentTimeSlot === oldTimeSlot) {
        // Update the key with new timeslot
        const newKey = `${day}-${newStart}-${newEnd}`;
        newGridData[newKey] = {
          ...gridData[key],
          startTime: newStart,
          endTime: newEnd
        };
      } else if (newTimeSlots.includes(currentTimeSlot)) {
        // Only keep if the timeslot still exists
        newGridData[key] = gridData[key];
      }
    });

    setGridData(newGridData);
    setTimeSlots(sortedTimeSlots);
    setEditTimeSlotDialog(false);
    setEditingTimeSlot({ index: -1, value: "" });

    setTimetableState(prev => ({
      ...prev,
      gridData: newGridData,
      timeSlots: sortedTimeSlots,
      lastSaved: new Date().toISOString()
    }));

    alert(`Timeslot updated to ${formattedTimeSlot}. Contained predefined timeslots were removed.`);
  };

  // Handle course selection change
  const handleCourseChange = (value) => {
    setBatchDetails({
      course: value,
      batch: "",
      semester: ""
    });
    setIsSemesterAutoSelected(false);
    setShowTimetable(false);
    setIsLocked(false);
  };

  // Handle semester selection change
  const handleSemesterChange = (value) => {
    setBatchDetails({
      ...batchDetails,
      semester: value,
      semester_id: value
    });
    // Clear auto-selected flag when manually changing semester
    setIsSemesterAutoSelected(false);
    setShowTimetable(false);
    setIsLocked(false);
  };
  const refresh = () => {
    setIsSemesterAutoSelected(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
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
              <h1 className="text-xl font-bold text-white">Timetable Generator</h1>
              <p className="text-indigo-100 text-sm mt-1">Create and manage your academic schedule</p>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Course</label>
                <Select
                  disabled={isLocked || loading}
                  value={batchDetails.course}
                  onValueChange={handleCourseChange}
                >
                  <SelectTrigger className="w-full h-12 border-2 border-gray-200 rounded-xl hover:border-indigo-300 focus:border-indigo-500 transition-colors">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 shadow-lg">
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

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Batch</label>
                <Select
                  disabled={isLocked || loading || !batchDetails.course}
                  value={batchDetails.batch}
                  onValueChange={(value) => {
                    // Extract batch year from the batch value (format: "YYYY-Section")
                    const batchYear = value.split('-')[0];
                    
                    // Calculate and auto-select current semester
                    const currentSemester = calculateCurrentSemester(batchYear);
                    
                    setBatchDetails({
                      ...batchDetails,
                      batch: value,
                      semester: currentSemester
                    });
                    setIsSemesterAutoSelected(true);
                    setShowTimetable(false);
                    setIsLocked(false);
                  }}
                >
                  <SelectTrigger className="w-full h-12 border-2 border-gray-200 rounded-xl hover:border-indigo-300 focus:border-indigo-500 transition-colors">
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 shadow-lg">
                    {getFilteredBatches().map((batch) => (
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

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Semester</label>
                <Select
                  disabled={isLocked || loading || !batchDetails.batch}
                  value={batchDetails.semester}
                  onValueChange={handleSemesterChange}
                >
                  <SelectTrigger className="w-full h-12 border-2 border-gray-200 rounded-xl hover:border-indigo-300 focus:border-indigo-500 transition-colors">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 shadow-lg">
                    {getFilteredSemesters().map((semester) => (
                      <SelectItem key={semester.id} value={semester.id || semester.number?.toString()} className="rounded-lg">
                        <div className="flex flex-col">
                          <span className="font-medium">{semester.id || semester.number}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isSemesterAutoSelected && batchDetails.batch && batchDetails.semester && (
                  <div className="text-xs text-indigo-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Auto-selected current semester
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8">
              <Button
                className={`w-full h-12 font-semibold rounded-xl shadow-lg transition-all duration-300 ${allDetailsSelected() && !loading
                  ? "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white transform hover:scale-[1.02]"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                onClick={handleGenerateTimetable}
                disabled={!allDetailsSelected() || loading}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>

                Generate Timetable Grid
              </Button>
            </div>

            {/* Timetable State Info */}
            {showTimetable && timetableState.lastSaved && (
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Status:</span> {timetableState.isExisting ? 'Existing timetable loaded' : 'New timetable'} |
                    <span className="font-semibold"> Last saved:</span> {new Date(timetableState.lastSaved).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading/Error States */}
      {(loading || isLoading) && (
        <div className="flex justify-center items-center py-8">
          <div className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            <p className="text-gray-700 font-medium">
              {loading ? 'Loading data...' : 'Loading timetable...'}
            </p>
          </div>
        </div>
      )}

      {/* Timetable Grid */}
      {showTimetable && allDetailsSelected() && (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Timetable Grid</h2>
                  <p className="text-indigo-100 text-sm">Manage your class schedule</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2"
                    onClick={() => setShowAddTimeSlotDialog(true)}
                  >
                    <Plus size={16} />
                    <span className="hidden sm:inline">Add Time Slot</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-lg"
                    onClick={saveLectures}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    <span className="hidden sm:inline">
                      {timetableState.isExisting ? 'Update Timetable' : 'Save Timetable'}
                    </span>
                    <span className="sm:hidden">Save</span>
                  </Button>
                  <Button
                    className="bg-white hover:bg-gray-200 text-gray-600 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-lg"
                    onClick={refresh}
                    disabled={isSaving}
                  >

                    <RefreshCw size={18} />
                    <span className="hidden sm:inline">ReFresh</span>
                    <span className="sm:hidden "></span>
                  </Button>
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-lg"
                    onClick={clearTimetable}
                  >
                    <Trash size={16} />
                    <span className="hidden sm:inline">Clear All</span>
                    <span className="sm:hidden">Clear</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile Timetable View */}
            <div className="lg:hidden">
              <div className="p-4 space-y-4">
                {days.map((day) => (
                  <div key={day} className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-bold text-indigo-700 mb-3 text-lg">{day}</h3>
                    <div className="space-y-2">
                      {timeSlots.map((time) => {
                        const cellData = gridData[`${day}-${time}`];
                        return (
                          <div
                            key={`${day}-${time}`}
                            className="bg-white rounded-lg p-3 border-2 border-gray-200 hover:border-indigo-300 cursor-pointer transition-colors"
                            onClick={() => handleCellClick(day, time)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="text-sm font-semibold text-gray-600 mb-1">{time}</div>
                                {cellData ? (
                                  <div>
                                    <div className="font-semibold text-indigo-700 text-sm mb-1">
                                      {cellData.subject}
                                    </div>
                                    <div className="text-xs text-gray-600 mb-1">
                                      {cellData.code}
                                    </div>
                                    <div className="text-xs text-gray-500 mb-1">
                                      {cellData.faculty}
                                    </div>
                                    {cellData.room && (
                                      <div className="text-xs text-gray-500">
                                        Room: {cellData.room}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-gray-400 text-sm">Tap to add class</div>
                                )}
                              </div>
                              <div className="flex gap-1 ml-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditTimeSlot(timeSlots.indexOf(time));
                                  }}
                                  className="text-blue-600 hover:text-blue-800 p-1 rounded"
                                  title="Edit time slot"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTimeSlot(timeSlots.indexOf(time));
                                  }}
                                  className="text-red-600 hover:text-red-800 p-1 rounded"
                                  title="Delete time slot"
                                >
                                  <Trash2 size={14} />
                                </button>
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
                      {timeSlots.map((time, index) => (
                        <th
                          key={index}
                          className="border-r border-gray-200 p-3 text-center font-semibold text-indigo-700 relative min-w-[140px]"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-sm font-medium">{time}</span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEditTimeSlot(index)}
                                className="text-blue-600 hover:text-blue-800 p-1 rounded-lg hover:bg-blue-50 transition-colors"
                                title="Edit time slot"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteTimeSlot(index)}
                                className="text-red-600 hover:text-red-800 p-1 rounded-lg hover:bg-red-50 transition-colors"
                                title="Delete time slot"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {days.map((day, dayIndex) => {
                      const groupedLectures = groupConsecutiveTimeSlots(gridData, [day], timeSlots);

                      return (
                        <tr key={day} className={dayIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="border-r border-gray-200 p-4 font-bold text-indigo-700 bg-gradient-to-r from-indigo-50 to-blue-50 text-center">
                            {day}
                          </td>
                          {timeSlots.map((time, timeIndex) => {
                            const cellKey = `${day}-${time}`;
                            const lecture = gridData[cellKey];
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
                                className={`border-r border-gray-200 p-3 text-center cursor-pointer hover:bg-indigo-50 transition-colors duration-200 h-24 ${colSpan > 1 ? 'bg-blue-50' : ''}`}
                                onClick={() => handleCellClick(day, time)}
                                colSpan={colSpan}
                              >
                                {lecture ? (
                                  <div className="space-y-1">
                                    <div className="font-semibold text-indigo-700 text-sm leading-tight">
                                      {lecture.subject}
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
                                    {colSpan > 1 && (
                                      <div className="text-xs text-gray-400 mt-1">
                                        {time.split('-')[0]} to {groupedLecture.timeSlots[groupedLecture.timeSlots.length - 1].split('-')[1]}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-gray-400 text-sm font-medium">
                                    Click to add
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

      {/* Dialog for adding/editing entries */}
      <Dialog open={selectedCell !== null} onOpenChange={() => setSelectedCell(null)}>
        <DialogContent className="sm:max-w-md mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-indigo-700">
              {selectedCell && gridData[`${selectedCell.day}-${selectedCell.time}`]
                ? "Edit Class Entry"
                : "Add New Class"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Subject</label>
              <Select
                value={dialogData.subject}
                onValueChange={(value) => handleDialogInputChange("subject", value)}
                disabled={!batchDetails.course}
              >
                <SelectTrigger className="w-full h-12 border-2 border-gray-200 rounded-xl hover:border-indigo-300 focus:border-indigo-500 transition-colors">
                  <SelectValue placeholder={!batchDetails.course ? "Select course first" : "Select subject"} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2 shadow-lg">
                  {getFilteredSubjects().length === 0 && batchDetails.course ? (
                    <div className="px-4 py-2 text-sm text-gray-500 text-center">
                      No subjects available for {batchDetails.course}
                    </div>
                  ) : (
                    getFilteredSubjects().map((subject) => (
                      <SelectItem key={subject.ID} value={subject.Name} className="rounded-lg">
                        <div className="flex flex-col">
                          <span className="font-medium">{subject.Name}</span>
                          <span className="text-xs text-gray-500">{subject.Code}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Subject Code</label>
              <Input
                value={dialogData.code}
                onChange={(e) => handleDialogInputChange("code", e.target.value)}
                placeholder="Subject code"
                readOnly
                className="h-12 border-2 border-gray-200 rounded-xl bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Faculty</label>
              <Select
                value={dialogData.faculty}
                onValueChange={(value) => handleDialogInputChange("faculty", value)}
              >
                <SelectTrigger className="w-full h-12 border-2 border-gray-200 rounded-xl hover:border-indigo-300 focus:border-indigo-500 transition-colors">
                  <SelectValue placeholder="Select faculty" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2 shadow-lg">
                  {faculties.map((faculty) => (
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

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Room</label>
              <Select
                value={dialogData.room}
                onValueChange={(value) => handleDialogInputChange("room", value)}
              >
                <SelectTrigger className="w-full h-12 border-2 border-gray-200 rounded-xl hover:border-indigo-300 focus:border-indigo-500 transition-colors">
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2 shadow-lg">
                  {rooms.map((room) => (
                    <SelectItem key={room.ID} value={room.Name} className="rounded-lg">
                      <div className="flex flex-col">
                        <span className="font-medium">{room.Name}</span>
                        {room.Capacity && (
                          <span className="text-xs text-gray-500">Capacity: {room.Capacity}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6">
            {selectedCell && gridData[`${selectedCell.day}-${selectedCell.time}`] && (
              <Button
                variant="destructive"
                onClick={() => {
                  handleClearCell(selectedCell.day, selectedCell.time);
                  setSelectedCell(null);
                }}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium"
              >
                Clear Entry
              </Button>
            )}
            <div className="flex gap-2 flex-1">
              <DialogClose asChild>
                <Button variant="outline" className="flex-1 rounded-xl border-2 hover:bg-gray-50">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl font-medium"
                onClick={handleSaveEntry}
                disabled={!dialogData.subject || !dialogData.faculty || !dialogData.room}
              >
                Save Class
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Time Slot Dialog */}
      <Dialog open={editTimeSlotDialog} onOpenChange={setEditTimeSlotDialog}>
        <DialogContent className="sm:max-w-md mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-indigo-700">Edit Time Slot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Time Slot
              </label>
              <Input
                value={editingTimeSlot.value}
                onChange={(e) => setEditingTimeSlot(prev => ({ ...prev, value: e.target.value }))}
                placeholder="e.g., 9:00-10:00 or 17:30-18:30"
                className="h-12 border-2 border-gray-200 rounded-xl hover:border-indigo-300 focus:border-indigo-500 transition-colors"
              />
              <p className="text-xs text-gray-500">
                Format: HH:MM-HH:MM (24-hour format)
              </p>
            </div>
          </div>
          <DialogFooter className="flex gap-2 mt-6">
            <DialogClose asChild>
              <Button
                variant="outline"
                onClick={() => {
                  setEditTimeSlotDialog(false);
                  setEditingTimeSlot({ index: -1, value: "" });
                }}
                className="flex-1 rounded-xl border-2 hover:bg-gray-50"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl font-medium"
              onClick={handleSaveEditTimeSlot}
              disabled={!editingTimeSlot.value.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Time Slot Dialog */}
      <Dialog open={showAddTimeSlotDialog} onOpenChange={setShowAddTimeSlotDialog}>
        <DialogContent className="sm:max-w-md mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-indigo-700">Add New Time Slot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Time Slot
              </label>
              <Input
                value={newTimeSlot}
                onChange={(e) => setNewTimeSlot(e.target.value)}
                placeholder="e.g., 9:00-10:00 or 17:30-18:30"
                className="h-12 border-2 border-gray-200 rounded-xl hover:border-indigo-300 focus:border-indigo-500 transition-colors"
              />
              <p className="text-xs text-gray-500">
                Format: HH:MM-HH:MM (24-hour format)
              </p>
            </div>
          </div>
          <DialogFooter className="flex gap-2 mt-6">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1 rounded-xl border-2 hover:bg-gray-50">
                Cancel
              </Button>
            </DialogClose>
            <Button
              className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl font-medium"
              onClick={handleAddTimeSlot}
              disabled={!newTimeSlot}
            >
              Add Time Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CreateTimeTable
