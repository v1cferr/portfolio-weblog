FROM node:lts

WORKDIR /app

COPY package*.json .

RUN npm install -g pnpm

RUN apt-get update && apt-get install -y sudo

COPY . .

RUN pnpm install

EXPOSE 3000

CMD ["pnpm", "run", "dev"]