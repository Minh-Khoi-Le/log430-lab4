import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const products = [
  { nom: "Baguette", prix: 2.99, description: "Pain français classique" },
  { nom: "Fromage", prix: 7.99, description: "Fromage affiné artisanal" },
  { nom: "Jambon", prix: 4.29, description: "Jambon de qualité supérieure" },
  { nom: "Lait", prix: 3.49, description: "Lait frais entier" },
  { nom: "Oeufs", prix: 3.99, description: "Oeufs bio de poules élevées en plein air" },
  { nom: "Tomate", prix: 2.19, description: "Tomates rouges mûres" },
  { nom: "Beurre", prix: 5.49, description: "Beurre doux artisanal" },
  { nom: "Pomme", prix: 1.59, description: "Pommes croquantes" },
  { nom: "Poivre", prix: 1.99, description: "Poivre noir moulu" },
  { nom: "Chocolat", prix: 3.79, description: "Chocolat noir 70% cacao" },
];

const magasins = [
  { nom: "Magasin A", adresse: "1 rue de Paris" },
  { nom: "Magasin B", adresse: "2 avenue de Lyon" },
  { nom: "Magasin C", adresse: "3 boulevard de Lille" },
  { nom: "Magasin D", adresse: "4 place de Bordeaux" },
  { nom: "Magasin E", adresse: "5 chemin de Nice" },
];

// Users with different roles
const users = [
  { nom: "g", role: "gestionnaire", password: "g" },
  { nom: "c", role: "client", password: "c" },
  { nom: "Alice", role: "client", password: "password" },
  { nom: "Bob", role: "client", password: "password" },
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  // Delete all data in the database
  await prisma.ligneVente?.deleteMany?.();
  await prisma.vente?.deleteMany?.();
  await prisma.stock?.deleteMany?.();
  await prisma.magasin.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user?.deleteMany?.();

  // Insert products, stores and users
  await prisma.product.createMany({ data: products });
  await prisma.magasin.createMany({ data: magasins });
  await prisma.user.createMany({ data: users });

  // Get the products, stores and users inserted
  const productsList = await prisma.product.findMany();
  const magasinsList = await prisma.magasin.findMany();
  const clientsList = await prisma.user.findMany({ where: { role: 'client' } });

  // Create stocks for each product X store
  for (const magasin of magasinsList) {
    for (const product of productsList) {
      await prisma.stock.create({
        data: {
          productId: product.id,
          magasinId: magasin.id,
          quantite: getRandomInt(20, 100) // stock random
        }
      });
    }
  }

  // Generate random sales for each store
  for (const magasin of magasinsList) {
    const nbVentes = getRandomInt(5, 10); // 5 to 10 sales per store
    for (let v = 0; v < nbVentes; v++) {
      // Random client among the users with role 'client'
      const client = clientsList[getRandomInt(0, clientsList.length - 1)];
      // 1 to 4 different products per sale
      const productsChoisis = [...productsList]
        .sort(() => Math.random() - 0.5)
        .slice(0, getRandomInt(1, 4));

      // Generate sale lines
      const lignes = productsChoisis.map(product => ({
        productId: product.id,
        quantite: getRandomInt(1, 5),
        prixUnitaire: product.prix
      }));

      // Calculate the total of the sale
      const total = lignes.reduce((acc, l) => acc + l.quantite * l.prixUnitaire, 0);

      // Create the sale with its associated lines
      await prisma.vente.create({
        data: {
          magasinId: magasin.id,
          userId: client.id,
          total,
          lignes: {
            create: lignes
          }
        }
      });
    }
  }

  console.log("Données seedées (products, magasins, stocks, users, ventes) !");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
