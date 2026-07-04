# Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_KEY
ARG VITE_GS_SHEET_ID
ARG VITE_GS_API_KEY
ARG VITE_GS_SCRIPT_URL

ENV VITE_API_KEY=$VITE_API_KEY
ENV VITE_GS_SHEET_ID=$VITE_GS_SHEET_ID
ENV VITE_GS_API_KEY=$VITE_GS_API_KEY
ENV VITE_GS_SCRIPT_URL=$VITE_GS_SCRIPT_URL

RUN npm run build

# Production stage with nginx
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]