# Use Node 18
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build args (all VITE_* vars must be passed at build time)
ARG VITE_API_KEY
ARG VITE_GS_SHEET_ID
ARG VITE_GS_API_KEY
ARG VITE_GS_SCRIPT_URL

# Set env vars for build time (Vite needs these)
ENV VITE_API_KEY=$VITE_API_KEY
ENV VITE_GS_SHEET_ID=$VITE_GS_SHEET_ID
ENV VITE_GS_API_KEY=$VITE_GS_API_KEY
ENV VITE_GS_SCRIPT_URL=$VITE_GS_SCRIPT_URL

# Build the app
RUN npm run build

# Install serve for static files
RUN npm install -g serve

# Expose port
EXPOSE 8080

# Start command
CMD ["serve", "-s", "dist", "-l", "8080"]