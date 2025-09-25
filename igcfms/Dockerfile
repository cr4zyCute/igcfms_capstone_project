FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund || npm install

COPY . .

EXPOSE 3000
CMD ["npm", "start"]


