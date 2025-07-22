package controllers

import (
	"net/http"
	"strconv"
	"tms-server/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func QueryLectures(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var lectures []models.Lecture

		// Extract query parameters
		courseIDStr := c.Query("course_id")
		yearStr := c.Query("year")
		section := c.Query("section")
		semesterStr := c.Query("semester")
		facultyIDStr := c.Query("faculty_id")
		roomIDStr := c.Query("room_id")
		batchIDStr := c.Query("batch_id")

		query := db.Preload("Batch").Preload("Subject").Preload("Faculty").Preload("Room").
			Joins("JOIN batches ON batches.id = lectures.batch_id")

		if batchIDStr != "" {
			if batchID, err := strconv.Atoi(batchIDStr); err == nil {
				query = query.Where("batch_id = ?", batchID)
			}
		}

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

		if yearStr != "" {
			if year, err := strconv.Atoi(yearStr); err == nil {
				query = query.Where("batches.year = ?", year)
			} else {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid year parameter"})
				return
			}
		}

		if courseIDStr != "" {
			if courseID, err := strconv.Atoi(courseIDStr); err == nil {
				query = query.Where("batches.course_id = ?", courseID)
			} else {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course_id parameter"})
				return
			}
		}

		if section != "" {
			query = query.Where("batches.section = ?", section)
		}

		if err := query.Find(&lectures).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, lectures)
	}
}
