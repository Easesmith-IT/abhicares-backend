FROM node:20
WORKDIR /app
COPY package*.json ./
#RUN npm install -g npm@11.0.0
RUN npm install --force
COPY . .
EXPOSE 5000
CMD ["node", "app.js"]
