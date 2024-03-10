const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const winston = require('winston');


const token = '7184725401:AAEZHG_PCzgJAEuJ1s0Cay62qjhBzFbIsE8';
const webAppUrl = 'https://cosmic-pastelito-ec955f.netlify.app';
const bot = new TelegramBot(token, { polling: true });
const app = express();

app.use(express.json());
app.use(cors());

const logger = winston.createLogger({
    transports: [
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    logger.info(`Received message: ${text}`);

    if (text === '/start') {
        logger.info('Sending /start message');

        await bot.sendMessage(chatId, 'Ниже появится кнопка, заполни форму', {
            reply_markup: {
                keyboard: [
                    [{ text: 'Заполнить форму', web_app: { url: webAppUrl + '/form' } }]
                ]
            }
        });

        await bot.sendMessage(chatId, 'Заходи в наш интернет магазин по кнопке ниже', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Сделать заказ', web_app: { url: webAppUrl } }]
                ]
            }
        });
    }

    if (msg?.web_app_data?.data) {
        try {
            const data = JSON.parse(msg?.web_app_data?.data);
            logger.info('Received data from web app:', data);

            await bot.sendMessage(chatId, 'Спасибо за обратную связь!');
            await bot.sendMessage(chatId, 'Ваша страна: ' + data?.country);
            await bot.sendMessage(chatId, 'Ваша улица: ' + data?.street);

            setTimeout(async () => {
                await bot.sendMessage(chatId, 'Всю информацию вы получите в этом чате');
            }, 3000);
        } catch (e) {
            logger.error('Error processing web app data:', e);
            console.error(e);
        }
    }
});

app.post('/web-data', async (req, res) => {
    const { queryId, products = [], totalPrice } = req.body;
    try {
        if (!products.length) {
            throw new Error('No products provided');
        }

        logger.info('Received web data:', req.body);

        await bot.answerWebAppQuery(queryId, {
            type: 'article',
            id: queryId,
            title: 'Успешная покупка',
            input_message_content: {
                message_text: `Поздравляю с покупкой, вы приобрели товар на сумму ${totalPrice}, ${products.map(item => item.title).join(', ')}`
            }
        });

        logger.info('Successfully answered web app query');
        return res.status(200).json({});
    } catch (e) {
        logger.error('Error processing web data:', e);
        console.error(e);
        return res.status(500).json({});
    }
});

const PORT = 8000;
app.listen(PORT, () => {
    console.log('Server started on PORT ' + PORT);
    logger.info('Server started on PORT ' + PORT);
});