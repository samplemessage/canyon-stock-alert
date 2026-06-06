import { JSDOM } from 'jsdom';

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const BIKE_URL = process.env.BIKE_URL;
const BIKE_SIZE = process.env.BIKE_SIZE || 'S';

async function sendTelegram(message) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message }),
  });
}

async function checkAvailability() {
  console.log(`Checking availability for size ${BIKE_SIZE}...`);

  const response = await fetch(BIKE_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  const html = await response.text();
  const { document } = new JSDOM(html).window;

  const element = document.querySelector(
    `.productConfiguration__optionListItem .productConfiguration__selectVariant[data-product-size="${BIKE_SIZE}"]`
  );

  if (!element) {
    console.log('Size element not found in HTML – Canyon may be blocking the request.');
    await sendTelegram(`⚠️ Canyon stock check failed – size element not found. Please check manually: ${BIKE_URL}`);
    return;
  }

    const isAvailable = !element.innerHTML.includes('Notify') && !element.innerHTML.includes('Benachrichtige');

  if (isAvailable) {
    await sendTelegram(`✅ Canyon Endurace AllRoad size ${BIKE_SIZE} is IN STOCK! 🚴 Buy now: ${BIKE_URL}`);
    console.log('Bike is available! Telegram message sent.');
  } else {
    console.log('Bike is not available yet.');
  }
}

checkAvailability().catch(async (err) => {
  console.error('Error:', err);
  await sendTelegram(`⚠️ Canyon stock check error: ${err.message}`);
});
