# LOG430 - Application de Gestion de Magasin

## Description

Cette application simule la gestion d'un magasin avec une interface web moderne :  

- Un frontend React (Vite)
- Un backend Node.js (Express, DAO, Prisma/PostgreSQL) avec API REST documentée  
  Les deux services sont orchestrés avec **Docker Compose**.  
  Un pipeline **CI/CD** GitHub Actions automatise le build et les tests.

---

## Choix techniques

Frontend : React / Vite / Material UI

Backend : Express (Node.js 20)

Persistance : Prisma ORM / PostgreSQL

Conteneurisation : Docker Compose (client/server/db)

---

## Instructions d'exécution

### 1. **Prérequis**

- **Docker & Docker Compose** installés
- (Facultatif) Node.js 18+ pour lancer localement hors Docker

---

### 2. **Lancer l'application complète**

Avec Docker :

```bash
docker-compose up --build
```

En local :

```bash
# Pour lancer le server
cd server
npm run start
```

```bash
# Pour lancer l'application web
cd client
npm run dev
```

## Injection de données par défaut

Pour avoir des données par défaut :

```bash
# Avec Docker
docker-compose exec server npm run seed

# Localement
cd server
npm run seed
```

## Lancer les tests

Tester localement :

```bash
cd server
npm test
```

## Commandes Prisma utiles

Pour réinitialiser migration prisma :

```bash
npx prisma migrate reset
npx prisma migrate dev --name init
```

Il faut reseed les données après (à voir plus haut).

## Récupérer l'arborescence du projet

Exécuter sur le root du projet

```bash
treee -l 4 --ignore "node_modules,.git" -o docs\structure.txt
```

## Arborescene

```text
├── client
│ ├── Dockerfile
│ ├── eslint.config.js
│ ├── index.html
│ ├── package-lock.json
│ ├── package.json
│ ├── public
│ ├── src
│ │ ├── api
│ │ │ └── index.js
│ │ ├── App.jsx
│ │ ├── assets
│ │ │ ├── index.css
│ │ │ └── react.svg
│ │ ├── components
│ │ │ ├── Modal.jsx
│ │ │ ├── Navbar.jsx
│ │ │ ├── ProductCard.jsx
│ │ │ ├── ProductEditForm.jsx
│ │ │ └── ProductList.jsx
│ │ ├── context
│ │ │ ├── CartContext.jsx
│ │ │ └── UserContext.jsx
│ │ ├── main.jsx
│ │ └── pages
│ │ ├── CartPage.jsx
│ │ ├── Dashboard.jsx
│ │ ├── Login.jsx
│ │ ├── MagasinDetail.jsx
│ │ └── Products.jsx
│ └── vite.config.js
├── docker-compose.yml
├── package-lock.json
├── package.json
├── README.md
└── server
├── controllers
│ ├── magasin.controller.js
│ ├── maisonmere.controller.js
│ ├── product.controller.js
│ ├── stock.controller.js
│ ├── user.controller.js
│ └── vente.controller.js
├── dao
│ ├── magasin.dao.js
│ ├── produit.dao.js
│ ├── stock.dao.js
│ ├── user.dao.js
│ └── vente.dao.js
├── Dockerfile
├── docs
│ └── magasinapi.yaml
├── index.js
├── jest.config.js
├── middleware
│ ├── auth.js
│ ├── errorHandler.js
│ └── validateRequest.js
├── package-lock.json
├── package.json
├── prisma
│ └── schema.prisma
├── routes
│ ├── magasin.routes.js
│ ├── maisonmere.routes.js
│ ├── product.routes.js
│ ├── stock.routes.js
│ ├── user.routes.js
│ └── vente.routes.js
├── seed.js
├── server.js
├── services
│ └── product.service.js
└── tests
├── auth.test.js
├── basic.test.js
├── magasin.test.js
├── product.test.js
├── setup.js
├── stock.test.js
└── ventes.test.js

```
