FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install -g npm@11.6.2

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 8787

CMD ["npx", "wrangler", "--cwd", ".output", "dev", "--ip", "0.0.0.0", "--port", "8787"]