FROM node:17-alpine

RUN mkdir /app
WORKDIR /app
COPY . ./
RUN npm ci && npm run build
EXPOSE 3000
CMD npx prisma generate && npx prisma db push --accept-data-loss && npm run start:prod