CREATE TABLE "_EntityLineMembers" ("A" TEXT NOT NULL, "B" TEXT NOT NULL);
CREATE UNIQUE INDEX "_EntityLineMembers_AB_unique" ON "_EntityLineMembers"("A","B");
CREATE INDEX "_EntityLineMembers_B_index" ON "_EntityLineMembers"("B");
ALTER TABLE "_EntityLineMembers" ADD CONSTRAINT "_EntityLineMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "entity_lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_EntityLineMembers" ADD CONSTRAINT "_EntityLineMembers_B_fkey" FOREIGN KEY ("B") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;