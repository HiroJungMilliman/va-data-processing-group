import { useState } from "react";

const DATA_SCALES = ["< 100 MB", "> 1 GB", "> 100 GB"];
const SCALE_KEYS = ["small", "medium", "large"];

const CATEGORIES = [
  { id: "etl", label: "ETL & Advanced Transformations", priority: 1, icon: "⟳" },
  { id: "ml", label: "Machine Learning Modeling", priority: 2, icon: "◈" },
  { id: "staging", label: "Dashboard Staging", priority: 3, icon: "▦" },
  { id: "eda", label: "Exploratory Data Analysis", priority: 4, icon: "◎" },
  { id: "viz", label: "Data Visualization", priority: 5, icon: "◉" },
];

const STACK = {
  language: {
    label: "Language",
    options: [
      {
        name: "Python",
        etl: {
          small: { rating: 5, strengths: ["Pandas handles <100MB effortlessly", "Rich ecosystem: dbt-core, petl, bonobo", "Great for irregular/nested data (JSON, XML)", "Fast iteration with Jupyter"], weaknesses: ["Single-threaded Pandas doesn't scale", "Memory-heavy; 100MB CSV → ~400MB in memory"] },
          medium: { rating: 4, strengths: ["Polars or Dask extends scale significantly", "PySpark available for cluster work", "Strong connector ecosystem (SQLAlchemy, Arrow)"], weaknesses: ["Pandas hits walls; requires lib swap to Polars/Dask", "Parallelism is manual; GIL limits CPU threading"] },
          large: { rating: 3, strengths: ["PySpark/Dask orchestrate distributed ETL well", "Works as glue layer between compute engines"], weaknesses: ["Python itself is not the executor at this scale", "Memory management complex; OOM errors common without care", "Slower than JVM-native Spark for heavy transforms"] },
        },
        ml: {
          small: { rating: 5, strengths: ["sklearn, XGBoost, LightGBM all excel here", "Fast experimentation; entire dataset fits in RAM", "Jupyter + matplotlib for inline validation"], weaknesses: ["No distributed training; single machine only"] },
          medium: { rating: 5, strengths: ["PyTorch/TensorFlow handle GB-scale with GPU", "MLflow, W&B integrations are Python-native", "Feature engineering with Polars is fast"], weaknesses: ["Deep learning needs GPU memory management", "Training loops require careful batching"] },
          large: { rating: 4, strengths: ["Ray Train / Dask-ML for distributed ML", "Horovod for multi-GPU training", "Python APIs for Spark MLlib"], weaknesses: ["Not native distributed; adds coordination overhead", "Debugging distributed jobs is painful"] },
        },
        staging: {
          small: { rating: 5, strengths: ["Pandas transforms are expressive and fast", "Direct DB write with SQLAlchemy", "Easy scheduling with Airflow/Prefect"], weaknesses: ["Overkill; SQL often simpler for pure staging"] },
          medium: { rating: 4, strengths: ["Polars for fast transformations before write", "Works well as dbt runner"], weaknesses: ["SQL+dbt usually cleaner for this use case"] },
          large: { rating: 3, strengths: ["Good orchestration layer for Spark/BigQuery jobs"], weaknesses: ["Python shouldn't be the engine; hand off to SQL/Spark"] },
        },
        eda: {
          small: { rating: 5, strengths: ["Pandas + ydata-profiling instant full-dataset profile", "Jupyter notebooks are the standard for EDA", "Rich inline visualization"], weaknesses: ["None at this scale"] },
          medium: { rating: 4, strengths: ["Polars + DuckDB for fast sampling and aggregation", "Statistical libraries (scipy, statsmodels) readily available"], weaknesses: ["Full-dataset EDA may require sampling strategies"] },
          large: { rating: 3, strengths: ["Scripted EDA via Spark or BigQuery client", "Sampling workflows still viable"], weaknesses: ["Interactive EDA is slow; must pre-aggregate", "Notebooks become unwieldy; need workflow management"] },
        },
        viz: {
          small: { rating: 5, strengths: ["Matplotlib, seaborn, plotly, altair — best ecosystem", "Inline Jupyter rendering", "Streamlit/Dash for quick dashboards"], weaknesses: ["None at this scale"] },
          medium: { rating: 4, strengths: ["Plotly handles aggregated data well", "Can pre-aggregate then visualize"], weaknesses: ["Raw 1GB+ data must be sampled/aggregated first", "Browser-based viz can't handle millions of raw rows"] },
          large: { rating: 3, strengths: ["Generate pre-aggregated exports for viz tools", "Datashader for large-scale raster viz"], weaknesses: ["Python is the prep layer, not the viz layer here"] },
        },
      },
      {
        name: "SQL (dbt / raw)",
        etl: {
          small: { rating: 4, strengths: ["Extremely concise for relational transforms", "dbt adds lineage, testing, documentation", "DuckDB runs SQL on files with no infra"], weaknesses: ["Poor at unstructured/nested data without preprocessing", "Limited procedural logic without stored procedures"] },
          medium: { rating: 5, strengths: ["dbt + DuckDB or Snowflake handles GB-scale elegantly", "Declarative transforms are reproducible and auditable", "Incremental models for efficient partial refreshes"], weaknesses: ["Complex business logic becomes hard to maintain in SQL", "Debugging multi-CTE chains is cumbersome"] },
          large: { rating: 5, strengths: ["BigQuery/Snowflake/Redshift are purpose-built for this", "Massively parallel SQL at petabyte scale", "Columnar engines vastly outperform row-based processing"], weaknesses: ["Cost can escalate rapidly with full-scan queries", "Proprietary SQL dialects create lock-in"] },
        },
        ml: {
          small: { rating: 2, strengths: ["BigQuery ML for basic regression/classification in-database"], weaknesses: ["SQL not suited for iterative ML training loops", "Feature engineering is verbose and limited"] },
          medium: { rating: 2, strengths: ["In-database ML (Snowpark ML, BQML) for simple models"], weaknesses: ["Lacks gradient boosting, neural nets, hyperparameter tuning", "Python handoff required for real ML work"] },
          large: { rating: 3, strengths: ["Feature store via SQL is excellent", "BQML can handle logistic regression at scale"], weaknesses: ["Still not a real ML engine for complex models"] },
        },
        staging: {
          small: { rating: 5, strengths: ["dbt is the gold standard for staging layer modeling", "Version-controlled, tested, documented transforms", "Fast iteration"], weaknesses: ["None at this scale"] },
          medium: { rating: 5, strengths: ["Incremental dbt models very efficient", "Materialized views in Snowflake/BigQuery excellent"], weaknesses: [] },
          large: { rating: 5, strengths: ["Native SQL engines handle staging at any scale", "Partitioning + clustering make large tables performant"], weaknesses: ["Warehouse costs must be managed carefully"] },
        },
        eda: {
          small: { rating: 3, strengths: ["DuckDB in Jupyter gives SQL EDA inline", "Fast aggregations and filtering"], weaknesses: ["Less ergonomic than Pandas for ad-hoc exploration", "Statistical functions limited vs Python"] },
          medium: { rating: 4, strengths: ["Warehouse SQL for fast aggregated EDA", "GROUP BY + APPROX_COUNT_DISTINCT at scale"], weaknesses: ["No native distribution plots or correlation matrices"] },
          large: { rating: 4, strengths: ["Only practical EDA method at this scale is SQL aggregation", "Sampling via TABLESAMPLE or RAND()"], weaknesses: ["No interactivity; must export results for visualization"] },
        },
        viz: {
          small: { rating: 2, strengths: ["Can feed query results to BI tools"], weaknesses: ["SQL produces tables, not charts"] },
          medium: { rating: 2, strengths: ["BI tools query SQL layer directly (Looker, Tableau)"], weaknesses: ["SQL is the data layer, not the presentation layer"] },
          large: { rating: 3, strengths: ["Live connections to warehouses enable large-scale BI"], weaknesses: ["Query optimization critical for dashboard performance"] },
        },
      },
      {
        name: "Scala / Java (Spark native)",
        etl: {
          small: { rating: 2, strengths: ["Full Spark API access"], weaknesses: ["Massive overkill; startup overhead alone dwarfs job time", "Slow dev iteration vs Python/SQL"] },
          medium: { rating: 3, strengths: ["Native Spark performance edge over PySpark (~10-20%)", "Better for complex custom UDFs"], weaknesses: ["Slower development cycle", "Smaller talent pool"] },
          large: { rating: 5, strengths: ["Maximum performance for massive ETL pipelines", "No Python serialization overhead", "Native Spark Structured Streaming"], weaknesses: ["Harder to hire for", "Longer development time"] },
        },
        ml: {
          small: { rating: 1, strengths: [], weaknesses: ["No compelling reason to use Scala for ML at this scale"] },
          medium: { rating: 2, strengths: ["MLlib native performance"], weaknesses: ["Python ecosystem is far superior for ML tooling"] },
          large: { rating: 3, strengths: ["Spark MLlib at full performance", "Great for feature pipelines feeding ML"], weaknesses: ["Python (with PySpark) is usually preferred even here"] },
        },
        staging: {
          small: { rating: 1, strengths: [], weaknesses: ["Completely wrong tool for this scale"] },
          medium: { rating: 2, strengths: ["Possible but not recommended"], weaknesses: ["SQL or Python far more practical"] },
          large: { rating: 3, strengths: ["High-throughput staging pipelines"], weaknesses: ["SQL engines typically preferred for staging at scale"] },
        },
        eda: {
          small: { rating: 1, strengths: [], weaknesses: ["Not suited for EDA"] },
          medium: { rating: 2, strengths: ["Zeppelin notebooks possible"], weaknesses: ["Python notebooks are far superior"] },
          large: { rating: 2, strengths: ["Spark-based EDA possible"], weaknesses: ["Python/SQL preferred even at this scale"] },
        },
        viz: { small: { rating: 1, strengths: [], weaknesses: ["Not a viz language"] }, medium: { rating: 1, strengths: [], weaknesses: [] }, large: { rating: 1, strengths: [], weaknesses: [] } },
      },
    ],
  },
  storage: {
    label: "Data Storage",
    options: [
      {
        name: "PostgreSQL / OLTP DB",
        etl: {
          small: { rating: 4, strengths: ["Excellent for structured relational ETL", "Strong ACID guarantees", "Rich indexing for lookup-heavy transforms"], weaknesses: ["Row-oriented; slow for analytical full-table scans"] },
          medium: { rating: 3, strengths: ["Handles GB-scale with proper indexing", "Partitioning helps", "pg_partman, TimescaleDB extend capabilities"], weaknesses: ["Not columnar; analytical queries get slow", "Vacuum/autovacuum overhead at scale"] },
          large: { rating: 2, strengths: ["With Citus extension, horizontal sharding possible"], weaknesses: ["Not designed for 100GB+ analytical workloads", "Cost of proper sizing is high vs cloud warehouses"] },
        },
        ml: {
          small: { rating: 3, strengths: ["pgvector for embedding storage", "Good feature store for structured features"], weaknesses: ["Feature extraction queries can be slow"] },
          medium: { rating: 2, strengths: ["pgvector handles moderate vector workloads"], weaknesses: ["Export to Python required for training; adds latency"] },
          large: { rating: 1, strengths: [], weaknesses: ["Not suitable as ML data source at this scale"] },
        },
        staging: {
          small: { rating: 5, strengths: ["Ideal staging store for dashboard-feeding queries", "Materialized views for pre-aggregation", "Excellent BI tool connector support"], weaknesses: [] },
          medium: { rating: 4, strengths: ["Handles dashboard staging well with good indexing"], weaknesses: ["Analytical query performance degrades without careful tuning"] },
          large: { rating: 2, strengths: [], weaknesses: ["Wrong tool; use a columnar warehouse instead"] },
        },
        eda: {
          small: { rating: 4, strengths: ["SQL EDA is fast and expressive", "DBeaver/DataGrip provide excellent UX"], weaknesses: ["Row-oriented scans slow for wide-open EDA"] },
          medium: { rating: 3, strengths: ["Reasonable for sampled EDA"], weaknesses: ["Full-scan EDA queries are slow"] },
          large: { rating: 1, strengths: [], weaknesses: ["Not practical for EDA at this scale"] },
        },
        viz: {
          small: { rating: 4, strengths: ["Direct connection from Tableau, Looker, Metabase", "Fast for pre-aggregated dashboard queries"], weaknesses: [] },
          medium: { rating: 3, strengths: ["Viable with proper indexing and materialized views"], weaknesses: ["Dashboard query times can be inconsistent"] },
          large: { rating: 1, strengths: [], weaknesses: ["Too slow for live dashboard connections"] },
        },
      },
      {
        name: "Snowflake / BigQuery (Cloud DW)",
        etl: {
          small: { rating: 3, strengths: ["Works fine, cost is low at this scale"], weaknesses: ["Overkill; local DuckDB or Postgres is cheaper and faster to iterate"] },
          medium: { rating: 5, strengths: ["Auto-scaling compute handles GB-scale instantly", "Zero-copy cloning for environment management", "Time travel for rollback", "dbt integrates natively"], weaknesses: ["Cost must be monitored; easy to overspend on compute"] },
          large: { rating: 5, strengths: ["Purpose-built for petabyte-scale analytical ETL", "Columnar compression = massive I/O savings", "Separation of compute/storage enables elastic scaling", "Near-zero maintenance"], weaknesses: ["Vendor lock-in on proprietary SQL extensions", "Data egress costs significant when exporting large datasets"] },
        },
        ml: {
          small: { rating: 3, strengths: ["Snowpark ML / BQML for simple in-warehouse ML"], weaknesses: ["Expensive for ML workloads vs local compute"] },
          medium: { rating: 4, strengths: ["Feature store + export to Python works well", "Snowpark Container Services for in-warehouse Python ML", "BQML for large-scale AutoML"], weaknesses: ["GPU-intensive training still better on dedicated compute"] },
          large: { rating: 4, strengths: ["Massive feature engineering at scale before export", "BQML Vertex AI integration", "Snowflake Cortex for in-warehouse LLMs"], weaknesses: ["Still best to export features for heavy PyTorch/TF training"] },
        },
        staging: {
          small: { rating: 3, strengths: ["Works well, though possibly over-engineered"], weaknesses: ["Cost per query adds up if many small dashboard loads"] },
          medium: { rating: 5, strengths: ["Materialized views, clustering keys, result caching = fast dashboards", "Near-zero admin overhead"], weaknesses: ["Warehouse sizing requires tuning to balance cost/performance"] },
          large: { rating: 5, strengths: ["Industry standard for large-scale dashboard staging", "Automatic query result cache", "Columnar storage = fast aggregations"], weaknesses: ["Full-scan queries must be watched for cost"] },
        },
        eda: {
          small: { rating: 3, strengths: ["Works fine; cost is minimal"], weaknesses: ["Local DuckDB faster for truly ad-hoc EDA"] },
          medium: { rating: 5, strengths: ["Interactive SQL EDA at GB scale in seconds", "Partner notebooks (Hex, Deepnote) connect directly"], weaknesses: ["Costs accrue during long exploratory sessions"] },
          large: { rating: 5, strengths: ["Only practical interactive EDA at this scale", "APPROX_* functions for fast statistical profiles", "Sampling clauses built in"], weaknesses: ["Cost management critical; use small warehouses for EDA"] },
        },
        viz: {
          small: { rating: 3, strengths: ["Direct connection from all major BI tools"], weaknesses: ["Overkill; local DB cheaper"] },
          medium: { rating: 5, strengths: ["Live connections from Looker, Tableau, Power BI, Metabase work excellently", "Result caching makes dashboards snappy"], weaknesses: [] },
          large: { rating: 5, strengths: ["The standard choice for enterprise BI at scale", "Looker's LookML layer sits natively on Snowflake/BQ"], weaknesses: ["Cost discipline required for high-concurrency dashboards"] },
        },
      },
      {
        name: "DuckDB (in-process OLAP)",
        etl: {
          small: { rating: 5, strengths: ["Reads Parquet/CSV/JSON natively — zero infra", "Vectorized columnar execution; faster than Pandas for most ops", "SQL + Python API", "Runs locally or embedded in app"], weaknesses: ["Single-node only; no distribution"] },
          medium: { rating: 4, strengths: ["Handles multi-GB files efficiently via chunked reads", "Columnar push-down on Parquet avoids full reads", "MotherDuck extends to cloud (still single-node feel)"], weaknesses: ["At upper end of GB-range, memory pressure emerges", "Not suitable for concurrent multi-user workloads"] },
          large: { rating: 2, strengths: ["Can query partitioned Parquet lakes with predicate push-down", "MotherDuck for some cloud offload"], weaknesses: ["Single-node architecture breaks down", "Cannot orchestrate distributed compute"] },
        },
        ml: {
          small: { rating: 4, strengths: ["Fast feature extraction before handing to sklearn", "SQL feature engineering is expressive"], weaknesses: ["Not a training engine; Python handoff required"] },
          medium: { rating: 3, strengths: ["Efficient feature pipeline before export"], weaknesses: ["Memory pressure at upper GB range"] },
          large: { rating: 1, strengths: [], weaknesses: ["Not viable at this scale for ML feature pipelines"] },
        },
        staging: {
          small: { rating: 5, strengths: ["Perfect for local or lightweight dashboard staging", "Direct connection from Evidence, Observable, Rill"], weaknesses: [] },
          medium: { rating: 4, strengths: ["Embedded in BI tools like Evidence; handles GB-scale well"], weaknesses: ["Not suitable for multi-user concurrent dashboard access"] },
          large: { rating: 1, strengths: [], weaknesses: ["Single-node can't serve large-scale concurrent dashboards"] },
        },
        eda: {
          small: { rating: 5, strengths: ["Best-in-class for local EDA — fast, zero infra, SQL", "Pairs beautifully with Jupyter via Python API", "Replaces Pandas for most EDA tasks"], weaknesses: [] },
          medium: { rating: 4, strengths: ["Outperforms Pandas on GB-scale aggregations significantly", "Efficient Parquet reads with column pruning"], weaknesses: ["Very large files require careful memory management"] },
          large: { rating: 2, strengths: ["Partitioned Parquet queries possible with push-down"], weaknesses: ["OOM risk without careful query design"] },
        },
        viz: {
          small: { rating: 4, strengths: ["Direct integration with Evidence, Observable Plot, Rill", "Embedded dashboards with DuckDB backend are very fast"], weaknesses: [] },
          medium: { rating: 3, strengths: ["Works for embedded analytics with good query design"], weaknesses: ["Not suitable for concurrent multi-user BI"] },
          large: { rating: 1, strengths: [], weaknesses: ["Not viable for serving large-scale viz workloads"] },
        },
      },
      {
        name: "Apache Spark (distributed)",
        etl: {
          small: { rating: 2, strengths: ["Full API available"], weaknesses: ["Startup time (30-60s) dwarfs job execution time", "Massive operational overhead for small data"] },
          medium: { rating: 4, strengths: ["Begins to show value at multi-GB scale", "Structured Streaming for real-time ETL", "Delta Lake integration for ACID on data lakes"], weaknesses: ["Still heavyweight; DuckDB/Polars often faster for batch GB-scale work"] },
          large: { rating: 5, strengths: ["The gold standard for 100GB+ distributed ETL", "Handles petabyte workloads with horizontal scaling", "Delta Lake / Iceberg for lakehouse ACID guarantees", "Databricks Photon engine for 10x+ acceleration"], weaknesses: ["Operational complexity is significant", "Cluster tuning (partitions, memory) requires expertise"] },
        },
        ml: {
          small: { rating: 2, strengths: [], weaknesses: ["Total overkill; adds complexity with no benefit"] },
          medium: { rating: 3, strengths: ["Spark MLlib for distributed feature pipelines", "Good for distributing sklearn via spark-sklearn"], weaknesses: ["Python ecosystem usually preferred at this scale"] },
          large: { rating: 5, strengths: ["Distributed feature engineering at scale is Spark's sweet spot", "Deep learning via Horovod on Spark", "Seamless integration with MLflow on Databricks"], weaknesses: ["MLlib less capable than sklearn for advanced algorithms", "Debugging distributed ML is hard"] },
        },
        staging: {
          small: { rating: 1, strengths: [], weaknesses: ["Wrong tool entirely"] },
          medium: { rating: 3, strengths: ["Can stage to Delta Lake / warehouse"], weaknesses: ["SQL engines or Python simpler for staging at this scale"] },
          large: { rating: 4, strengths: ["Spark Delta Live Tables for streaming staging pipelines", "Batch staging to warehouse at massive scale"], weaknesses: ["Operational cost and complexity vs managed SQL warehouse"] },
        },
        eda: {
          small: { rating: 1, strengths: [], weaknesses: ["Not suitable for EDA"] },
          medium: { rating: 2, strengths: ["Possible in Databricks notebooks"], weaknesses: ["Python/DuckDB far faster for EDA at this scale"] },
          large: { rating: 3, strengths: ["Databricks notebooks + display() for large-scale EDA", "SparkSQL aggregations at any scale"], weaknesses: ["Slow iteration; each cell can take minutes"] },
        },
        viz: { small: { rating: 1, strengths: [], weaknesses: ["Not a viz tool"] }, medium: { rating: 2, strengths: [], weaknesses: ["Use outputs as feed for viz tools"] }, large: { rating: 3, strengths: ["Feeds downstream BI tools via Delta/warehouse export"], weaknesses: [] } },
      },
    ],
  },
  fileFormat: {
    label: "File Formats",
    options: [
      {
        name: "Parquet",
        etl: {
          small: { rating: 4, strengths: ["Columnar compression → 5-10x smaller than CSV", "Schema enforcement prevents type errors", "Predicate push-down skips irrelevant row groups"], weaknesses: ["Not human-readable; requires tooling to inspect"] },
          medium: { rating: 5, strengths: ["Partition pruning makes scans dramatically faster", "Works natively with DuckDB, Pandas, Spark, BigQuery", "Row group statistics enable query optimization"], weaknesses: ["Small-file problem if not careful with partitioning"] },
          large: { rating: 5, strengths: ["The lakehouse standard at scale", "10-20x compression vs CSV means far less I/O", "Column projection + predicate push-down = only read what you need"], weaknesses: ["File management (compaction, small files) requires maintenance"] },
        },
        ml: {
          small: { rating: 4, strengths: ["Fast feature reads; select only needed columns", "Consistent schema for reproducible training datasets"], weaknesses: [] },
          medium: { rating: 5, strengths: ["PyArrow reads Parquet directly into pandas/numpy efficiently", "Partitioned by date or label for efficient sampling"], weaknesses: [] },
          large: { rating: 5, strengths: ["Standard format for large training dataset storage", "HuggingFace Datasets + Arrow/Parquet at petabyte scale"], weaknesses: ["Very large individual files need streaming reads"] },
        },
        staging: {
          small: { rating: 4, strengths: ["Compact, fast staging layer in data lake"], weaknesses: [] },
          medium: { rating: 5, strengths: ["External tables in Snowflake/BigQuery over Parquet = efficient staging", "Partitioned Parquet as performant BI source via Trino/DuckDB"], weaknesses: [] },
          large: { rating: 5, strengths: ["Lakehouse staging pattern (S3 Parquet → external table) is extremely cost-efficient"], weaknesses: ["Stale metadata if not using Iceberg/Delta catalog"] },
        },
        eda: {
          small: { rating: 4, strengths: ["DuckDB reads Parquet instantly for EDA queries"], weaknesses: ["Can't open in Excel / text editor"] },
          medium: { rating: 5, strengths: ["Column pruning means EDA queries read only relevant columns", "ydata-profiling reads Parquet via pandas"], weaknesses: [] },
          large: { rating: 5, strengths: ["Only viable format for large-scale EDA via DuckDB/Spark/BQ"], weaknesses: ["Requires always having a compute layer"] },
        },
        viz: { small: { rating: 3, strengths: ["Observable Plot, Evidence read Parquet natively"], weaknesses: [] }, medium: { rating: 4, strengths: ["Efficient data feed for viz tools via query layer"], weaknesses: [] }, large: { rating: 4, strengths: [], weaknesses: [] } },
      },
      {
        name: "Delta Lake / Iceberg",
        etl: {
          small: { rating: 2, strengths: [], weaknesses: ["Overkill; Parquet alone is sufficient"] },
          medium: { rating: 4, strengths: ["ACID transactions on data lake files", "Schema evolution support", "Time travel / versioning for auditability"], weaknesses: ["Adds catalog management overhead", "Requires compatible reader (not everything supports it)"] },
          large: { rating: 5, strengths: ["ACID guarantees on petabyte-scale ETL pipelines", "Concurrent write support — multiple jobs safe", "Incremental reads via change data feed", "Z-ordering for optimized query patterns", "Compaction + vacuuming keeps performance high"], weaknesses: ["Catalog (Hive Metastore, AWS Glue, Nessie) adds infra", "Iceberg vs Delta ecosystem fragmentation"] },
        },
        ml: {
          small: { rating: 2, strengths: [], weaknesses: ["Unnecessary complexity"] },
          medium: { rating: 3, strengths: ["Time travel useful for reproducible training snapshots"], weaknesses: [] },
          large: { rating: 5, strengths: ["Versioned feature stores on Delta/Iceberg tables", "Reproducible training datasets via time travel", "Concurrent feature computation is safe"], weaknesses: [] },
        },
        staging: {
          small: { rating: 1, strengths: [], weaknesses: ["Too complex"] },
          medium: { rating: 3, strengths: ["Streaming staging with Delta Live Tables"], weaknesses: ["Managed warehouse tables are simpler for most staging"] },
          large: { rating: 5, strengths: ["Delta Live Tables for CDC-based staging pipelines", "Merge (upsert) at scale with MERGE INTO", "Streaming + batch unified"], weaknesses: ["Operational overhead; best on Databricks or managed catalog"] },
        },
        eda: { small: { rating: 1, strengths: [], weaknesses: [] }, medium: { rating: 3, strengths: ["Time travel lets you EDA past data states"], weaknesses: [] }, large: { rating: 4, strengths: ["Browse snapshots; query optimized layout"], weaknesses: [] } },
        viz: { small: { rating: 1, strengths: [], weaknesses: [] }, medium: { rating: 2, strengths: [], weaknesses: [] }, large: { rating: 4, strengths: ["Databricks SQL / Trino serve Delta/Iceberg directly to BI tools"], weaknesses: [] } },
      },
      {
        name: "CSV / JSON",
        etl: {
          small: { rating: 4, strengths: ["Universal compatibility; works everywhere", "Human-readable and debuggable", "No tooling required to inspect"], weaknesses: ["No schema enforcement; type errors common", "2-10x larger than Parquet", "JSON parsing is CPU-intensive"] },
          medium: { rating: 2, strengths: ["Still readable; good for interchange formats"], weaknesses: ["Terrible performance at GB scale", "Scan-all-rows required; no predicate push-down", "5-10x slower to read than Parquet"] },
          large: { rating: 1, strengths: ["Only valid use: source system output format you don't control"], weaknesses: ["Convert to Parquet immediately", "Prohibitively slow to process directly", "Storage costs are extreme vs columnar formats"] },
        },
        ml: {
          small: { rating: 3, strengths: ["Easy to share and inspect training data"], weaknesses: ["Slower reads than Parquet"] },
          medium: { rating: 2, strengths: [], weaknesses: ["Much slower than Parquet for feature reads"] },
          large: { rating: 1, strengths: [], weaknesses: ["Never use CSV/JSON as training data format at this scale"] },
        },
        staging: {
          small: { rating: 3, strengths: ["Simple staging for small report files"], weaknesses: [] },
          medium: { rating: 1, strengths: [], weaknesses: ["Too slow for reliable staging"] },
          large: { rating: 1, strengths: [], weaknesses: ["Not appropriate"] },
        },
        eda: {
          small: { rating: 5, strengths: ["Open in Excel, VS Code, or any tool instantly", "Great for quick inspection without infrastructure"], weaknesses: [] },
          medium: { rating: 2, strengths: [], weaknesses: ["Very slow EDA; convert first"] },
          large: { rating: 1, strengths: [], weaknesses: ["Impractical"] },
        },
        viz: { small: { rating: 4, strengths: ["D3.js, Observable, Vega-Lite all read JSON/CSV natively"], weaknesses: [] }, medium: { rating: 2, strengths: [], weaknesses: ["Browser can't handle GB-scale JSON"] }, large: { rating: 1, strengths: [], weaknesses: [] } },
      },
    ],
  },
  compute: {
    label: "Cloud Compute / Storage",
    options: [
      {
        name: "AWS (S3 + EMR + SageMaker)",
        etl: {
          small: { rating: 3, strengths: ["S3 as cheap, durable object store", "Lambda for event-driven micro-ETL", "Glue for serverless Spark jobs"], weaknesses: ["Over-engineered for small data; local or RDS is simpler"] },
          medium: { rating: 4, strengths: ["EMR Serverless for on-demand Spark", "Glue with auto-scaling workers", "S3 + Athena for serverless SQL ETL"], weaknesses: ["AWS complexity is real; IAM, VPC, networking overhead"] },
          large: { rating: 5, strengths: ["EMR + Spark at any scale", "S3 as infinite cheap storage layer", "AWS Glue Data Catalog + Iceberg integration", "Step Functions for ETL orchestration"], weaknesses: ["Complex pricing model; data transfer costs bite", "Operational expertise requirement is high"] },
        },
        ml: {
          small: { rating: 3, strengths: ["SageMaker Studio for managed notebooks"], weaknesses: ["Expensive for what you get at small scale; local Jupyter is simpler"] },
          medium: { rating: 5, strengths: ["SageMaker Training Jobs with GPU instances", "Managed MLflow on SageMaker", "Feature Store integration", "Autopilot for AutoML"], weaknesses: ["SageMaker SDK has steep learning curve", "Cost of GPU instances adds up fast"] },
          large: { rating: 5, strengths: ["SageMaker distributed training (data + model parallelism)", "Spot instance training at 70% savings", "SageMaker Pipelines for ML lifecycle", "Bedrock for LLM integration"], weaknesses: ["Vendor complexity; many overlapping services cause confusion"] },
        },
        staging: {
          small: { rating: 3, strengths: ["RDS + Redshift Serverless for staging"], weaknesses: ["Overkill cost vs local options"] },
          medium: { rating: 4, strengths: ["Redshift for warehouse staging", "S3 + Athena for cheap external table staging"], weaknesses: ["Redshift concurrency limits require management"] },
          large: { rating: 5, strengths: ["Redshift RA3 (compute/storage separation)", "S3 Iceberg tables as staging source for Athena", "ElastiCache for dashboard caching layer"], weaknesses: ["Redshift vs Snowflake/BQ is competitive; often lose on developer experience"] },
        },
        eda: {
          small: { rating: 3, strengths: ["SageMaker Studio notebooks for cloud EDA"], weaknesses: ["Local environment faster for iterative EDA"] },
          medium: { rating: 4, strengths: ["Athena for serverless SQL EDA over S3 data", "SageMaker + data wrangler for visual EDA"], weaknesses: ["Athena query results need manual download for further Python analysis"] },
          large: { rating: 5, strengths: ["Athena + S3 partitioned Parquet = serverless EDA at any scale", "EMR Notebooks for Spark-based EDA"], weaknesses: ["Slower iteration than Snowflake/BQ interactive console"] },
        },
        viz: { small: { rating: 2, strengths: [], weaknesses: ["AWS doesn't have a strong native BI product (QuickSight is limited)"] }, medium: { rating: 3, strengths: ["QuickSight SPICE for fast dashboards", "Connects to Athena, Redshift"], weaknesses: ["QuickSight is significantly behind Tableau/Looker in capability"] }, large: { rating: 4, strengths: ["Redshift/Athena as backend for any major BI tool"], weaknesses: [] } },
      },
      {
        name: "GCP (BigQuery + Vertex AI)",
        etl: {
          small: { rating: 3, strengths: ["BigQuery on small data is instant", "Dataflow (Apache Beam) for streaming"], weaknesses: ["Per-query pricing on BQ can sting during iteration"] },
          medium: { rating: 5, strengths: ["BigQuery is extremely fast at GB scale", "Flat-rate or on-demand pricing", "Dataflow for managed Beam pipelines", "dbt on BigQuery is a top-tier combination"], weaknesses: ["Dataflow (Beam) has a steep learning curve vs Spark"] },
          large: { rating: 5, strengths: ["BigQuery's serverless architecture auto-scales to petabytes", "BigLake for unified storage+compute", "Dataproc (managed Spark/Hadoop) for custom ETL", "No infra management — just SQL"], weaknesses: ["Data egress costs are real", "Storage + compute costs require governance"] },
        },
        ml: {
          small: { rating: 4, strengths: ["Vertex AI Workbench for managed notebooks", "Colab Enterprise for collaborative EDA/ML"], weaknesses: ["Google's ML tooling has changed names many times; documentation can be confusing"] },
          medium: { rating: 5, strengths: ["Vertex AI Training with GPU/TPU", "AutoML for rapid baseline models", "BigQuery ML for in-warehouse ML", "Feature Store managed service"], weaknesses: ["TPUs require TensorFlow/JAX; PyTorch support improving but secondary"] },
          large: { rating: 5, strengths: ["Best TPU access for large-scale deep learning", "Vertex AI Pipelines (Kubeflow-based)", "BigQuery ML at petabyte feature scale", "PaLM / Gemini API integration"], weaknesses: ["TPU ecosystem requires JAX expertise for max performance"] },
        },
        staging: {
          small: { rating: 3, strengths: ["BigQuery works fine; costs are minimal"], weaknesses: [] },
          medium: { rating: 5, strengths: ["BigQuery materialized views + scheduled queries = excellent staging", "Looker Studio connects natively"], weaknesses: [] },
          large: { rating: 5, strengths: ["BigQuery is the best cloud warehouse for staging at massive scale", "Partitioning + clustering = highly efficient dashboard queries", "Result caching for repeated queries"], weaknesses: ["Slot reservation required for predictable cost at high concurrency"] },
        },
        eda: {
          small: { rating: 4, strengths: ["BigQuery console is excellent for interactive EDA", "Colab + BigQuery API integration is seamless"], weaknesses: [] },
          medium: { rating: 5, strengths: ["BigQuery interactive SQL EDA is best-in-class speed", "Vertex AI Workbench for Python EDA against BQ data"], weaknesses: [] },
          large: { rating: 5, strengths: ["BigQuery scales EDA to petabytes transparently", "APPROX functions, TABLESAMPLE for large-scale stats"], weaknesses: ["Cost management required during intensive EDA sessions"] },
        },
        viz: { small: { rating: 4, strengths: ["Looker Studio (free) connects directly to BigQuery", "Excellent Tableau/Power BI connector"], weaknesses: [] }, medium: { rating: 5, strengths: ["Looker (Looker + BigQuery is Google's native stack) is excellent", "Direct BigQuery connection from all major BI tools"], weaknesses: [] }, large: { rating: 5, strengths: ["Best-in-class BI at scale via Looker native integration"], weaknesses: [] } },
      },
      {
        name: "Azure (ADLS + Synapse + ML)",
        etl: {
          small: { rating: 3, strengths: ["Azure Data Factory for ETL pipelines", "Works well in Microsoft-heavy orgs"], weaknesses: ["ADF UI is clunky; harder to version-control than code-first tools"] },
          medium: { rating: 4, strengths: ["Synapse Analytics integrates Spark + SQL", "ADF for orchestrated ETL", "Delta Lake on ADLS Gen2"], weaknesses: ["Synapse is complex; Databricks on Azure is often preferred"] },
          large: { rating: 4, strengths: ["Azure Databricks is the best Azure ETL story at scale", "Synapse Spark pools for large-scale work", "ADLS Gen2 as cost-effective object store"], weaknesses: ["Azure Databricks is essentially Databricks on Azure; not unique to Azure", "Fabric is new and still maturing"] },
        },
        ml: {
          small: { rating: 3, strengths: ["Azure ML Studio for managed experiments"], weaknesses: ["Heavier UI than Vertex or SageMaker for simple use cases"] },
          medium: { rating: 4, strengths: ["Azure ML with GPU compute clusters", "MLflow integration", "Automated ML (AutoML)"], weaknesses: ["Best for Microsoft shops; tooling less intuitive than GCP/AWS equivalents"] },
          large: { rating: 4, strengths: ["Large GPU cluster support", "Azure OpenAI integration for LLMs", "Fabric + ML integration roadmap"], weaknesses: ["Less ML innovation velocity than GCP (TPUs) or AWS (Trainium/Inferentia)"] },
        },
        staging: {
          small: { rating: 3, strengths: ["SQL Database or Synapse for staging"], weaknesses: [] },
          medium: { rating: 4, strengths: ["Synapse dedicated SQL pool for staging", "Power BI Direct Lake on Fabric"], weaknesses: [] },
          large: { rating: 4, strengths: ["Fabric OneLake + Direct Lake eliminates data copy for Power BI", "Synapse + Delta Lake at scale"], weaknesses: ["Fabric is still maturing; production readiness varies by feature"] },
        },
        eda: { small: { rating: 3, strengths: ["Azure ML Notebooks", "Synapse Notebooks"], weaknesses: [] }, medium: { rating: 3, strengths: [], weaknesses: ["Slower iteration than BQ or Snowflake console"] }, large: { rating: 3, strengths: ["Synapse SQL on-demand for serverless large-scale EDA"], weaknesses: ["More complex than BigQuery for pure EDA"] } },
        viz: { small: { rating: 4, strengths: ["Power BI is the strongest native BI product of the big three", "Tight integration across entire Microsoft stack"], weaknesses: [] }, medium: { rating: 5, strengths: ["Power BI + Azure Synapse / Fabric is best-in-class for Microsoft orgs", "Direct Lake mode eliminates data movement"], weaknesses: [] }, large: { rating: 4, strengths: ["Power BI Premium for large-scale enterprise BI"], weaknesses: ["Power BI Premium is expensive at enterprise scale"] } },
      },
      {
        name: "Databricks (cloud-agnostic)",
        etl: {
          small: { rating: 2, strengths: [], weaknesses: ["Very expensive for small data", "30s+ cluster startup makes iteration painful"] },
          medium: { rating: 5, strengths: ["Delta Live Tables for declarative ETL pipelines", "Serverless compute with fast startup", "Auto Loader for incremental file ingestion", "Best-in-class Spark UX"], weaknesses: ["Cost is higher than alternatives for GB-scale (not using full cluster value)"] },
          large: { rating: 5, strengths: ["The gold standard for large-scale ETL", "Photon engine: 10-50x faster than OSS Spark on some workloads", "Unity Catalog for governance", "Streaming + batch unified in DLT", "Multi-cloud (AWS, Azure, GCP)"], weaknesses: ["Premium pricing; significantly more expensive than DIY Spark", "Vendor dependency"] },
        },
        ml: {
          small: { rating: 2, strengths: [], weaknesses: ["Too expensive; use local Jupyter"] },
          medium: { rating: 5, strengths: ["MLflow invented at Databricks; deepest integration", "Feature Store managed service", "AutoML for baseline models", "Model serving with Mosaic AI"], weaknesses: ["Cost of GPU clusters during active training"] },
          large: { rating: 5, strengths: ["Best large-scale ML platform: distributed training + feature store + serving", "Mosaic AI (MosaicML acquisition) for LLM fine-tuning", "Unity Catalog for ML governance", "DBRX open-source LLM", "Tight Delta Lake + ML pipeline integration"], weaknesses: ["Premium cost tier; requires budget commitment"] },
        },
        staging: {
          small: { rating: 1, strengths: [], weaknesses: ["Not cost-effective"] },
          medium: { rating: 3, strengths: ["DLT can stage to Delta tables", "Databricks SQL for serving"], weaknesses: ["Databricks SQL warehouse cost for concurrent dashboards can be high"] },
          large: { rating: 5, strengths: ["Databricks SQL Serverless for warehouse staging", "Delta tables with optimized layout for fast BI queries", "Unity Catalog for access control on staging tables"], weaknesses: ["Cost for high-concurrency dashboard serving requires Pro/Serverless SQL tier"] },
        },
        eda: {
          small: { rating: 2, strengths: [], weaknesses: ["Not worth the cluster cost"] },
          medium: { rating: 4, strengths: ["Excellent notebook UX", "AI Assistant for code generation in notebooks", "Seamless BambooLab / Hex integration"], weaknesses: ["Cluster startup latency for interactive EDA"] },
          large: { rating: 5, strengths: ["Notebooks + SparkSQL for large-scale EDA", "display() function for instant inline viz", "AI-assisted EDA with Databricks Assistant"], weaknesses: [] },
        },
        viz: { small: { rating: 1, strengths: [], weaknesses: [] }, medium: { rating: 3, strengths: ["Databricks SQL dashboards built-in (basic)", "Connects to Tableau, Power BI, Looker"], weaknesses: ["Native dashboarding is limited; use external BI tool"] }, large: { rating: 4, strengths: ["Databricks SQL as backend for Tableau/Looker/Power BI at scale", "Lakeview dashboards improving rapidly"], weaknesses: [] } },
      },
    ],
  },
  calcEngine: {
    label: "Calculation Engine",
    options: [
      {
        name: "Pandas / Polars",
        etl: {
          small: { rating: 5, strengths: ["Pandas: most expressive DataFrame API; huge ecosystem", "Polars: 5-50x faster than Pandas on same hardware", "Both handle complex transformations elegantly in Python"], weaknesses: ["Pandas: memory-inefficient (object dtype, copies)", "Polars: smaller ecosystem, some learning curve from Pandas"] },
          medium: { rating: 3, strengths: ["Polars: lazy evaluation + streaming can handle multi-GB", "Chunked reads avoid full memory load"], weaknesses: ["Pandas: OOM at 5-10GB on 16GB RAM machine is common", "Single-threaded (Pandas); limited by RAM"] },
          large: { rating: 1, strengths: ["Polars with streaming can process larger-than-memory datasets in chunks"], weaknesses: ["Both are fundamentally single-node; cannot distribute across machines", "Polars streaming is not full distributed compute"] },
        },
        ml: {
          small: { rating: 5, strengths: ["Polars/Pandas → numpy/sklearn pipeline is seamless", "Fast feature engineering interactively"], weaknesses: [] },
          medium: { rating: 4, strengths: ["Polars is fast enough for GB-scale feature engineering", "Lazy evaluation reduces memory pressure"], weaknesses: ["RAM limits still apply"] },
          large: { rating: 1, strengths: [], weaknesses: ["Cannot handle 100GB+ in-memory feature engineering"] },
        },
        staging: {
          small: { rating: 4, strengths: ["Fast, expressive transform before staging write"], weaknesses: [] },
          medium: { rating: 3, strengths: ["Polars for efficient pre-write transformations"], weaknesses: [] },
          large: { rating: 1, strengths: [], weaknesses: ["Not suitable"] },
        },
        eda: {
          small: { rating: 5, strengths: ["Pandas: richest EDA API (.describe(), .value_counts(), .corr())", "Integrates with every Python viz library", "Polars: fast profiling with less memory"], weaknesses: [] },
          medium: { rating: 4, strengths: ["Polars lazy EDA is much faster than Pandas at GB scale"], weaknesses: ["Pandas .read_csv() on 5GB file is often OOM"] },
          large: { rating: 1, strengths: [], weaknesses: ["Not viable for raw data EDA"] },
        },
        viz: { small: { rating: 5, strengths: ["Direct pipeline into Matplotlib, Plotly, Altair, Seaborn"], weaknesses: [] }, medium: { rating: 3, strengths: ["Pre-aggregate with Polars then plot"], weaknesses: [] }, large: { rating: 1, strengths: [], weaknesses: [] } },
      },
      {
        name: "DuckDB (query engine)",
        etl: {
          small: { rating: 5, strengths: ["Often faster than Pandas/Polars for SQL-expressible transforms", "No server required; embedded in Python/R/Node", "Reads Parquet, CSV, JSON directly", "Pushes predicates into Parquet files"], weaknesses: ["Complex custom logic harder than Python/Pandas"] },
          medium: { rating: 5, strengths: ["Handles multi-GB files efficiently with chunked processing", "Vectorized columnar execution is very fast", "Parallel query execution uses all CPU cores"], weaknesses: ["Single-node; won't scale beyond available RAM+disk eventually"] },
          large: { rating: 3, strengths: ["Can spill to disk for larger-than-RAM queries", "Partitioned Parquet predicate push-down reduces actual data read"], weaknesses: ["Single-node architecture is the ceiling", "MotherDuck extends somewhat but not true distributed compute"] },
        },
        ml: {
          small: { rating: 4, strengths: ["Fastest feature extraction pipeline into Python", "SQL feature engineering is concise"], weaknesses: [] },
          medium: { rating: 4, strengths: ["Efficient feature store reads with column pruning"], weaknesses: [] },
          large: { rating: 2, strengths: [], weaknesses: ["Single-node limits"] },
        },
        staging: {
          small: { rating: 5, strengths: ["Embedded in Evidence, Rill; zero-infra dashboard staging"], weaknesses: [] },
          medium: { rating: 4, strengths: ["Serverless staging for moderate-scale dashboards"], weaknesses: [] },
          large: { rating: 2, strengths: [], weaknesses: ["Cannot serve high-concurrency dashboards at this scale"] },
        },
        eda: {
          small: { rating: 5, strengths: ["Best local EDA tool: fast SQL, zero infra, Jupyter integration"], weaknesses: [] },
          medium: { rating: 5, strengths: ["Beats Pandas for almost all GB-scale EDA patterns", "Multi-core parallel aggregations"], weaknesses: [] },
          large: { rating: 3, strengths: ["Can EDA partitioned Parquet lakes with push-down", "Much faster than Pandas/Polars for SQL queries at this scale"], weaknesses: ["OOM risk on wide aggregations across 100GB+"] },
        },
        viz: { small: { rating: 4, strengths: ["Native integration with Observable Plot, Evidence, Rill for embedded analytics"], weaknesses: [] }, medium: { rating: 4, strengths: [], weaknesses: [] }, large: { rating: 2, strengths: [], weaknesses: [] } },
      },
      {
        name: "Apache Spark (PySpark)",
        etl: {
          small: { rating: 1, strengths: [], weaknesses: ["30-60s startup overhead for any job", "Much slower than DuckDB/Polars for small data"] },
          medium: { rating: 4, strengths: ["True parallelism across all cores", "Lazy evaluation + query optimization", "Handles multi-GB easily"], weaknesses: ["Overhead vs DuckDB/Polars is high for purely local use"] },
          large: { rating: 5, strengths: ["The only open-source engine that can distribute across clusters", "Horizontal scaling to petabytes", "Structured Streaming for continuous ETL", "Catalyst optimizer for complex query planning"], weaknesses: ["Cluster management; tuning partitions, shuffle, memory"] },
        },
        ml: {
          small: { rating: 1, strengths: [], weaknesses: ["Wrong tool"] },
          medium: { rating: 3, strengths: ["Distributing sklearn via spark-sklearn", "MLlib for simple distributed models"], weaknesses: ["Python-native sklearn often faster locally at this scale"] },
          large: { rating: 5, strengths: ["Distributed feature engineering is Spark's killer ML use case", "Horovod for distributed deep learning on Spark", "Integration with MLflow, Delta for ML pipelines"], weaknesses: ["MLlib algorithm selection is narrower than sklearn"] },
        },
        staging: {
          small: { rating: 1, strengths: [], weaknesses: [] },
          medium: { rating: 3, strengths: [], weaknesses: [] },
          large: { rating: 4, strengths: ["High-throughput batch staging to Delta/warehouse"], weaknesses: [] },
        },
        eda: {
          small: { rating: 1, strengths: [], weaknesses: [] },
          medium: { rating: 2, strengths: [], weaknesses: ["Pandas/DuckDB faster for EDA at this scale"] },
          large: { rating: 3, strengths: ["SparkSQL aggregations for large-scale EDA", "Databricks display() for inline viz"], weaknesses: ["Slow iteration; not truly interactive"] },
        },
        viz: { small: { rating: 1, strengths: [], weaknesses: [] }, medium: { rating: 1, strengths: [], weaknesses: [] }, large: { rating: 2, strengths: ["Feeds BI tools via Delta/warehouse"], weaknesses: [] } },
      },
      {
        name: "BigQuery / Snowflake SQL Engine",
        etl: {
          small: { rating: 3, strengths: ["Zero infra; works instantly"], weaknesses: ["Per-query cost during rapid iteration", "Slower feedback loop than local engines"] },
          medium: { rating: 5, strengths: ["Massively parallel SQL execution", "Sub-second aggregations on GB-scale data", "Result caching for repeated queries"], weaknesses: ["SQL has limits for complex procedural logic"] },
          large: { rating: 5, strengths: ["True serverless horizontal scaling to petabytes", "Columnar compression + predicate push-down minimize I/O", "Concurrent query isolation — no resource contention", "Cost-per-byte scanned model incentivizes good schema design"], weaknesses: ["Full-table scans on unpartitioned large tables are expensive", "Complex window functions with large frames can be slow + costly"] },
        },
        ml: {
          small: { rating: 2, strengths: ["BQML for simple regression/classification in-database"], weaknesses: [] },
          medium: { rating: 3, strengths: ["BQML AutoML; Snowpark ML for in-warehouse Python", "Feature engineering at scale is a strength"], weaknesses: ["Serious ML work still needs Python + PyTorch/sklearn export"] },
          large: { rating: 4, strengths: ["Feature store at petabyte scale via SQL", "BQML + Vertex AI integration for full ML lifecycle in GCP", "Snowflake Cortex ML functions for in-warehouse inference"], weaknesses: ["GPU training must happen outside the warehouse"] },
        },
        staging: {
          small: { rating: 3, strengths: [], weaknesses: [] },
          medium: { rating: 5, strengths: ["Purpose-built for analytical staging workloads", "Result cache makes identical dashboard queries free"], weaknesses: [] },
          large: { rating: 5, strengths: ["The ideal staging engine for large-scale BI", "Partition pruning + clustering = fast dashboard queries at any scale"], weaknesses: [] },
        },
        eda: {
          small: { rating: 3, strengths: [], weaknesses: ["Local DuckDB faster and cheaper for iterative EDA"] },
          medium: { rating: 5, strengths: ["Sub-second interactive SQL EDA on GB data", "Rich console with inline results"], weaknesses: [] },
          large: { rating: 5, strengths: ["Only practical interactive EDA engine at 100GB+ scale", "APPROX_QUANTILES, APPROX_COUNT_DISTINCT for fast stats", "TABLESAMPLE for rapid sampling-based EDA"], weaknesses: ["Costs accrue fast during intensive EDA sessions"] },
        },
        viz: { small: { rating: 3, strengths: [], weaknesses: [] }, medium: { rating: 5, strengths: ["Live connection from Tableau, Looker, Metabase, Power BI — all excellent"], weaknesses: [] }, large: { rating: 5, strengths: ["Gold standard backend for enterprise BI at scale"], weaknesses: [] } },
      },
    ],
  },
};

const RATING_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];
const RATING_LABELS = ["Poor", "Fair", "Good", "Strong", "Excellent"];

function RatingBar({ rating }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <div style={{ display: "flex", gap: "3px" }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              width: "16px",
              height: "8px",
              borderRadius: "2px",
              background: i <= rating ? RATING_COLORS[rating - 1] : "#1e293b",
              transition: "background 0.2s",
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: "11px", color: RATING_COLORS[rating - 1], fontWeight: 600, minWidth: "60px", fontFamily: "monospace" }}>
        {RATING_LABELS[rating - 1]}
      </span>
    </div>
  );
}

function ScaleBadge({ scale, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 14px",
        borderRadius: "20px",
        border: "1px solid",
        borderColor: active ? "#38bdf8" : "#334155",
        background: active ? "rgba(56,189,248,0.15)" : "transparent",
        color: active ? "#38bdf8" : "#64748b",
        cursor: "pointer",
        fontSize: "12px",
        fontFamily: "'IBM Plex Mono', monospace",
        fontWeight: active ? 700 : 400,
        transition: "all 0.2s",
        whiteSpace: "nowrap",
      }}
    >
      {scale}
    </button>
  );
}

export default function App() {
  const [activeScale, setActiveScale] = useState(0);
  const [activeCategory, setActiveCategory] = useState("etl");
  const [expandedOption, setExpandedOption] = useState(null);
  const [activeStackSection, setActiveStackSection] = useState("language");

  const scaleKey = SCALE_KEYS[activeScale];
  const section = STACK[activeStackSection];
  const category = activeCategory;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#020817",
      color: "#e2e8f0",
      fontFamily: "'IBM Plex Sans', sans-serif",
      padding: "0",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=IBM+Plex+Sans:wght@300;400;500;600&family=Bebas+Neue&display=swap');
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        .option-card:hover { border-color: #38bdf8 !important; }
        .nav-btn:hover { background: rgba(56,189,248,0.08) !important; }
        .stack-tab:hover { color: #94a3b8 !important; }
      `}</style>

      {/* Header */}
      <div style={{
        borderBottom: "1px solid #0f2037",
        padding: "28px 40px 20px",
        background: "linear-gradient(180deg, #020c1b 0%, #020817 100%)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "36px", letterSpacing: "3px", color: "#f8fafc", lineHeight: 1 }}>
                DATA STACK DECISION MATRIX
              </div>
              <div style={{ fontSize: "12px", color: "#475569", fontFamily: "monospace", marginTop: "6px", letterSpacing: "1px" }}>
                STRENGTHS · WEAKNESSES · SCALE ANALYSIS
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "11px", color: "#475569", fontFamily: "monospace", marginRight: "4px" }}>DATA SIZE:</span>
              {DATA_SCALES.map((s, i) => (
                <ScaleBadge key={s} scale={s} active={activeScale === i} onClick={() => setActiveScale(i)} />
              ))}
            </div>
          </div>

          {/* Category selector */}
          <div style={{ display: "flex", gap: "8px", marginTop: "20px", flexWrap: "wrap" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className="nav-btn"
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: "7px 14px",
                  borderRadius: "6px",
                  border: "1px solid",
                  borderColor: activeCategory === cat.id ? "#38bdf8" : "#1e293b",
                  background: activeCategory === cat.id ? "rgba(56,189,248,0.12)" : "transparent",
                  color: activeCategory === cat.id ? "#e2e8f0" : "#64748b",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: activeCategory === cat.id ? 600 : 400,
                  transition: "all 0.15s",
                  display: "flex", alignItems: "center", gap: "6px",
                }}
              >
                <span style={{ opacity: 0.7, fontFamily: "monospace" }}>{cat.icon}</span>
                <span>{cat.label}</span>
                <span style={{
                  background: activeCategory === cat.id ? "#38bdf8" : "#1e293b",
                  color: activeCategory === cat.id ? "#020817" : "#475569",
                  fontSize: "10px",
                  fontFamily: "monospace",
                  padding: "1px 5px",
                  borderRadius: "3px",
                  fontWeight: 700,
                }}>P{cat.priority}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 40px" }}>
        {/* Stack section tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #1e293b", marginBottom: "28px" }}>
          {Object.entries(STACK).map(([key, sec]) => (
            <button
              key={key}
              className="stack-tab"
              onClick={() => { setActiveStackSection(key); setExpandedOption(null); }}
              style={{
                padding: "10px 20px",
                background: "transparent",
                border: "none",
                borderBottom: "2px solid",
                borderColor: activeStackSection === key ? "#38bdf8" : "transparent",
                color: activeStackSection === key ? "#38bdf8" : "#475569",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: activeStackSection === key ? 600 : 400,
                transition: "all 0.15s",
                marginBottom: "-1px",
              }}
            >
              {sec.label}
            </button>
          ))}
        </div>

        {/* Options grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {section.options.map((opt) => {
            const catData = opt[category]?.[scaleKey];
            if (!catData) return null;
            const isExpanded = expandedOption === opt.name;
            return (
              <div
                key={opt.name}
                className="option-card"
                onClick={() => setExpandedOption(isExpanded ? null : opt.name)}
                style={{
                  background: "#0a1628",
                  border: "1px solid",
                  borderColor: isExpanded ? "#38bdf8" : "#1e293b",
                  borderRadius: "12px",
                  padding: "20px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  gridColumn: isExpanded ? "1 / -1" : undefined,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: "#f1f5f9", marginBottom: "4px" }}>{opt.name}</div>
                    <RatingBar rating={catData.rating} />
                  </div>
                  <div style={{
                    fontSize: "11px",
                    color: "#475569",
                    fontFamily: "monospace",
                    background: "#0f172a",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    transform: isExpanded ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s",
                    marginLeft: "10px",
                  }}>▾</div>
                </div>

                {!isExpanded && catData.strengths.length > 0 && (
                  <div style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.5" }}>
                    {catData.strengths[0]}
                    {catData.strengths.length > 1 && <span style={{ color: "#334155" }}> +{catData.strengths.length - 1} more</span>}
                  </div>
                )}

                {isExpanded && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #1e293b" }}>
                    {SCALE_KEYS.map((sk, si) => {
                      const d = opt[category]?.[sk];
                      if (!d) return null;
                      return (
                        <div key={sk} style={{
                          background: sk === scaleKey ? "rgba(56,189,248,0.05)" : "transparent",
                          border: "1px solid",
                          borderColor: sk === scaleKey ? "rgba(56,189,248,0.2)" : "#1e293b",
                          borderRadius: "8px",
                          padding: "14px",
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                            <span style={{ fontSize: "11px", color: "#475569", fontFamily: "monospace" }}>{DATA_SCALES[si]}</span>
                            <RatingBar rating={d.rating} />
                          </div>
                          {d.strengths.length > 0 && (
                            <div style={{ marginBottom: "10px" }}>
                              <div style={{ fontSize: "10px", color: "#22c55e", fontFamily: "monospace", letterSpacing: "1px", marginBottom: "6px" }}>STRENGTHS</div>
                              {d.strengths.map((s, i) => (
                                <div key={i} style={{ display: "flex", gap: "6px", fontSize: "12px", color: "#94a3b8", lineHeight: "1.5", marginBottom: "4px" }}>
                                  <span style={{ color: "#22c55e", flexShrink: 0, marginTop: "2px" }}>+</span>
                                  <span>{s}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {d.weaknesses.length > 0 && (
                            <div>
                              <div style={{ fontSize: "10px", color: "#ef4444", fontFamily: "monospace", letterSpacing: "1px", marginBottom: "6px" }}>WEAKNESSES</div>
                              {d.weaknesses.map((w, i) => (
                                <div key={i} style={{ display: "flex", gap: "6px", fontSize: "12px", color: "#94a3b8", lineHeight: "1.5", marginBottom: "4px" }}>
                                  <span style={{ color: "#ef4444", flexShrink: 0, marginTop: "2px" }}>−</span>
                                  <span>{w}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Recommendation summary */}
        <div style={{ marginTop: "40px", background: "#0a1628", border: "1px solid #1e293b", borderRadius: "12px", padding: "28px" }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "20px", letterSpacing: "2px", color: "#38bdf8", marginBottom: "20px" }}>
            RECOMMENDED STACK BY DATA SCALE
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px" }}>
            {[
              {
                scale: "< 100 MB",
                label: "Local / Lightweight",
                color: "#22c55e",
                stack: [
                  { role: "Language", rec: "Python" },
                  { role: "Engine", rec: "DuckDB + Pandas/Polars" },
                  { role: "Storage", rec: "Parquet files + PostgreSQL" },
                  { role: "Format", rec: "Parquet / CSV" },
                  { role: "Cloud", rec: "Optional: any provider" },
                  { role: "ML", rec: "scikit-learn + XGBoost" },
                  { role: "Viz", rec: "Plotly / Streamlit" },
                ],
                note: "Everything runs locally. DuckDB replaces most Pandas needs. CSV/Parquet on disk is sufficient. Avoid cloud warehouse costs.",
              },
              {
                scale: "> 1 GB",
                label: "Mid-Scale / Cloud-Ready",
                color: "#f59e0b",
                stack: [
                  { role: "Language", rec: "Python + SQL (dbt)" },
                  { role: "Engine", rec: "DuckDB / Polars + Cloud DW" },
                  { role: "Storage", rec: "Snowflake or BigQuery" },
                  { role: "Format", rec: "Parquet on S3/GCS" },
                  { role: "Cloud", rec: "GCP (BigQuery) or AWS" },
                  { role: "ML", rec: "PyTorch/sklearn + Vertex AI" },
                  { role: "Viz", rec: "Looker / Tableau → BQ/Snowflake" },
                ],
                note: "Cloud warehouse becomes essential. dbt for transformation layer. Python for ML. Start evaluating Databricks if pipelines are complex.",
              },
              {
                scale: "> 100 GB",
                label: "Enterprise / Distributed",
                color: "#ef4444",
                stack: [
                  { role: "Language", rec: "Python + SQL + PySpark" },
                  { role: "Engine", rec: "Spark (Databricks Photon) + BQ" },
                  { role: "Storage", rec: "Delta Lake / Iceberg on S3/GCS" },
                  { role: "Format", rec: "Parquet (Delta/Iceberg layer)" },
                  { role: "Cloud", rec: "Databricks (any cloud) or GCP" },
                  { role: "ML", rec: "Databricks MLflow + Vertex AI / SageMaker" },
                  { role: "Viz", rec: "Looker + BigQuery / Databricks SQL" },
                ],
                note: "Distributed compute is mandatory. Delta/Iceberg for ACID at scale. SQL warehouse (BQ/Snowflake) for dashboard serving. Databricks for unified ETL+ML.",
              },
            ].map((rec) => (
              <div key={rec.scale} style={{ borderLeft: `3px solid ${rec.color}`, paddingLeft: "16px" }}>
                <div style={{ fontSize: "11px", fontFamily: "monospace", color: rec.color, letterSpacing: "1px", marginBottom: "2px" }}>{rec.scale}</div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#f1f5f9", marginBottom: "12px" }}>{rec.label}</div>
                {rec.stack.map((s) => (
                  <div key={s.role} style={{ display: "flex", gap: "8px", fontSize: "12px", marginBottom: "5px" }}>
                    <span style={{ color: "#475569", minWidth: "70px", fontFamily: "monospace", fontSize: "11px", paddingTop: "1px" }}>{s.role}</span>
                    <span style={{ color: "#cbd5e1" }}>{s.rec}</span>
                  </div>
                ))}
                <div style={{ marginTop: "12px", fontSize: "11px", color: "#64748b", lineHeight: "1.6", borderTop: "1px solid #1e293b", paddingTop: "10px" }}>
                  {rec.note}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
