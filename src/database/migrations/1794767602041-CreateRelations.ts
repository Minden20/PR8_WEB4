import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRelations1794767602041 implements MigrationInterface {
  name = 'CreateRelations1794767602041';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "menu_categories" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying(100) NOT NULL, "description" text, "sortOrder" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_30e8482d17959bb79ead70da22d" UNIQUE ("name"), CONSTRAINT "PK_124ae987900336f983881cb04e6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "dishes" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "title" character varying(120) NOT NULL, "slug" character varying(160) NOT NULL, "price" numeric(8,2) NOT NULL, "weightGrams" integer NOT NULL, "calories" integer NOT NULL, "isSpicy" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "menu_category_id" uuid, CONSTRAINT "UQ_51f392971d25c773afa3becc010" UNIQUE ("slug"), CONSTRAINT "PK_f4748c8e8382ad34ef517520b7b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "dishes" ADD CONSTRAINT "FK_4ad462e9ccc5d3788cc34c3878d" FOREIGN KEY ("menu_category_id") REFERENCES "menu_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dishes" DROP CONSTRAINT "FK_4ad462e9ccc5d3788cc34c3878d"`,
    );
    await queryRunner.query(`DROP TABLE "dishes"`);
    await queryRunner.query(`DROP TABLE "menu_categories"`);
  }
}
