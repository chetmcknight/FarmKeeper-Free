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

# Build args
ARG VITE_API_KEY
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_KEY
ARG VITE_PAYPAL_CLIENT_ID

# Set env vars for build time (Vite needs these)
ENV VITE_API_KEY=$VITE_API_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_KEY=$VITE_SUPABASE_KEY
ENV VITE_PAYPAL_CLIENT_ID=$VITE_PAYPAL_CLIENT_ID

# Build the app
RUN npm run build

# Install serve for static files
RUN npm install -g serve

# Expose port
EXPOSE 8080

# Start command
CMD ["serve", "-s", "dist", "-l", "8080"]