import { PGlite } from '@electric-sql/pglite'
const t0 = performance.now()
const db = await PGlite.create()
const t1 = performance.now()
await db.exec(`CREATE TABLE teams (id integer PRIMARY KEY, name text NOT NULL); INSERT INTO teams VALUES (1,'Rain Dance'),(2,'Sun Room');`)
const t2 = performance.now()
const copy = await db.clone()
const t3 = performance.now()
const res = await copy.exec(`ALTER TABLE teams ADD COLUMN is_public boolean; INSERT INTO teams (id,name) VALUES (3,'Trick Room'); SELECT id, name, is_public, count(*) over () AS n, now() AS t, 1.5::numeric AS d FROM teams ORDER BY id;`, { rowMode: 'array' })
console.log('create ms', Math.round(t1-t0), 'seed ms', Math.round(t2-t1), 'clone ms', Math.round(t3-t2))
console.log('results', res.length, JSON.stringify(res.map(r => ({ fields: r.fields.map(f => f.name + ':' + f.dataTypeID), rows: r.rows, affected: r.affectedRows })), (k, v) => typeof v === 'bigint' ? 'BIGINT:' + v : v))
console.log('original unchanged', JSON.stringify((await db.query('SELECT count(*) FROM teams')).rows, (k,v) => typeof v === 'bigint' ? 'BIGINT:'+v : v))
const uuid = await db.exec(`CREATE TABLE u (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), n text); INSERT INTO u (n) VALUES ('a'),('b'); SELECT count(DISTINCT id) AS c FROM u;`)
console.log('uuid', JSON.stringify(uuid.at(-1).rows, (k,v) => typeof v === 'bigint' ? 'BIGINT:'+v : v))
try { await db.exec(`SELECT 1;\nSELEC name FROM teams;`) } catch (e) { console.log('error', { name: e.name, message: e.message, position: e.position, hint: e.hint, detail: e.detail, code: e.code }) }
try { await db.exec(`SELECT nope FROM teams;`) } catch (e) { console.log('error2', { message: e.message, position: e.position, code: e.code }) }
