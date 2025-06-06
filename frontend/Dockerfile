FROM node:18-alpine

WORKDIR /frontend

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

ENV PORT=3000
# ENV NODE_ENV=production
CMD ["npm", "start"] 
ENV NODE_ENV=development
CMD ["npm", "run", "dev"]