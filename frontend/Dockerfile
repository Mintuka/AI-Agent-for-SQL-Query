FROM node:18-alpine

WORKDIR /frontend

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
# EXPOSE 3000
CMD ["npm", "start"] 
# CMD ["npm", "run", "dev"]