import React, { createContext, useContext, useEffect, useState } from 'react';
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

interface DuckDBContextType {
    db: duckdb.AsyncDuckDB | null;
    conn: duckdb.AsyncDuckDBConnection | null;
    ready: boolean;
}

const DuckDBContext = createContext<DuckDBContextType>({ db: null, conn: null, ready: false });

export const useDuckDB = () => useContext(DuckDBContext);

export const DuckDBProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [db, setDb] = useState<duckdb.AsyncDuckDB | null>(null);
    const [conn, setConn] = useState<duckdb.AsyncDuckDBConnection | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const initDB = async () => {
            const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
            const worker = new Worker(bundle.mainWorker!);
            const logger = new duckdb.ConsoleLogger();
            const dbInstance = new duckdb.AsyncDuckDB(logger, worker);
            await dbInstance.instantiate(bundle.mainModule, bundle.pthreadWorker);
            
            // Connect and mount OPFS
            const connection = await dbInstance.connect();
            
            setDb(dbInstance);
            setConn(connection);
            
            // Initialize Schema
            await connection.query(`
                CREATE TABLE IF NOT EXISTS business_profile (
                    id INTEGER PRIMARY KEY,
                    business_name VARCHAR,
                    has_tin BOOLEAN,
                    is_small_company BOOLEAN
                );
                
                CREATE TABLE IF NOT EXISTS expenses (
                    id INTEGER PRIMARY KEY,
                    type VARCHAR,
                    amount DOUBLE
                );
                
                CREATE TABLE IF NOT EXISTS inventory (
                    id INTEGER PRIMARY KEY,
                    category VARCHAR,
                    name VARCHAR,
                    quantity INTEGER,
                    purchase_price DOUBLE,
                    transport_cost DOUBLE,
                    labor_cost DOUBLE,
                    selling_price DOUBLE,
                    sold BOOLEAN
                );
                
                CREATE TABLE IF NOT EXISTS employees (
                    id INTEGER PRIMARY KEY,
                    name VARCHAR,
                    salary DOUBLE,
                    allowances DOUBLE
                );
            `);
            
            if (isMounted) {
                setReady(true);
            }
        };

        if (!db) {
            initDB().catch(console.error);
        }

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <DuckDBContext.Provider value={{ db, conn, ready }}>
            {children}
        </DuckDBContext.Provider>
    );
};
