ALTER TABLE "presentes"
ADD COLUMN "ordem" INTEGER NOT NULL DEFAULT 0;

WITH presentes_ordenados AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY "createdAt" DESC, "id" DESC) AS nova_ordem
  FROM "presentes"
)
UPDATE "presentes" AS p
SET "ordem" = o.nova_ordem
FROM presentes_ordenados AS o
WHERE p.id = o.id;

CREATE INDEX "presentes_ordem_idx"
  ON "presentes"("ordem");
