-- CreateTable
CREATE TABLE "Magasin" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "adresse" TEXT,

    CONSTRAINT "Magasin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prix" DOUBLE PRECISION NOT NULL,
    "description" TEXT,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" SERIAL NOT NULL,
    "quantite" INTEGER NOT NULL DEFAULT 0,
    "magasinId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'client',
    "password" TEXT NOT NULL DEFAULT 'password',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vente" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "magasinId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Vente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vente_ligne" (
    "id" SERIAL NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prixUnitaire" DOUBLE PRECISION NOT NULL,
    "venteId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,

    CONSTRAINT "Vente_ligne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "venteId" INTEGER NOT NULL,
    "magasinId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund_ligne" (
    "id" SERIAL NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prixUnitaire" DOUBLE PRECISION NOT NULL,
    "refundId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,

    CONSTRAINT "Refund_ligne_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_nom_key" ON "User"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_magasinId_productId_key" ON "Stock"("magasinId", "productId");

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_magasinId_fkey" FOREIGN KEY ("magasinId") REFERENCES "Magasin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vente" ADD CONSTRAINT "Vente_magasinId_fkey" FOREIGN KEY ("magasinId") REFERENCES "Magasin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vente" ADD CONSTRAINT "Vente_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vente_ligne" ADD CONSTRAINT "Vente_ligne_venteId_fkey" FOREIGN KEY ("venteId") REFERENCES "Vente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vente_ligne" ADD CONSTRAINT "Vente_ligne_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_venteId_fkey" FOREIGN KEY ("venteId") REFERENCES "Vente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_magasinId_fkey" FOREIGN KEY ("magasinId") REFERENCES "Magasin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund_ligne" ADD CONSTRAINT "Refund_ligne_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "Refund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund_ligne" ADD CONSTRAINT "Refund_ligne_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
