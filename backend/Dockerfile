FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

RUN npm install -g typescript

COPY . .
RUN npm run build

RUN mkdir -p data uploads

EXPOSE 3001

CMD ["npm", "start"]