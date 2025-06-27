package models

type Course struct {
	ID              uint   `gorm:"primaryKey"`
	Name            string `gorm:"not null"`
	Code            string `gorm:"uniqueIndex;not null"`
	Course_Duration int8   `gorm:"not null"`
	Batches         []Batch
	Subjects        []Subject
}
