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
    // Preserve WASM workers across Vite HMR hot-reloads using global scope
    const [db, setDb] = useState<duckdb.AsyncDuckDB | null>((window as any).__DUCKDB_INSTANCE__ || null);
    const [conn, setConn] = useState<duckdb.AsyncDuckDBConnection | null>((window as any).__DUCKDB_CONN__ || null);
    const [ready, setReady] = useState(!!((window as any).__DUCKDB_CONN__));

    useEffect(() => {
        let isMounted = true;

        const handleReady = () => {
            if (isMounted && (window as any).__DUCKDB_CONN__) {
                setDb((window as any).__DUCKDB_INSTANCE__);
                setConn((window as any).__DUCKDB_CONN__);
                setReady(true);
            }
        };

        window.addEventListener('duckdb_ready', handleReady);

        if ((window as any).__DUCKDB_CONN__) {
            handleReady();
            return () => { isMounted = false; window.removeEventListener('duckdb_ready', handleReady); };
        }

        const initDB = async () => {
            const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
            const worker = new Worker(bundle.mainWorker!);
            const logger = new duckdb.ConsoleLogger();
            const dbInstance = new duckdb.AsyncDuckDB(logger, worker);
            await dbInstance.instantiate(bundle.mainModule, bundle.pthreadWorker);
            
            // Connect to OPFS for persistent storage
            await dbInstance.open({ 
                path: 'opfs://tax_pilot_ledger_v2.db',
                accessMode: duckdb.DuckDBAccessMode.READ_WRITE
            });
            const connection = await dbInstance.connect();

            // Prevent data loss on mobile crashes
            await connection.query("SET checkpoint_threshold = '0KB'");
            await connection.query("SET wal_autocheckpoint = '0KB'");
            
            // Initialize Schema
            await connection.query(`
                CREATE TABLE IF NOT EXISTS business_profile (
                    id VARCHAR PRIMARY KEY,
                    business_name VARCHAR,
                    has_tin BOOLEAN,
                    is_small_company BOOLEAN
                );
                
                CREATE TABLE IF NOT EXISTS expenses (
                    id VARCHAR PRIMARY KEY,
                    type VARCHAR,
                    amount DOUBLE
                );
                
                CREATE TABLE IF NOT EXISTS inventory (
                    id VARCHAR PRIMARY KEY,
                    category VARCHAR,
                    name VARCHAR,
                    quantity INTEGER,
                    entryType VARCHAR,
                    purchasePricePerUnit DOUBLE,
                    totalTransportCost DOUBLE,
                    totalLaborCost DOUBLE,
                    trueUnitCost DOUBLE,
                    sellingPricePerUnit DOUBLE
                );

                CREATE TABLE IF NOT EXISTS sales_log (
                    id VARCHAR PRIMARY KEY,
                    category VARCHAR,
                    name VARCHAR,
                    quantity INTEGER,
                    entryType VARCHAR,
                    purchasePricePerUnit DOUBLE,
                    totalTransportCost DOUBLE,
                    totalLaborCost DOUBLE,
                    trueUnitCost DOUBLE,
                    sellingPricePerUnit DOUBLE,
                    saleDate VARCHAR,
                    profit DOUBLE,
                    vatCollected DOUBLE
                );
                
                CREATE TABLE IF NOT EXISTS employees (
                    id VARCHAR PRIMARY KEY,
                    name VARCHAR,
                    salary DOUBLE,
                    allowances DOUBLE
                );
            `);

            // Attach securely to window for HMR survival!
            (window as any).__DUCKDB_INSTANCE__ = dbInstance;
            (window as any).__DUCKDB_CONN__ = connection;
            
            window.dispatchEvent(new Event('duckdb_ready'));
        };

        if (!(window as any).__DUCKDB_INIT_PROMISE__) {
            (window as any).__DUCKDB_INIT_PROMISE__ = initDB().catch(console.error);
        }

        return () => {
            isMounted = false;
            window.removeEventListener('duckdb_ready', handleReady);
        };
    }, []);

    return (
        <DuckDBContext.Provider value={{ db, conn, ready }}>
            {children}
        </DuckDBContext.Provider>
    );
};
