import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvp_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdb_wasm_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
    mvp: {
        mainModule: duckdb_wasm,
        mainWorker: mvp_worker,
    },
    eh: {
        mainModule: duckdb_wasm_eh,
        mainWorker: eh_worker,
    },
};

let db: duckdb.AsyncDuckDB | null = null;

export const initDuckDB = async () => {
    if (db) return db;
    try {
        const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
        const worker = new Worker(bundle.mainWorker!);
        const logger = new duckdb.ConsoleLogger();
        db = new duckdb.AsyncDuckDB(logger, worker);
        await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
        return db;
    } catch (e) {
        console.error("DuckDB Init Failed:", e);
        throw e;
    }
};

export const loadCSVIntoDuckDB = async (db: duckdb.AsyncDuckDB, file: File, tableName = 'dataset') => {
    try {
        const url = URL.createObjectURL(file);
        await db.registerFileURL(file.name, url, duckdb.DuckDBDataProtocol.HTTP, false);
        const conn = await db.connect();
        await conn.query(`CREATE OR REPLACE TABLE ${tableName} AS SELECT * FROM read_csv_auto('${file.name}', header=true, ALL_VARCHAR=true)`);
        await conn.close();
        URL.revokeObjectURL(url);
        return true;
    } catch (e) {
        console.error("DuckDB Load Error:", e);
        return false;
    }
};

export const executeSQL = async (db: duckdb.AsyncDuckDB, query: string) => {
    try {
        const conn = await db.connect();
        const result = await conn.query(query);
        await conn.close();
        return result.toArray().map(r => r.toJSON());
    } catch (e) {
        console.error("SQL Execution Error:", e);
        return [];
    }
};
