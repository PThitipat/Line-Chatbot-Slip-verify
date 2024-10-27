const line = require('@line/bot-sdk');
const express = require('express');
const axios = require('axios').default;
const dotenv = require('dotenv');
const { createCanvas, loadImage } = require('canvas');
const jsqr = require('jsqr');

// Variables
const env = dotenv.config().parsed;
const app = express();
const lineConfig = {
    channelAccessToken: env.ACCESS_TOKEN,
    channelSecret: env.SECRET_TOKEN,
};
const client = new line.Client(lineConfig);

// Processes
app.post('/webhook', line.middleware(lineConfig), async (req, res) => {
    try {
        const events = req.body.events;
        console.log('event=>>>>', events);
        return events.length > 0 ? await events.map((item) => handleEvent(item)) : res.status(200).send('OK');
    } catch (error) {
        res.status(500).end();
    }
});

const handleEvent = async (event) => {
    if (event.type === 'message' && event.message.type === 'image') {
        try {
            const qrText = await handleImageMessage(event);
            if (qrText) {
                const url = 'https://slipsplus.com/api/verify';
                const data = {
                    qrcode_text: qrText,
                    key_api: env.SECRET_KEY_API,
                    ip: null,
                };

                try {
                    const response = await axios.post(url, data);
                    if (response.status === 200) {
                        const moneyformatted = parseFloat(response.data["amount"]);
                        const formattedMoney = moneyformatted.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        });
                        if (response.data["request_same"] == 0) {
                            const flexMessage = {
                                type: 'flex',
                                altText: 'ตรวจสอบสลิป',
                                contents: {
                                type: "bubble",
                                body: {
                                    type: "box",
                                    layout: "vertical",
                                    contents: [
                                    {
                                        type: "text",
                                        text: "RECEIPT",
                                        weight: "bold",
                                        color: "#1DB446",
                                        size: "sm"
                                    },
                                    {
                                        type: "text",
                                        text: `${response.data.massage_th}`,
                                        weight: "bold",
                                        size: "xxl",
                                        margin: "md"
                                    },
                                    {
                                        type: "separator",
                                        margin: "xxl"
                                    },
                                    {
                                        type: "box",
                                        layout: "vertical",
                                        margin: "xxl",
                                        spacing: "sm",
                                        contents: [
                                        {
                                            type: "box",
                                            layout: "horizontal",
                                            contents: [
                                            {
                                                type: "text",
                                                text: "ยอดเงิน",
                                                size: "sm",
                                                color: "#555555",
                                                flex: 0
                                            },
                                            {
                                                type: "text",
                                                text: `${formattedMoney} บาท`,
                                                size: "sm",
                                                color: "#111111",
                                                align: "end"
                                            }
                                            ]
                                        },
                                        {
                                            type: "separator",
                                            margin: "xxl"
                                        },
                                        {
                                            type: "box",
                                            layout: "horizontal",
                                            contents: [
                                            {
                                                type: "text",
                                                text: "ชื่อผู้รับ",
                                                size: "sm",
                                                color: "#555555"
                                            },
                                            {
                                                type: "text",
                                                text: `${response.data.receiver.name}`,
                                                size: "sm",
                                                color: "#111111",
                                                align: "end"
                                            }
                                            ]
                                        },
                                        {
                                            type: "box",
                                            layout: "horizontal",
                                            contents: [
                                            {
                                                type: "text",
                                                text: "เลขที่บัญชี",
                                                size: "sm",
                                                color: "#555555"
                                            },
                                            {
                                                type: "text",
                                                text: `${response.data.receiver.acc_no}`,
                                                size: "sm",
                                                color: "#111111",
                                                align: "end"
                                            }
                                            ]
                                        },
                                        {
                                            type: "box",
                                            layout: "horizontal",
                                            contents: [
                                            {
                                                type: "text",
                                                text: "ธนาคาร",
                                                size: "sm",
                                                color: "#555555"
                                            },
                                            {
                                                type: "text",
                                                text: `${response.data.receiver.bank_name}`,
                                                size: "sm",
                                                color: "#111111",
                                                align: "end"
                                            }
                                            ]
                                        }
                                        ]
                                    },
                                    {
                                        type: "separator",
                                        margin: "xxl"
                                    },
                                    {
                                        type: "box",
                                        layout: "horizontal",
                                        margin: "md",
                                        contents: [
                                        {
                                            type: "text",
                                            text: "PAYMENT ID",
                                            size: "xs",
                                            color: "#aaaaaa",
                                            flex: 0
                                        },
                                        {
                                            type: "text",
                                            text: `#${response.data.transactionId}`,
                                            color: "#aaaaaa",
                                            size: "xs",
                                            align: "end"
                                        }
                                        ]
                                    },
                                    {
                                        type: "box",
                                        layout: "horizontal",
                                        margin: "md",
                                        contents: [
                                        {
                                            type: "text",
                                            text: "เวลา",
                                            size: "xs",
                                            color: "#aaaaaa",
                                            flex: 0
                                        },
                                        {
                                            type: "text",
                                            text: `${response.data.slip_time}`,
                                            color: "#aaaaaa",
                                            size: "xs",
                                            align: "end"
                                        }
                                        ]
                                    }
                                    ]
                                },
                                "styles": {
                                    "footer": {
                                    "separator": true
                                    }
                                }},
                            };
                            await client.replyMessage(event.replyToken, flexMessage);
                        } else {
                            const flexMessage = {
                                type: 'flex',
                                altText: 'This is a flex message',
                                contents: {
                                type: "bubble",
                                body: {
                                    type: "box",
                                    layout: "vertical",
                                    contents: [
                                    {
                                        type: "text",
                                        text: "RECEIPT",
                                        weight: "bold",
                                        color: "#1DB446",
                                        size: "sm"
                                    },
                                    {
                                        type: "text",
                                        text: `${response.data.massage_th}`,
                                        weight: "bold",
                                        size: "xxl",
                                        margin: "md"
                                    },
                                    {
                                        type: "separator",
                                        margin: "xxl"
                                    },
                                    {
                                        type: "box",
                                        layout: "vertical",
                                        margin: "xxl",
                                        spacing: "sm",
                                        contents: [
                                        {
                                            type: "box",
                                            layout: "horizontal",
                                            contents: [
                                            {
                                                type: "text",
                                                text: "ยอดเงิน",
                                                size: "sm",
                                                color: "#555555",
                                                flex: 0
                                            },
                                            {
                                                type: "text",
                                                text: `${formattedMoney} บาท`,
                                                size: "sm",
                                                color: "#111111",
                                                align: "end"
                                            }
                                            ]
                                        },
                                        {
                                            type: "separator",
                                            margin: "xxl"
                                        },
                                        {
                                            type: "box",
                                            layout: "horizontal",
                                            contents: [
                                            {
                                                type: "text",
                                                text: "ชื่อผู้รับ",
                                                size: "sm",
                                                color: "#555555"
                                            },
                                            {
                                                type: "text",
                                                text: `${response.data.receiver.name}`,
                                                size: "sm",
                                                color: "#111111",
                                                align: "end"
                                            }
                                            ]
                                        },
                                        {
                                            type: "box",
                                            layout: "horizontal",
                                            contents: [
                                            {
                                                type: "text",
                                                text: "เลขที่บัญชี",
                                                size: "sm",
                                                color: "#555555"
                                            },
                                            {
                                                type: "text",
                                                text: `${response.data.receiver.acc_no}`,
                                                size: "sm",
                                                color: "#111111",
                                                align: "end"
                                            }
                                            ]
                                        },
                                        {
                                            type: "box",
                                            layout: "horizontal",
                                            contents: [
                                            {
                                                type: "text",
                                                text: "ธนาคาร",
                                                size: "sm",
                                                color: "#555555"
                                            },
                                            {
                                                type: "text",
                                                text: `${response.data.receiver.bank_name}`,
                                                size: "sm",
                                                color: "#111111",
                                                align: "end"
                                            }
                                            ]
                                        }
                                        ]
                                    },
                                    {
                                        type: "separator",
                                        margin: "xxl"
                                    },
                                    {
                                        type: "box",
                                        layout: "horizontal",
                                        margin: "md",
                                        contents: [
                                        {
                                            type: "text",
                                            text: "PAYMENT ID",
                                            size: "xs",
                                            color: "#aaaaaa",
                                            flex: 0
                                        },
                                        {
                                            type: "text",
                                            text: `#${response.data.transactionId}`,
                                            color: "#aaaaaa",
                                            size: "xs",
                                            align: "end"
                                        }
                                        ]
                                    },
                                    {
                                        type: "box",
                                        layout: "horizontal",
                                        margin: "md",
                                        contents: [
                                        {
                                            type: "text",
                                            text: "เวลา",
                                            size: "xs",
                                            color: "#aaaaaa",
                                            flex: 0
                                        },
                                        {
                                            type: "text",
                                            text: `${response.data.slip_time}`,
                                            color: "#aaaaaa",
                                            size: "xs",
                                            align: "end"
                                        }
                                        ]
                                    }
                                    ]
                                },
                                "styles": {
                                    "footer": {
                                    "separator": true
                                    }
                                }},
                            };
                            await client.replyMessage(event.replyToken, flexMessage);
                        }
                    }
                } catch (error) {
                    console.error('Error making POST request:', error.message);
                    if (error.response) {
                        console.error('Response data:', error.response.data);
                        console.error('Response status:', error.response.status);
                        console.error('Response headers:', error.response.headers);
                    } else if (error.request) {
                        console.error('No response received:', error.request);
                    } else {
                        console.error('Error in request setup:', error.message);
                    }
                }
            } else {
                console.log('No QR code found in the image.');
            }
        } catch (error) {
            console.error('Error handling image message:', error.message);
        }
    }
};

async function decodeQRCode(buffer) {
    try {
        const image = await loadImage(buffer);
        const canvas = createCanvas(image.width, image.height);
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, image.width, image.height);
        const imageData = context.getImageData(0, 0, image.width, image.height);
        const code = jsqr(imageData.data, imageData.width, imageData.height);

        if (code) {
            return code.data;
        } else {
            console.log('No QR Code found');
            return null;
        }
    } catch (error) {
        console.error('Error decoding QR Code:', error.message);
        return null;
    }
}

async function handleImageMessage(event) {
    const messageId = event.message.id;

    return new Promise(async (resolve, reject) => {
        try {
            const stream = await client.getMessageContent(messageId);
            const chunks = [];
            stream.on('data', (chunk) => {
                chunks.push(chunk);
            });
            stream.on('end', async () => {
                const buffer = Buffer.concat(chunks);
                const qrText = await decodeQRCode(buffer);
                resolve(qrText);
            });
        } catch (error) {
            reject(error);
        }
    });
}


app.listen(4000, () => {
    console.log('listening on ' + 4000);
});
