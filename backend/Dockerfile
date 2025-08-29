FROM node:22-alpine

WORKDIR /app

# Update npm to latest version
RUN npm install -g npm@latest

COPY backend/package*.json ./
RUN npm install

RUN npm install -g typescript

COPY backend/ ./
COPY config.ts ./src/
RUN npm run build

RUN mkdir -p data uploads

EXPOSE 3001

CMD ["npm", "start"]