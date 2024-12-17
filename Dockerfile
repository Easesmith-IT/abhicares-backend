FROM node:20.14.0
WORKDIR /app
COPY package*.json ./
RUN npm install -g npm@11.0.0
RUN npm install
COPY . .
EXPOSE 5000
CMD ["node", "app.js"]
