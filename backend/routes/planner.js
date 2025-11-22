// Planner routes

// backend/routes/planner.js
const express = require('express');
const router = express.Router();
const plannerController = require('../controllers/plannerController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Study plans
router.post('/plans', plannerController.createPlan);
router.get('/plans', plannerController.getPlans);
router.put('/plans/:planId', plannerController.updatePlan);
router.delete('/plans/:planId', plannerController.deletePlan);

// Pomodoro
router.post('/pomodoro/start', plannerController.startPomodoro);
router.put('/pomodoro/:sessionId/complete', plannerController.completePomodoro);
router.get('/pomodoro/stats', plannerController.getPomodoroStats);

// Reminders
router.post('/reminders', plannerController.createReminder);
router.get('/reminders', plannerController.getReminders);
router.put('/reminders/:reminderId/complete', plannerController.completeReminder);

// Schedule
router.get('/schedule/today', plannerController.getTodaySchedule);

module.exports = router;