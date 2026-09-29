CREATE TABLE "entity_lines" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "entity_lines_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "entity_lines_name_key" ON "entity_lines"("name");
CREATE INDEX "entity_lines_sortOrder_idx" ON "entity_lines"("sortOrder");

ALTER TABLE "entities" ADD COLUMN "lineId" TEXT;
CREATE INDEX "entities_lineId_idx" ON "entities"("lineId");

INSERT INTO "entity_lines" ("id", "name", "description", "sortOrder") VALUES
('linha-caboclos', 'Caboclos', 'Linha de trabalho dos Caboclos e Caboclas.', 1),
('linha-pretos-velhos', 'Pretos-Velhos', 'Linha de trabalho dos Pretos-Velhos e Pretas-Velhas.', 2),
('linha-eres', 'Erês / Crianças', 'Linha de trabalho das Crianças, Erês ou Ibejada.', 3),
('linha-boiadeiros', 'Boiadeiros', 'Linha de trabalho dos Boiadeiros e Boiadeiras.', 4),
('linha-baianos', 'Baianos', 'Linha de trabalho dos Baianos e Baianas.', 5),
('linha-marinheiros', 'Marinheiros', 'Linha de trabalho dos Marinheiros e Marinheiras.', 6),
('linha-ciganos', 'Ciganos', 'Linha de trabalho dos Ciganos e Ciganas.', 7),
('linha-oriente', 'Povo do Oriente', 'Linha de trabalho tradicionalmente associada ao Povo do Oriente.', 8),
('linha-malandros', 'Malandros', 'Linha de trabalho dos Malandros e Malandras.', 9),
('linha-exus', 'Exus', 'Linha de trabalho dos Exus.', 10),
('linha-pombagiras', 'Pombagiras', 'Linha de trabalho das Pombagiras.', 11),
('linha-exus-mirins', 'Exus-Mirins', 'Linha de trabalho dos Exus-Mirins.', 12),
('linha-sereias', 'Sereias / Povos das Águas', 'Categoria para entidades tradicionalmente relacionadas às águas, conforme a tradição da casa.', 13),
('linha-almas', 'Linha das Almas', 'Categoria para trabalhos relacionados às Almas, conforme a tradição da casa.', 14),
('linha-falangeiros-orixas', 'Falangeiros de Orixás', 'Categoria para entidades/falangeiros associados diretamente às irradiações dos Orixás.', 15);

UPDATE "entities" e
SET "lineId" = l."id"
FROM "entity_lines" l
WHERE lower(trim(e."line")) = lower(trim(l."name"));

ALTER TABLE "entities"
ADD CONSTRAINT "entities_lineId_fkey"
FOREIGN KEY ("lineId") REFERENCES "entity_lines"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
