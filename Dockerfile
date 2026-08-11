FROM node:20-alpine

# Install OpenSSL for Prisma query engine compatibility on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

COPY backend/package*.json ./backend/

RUN cd backend && npm install

COPY backend/prisma ./backend/prisma/

RUN cd backend && npx prisma generate

COPY backend ./backend/

RUN cd backend && npm run build

EXPOSE 5000

WORKDIR /app/backend

CMD npx prisma db push && npx prisma db seed && npm run start
