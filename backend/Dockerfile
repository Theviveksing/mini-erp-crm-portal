FROM node:20-alpine

# Install OpenSSL for Prisma query engine compatibility
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY prisma ./prisma/

RUN npx prisma generate

COPY . .

RUN npm run build

EXPOSE 5000

# Script to sync database schema, seed database, and start backend
CMD npx prisma db push && npx prisma db seed && npm run start
