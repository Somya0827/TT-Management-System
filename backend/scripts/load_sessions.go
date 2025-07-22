package main

import (
	"flag"
	"fmt"
	"log"
	"strings"
	"time"
	"tms-server/config"
	"tms-server/models"
)

func init() {
	config.LoadEnvVariables()
}

func main() {
	days := flag.Int("days", 10, "Number of days to load sessions for (default: 10)")
	flag.Parse()

	config.ConnectDB()

	fmt.Printf("Loading sessions for the last %d days...\n", *days)
	
	if err := loadSessionsForLastDays(*days); err != nil {
		log.Fatalf("Failed to load sessions: %v", err)
	}
	
	fmt.Println("Sessions loaded successfully!")
}

func loadSessionsForLastDays(days int) error {
	// Get all lectures from the database
	var lectures []models.Lecture
	if err := config.DB.Find(&lectures).Error; err != nil {
		return fmt.Errorf("failed to fetch lectures: %w", err)
	}

	if len(lectures) == 0 {
		fmt.Println("No lectures found in the database")
		return nil
	}

	fmt.Printf("Found %d lectures in the database\n", len(lectures))

	// Generate dates for the last N days
	endDate := time.Now()
	startDate := endDate.AddDate(0, 0, -days+1) // Go back N-1 days to include today

	fmt.Printf("Loading sessions from %s to %s\n", 
		startDate.Format("2006-01-02"), 
		endDate.Format("2006-01-02"))

	sessionsCreated := 0
	sessionsSkipped := 0

	// Iterate through each day
	for date := startDate; !date.After(endDate); date = date.AddDate(0, 0, 1) {
		dayOfWeek := date.Weekday().String()
		
		// Find lectures scheduled for this day of the week
		for _, lecture := range lectures {
			if strings.EqualFold(lecture.DayOfWeek, dayOfWeek) {
				// Check if session already exists for this lecture and date
				var existingSession models.Session
				result := config.DB.Where("lecture_id = ? AND date = ?", lecture.ID, date.Format("2006-01-02")).First(&existingSession)
				
				if result.Error == nil {
					// Session already exists, skip
					sessionsSkipped++
					continue
				}

				// Create new session with null status
				session := models.Session{
					LectureID: lecture.ID,
					Date:      date,
					// Status is left as zero value (empty string) which will be treated as NULL
				}

				if err := config.DB.Create(&session).Error; err != nil {
					return fmt.Errorf("failed to create session for lecture %d on %s: %w", 
						lecture.ID, date.Format("2006-01-02"), err)
				}

				sessionsCreated++
				fmt.Printf("Created session for lecture %d on %s (%s)\n", 
					lecture.ID, date.Format("2006-01-02"), dayOfWeek)
			}
		}
	}

	fmt.Printf("\nSummary:\n")
	fmt.Printf("- Sessions created: %d\n", sessionsCreated)
	fmt.Printf("- Sessions skipped (already exist): %d\n", sessionsSkipped)
	fmt.Printf("- Total sessions processed: %d\n", sessionsCreated+sessionsSkipped)

	return nil
}
