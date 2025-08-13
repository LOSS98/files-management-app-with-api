FROM node:22-alpine

# Install native dependencies for SQLite3 and Sharp
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite \
    vips-dev

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies and rebuild native modules
RUN npm install && \
    npm rebuild better-sqlite3 --build-from-source && \
    npm rebuild sharp --platform=linuxmusl

# Install TypeScript globally
RUN npm install -g typescript

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create required directories
RUN mkdir -p data uploads

# Set proper permissions
RUN chown -R node:node /app
USER node

EXPOSE 3001

CMD ["npm", "start"]