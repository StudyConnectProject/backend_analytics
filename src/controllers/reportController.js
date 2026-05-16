const reportService = require("../services/reportService");

const getActiveUsers = async (req, res) => {
  try {
    const { from, to } = req.query;
    const result = await reportService.getActiveUsers(from, to);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPopularCourses = async (req, res) => {
  try {
    const { from, to, limit } = req.query;
    const result = await reportService.getPopularCourses(
      from,
      to,
      limit ? parseInt(limit) : 10
    );
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getTopTutors = async (req, res) => {
  try {
    const { from, to, limit } = req.query;
    const result = await reportService.getTopTutors(
      from,
      to,
      limit ? parseInt(limit) : 10
    );
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getSystemMetrics = async (req, res) => {
  try {
    const result = await reportService.getSystemMetrics();
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPeakHours = async (req, res) => {
  try {
    const { from, to } = req.query;
    const result = await reportService.getPeakHours(from, to);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getDateRangeReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const result = await reportService.getDateRangeReport(from, to);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

module.exports = {
  getActiveUsers,
  getPopularCourses,
  getTopTutors,
  getSystemMetrics,
  getPeakHours,
  getDateRangeReport,
};
