package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"gorm.io/gorm"
)

// IPAddresses is a custom type for storing array of IP addresses in the database
type IPAddresses []string

// Value implements the driver.Valuer interface for IPAddresses
func (ips IPAddresses) Value() (driver.Value, error) {
	if ips == nil {
		return nil, nil
	}
	return json.Marshal(ips)
}

// Scan implements the sql.Scanner interface for IPAddresses
func (ips *IPAddresses) Scan(value interface{}) error {
	if value == nil {
		*ips = nil
		return nil
	}

	switch v := value.(type) {
	case []byte:
		return json.Unmarshal(v, ips)
	case string:
		return json.Unmarshal([]byte(v), ips)
	default:
		return errors.New("cannot scan IPAddresses")
	}
}

type User struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	Username      string         `gorm:"unique;not null;size:32" json:"username"`
	Email         string         `gorm:"unique;not null;size:254" json:"email"`
	Password      string         `json:"-"`
	Role          string         `gorm:"not null;default:'member'" json:"role"`
	CreatedAt     time.Time      `json:"createdAt"`
	UpdatedAt     time.Time      `json:"updatedAt"`
	TeamID        *uint          `json:"teamId,omitempty"`
	Team          *Team          `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"team,omitempty"`
	Submissions   []Submission   `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"submissions,omitempty"`
	Notifications []Notification `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"notifications,omitempty"`
	Banned        bool           `json:"banned"`
	IPAddresses   IPAddresses    `gorm:"type:json" json:"ipAddresses"`
	MemberSince   time.Time      `gorm:"-" json:"memberSince"`
}

// AfterFind GORM hook to populate computed fields
func (u *User) AfterFind(tx *gorm.DB) error {
	u.MemberSince = u.CreatedAt
	return nil
}
