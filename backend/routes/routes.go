package routes

import (
	"tms-server/config"
	"tms-server/controllers"
	"tms-server/middleware"
	"tms-server/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterRoutes(r *gin.Engine) {
	r.Use(middleware.CORSMiddleware())

	db := config.DB
	api := r.Group("/api/v1")

	// Public routes
	api.GET("/ping", controllers.Ping)
	api.POST("/login", controllers.Login)

	// Protected routes (faculty+)
	api.Use(middleware.JWTAuthMiddleware())
	api.POST("/logout", controllers.Logout)
	registerFacultyRoutes(api, db)

	// Admin-only routes
	admin := api.Group("/")
	admin.Use(middleware.RoleAuthMiddleware("admin", "superadmin"))
	registerAdminRoutes(admin, db)

	// Superadmin-only routes
	super := api.Group("/")
	super.Use(middleware.RoleAuthMiddleware("superadmin"))
	registerSuperAdminRoutes(super, db)
}

func registerFacultyRoutes(r *gin.RouterGroup, db *gorm.DB) {
	r.GET("/course", controllers.All[models.Course](db))
	r.GET("/course/:id", controllers.Get[models.Course](db))

	r.GET("/subject", controllers.All[models.Subject](db))
	r.GET("/subject/:id", controllers.Get[models.Subject](db))

	r.GET("/faculty", controllers.All[models.Faculty](db))
	r.GET("/faculty/:id", controllers.Get[models.Faculty](db))

	r.GET("/room", controllers.All[models.Room](db))
	r.GET("/room/:id", controllers.Get[models.Room](db))

	r.GET("/batch", controllers.All[models.Batch](db))
	r.GET("/batch/:id", controllers.Get[models.Batch](db))

	r.GET("/lecture", controllers.QueryLectures(db)) // for backwards compatibility, use /query
	r.GET("/lecture/query", controllers.QueryLectures(db))
	r.GET("/lecture/:id", controllers.Get[models.Lecture](db))

	r.GET("/session", controllers.All[models.Session](db))
	r.GET("/session/:id", controllers.Get[models.Session](db))

	r.GET("/calendar", controllers.GetCalendarSummaryByMonth)
	r.GET("/calendar/day", controllers.GetLectureDetailsByDate)
}

func registerAdminRoutes(r *gin.RouterGroup, db *gorm.DB) {
	// Course
	r.POST("/course", controllers.Create[models.Course](db))
	r.PUT("/course/:id", controllers.Update[models.Course](db))
	r.DELETE("/course/:id", controllers.Delete[models.Course](db))

	// Subject
	r.POST("/subject", controllers.Create[models.Subject](db))
	r.PUT("/subject/:id", controllers.Update[models.Subject](db))
	r.DELETE("/subject/:id", controllers.Delete[models.Subject](db))

	// Faculty
	r.POST("/faculty", controllers.Create[models.Faculty](db))
	r.PUT("/faculty/:id", controllers.Update[models.Faculty](db))
	r.DELETE("/faculty/:id", controllers.Delete[models.Faculty](db))

	// Room
	r.POST("/room", controllers.Create[models.Room](db))
	r.PUT("/room/:id", controllers.Update[models.Room](db))
	r.DELETE("/room/:id", controllers.Delete[models.Room](db))

	// Batch
	r.POST("/batch", controllers.Create[models.Batch](db))
	r.PUT("/batch/:id", controllers.Update[models.Batch](db))
	r.DELETE("/batch/:id", controllers.Delete[models.Batch](db))

	// Lecture
	r.POST("/lecture", controllers.Create[models.Lecture](db))
	r.PUT("/lecture/:id", controllers.Update[models.Lecture](db))
	r.DELETE("/lecture/:id", controllers.Delete[models.Lecture](db))

	// Session
	r.POST("/session", controllers.Create[models.Session](db))
	r.PUT("/session/:id", controllers.Update[models.Session](db))
	r.DELETE("/session/:id", controllers.Delete[models.Session](db))
}

func registerSuperAdminRoutes(r *gin.RouterGroup, db *gorm.DB) {
	r.GET("/user", controllers.All[models.User](db))
	r.POST("/user", controllers.Create[models.User](db))
	r.GET("/user/:id", controllers.Get[models.User](db))
	r.PUT("/user/:id", controllers.Update[models.User](db))
	r.DELETE("/user/:id", controllers.Delete[models.User](db))
}
