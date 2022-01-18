FROM node:17-alpine

RUN mkdir /app
WORKDIR /app
COPY . ./
RUN yarn install && yarn build && npx prisma generate && npx prisma db push
EXPOSE 3000
CMD yarn start:prod