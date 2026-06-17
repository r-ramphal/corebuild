-- Least-privilege rechten voor de CoreBuild-applicatierol (corebuild_app).
--
-- Doel: de Next.js-runtime (Vercel) draait NIET meer als neondb_owner (volledige
-- DDL: CREATE/DROP/ALTER/ownership), maar als een rol die uitsluitend rijen mag
-- lezen en schrijven. Bij een credential-leak of RCE kan een aanvaller dan geen
-- tabellen droppen/wijzigen of het schema aantasten.
--
-- Migraties blijven via neondb_owner lopen (drizzle-kit + scripts/apply-migration.ts);
-- die rol blijft dus de eigenaar van alle objecten.
--
-- De ROL zelf (CREATE ROLE ... PASSWORD) wordt door scripts/setup-app-role.ts
-- aangemaakt met een gegenereerd wachtwoord — bewust niet in dit bestand (geheim).
-- Deze grants zijn idempotent en veilig opnieuw uit te voeren.

-- Verbinden + het schema gebruiken, maar NIET er nieuwe objecten in mogen maken.
GRANT CONNECT ON DATABASE neondb TO corebuild_app;
GRANT USAGE ON SCHEMA public TO corebuild_app;
REVOKE CREATE ON SCHEMA public FROM corebuild_app;

-- DML op alle huidige tabellen — bewust GEEN TRUNCATE, GEEN ownership, GEEN DDL.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO corebuild_app;

-- Sequences voor de serial-PK's (nextval bij INSERT op listings/price_history/builds/price_alerts).
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO corebuild_app;

-- Toekomstige objecten die neondb_owner aanmaakt (volgende migraties) krijgen
-- automatisch dezelfde DML-rechten → geen her-grant per migratie nodig.
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO corebuild_app;
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO corebuild_app;
