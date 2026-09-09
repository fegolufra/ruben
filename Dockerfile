FROM node:18-bookworm
RUN apt-get update && apt-get install -y python3 make g++ libsqlite3-dev
WORKDIR /app
COPY package.json ./
RUN npm install --build-from-source=better-sqlite3
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
