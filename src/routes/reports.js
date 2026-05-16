const { Router } = require("express");
const {
  getActiveUsers,
  getPopularCourses,
  getTopTutors,
  getSystemMetrics,
  getPeakHours,
  getDateRangeReport,
} = require("../controllers/reportController");

const router = Router();

// GET /reports/active-users?from=&to=
router.get("/active-users", getActiveUsers);

// GET /reports/popular-courses?from=&to=&limit=
router.get("/popular-courses", getPopularCourses);

// GET /reports/top-tutors?from=&to=&limit=
router.get("/top-tutors", getTopTutors);

// GET /reports/system-metrics
router.get("/system-metrics", getSystemMetrics);

// GET /reports/peak-hours?from=&to=
router.get("/peak-hours", getPeakHours);

// GET /reports/date-range?from=&to=
router.get("/date-range", getDateRangeReport);

module.exports = router;
