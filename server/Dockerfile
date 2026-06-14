FROM node:22-alpine

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY index.js db.js seed.js cron.js ./
COPY controllers ./controllers
COPY error ./error
COPY middleware ./middleware
COPY models ./models
COPY routes ./routes

EXPOSE 5000

CMD ["node", "index.js"]
