const eventService = require("../services/eventService");

const register = async (req, res) => {
  try {
    const event = await eventService.register(req.body);
    res.status(201).json(event);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

const query = async (req, res) => {
  try {
    const { type, source, userId, from, to, page, limit } = req.query;
    const result = await eventService.query({
      type,
      source,
      userId,
      from,
      to,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const event = await eventService.getById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }
    res.status(200).json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const event = await eventService.remove(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }
    res.status(200).json({ message: "Evento eliminado", event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getUserActivity = async (req, res) => {
  try {
    const { from, to } = req.query;
    const result = await eventService.getUserActivity(req.params.userId, from, to);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { register, query, getById, remove, getUserActivity };
