const { Router } = require("express");
const {
  register,
  query,
  getById,
  remove,
  getUserActivity,
} = require("../controllers/eventController");

const router = Router();

// POST /events
router.post("/", register);

// GET /events?type=&source=&userId=&from=&to=&page=&limit=
router.get("/", query);

// GET /events/user-activity/:userId?from=&to=
router.get("/user-activity/:userId", getUserActivity);

// GET /events/:id
router.get("/:id", getById);

// DELETE /events/:id
router.delete("/:id", remove);

module.exports = router;
