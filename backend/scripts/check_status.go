package main

import (
	"fmt"
	"tms-server/config"
	"tms-server/models"
)

func init() {
	config.LoadEnvVariables()
}

func main() {
	config.ConnectDB()

	// Check existing sessions to see what status values are used
	var sessions []models.Session
	config.DB.Limit(10).Find(&sessions)
	
	fmt.Printf("Found %d existing sessions:\n", len(sessions))
	for _, s := range sessions {
		fmt.Printf("ID: %d, Status: '%s'\n", s.ID, s.Status)
	}

	// Check for unique status values
	var statuses []string
	config.DB.Model(&models.Session{}).Distinct("status").Pluck("status", &statuses)
	
	fmt.Printf("\nUnique status values in database:\n")
	for _, status := range statuses {
		fmt.Printf("- '%s'\n", status)
	}
}
