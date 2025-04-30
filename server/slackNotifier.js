import { WebClient } from '@slack/web-api';
import generateGraph from './graphGenerator.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import {
  loadPreviousEngagements,
  saveEngagements,
  compareEngagements
} from './engagementUtils.js';

dotenv.config();

const slackToken = process.env.SLACK_BOT_TOKEN;
const channelId = process.env.SLACK_CHANNEL_ID;
const web = new WebClient(slackToken);

const periodLabels = {
  last_7_days: 'a week',
  last_14_days: '14 days',
  last_28_days: '28 days',
  last_30_days: '30 days',
  last_60_days: '60 days',
};

async function sendToSlack(allAnalyticsData) {
  const periods = Object.keys(periodLabels);
  const engagementNow = {};
  const previous = loadPreviousEngagements();
  const filesToUpload = [];

  for (const period of periods) {
    const dataset = allAnalyticsData.find(d => d.label === period);
    if (!dataset || !dataset.combined) continue;

    const fileName = `active_users_${period}.png`;
    const imagePath = path.join(process.cwd(), 'graphs', fileName);

    const engagement = generateGraph(dataset.combined, period);
    engagementNow[period] = engagement;

    filesToUpload.push({
      path: imagePath
    });

    await new Promise(res => setTimeout(res, 300));
  }

  // 1. Post engagement summary message first
  const summaryText = compareEngagements(engagementNow, previous, periodLabels);
  await web.chat.postMessage({
    channel: channelId,
    text: summaryText
  });

  // 2. Upload all graph images (no message, no title spam)
  for (const file of filesToUpload) {
    const imageBuffer = fs.readFileSync(file.path);
    await web.files.uploadV2({
      channel_id: channelId,
      file: imageBuffer,
      filename: path.basename(file.path),
      title: file.title
    });
    await fs.promises.unlink(file.path);
  }

  // 3. Update engagement time values
  saveEngagements(engagementNow);
}

export default sendToSlack;
