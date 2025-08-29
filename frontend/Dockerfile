FROM node:22-alpine AS build

WORKDIR /app

# Update npm to latest version
RUN npm install -g npm@latest

COPY package*.json ./
RUN npm install

COPY . .

# Build arguments for environment variables
ARG VITE_BACKEND_DOMAIN
ARG VITE_BACKEND_PORT
ARG VITE_BACKEND_PROTOCOL
ARG VITE_PRODUCTION_DOMAIN
ARG VITE_PRODUCTION_PROTOCOL

# Set environment variables for the build
ENV VITE_BACKEND_DOMAIN=$VITE_BACKEND_DOMAIN
ENV VITE_BACKEND_PORT=$VITE_BACKEND_PORT
ENV VITE_BACKEND_PROTOCOL=$VITE_BACKEND_PROTOCOL
ENV VITE_PRODUCTION_DOMAIN=$VITE_PRODUCTION_DOMAIN
ENV VITE_PRODUCTION_PROTOCOL=$VITE_PRODUCTION_PROTOCOL

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]