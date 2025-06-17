FROM node:20-alpine

WORKDIR /app

# Installe les dépendances
COPY package*.json ./
RUN npm install

# Copie tout le code source (y compris prisma/)
COPY . .

# Génère le client Prisma (obligatoire)
RUN npx prisma generate

EXPOSE 3000

# Ajoute la migration automatique au démarrage :
CMD npx prisma migrate deploy && npm start

# seed la BD  automatiquement après migration :
CMD npx prisma migrate deploy && npm run seed && npm start
