const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config()
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true
    }
  });
// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

io.on('connection', (socket) => {
    console.log('Client connected');
    socket.on('image', async (data) => {
        try {
            console.log(typeof data.image); // Print the type of the received image data
            
            // Process the image with the model
            const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
            const prompt = "describe the provided images";

            // Convert the image data to base64
            const base64ImageData = Buffer.from(data.image, 'base64').toString('base64');

            // Prepare the image data for the model
            const imagePart = {
                inlineData: {
                    data: base64ImageData,
                    mimeType: "image/jpeg"
                },
            };

            // Generate content with the prompt and image
            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            const description = await response.text();
            // Emit description and image data
            io.emit('descriptionAndImage', { description, image: data.image });
        } catch (error) {
            console.error('Error processing image:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
