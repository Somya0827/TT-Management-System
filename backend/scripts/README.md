# Session Loader Script

This script automatically creates session entries in the database for all scheduled lectures over a specified number of days.

## Files

- `load_sessions.go` - The main Go script that handles session creation
- `run_load_sessions.bat` - Batch file to build and run the script easily

## How Sessions Work

Sessions represent whether a particular lecture was held or scheduled on a specific date. The script:

1. Fetches all lectures from the database
2. For each day in the specified range, finds lectures scheduled for that day of the week
3. Creates session entries with status "scheduled" for lectures that don't already have sessions
4. Skips creating sessions if they already exist for that lecture and date

## Usage

### Method 1: Using the Batch Script (Recommended)

```cmd
# Load sessions for the last 10 days (default)
run_load_sessions.bat

# Load sessions for a custom number of days (e.g., 7 days)
run_load_sessions.bat 7
```

### Method 2: Running Go Directly

```cmd
# Navigate to backend directory
cd "f:\IIPS Summer Internship\TT-Management-System\backend"

# Build and run with default (10 days)
go run scripts\load_sessions.go

# Build and run with custom days
go run scripts\load_sessions.go -days=7
```

## Output

The script will display:
- Number of lectures found
- Date range being processed
- Each session being created
- Summary of sessions created vs skipped
- Total sessions processed

## Prerequisites

- Go environment set up
- Database connection configured in .env file
- Lectures already exist in the database
- All required Go modules installed (`go mod tidy`)

## Notes

- The script will not create duplicate sessions
- Default session status is "scheduled"
- The script processes the last N days including today
- Weekend days are included if lectures are scheduled for them
