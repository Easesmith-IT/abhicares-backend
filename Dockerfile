FROM node:20

RUN useradd -ms /bin/bash shubham

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

RUN chown -R shubham:shubham /app

EXPOSE 5000
CMD ["node", "app.js"]
