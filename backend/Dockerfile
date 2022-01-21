FROM node:17-alpine

RUN mkdir /app
WORKDIR /app
COPY . ./
RUN yarn install && yarn build
EXPOSE 3000
CMD npx prisma generate && npx prisma db push && yarn start:prod