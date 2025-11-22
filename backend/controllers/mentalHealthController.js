// Mental health tracking

// backend/controllers/mentalHealthController.js
const { runQuery, getQuery, allQuery } = require('../config/database');
const Sentiment = require('sentiment');
const sentiment = new Sentiment();

// Analyze search history for mental health insights
exports.analyzeSearchHistory = async (req, res) => {
  try {
    // Get recent search history (last 7 days)
    const searches = await allQuery(
      `SELECT query, search_type, timestamp 
       FROM search_history 
       WHERE user_id = ? 
       AND timestamp >= datetime('now', '-7 days')
       ORDER BY timestamp DESC`,
      [req.userId]
    );

    if (searches.length === 0) {
      return res.json({
        message: 'Not enough data for analysis',
        moodScore: 5,
        stressLevel: 'unknown',
        recommendations: ['Start using the app more to get personalized insights']
      });
    }

    // Analyze sentiment of queries
    let totalScore = 0;
    let negativeCount = 0;
    let stressKeywords = ['stress', 'anxiety', 'worried', 'difficult', 'hard', 'struggling', 'help', 'problem'];
    let stressIndicators = [];

    searches.forEach(search => {
      const analysis = sentiment.analyze(search.query);
      totalScore += analysis.score;

      // Check for stress keywords
      const lowerQuery = search.query.toLowerCase();
      stressKeywords.forEach(keyword => {
        if (lowerQuery.includes(keyword)) {
          stressIndicators.push(keyword);
          negativeCount++;
        }
      });
    });

    // Calculate mood score (1-10 scale)
    const avgSentiment = totalScore / searches.length;
    const moodScore = Math.max(1, Math.min(10, 5 + avgSentiment));
    
    // Determine stress level
    const stressRatio = negativeCount / searches.length;
    let stressLevel;
    if (stressRatio < 0.2) stressLevel = 'low';
    else if (stressRatio < 0.4) stressLevel = 'moderate';
    else stressLevel = 'high';

    // Generate recommendations
    const recommendations = generateRecommendations(moodScore, stressLevel, stressIndicators);

    // Save analysis
    const analysis = {
      mood_score: moodScore.toFixed(1),
      stress_level: stressLevel,
      stress_indicators: JSON.stringify([...new Set(stressIndicators)]),
      sentiment_score: avgSentiment.toFixed(2),
      total_searches: searches.length
    };

    await runQuery(
      `INSERT INTO mental_health_logs 
       (user_id, mood_score, stress_indicators, sentiment_score, analysis, recommendations) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.userId,
        moodScore,
        analysis.stress_indicators,
        avgSentiment,
        JSON.stringify(analysis),
        JSON.stringify(recommendations)
      ]
    );

    res.json({
      moodScore: parseFloat(moodScore.toFixed(1)),
      stressLevel,
      stressIndicators: [...new Set(stressIndicators)],
      sentimentScore: parseFloat(avgSentiment.toFixed(2)),
      recommendations,
      searchesAnalyzed: searches.length
    });
  } catch (error) {
    console.error('Analyze search history error:', error);
    res.status(500).json({ error: 'Failed to analyze search history' });
  }
};

// Get mental health trends
exports.getTrends = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const logs = await allQuery(
      `SELECT mood_score, stress_indicators, sentiment_score, created_at 
       FROM mental_health_logs 
       WHERE user_id = ? 
       AND created_at >= datetime('now', '-${parseInt(days)} days')
       ORDER BY created_at ASC`,
      [req.userId]
    );

    if (logs.length === 0) {
      return res.json({
        message: 'No data available',
        trends: []
      });
    }

    // Format data for charts
    const trends = logs.map(log => ({
      date: log.created_at.split(' ')[0],
      moodScore: log.mood_score,
      sentimentScore: log.sentiment_score,
      stressIndicators: log.stress_indicators ? JSON.parse(log.stress_indicators) : []
    }));

    // Calculate averages
    const avgMood = logs.reduce((sum, log) => sum + log.mood_score, 0) / logs.length;
    const avgSentiment = logs.reduce((sum, log) => sum + log.sentiment_score, 0) / logs.length;

    res.json({
      trends,
      averages: {
        mood: parseFloat(avgMood.toFixed(1)),
        sentiment: parseFloat(avgSentiment.toFixed(2))
      },
      dataPoints: logs.length
    });
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
};

// Get latest analysis
exports.getLatestAnalysis = async (req, res) => {
  try {
    const latest = await getQuery(
      `SELECT mood_score, stress_indicators, sentiment_score, recommendations, created_at 
       FROM mental_health_logs 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [req.userId]
    );

    if (!latest) {
      return res.json({
        moodScore: 5,
        message: 'No analysis available yet'
      });
    }

    res.json({
      moodScore: latest.mood_score,
      stressIndicators: latest.stress_indicators ? JSON.parse(latest.stress_indicators) : [],
      sentimentScore: latest.sentiment_score,
      recommendations: latest.recommendations ? JSON.parse(latest.recommendations) : [],
      analyzedAt: latest.created_at
    });
  } catch (error) {
    console.error('Get latest analysis error:', error);
    res.status(500).json({ error: 'Failed to fetch latest analysis' });
  }
};

// Manual mood log
exports.logMood = async (req, res) => {
  try {
    const { moodScore, notes } = req.body;

    if (!moodScore || moodScore < 1 || moodScore > 10) {
      return res.status(400).json({ error: 'Mood score must be between 1 and 10' });
    }

    await runQuery(
      `INSERT INTO mental_health_logs 
       (user_id, mood_score, analysis) 
       VALUES (?, ?, ?)`,
      [req.userId, moodScore, JSON.stringify({ manual: true, notes: notes || '' })]
    );

    res.json({
      message: 'Mood logged successfully',
      moodScore
    });
  } catch (error) {
    console.error('Log mood error:', error);
    res.status(500).json({ error: 'Failed to log mood' });
  }
};

// Get recommendations
exports.getRecommendations = async (req, res) => {
  try {
    const latest = await getQuery(
      `SELECT recommendations, mood_score, created_at 
       FROM mental_health_logs 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [req.userId]
    );

    if (!latest) {
      return res.json({
        recommendations: [
          'Take regular breaks while studying',
          'Practice the Pomodoro technique',
          'Get enough sleep (7-9 hours)',
          'Stay hydrated throughout the day'
        ]
      });
    }

    const recommendations = latest.recommendations 
      ? JSON.parse(latest.recommendations) 
      : generateRecommendations(latest.mood_score, 'moderate', []);

    res.json({
      recommendations,
      basedOnMood: latest.mood_score,
      analyzedAt: latest.created_at
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
};

// Helper function to generate recommendations
function generateRecommendations(moodScore, stressLevel, stressIndicators) {
  const recommendations = [];

  if (moodScore < 4) {
    recommendations.push(
      'Consider taking a longer break from studying',
      'Reach out to friends or family for support',
      'Try some light physical exercise or a walk',
      'Practice deep breathing or meditation'
    );
  } else if (moodScore < 7) {
    recommendations.push(
      'Take regular 5-10 minute breaks',
      'Use the Pomodoro timer to manage your time',
      'Stay hydrated and eat nutritious meals',
      'Get some fresh air or natural light'
    );
  } else {
    recommendations.push(
      'Keep up the great work!',
      'Maintain your current study routine',
      'Continue taking regular breaks',
      'Share your study techniques with others'
    );
  }

  if (stressLevel === 'high') {
    recommendations.push(
      'Break down large tasks into smaller chunks',
      'Prioritize your most important tasks',
      'Consider talking to a counselor or mentor',
      'Practice stress-reduction techniques'
    );
  }

  if (stressIndicators.includes('sleep') || stressIndicators.includes('tired')) {
    recommendations.push('Prioritize getting 7-9 hours of sleep');
  }

  return recommendations.slice(0, 5); // Return max 5 recommendations
}