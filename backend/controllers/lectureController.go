package controllers

import (
	"net/http"
	"strconv"
	"tms-server/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func FilteredLectures(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var lectures []models.Lecture

		yearStr := c.Query("year")
		section := c.Query("section")
		courseIDStr := c.Query("course_id")

		query := db.Preload("Batch").Preload("Subject").Preload("Faculty").Preload("Room").
			Joins("JOIN batches ON batches.id = lectures.batch_id")

		if yearStr != "" {
			if year, err := strconv.Atoi(yearStr); err == nil {
				query = query.Where("batches.year = ?", year)
			} else {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid year parameter"})
				return
			}
		}

		if section != "" {
			query = query.Where("batches.section = ?", section)
		}

		if courseIDStr != "" {
			if courseID, err := strconv.Atoi(courseIDStr); err == nil {
				query = query.Where("batches.course_id = ?", courseID)
			} else {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course_id parameter"})
				return
			}
		}

		if err := query.Find(&lectures).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, lectures)
	}
}

// Probably combine this with above, but keeping it for backward compatibility
// Having general way to query Lectures, and any filters. (this also includes section)
func QueryLectures(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var lectures []models.Lecture

		courseIDStr := c.Query("course_id")
		yearStr := c.Query("year")
		semesterStr := c.Query("semester")
		facultyIDStr := c.Query("faculty_id")
		roomIDStr := c.Query("room_id")

		query := db.Preload("Subject").Preload("Faculty").Preload("Batch").Preload("Room")

		if semesterStr != "" {
			if semester, err := strconv.Atoi(semesterStr); err == nil {
				query = query.Where("semester = ?", semester)
			}
		}

		if facultyIDStr != "" {
			if facultyID, err := strconv.Atoi(facultyIDStr); err == nil {
				query = query.Where("faculty_id = ?", facultyID)
			}
		}

		if roomIDStr != "" {
			if roomID, err := strconv.Atoi(roomIDStr); err == nil {
				query = query.Where("room_id = ?", roomID)
			}
		}

		if courseIDStr != "" && yearStr != "" {
			courseID, err1 := strconv.Atoi(courseIDStr)
			year, err2 := strconv.Atoi(yearStr)

			if err1 == nil && err2 == nil {
				var batch models.Batch
				if err := db.Where("course_id = ? AND year = ?", courseID, year).First(&batch).Error; err == nil {
					query = query.Where("batch_id = ?", batch.ID)
				} else if err == gorm.ErrRecordNotFound {
					c.JSON(http.StatusNotFound, gin.H{"error": "Batch not found"})
					return
				} else {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
			}
		}

		if err := query.Find(&lectures).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, lectures)
	}
}
