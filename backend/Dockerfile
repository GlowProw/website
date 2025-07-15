FROM node:22
WORKDIR /

COPY package*.json ./
COPY . .

RUN npm install

EXPOSE 3000 3001

CMD ["npm", "start"]
