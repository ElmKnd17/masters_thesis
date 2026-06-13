FROM node:22-alpine AS build

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.js postcss.config.js tailwind.config.js ./
COPY public ./public
COPY src ./src

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
