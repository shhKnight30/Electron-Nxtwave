// Productivity features

// backend/controllers/plannerController.js
const { runQuery, getQuery, allQuery } = require('../config/database');

// ============= STUDY PLANS =============

// Create study plan
exports.createPlan = async (req, res) => {
  try {
    const { title, description, schedule } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await runQuery(
      `INSERT INTO study_plans (user_id, title, description, schedule, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.userId,
        title,
        description || '',
        JSON.stringify(schedule || {}),
        'active'
      ]
    );

    res.status(201).json({
      id: result.id,
      message: 'Study plan created successfully',
      plan: {
        id: result.id,
        title,
        description,
        schedule,
        status: 'active'
      }
    });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({ error: 'Failed to create study plan' });
  }
};

// Get all study plans
exports.getPlans = async (req, res) => {
  try {
    const { status } = req.query;

    let query = 'SELECT * FROM study_plans WHERE user_id = ?';
    let params = [req.userId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const plans = await allQuery(query, params);

    // Parse schedule JSON
    const parsedPlans = plans.map(plan => ({
      ...plan,
      schedule: plan.schedule ? JSON.parse(plan.schedule) : {}
    }));

    res.json({
      plans: parsedPlans,
      count: parsedPlans.length
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'Failed to fetch study plans' });
  }
};

// Update study plan
exports.updatePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const { title, description, schedule, status } = req.body;

    // Verify ownership
    const plan = await getQuery(
      'SELECT * FROM study_plans WHERE id = ? AND user_id = ?',
      [planId, req.userId]
    );

    if (!plan) {
      return res.status(404).json({ error: 'Study plan not found' });
    }

    // Build update query
    const updates = [];
    const params = [];

    if (title) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (schedule) {
      updates.push('schedule = ?');
      params.push(JSON.stringify(schedule));
    }
    if (status) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    params.push(planId, req.userId);

    await runQuery(
      `UPDATE study_plans SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      params
    );

    res.json({
      message: 'Study plan updated successfully',
      planId
    });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ error: 'Failed to update study plan' });
  }
};

// Delete study plan
exports.deletePlan = async (req, res) => {
  try {
    const { planId } = req.params;

    const result = await runQuery(
      'DELETE FROM study_plans WHERE id = ? AND user_id = ?',
      [planId, req.userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Study plan not found' });
    }

    res.json({
      message: 'Study plan deleted successfully',
      planId
    });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({ error: 'Failed to delete study plan' });
  }
};

// ============= POMODORO =============

// Start pomodoro session
exports.startPomodoro = async (req, res) => {
  try {
    const { duration = 25 } = req.body;

    const validDuration = Math.min(Math.max(parseInt(duration), 1), 60);

    const result = await runQuery(
      'INSERT INTO pomodoro_sessions (user_id, duration, completed) VALUES (?, ?, ?)',
      [req.userId, validDuration, false]
    );

    res.json({
      sessionId: result.id,
      duration: validDuration,
      message: 'Pomodoro session started',
      startedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Start pomodoro error:', error);
    res.status(500).json({ error: 'Failed to start pomodoro session' });
  }
};

// Complete pomodoro session
exports.completePomodoro = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await getQuery(
      'SELECT * FROM pomodoro_sessions WHERE id = ? AND user_id = ?',
      [sessionId, req.userId]
    );

    if (!session) {
      return res.status(404).json({ error: 'Pomodoro session not found' });
    }

    if (session.completed) {
      return res.status(400).json({ error: 'Session already completed' });
    }

    await runQuery(
      'UPDATE pomodoro_sessions SET completed = ? WHERE id = ?',
      [true, sessionId]
    );

    res.json({
      message: 'Pomodoro session completed! 🎉',
      sessionId,
      duration: session.duration
    });
  } catch (error) {
    console.error('Complete pomodoro error:', error);
    res.status(500).json({ error: 'Failed to complete pomodoro session' });
  }
};

// Get pomodoro statistics
exports.getPomodoroStats = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    // Total sessions
    const totalSessions = await getQuery(
      `SELECT COUNT(*) as count FROM pomodoro_sessions 
       WHERE user_id = ? 
       AND created_at >= datetime('now', '-${parseInt(days)} days')`,
      [req.userId]
    );

    // Completed sessions
    const completedSessions = await getQuery(
      `SELECT COUNT(*) as count FROM pomodoro_sessions 
       WHERE user_id = ? 
       AND completed = 1 
       AND created_at >= datetime('now', '-${parseInt(days)} days')`,
      [req.userId]
    );

    // Total study time (in minutes)
    const totalTime = await getQuery(
      `SELECT SUM(duration) as total FROM pomodoro_sessions 
       WHERE user_id = ? 
       AND completed = 1 
       AND created_at >= datetime('now', '-${parseInt(days)} days')`,
      [req.userId]
    );

    // Today's sessions
    const todaySessions = await getQuery(
      `SELECT COUNT(*) as count FROM pomodoro_sessions 
       WHERE user_id = ? 
       AND DATE(created_at) = DATE('now')`,
      [req.userId]
    );

    // Today's completed
    const todayCompleted = await getQuery(
      `SELECT COUNT(*) as count FROM pomodoro_sessions 
       WHERE user_id = ? 
       AND completed = 1 
       AND DATE(created_at) = DATE('now')`,
      [req.userId]
    );

    // Recent sessions
    const recentSessions = await allQuery(
      `SELECT id, duration, completed, created_at 
       FROM pomodoro_sessions 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [req.userId]
    );

    res.json({
      total: totalSessions.count || 0,
      completed: completedSessions.count || 0,
      totalMinutes: totalTime.total || 0,
      totalHours: ((totalTime.total || 0) / 60).toFixed(1),
      completionRate: totalSessions.count > 0 
        ? ((completedSessions.count / totalSessions.count) * 100).toFixed(1) 
        : 0,
      today: {
        total: todaySessions.count || 0,
        completed: todayCompleted.count || 0
      },
      recentSessions,
      period: `Last ${days} days`
    });
  } catch (error) {
    console.error('Get pomodoro stats error:', error);
    res.status(500).json({ error: 'Failed to fetch pomodoro statistics' });
  }
};

// ============= REMINDERS =============

// Create reminder
exports.createReminder = async (req, res) => {
  try {
    const { title, description, reminderTime, type = 'study' } = req.body;

    if (!title || !reminderTime) {
      return res.status(400).json({ error: 'Title and reminder time are required' });
    }

    // Validate reminder time
    const reminderDate = new Date(reminderTime);
    if (isNaN(reminderDate.getTime())) {
      return res.status(400).json({ error: 'Invalid reminder time' });
    }

    if (reminderDate < new Date()) {
      return res.status(400).json({ error: 'Reminder time must be in the future' });
    }

    const result = await runQuery(
      `INSERT INTO study_plans (user_id, title, description, schedule, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.userId,
        title,
        description || '',
        JSON.stringify({ 
          type: 'reminder', 
          reminderTime,
          reminderType: type 
        }),
        'pending'
      ]
    );

    res.status(201).json({
      id: result.id,
      message: 'Reminder created successfully',
      reminder: {
        id: result.id,
        title,
        description,
        reminderTime,
        type
      }
    });
  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
};

// Get reminders
exports.getReminders = async (req, res) => {
  try {
    const { upcoming = true } = req.query;

    let query = `
      SELECT * FROM study_plans 
      WHERE user_id = ? 
      AND schedule LIKE '%"type":"reminder"%'
    `;
    const params = [req.userId];

    if (upcoming === 'true') {
      query += ` AND status = 'pending'`;
    }

    query += ' ORDER BY created_at DESC';

    const reminders = await allQuery(query, params);

    // Parse and format reminders
    const formattedReminders = reminders.map(reminder => {
      const schedule = reminder.schedule ? JSON.parse(reminder.schedule) : {};
      return {
        id: reminder.id,
        title: reminder.title,
        description: reminder.description,
        reminderTime: schedule.reminderTime,
        type: schedule.reminderType || 'study',
        status: reminder.status,
        createdAt: reminder.created_at
      };
    });

    // Sort by reminder time
    formattedReminders.sort((a, b) => {
      return new Date(a.reminderTime) - new Date(b.reminderTime);
    });

    res.json({
      reminders: formattedReminders,
      count: formattedReminders.length
    });
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
};

// Complete reminder
exports.completeReminder = async (req, res) => {
  try {
    const { reminderId } = req.params;

    const reminder = await getQuery(
      'SELECT * FROM study_plans WHERE id = ? AND user_id = ?',
      [reminderId, req.userId]
    );

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    await runQuery(
      'UPDATE study_plans SET status = ? WHERE id = ?',
      ['completed', reminderId]
    );

    res.json({
      message: 'Reminder marked as completed',
      reminderId
    });
  } catch (error) {
    console.error('Complete reminder error:', error);
    res.status(500).json({ error: 'Failed to complete reminder' });
  }
};

// ============= SCHEDULE =============

// Get today's schedule
exports.getTodaySchedule = async (req, res) => {
  try {
    // Get today's study plans
    const plans = await allQuery(
      `SELECT * FROM study_plans 
       WHERE user_id = ? 
       AND status = 'active' 
       AND DATE(created_at) = DATE('now')`,
      [req.userId]
    );

    // Get today's pomodoro sessions
    const pomodoros = await allQuery(
      `SELECT id, duration, completed, created_at 
       FROM pomodoro_sessions 
       WHERE user_id = ? 
       AND DATE(created_at) = DATE('now')`,
      [req.userId]
    );

    // Get upcoming reminders for today
    const reminders = await allQuery(
      `SELECT * FROM study_plans 
       WHERE user_id = ? 
       AND schedule LIKE '%"type":"reminder"%'
       AND status = 'pending'`,
      [req.userId]
    );

    const todayReminders = reminders
      .map(r => {
        const schedule = r.schedule ? JSON.parse(r.schedule) : {};
        const reminderTime = new Date(schedule.reminderTime);
        return {
          id: r.id,
          title: r.title,
          description: r.description,
          reminderTime: schedule.reminderTime,
          type: schedule.reminderType,
          isToday: reminderTime.toDateString() === new Date().toDateString()
        };
      })
      .filter(r => r.isToday);

    // Calculate study time today
    const totalStudyTime = pomodoros
      .filter(p => p.completed)
      .reduce((sum, p) => sum + p.duration, 0);

    res.json({
      date: new Date().toISOString().split('T')[0],
      plans: plans.map(p => ({
        ...p,
        schedule: p.schedule ? JSON.parse(p.schedule) : {}
      })),
      pomodoros: {
        total: pomodoros.length,
        completed: pomodoros.filter(p => p.completed).length,
        totalMinutes: totalStudyTime
      },
      reminders: todayReminders,
      summary: {
        totalPlans: plans.length,
        totalReminders: todayReminders.length,
        studyTime: `${Math.floor(totalStudyTime / 60)}h ${totalStudyTime % 60}m`
      }
    });
  } catch (error) {
    console.error('Get today schedule error:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s schedule' });
  }
};