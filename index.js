const line = require('@line/bot-sdk');
const express = require('express');
const axios = require('axios').default;
const dotenv = require('dotenv');
const { createCanvas, loadImage } = require('canvas');
const jsqr = require('jsqr');

const env = dotenv.config().parsed;
console.log(env.ACCESS_TOKEN)
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

const generatePaymentSlip = ({ 
    amount, 
    timestamp, 
    senderCode, 
    senderName, 
    receiverCode, 
    receiverName,
    CheckingText,
    CheckingTextColor,
    Textstatus,
    checkIconUrl = "https://static.vecteezy.com/system/resources/previews/009/591/411/non_2x/check-mark-icon-free-png.png"
  }) => {
    return {
      type: "flex",
      altText: "Payment Confirmation Slip",
      contents: {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          spacing: "md",
          contents: [
            {
              type: "box",
              layout: "baseline",
              contents: [
                {
                  type: "icon",
                  url: checkIconUrl,
                  size: "15px",
                  aspectRatio: "1:1"
                },
                {
                  type: "text",
                  text: CheckingText,
                  color: CheckingTextColor,
                  size: "md",
                  weight: "bold",
                  margin: "sm"
                }
              ]
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: `฿ ${amount.toString()}`,
                  size: "xl",
                  weight: "bold"
                }
              ]
            },
            {
              type: "text",
              text: `${Textstatus} เวลา: ${timestamp}`,
              size: "sm",
              color: "#8594A3"
            },
            {
              type: "separator",
              margin: "lg"
            },
            {
              type: "box",
              layout: "vertical",
              spacing: "sm",
              margin: "lg",
              contents: [
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "ชื่อผู้โอน",
                      size: "sm",
                      color: "#8594A3"
                    },
                    {
                      type: "text",
                      text: senderCode,
                      size: "sm",
                      margin: "md"
                    },
                    {
                      type: "text",
                      text: senderName,
                      size: "sm"
                    }
                  ]
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "ชื่อผู้รับ",
                      size: "sm",
                      color: "#8594A3"
                    },
                    {
                      type: "text",
                      text: receiverCode,
                      size: "sm",
                      margin: "md"
                    },
                    {
                      type: "text",
                      text: receiverName,
                      size: "sm"
                    }
                  ]
                }
              ]
            }
          ]
        }
      }
    };
  };

const handleEvent = async (event) => {
    if (event.type === 'message' && event.message.type === 'image') {
        console.log(event.replyToken);
        try {
            const qrText = await handleImageMessage(event);
            if (qrText) {
                const url = "https://api.slipok.com/api/line/apikey/33282";
                const apiKey = "SLIPOKZ5I20FE";
                const log = false;

                const data = {
                    data: qrText,
                    log: log
                };
                
                const headers = {
                    "Content-Type": "application/json",
                    "x-authorization": apiKey
                };

                try {
                    const response = await fetch(url, {
                        method: "POST",
                        headers: headers,
                        body: JSON.stringify(data),
                    });

                    const responseData = await response.json();
                    receivercode = responseData.data.receiver.proxy.value
                    sendercode = responseData.data.sender.account.value
                    if (responseData.success) {
                        Slip = generatePaymentSlip({
                            amount: responseData.data.amount,
                            timestamp: `${responseData.data.transTime}`,
                            senderCode: `${sendercode.replace(/.*?(\w{1}\d{4}-\w)/, '$1')}`,
                            senderName: `${responseData.data.sender.name}`,
                            receiverCode: `${receivercode.replace(/.*?(\w{1}\d{4}-\w)/, '$1')}`,
                            receiverName: `${responseData.data.receiver.displayName}`,
                            CheckingText: "สลิปถูกต้อง",
                            Textstatus: "รับเงินเรียบร้อย",
                            CheckingTextColor: "#27AE60"
                        });
                    } else {
                        Slip = generatePaymentSlip({
                            amount: responseData.data.amount,
                            timestamp: `${responseData.data.transTime}`,
                            senderCode: `${sendercode.replace(/.*?(\w{1}\d{4}-\w)/, '$1')}`,
                            senderName: `${responseData.data.sender.name}`,
                            receiverCode: `${receivercode.replace(/.*?(\w{1}\d{4}-\w)/, '$1')}`,
                            receiverName: `${responseData.data.receiver.displayName}`,
                            CheckingText: "สลิปไม่ถูกต้อง",
                            Textstatus: "",
                            CheckingTextColor: "#FF3A0F",
                            checkIconUrl: "https://image.similarpng.com/very-thumbnail/2021/06/Cross-mark-icon-in-red-color-on-transparent-background-PNG.png"
                        });
                    }
                    await client.replyMessage(event.replyToken, Slip);

                } catch (error) {
                    console.error('Error making POST request:', error.message);
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
