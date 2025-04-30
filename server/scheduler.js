import getAnalyticsData from './googleAnalytics.js';
import sendToSlack from './slackNotifier.js';

// Run every 30 seconds
try {
  console.log('Fetching data from Google Analytics...');
  const analyticsData = await getAnalyticsData();
  console.log('Generating graph...');
  await sendToSlack(analyticsData);
} catch (error) {
  console.error('Error during automation:', error);
}
