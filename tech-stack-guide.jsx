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
          small: { rating: 5, strengths: ["Pandas/Polars handle <100MB effortlessly with expressive APIs", "Rich ETL ecosystem: dbt-core, SQLAlchemy, PyArrow, petl", "Excellent at irregular/nested data (JSON, XML, APIs)", "Fast iteration in Jupyter notebooks"], weaknesses: ["Single-threaded Pandas is memory-heavy; 100MB CSV → ~400MB in memory", "More setup required vs SAS for traditional tabular ETL workflows"] },
          medium: { rating: 4, strengths: ["Polars or Dask extends single-node scale significantly", "PySpark available for cluster-based ETL on Databricks", "Broad connector ecosystem for diverse source systems"], weaknesses: ["Pandas hits memory walls; requires library swap to Polars/Dask", "Parallelism must be managed manually at this scale"] },
          large: { rating: 4, strengths: ["PySpark on Databricks is the de-facto standard for distributed ETL", "Works as an orchestration/glue layer between compute engines", "Delta Lake read/write via Python APIs is seamless on Databricks"], weaknesses: ["Python itself is not the execution engine at this scale; Spark JVM does the work", "Memory management complex without careful partitioning strategy"] },
        },
        ml: {
          small: { rating: 5, strengths: ["Best-in-class ecosystem: scikit-learn, XGBoost, LightGBM, CatBoost", "Fast experimentation; entire dataset fits in RAM", "Jupyter inline plots for immediate model diagnostics"], weaknesses: ["No native distributed training; single machine only at this scale"] },
          medium: { rating: 5, strengths: ["PyTorch/TensorFlow handle GB-scale with GPU acceleration", "MLflow (native to Databricks) integrations are Python-first", "Feature engineering with Polars is very fast before model training"], weaknesses: ["Deep learning requires careful GPU memory management and batching"] },
          large: { rating: 5, strengths: ["PySpark MLlib for distributed feature pipelines on Databricks", "Horovod/Ray Train for multi-GPU/multi-node deep learning", "Full MLflow lifecycle management on Databricks (tracking, registry, serving)", "Mosaic AI (Databricks) for LLM fine-tuning in Python"], weaknesses: ["Distributed debugging is significantly harder than single-node Python", "Requires Databricks cluster expertise to tune for ML workloads"] },
        },
        staging: {
          small: { rating: 4, strengths: ["Pandas transforms are expressive; direct DB write via SQLAlchemy", "Easy scheduling with lightweight tools like Prefect or APScheduler"], weaknesses: ["SQL is often simpler and more maintainable for pure staging logic"] },
          medium: { rating: 4, strengths: ["Polars for fast pre-write transformations before database load", "Works well as an orchestration layer driving SQL staging jobs"], weaknesses: ["SQL alone is often cleaner and more auditable for staging at this scale"] },
          large: { rating: 3, strengths: ["Python orchestrates Databricks SQL staging jobs effectively", "Delta Live Tables (Python API) for declarative pipeline staging"], weaknesses: ["Python is the orchestrator, not the engine; SQL/Spark does the heavy work"] },
        },
        eda: {
          small: { rating: 5, strengths: ["Pandas + ydata-profiling generates instant full-dataset HTML profiles", "Jupyter notebooks are the industry standard for interactive EDA", "Rich statistical libraries: scipy, statsmodels, pingouin"], weaknesses: ["Notebook sprawl can make EDA hard to reproduce without discipline"] },
          medium: { rating: 4, strengths: ["Polars + DuckDB combination is very fast for GB-scale aggregations", "Statistical libraries (scipy, statsmodels) work on sampled or aggregated data"], weaknesses: ["Full-dataset EDA requires sampling strategies; raw Pandas on multi-GB is slow"] },
          large: { rating: 3, strengths: ["Scripted EDA via PySpark on Databricks; display() for inline results", "Sampling workflows with PySpark are straightforward"], weaknesses: ["Interactive EDA is slow; cell execution can take minutes", "Must pre-aggregate most analyses; true row-level EDA impractical"] },
        },
        viz: {
          small: { rating: 5, strengths: ["Matplotlib, Seaborn, Plotly, Altair — the richest viz ecosystem available", "Inline Jupyter rendering makes share-nothing exploration fast", "Streamlit/Dash for rapid interactive dashboard prototyping"], weaknesses: ["More code required vs SAS ODS or R ggplot for standard statistical charts"] },
          medium: { rating: 4, strengths: ["Plotly handles aggregated results well; interactive charts at scale", "Pre-aggregate with Polars/DuckDB then visualize with no size issues"], weaknesses: ["Raw GB-scale data must be aggregated before browser-based rendering"] },
          large: { rating: 3, strengths: ["Pre-aggregated exports from Databricks feed Plotly/Streamlit effectively", "Databricks notebooks with display() for in-platform viz"], weaknesses: ["Python is the prep layer at this scale; purpose-built BI tools handle rendering"] },
        },
      },
      {
        name: "SAS",
        etl: {
          small: { rating: 5, strengths: ["PROC SQL + DATA step are extremely mature for tabular ETL", "Built-in connectors to enterprise databases and file formats", "Excellent handling of SAS datasets with no conversion overhead", "Strong audit trail and logging built into every step"], weaknesses: ["Proprietary language limits portability and open-source integration", "Weak at handling unstructured/nested data (JSON, XML) vs Python"] },
          medium: { rating: 4, strengths: ["SAS Viya CAS engine provides in-memory distributed processing", "PROC FEDSQL for federated queries across data sources", "Strong data quality PROC suite (SORT, TRANSPOSE, DATASETS)"], weaknesses: ["CAS licensing required for true distributed performance", "Slower iteration cycle than Python for complex custom logic"] },
          large: { rating: 3, strengths: ["Viya CAS distributes work across nodes", "Federated query across cloud storage and databases", "Mature job scheduling and dependency management in Viya"], weaknesses: ["Significantly more expensive than Databricks at this scale", "CAS performance does not match Spark Photon for raw throughput on very large data"] },
        },
        ml: {
          small: { rating: 4, strengths: ["PROC LOGISTIC, PROC REG, PROC FOREST are production-grade classical models", "Excellent model documentation and output formatting", "SAS Model Studio (Viya) provides visual AutoML pipeline builder"], weaknesses: ["No native deep learning; lags far behind Python for neural networks", "Closed ecosystem: no XGBoost, LightGBM, or Hugging Face access natively"] },
          medium: { rating: 3, strengths: ["Viya Model Studio supports distributed model training via CAS", "SAS Model Manager for governance and deployment workflows", "ONNX model import allows limited use of Python-trained models"], weaknesses: ["Cannot match Python's algorithm diversity or GPU training capabilities", "ML experimentation cycle is slower; less notebook-friendly than Python"] },
          large: { rating: 2, strengths: ["CAS enables distributed feature engineering for ML at scale", "Model Manager provides enterprise model governance workflows"], weaknesses: ["Not competitive with Python+Databricks for serious ML at this scale", "No native GPU training support; deep learning is a major gap", "Cost of running Viya for ML at 100GB+ is very high vs Python alternatives"] },
        },
        staging: {
          small: { rating: 5, strengths: ["DATA step and PROC SQL produce clean, well-documented staging outputs", "PROC EXPORT to multiple formats (CSV, Excel, database) is trivial", "Excellent for regulated environments requiring audit trails"], weaknesses: ["Overkill cost for simple staging; Python or SQL alone is cheaper"] },
          medium: { rating: 4, strengths: ["Viya pipelines stage to database or cloud storage efficiently", "SAS datasets as staging format are very fast for SAS-downstream consumers"], weaknesses: ["SAS datasets are proprietary; downstream non-SAS tools cannot read them natively"] },
          large: { rating: 3, strengths: ["Viya job scheduling for large staging pipelines", "Federated queries allow staging without full data movement"], weaknesses: ["Expensive at scale; cloud-native SQL warehouses are more cost-efficient", "SAS datasets at 100GB+ have practical format limitations"] },
        },
        eda: {
          small: { rating: 5, strengths: ["PROC MEANS, PROC FREQ, PROC UNIVARIATE are gold standard for statistical summaries", "PROC SGPLOT/SGPANEL for publication-ready statistical graphics built in", "ODS output produces formatted reports without additional code"], weaknesses: ["Interactive EDA is limited; no notebook-style exploration like Jupyter", "Limited ability to iterate quickly on visualizations compared to Python/R"] },
          medium: { rating: 4, strengths: ["Viya CAS enables fast in-memory profiling of GB-scale data", "Strong outlier detection and distributional analysis PROCs", "PROC CAS and DATA step work seamlessly on CAS tables"], weaknesses: ["Less flexible than Python for ad-hoc multi-step EDA chains", "Visualization output is static by default without SAS Visual Analytics"] },
          large: { rating: 3, strengths: ["CAS distributed computing enables profiling of large datasets", "PROC CARDINALITY and summary actions work on CAS tables at scale"], weaknesses: ["Interactive large-scale EDA requires SAS Visual Analytics (additional cost)", "Databricks + Python is faster to iterate for exploratory analysis at this scale"] },
        },
        viz: {
          small: { rating: 4, strengths: ["PROC SGPLOT/SGPANEL produce publication-quality statistical charts natively", "ODS PDF/RTF/HTML output for formatted report delivery", "SAS Visual Analytics (Viya) for drag-and-drop dashboarding"], weaknesses: ["Not interactive by default without SAS Visual Analytics", "SAS Visual Analytics is an additional licensing cost on top of base SAS"] },
          medium: { rating: 3, strengths: ["SAS Visual Analytics handles GB-scale data via CAS backend", "Point-and-click dashboard builder accessible to non-programmers"], weaknesses: ["Cannot match Tableau, Power BI, or Looker for dashboard sophistication", "Requires CAS running for performance; expensive for concurrent users"] },
          large: { rating: 2, strengths: ["SAS Visual Analytics can connect to CAS for large-scale dashboards"], weaknesses: ["Very expensive to serve high-concurrency dashboards via Viya CAS", "Purpose-built BI tools on Databricks SQL dramatically outperform on cost and capability"] },
        },
      },
      {
        name: "SQL",
        etl: {
          small: { rating: 4, strengths: ["Extremely concise and readable for relational transformations", "Universal; runs in-database, via dbt, or in DuckDB with no extra tooling", "Declarative style makes complex joins and aggregations maintainable"], weaknesses: ["Poor at unstructured or nested data without pre-processing", "Limited procedural logic; complex conditionals require CTEs or stored procedures"] },
          medium: { rating: 5, strengths: ["dbt with Databricks SQL is the gold standard for auditable, version-controlled ETL", "Incremental models handle partial refreshes efficiently", "Declarative transforms are inherently reproducible and testable"], weaknesses: ["Complex multi-step business logic becomes hard to test in long CTE chains", "Difficult to unit test individual transformation steps without dbt test framework"] },
          large: { rating: 5, strengths: ["Databricks SQL / Spark SQL run massively parallel across clusters", "Delta Live Tables uses SQL declaratively for streaming + batch pipelines", "SQL is the most readable and auditable form for large ETL logic reviews"], weaknesses: ["Proprietary Spark SQL dialects differ from ANSI SQL; portability concerns", "Very complex logic (stateful streaming, custom algorithms) still requires Python"] },
        },
        ml: {
          small: { rating: 1, strengths: ["Basic aggregations can serve as simple feature queries for downstream models"], weaknesses: ["SQL is not a machine learning language; cannot train models", "Must hand off to Python, R, or SAS for any real modeling"] },
          medium: { rating: 1, strengths: ["SQL is excellent for feature store queries and training data preparation"], weaknesses: ["All actual ML training must occur in Python or SAS; SQL is purely preparatory"] },
          large: { rating: 2, strengths: ["Databricks Feature Store is SQL-queryable, feeding Python ML training jobs", "SQL at scale is the best feature engineering layer before ML training"], weaknesses: ["SQL is a data prep tool for ML, not an ML engine", "Even Databricks ML is Python-driven; SQL feeds the pipeline"] },
        },
        staging: {
          small: { rating: 5, strengths: ["dbt is the gold standard for version-controlled, tested staging models", "Clear data lineage graph from source to mart", "Fast iteration and documentation generation built-in"], weaknesses: ["Requires a running database; more infrastructure than simple file-based staging"] },
          medium: { rating: 5, strengths: ["Incremental dbt models very efficient for append-only staging patterns", "Materialized views in Databricks SQL for pre-aggregated staging"], weaknesses: ["Schema changes require careful migration management"] },
          large: { rating: 5, strengths: ["Databricks SQL staging via Delta tables is highly performant", "Partition pruning and Z-ordering make large staging tables query-efficient", "Delta Live Tables pipelines in SQL are declarative and self-documenting"], weaknesses: ["Always-on SQL warehouses are expensive; use serverless for variable load"] },
        },
        eda: {
          small: { rating: 3, strengths: ["Fast aggregations, filtering, and GROUP BY summaries for quick profiling", "Any SQL client (DBeaver, DataGrip) gives instant results on local databases"], weaknesses: ["Less ergonomic than Pandas or SAS PROC for rich distributional EDA", "No native charting; must export results to a viz tool"] },
          medium: { rating: 4, strengths: ["Databricks SQL for fast interactive EDA on GB-scale data", "Window functions for running totals, percentiles, and lag/lead analysis"], weaknesses: ["Statistical depth limited vs Python (scipy) or SAS (PROC UNIVARIATE)", "No inline visualization without an additional BI tool"] },
          large: { rating: 4, strengths: ["SQL aggregation is the only practical approach to EDA at this scale", "TABLESAMPLE and APPROX functions enable fast statistical profiling on Databricks", "Sub-minute aggregations on 100GB+ Delta tables via Databricks SQL"], weaknesses: ["Fully interactive EDA is impossible; must pre-define queries", "Correlation matrices and distribution fitting require Python after SQL export"] },
        },
        viz: {
          small: { rating: 2, strengths: ["Query results feed directly into any BI tool (Tableau, Power BI, Metabase)"], weaknesses: ["SQL produces result sets, not visualizations", "Requires a separate BI tool or Python/R to render any chart"] },
          medium: { rating: 2, strengths: ["Databricks SQL as backend for BI tool live connections"], weaknesses: ["SQL is the data layer; all visualization happens in another tool"] },
          large: { rating: 3, strengths: ["Databricks SQL warehouses serve BI tools efficiently at scale", "Result caching means repeated dashboard queries are near-instant"], weaknesses: ["SQL alone cannot produce visualizations; always needs a BI layer on top"] },
        },
      },
      {
        name: "R",
        etl: {
          small: { rating: 4, strengths: ["dplyr + tidyr provide the most expressive tabular transformation syntax of any language", "readr, readxl, haven (reads SAS datasets) give broad file format coverage", "Pipe-based workflows are highly readable and maintainable"], weaknesses: ["R is memory-bound; data.frame held entirely in RAM", "Not widely used in production ETL pipelines; Python preferred for ops teams"] },
          medium: { rating: 3, strengths: ["data.table is extremely fast and memory-efficient for GB-scale tabular transforms", "arrow package reads Parquet natively with column pruning", "dbplyr allows SQL-backed transforms without writing raw SQL"], weaknesses: ["R is single-node; no native distributed compute", "Production scheduling of R ETL jobs requires additional tooling (Rscript + scheduler)"] },
          large: { rating: 2, strengths: ["sparklyr package connects R to Databricks Spark clusters", "Can orchestrate distributed jobs via sparklyr without leaving R"], weaknesses: ["sparklyr adds a translation layer; not all operations push down to Spark efficiently", "R is rarely the language of choice for large-scale ETL in production", "Much smaller community on Databricks compared to Python"] },
        },
        ml: {
          small: { rating: 5, strengths: ["Unmatched statistical modeling depth: lm, glm, lme4, survival, GAMs all native", "caret / tidymodels provide a unified ML framework similar to sklearn", "Best-in-class for statistical inference (p-values, CIs, diagnostics) vs Python", "ggplot2 for rich model diagnostic visualizations"], weaknesses: ["Deep learning ecosystem (Keras R, torch for R) is a thin wrapper; Python is preferred", "Slower execution than Python for large training loops"] },
          medium: { rating: 4, strengths: ["tidymodels scales well with data.table backends for feature engineering", "xgboost, lightgbm R packages are near-identical in performance to Python versions", "mlflow R client for experiment tracking on Databricks"], weaknesses: ["GPU training workflows less mature than Python", "Fewer MLOps tools natively support R models for deployment"] },
          large: { rating: 3, strengths: ["sparklyr + MLlib for distributed ML on Databricks", "mlflow R tracking on Databricks is well-supported", "R models serializable to PMML or ONNX for deployment"], weaknesses: ["Python is the dominant ML language on Databricks; R support is secondary-tier", "Neural network training at scale is not practical in R"] },
        },
        staging: {
          small: { rating: 3, strengths: ["DBI + dbplyr allow R to write transformed data to databases cleanly", "Plumber API can serve staged data as REST endpoints"], weaknesses: ["R is rarely used as a staging pipeline language in production", "Python or SQL are better choices for repeatable, scheduled staging"] },
          medium: { rating: 2, strengths: ["R Markdown / Quarto reports can drive scheduled staging outputs"], weaknesses: ["Not a natural fit for production staging pipelines", "Better handled by Python or SQL with dbt at this scale"] },
          large: { rating: 1, strengths: [], weaknesses: ["R should not be the staging engine at this scale", "Use SQL/Spark for staging; R can consume the staged results downstream"] },
        },
        eda: {
          small: { rating: 5, strengths: ["Strongest EDA language for statistical depth: skimr, DataExplorer, GGally", "ggplot2's grammar of graphics produces the most analytically informative charts", "RStudio IDE is purpose-built for exploratory data work", "R Markdown / Quarto for reproducible EDA reports with narrative"], weaknesses: ["Memory-bound; all data in RAM limits scale of exploration", "Slower for very wide datasets compared to Pandas"] },
          medium: { rating: 4, strengths: ["data.table enables fast GB-scale EDA queries", "arrow + dplyr for lazy evaluation against Parquet files without full memory load", "Quarto documents produce excellent shareable EDA artifacts"], weaknesses: ["Full in-memory EDA of multi-GB data requires careful memory management", "Less interactive than Python notebooks for iterative exploration at scale"] },
          large: { rating: 2, strengths: ["sparklyr allows R users to run distributed EDA on Databricks via familiar dplyr syntax", "Useful for statisticians who must work with large data but prefer R"], weaknesses: ["sparklyr's dplyr translation has gaps; some operations fall back to R (slow)", "Python or SQL EDA on Databricks is faster and better-supported at this scale"] },
        },
        viz: {
          small: { rating: 5, strengths: ["ggplot2 is the gold standard for statistical visualization: layered grammar, consistent aesthetic", "Plotly for R for interactive charts with minimal extra code", "Shiny for R for interactive web dashboards without JavaScript", "ggpubr, cowplot for publication-ready multi-panel figures"], weaknesses: ["Less suited for web-scale interactive dashboards compared to Python Streamlit/Dash", "Shiny apps require R process running; less scalable than Python web apps"] },
          medium: { rating: 4, strengths: ["ggplot2 handles aggregated data beautifully regardless of source scale", "Shiny + database backend for interactive dashboards up to GB-scale", "plotly::ggplotly() converts static ggplot to interactive with one line"], weaknesses: ["Shiny server scalability requires paid Posit Connect for concurrent users"] },
          large: { rating: 2, strengths: ["R can consume pre-aggregated results from Databricks SQL and produce charts", "ggplot2 quality is unmatched for analytical reporting on exported summaries"], weaknesses: ["R is not viable as a live dashboard backend at this scale", "Purpose-built BI tools or Python Streamlit preferred for large-scale serving"] },
        },
      },
    ],
  },
  storage: {
    label: "Data Storage",
    options: [
      {
        name: "Relational Database",
        subtitle: "PostgreSQL / SQL Server / Oracle",
        etl: {
          small: { rating: 4, strengths: ["Excellent for structured relational ETL with ACID guarantees", "Rich indexing enables fast lookup-heavy transformations", "PROC SQL (SAS) and dplyr (R) connect natively via ODBC/DBI", "dbt works natively against most relational databases"], weaknesses: ["Row-oriented storage is slow for wide analytical full-table scans", "Schema-on-write requires upfront data modeling effort"] },
          medium: { rating: 3, strengths: ["Handles GB-scale with proper indexing and partitioning", "Stored procedures enable complex server-side ETL logic", "Reliable for CDC and incremental load patterns"], weaknesses: ["Analytical query performance degrades without careful index design", "Vertical scaling is expensive; horizontal sharding adds significant complexity"] },
          large: { rating: 2, strengths: ["Sharding extensions (Citus for PostgreSQL) allow horizontal scale"], weaknesses: ["Not designed for 100GB+ analytical workloads; columnar warehouses dramatically outperform", "Administrative overhead (vacuum, bloat) is significant at scale", "Cost of right-sizing for analytical queries is high vs alternatives"] },
        },
        ml: {
          small: { rating: 3, strengths: ["Good feature store for structured, slowly-changing features", "Reliable source for training data extraction via SQL"], weaknesses: ["Feature extraction query performance can be slow for wide ML feature sets"] },
          medium: { rating: 2, strengths: ["Viable as feature store with proper indexing on model key columns"], weaknesses: ["Export to Python/R/SAS required for all training; adds pipeline latency", "Not suited for high-cardinality feature scans at GB scale"] },
          large: { rating: 1, strengths: [], weaknesses: ["Not suitable as ML training data source at 100GB+ scale", "Use Parquet on object storage or Databricks Feature Store at this scale"] },
        },
        staging: {
          small: { rating: 5, strengths: ["Ideal staging store for dashboard-feeding queries at small scale", "Materialized views for pre-aggregated marts", "Excellent connectivity to all BI tools (Tableau, Power BI, Metabase)", "dbt works natively against all major relational databases"], weaknesses: ["Row-oriented scans make some aggregation queries slow without materialization"] },
          medium: { rating: 4, strengths: ["Handles dashboard staging well with good index design", "Partial indexes and covering indexes can make specific dashboard queries very fast"], weaknesses: ["Analytical query performance can be inconsistent under concurrent dashboard load"] },
          large: { rating: 2, strengths: [], weaknesses: ["Wrong tool for 100GB+ analytical staging; use Databricks SQL over Delta tables", "Query times for complex dashboard aggregations become unacceptable", "Hardware costs to serve this load are prohibitive vs columnar alternatives"] },
        },
        eda: {
          small: { rating: 4, strengths: ["SQL EDA in any client (DBeaver, DataGrip) is fast and expressive", "Familiar interface for analysts coming from SQL backgrounds"], weaknesses: ["Row-oriented scans slow for wide-open EDA across many columns", "No native visualization; must export to Python/R/BI tool for charts"] },
          medium: { rating: 3, strengths: ["Reasonable for sampled or aggregated EDA via SQL", "Window functions enable running statistics queries"], weaknesses: ["Full-scan EDA on GB-scale tables is slow without indexes or materialized views"] },
          large: { rating: 1, strengths: [], weaknesses: ["Impractical for EDA at 100GB+; use Databricks SQL or SAS Viya CAS as the EDA engine"] },
        },
        viz: {
          small: { rating: 4, strengths: ["Direct live connection from all major BI tools", "Fast for pre-aggregated, indexed dashboard queries at small scale"], weaknesses: ["Concurrent dashboard users create lock contention on analytical queries"] },
          medium: { rating: 3, strengths: ["Viable with materialized views and read replicas for dashboard serving"], weaknesses: ["Query times can be inconsistent under concurrent dashboard load"] },
          large: { rating: 1, strengths: [], weaknesses: ["Not suitable as a live BI backend at this scale", "Replace with Databricks SQL or SAS Visual Analytics on CAS"] },
        },
      },
      {
        name: "Parquet",
        subtitle: "Columnar open format on disk / object storage",
        etl: {
          small: { rating: 4, strengths: ["Columnar compression gives 5-10x size reduction vs CSV with same data", "Schema enforcement prevents silent type errors during ETL", "Readable natively by Python, R (arrow), SAS Viya, and Databricks without conversion", "Predicate push-down skips irrelevant row groups without reading full file"], weaknesses: ["Not human-readable; requires tooling to inspect (unlike CSV)", "Small Parquet files can have higher per-file overhead than a single CSV"] },
          medium: { rating: 5, strengths: ["Partition pruning on directory structure makes scans dramatically faster", "Works natively across Python, R, SAS Viya, Spark, and SQL engines without conversion", "The de-facto interoperability format across all modern data tools", "Row group statistics allow query engines to skip large file sections"], weaknesses: ["Small-file problem requires periodic compaction if many incremental writes", "Schema evolution (adding columns) requires care to maintain backward compatibility"] },
          large: { rating: 5, strengths: ["The lakehouse standard for 100GB+ ETL on object storage (S3, ADLS, GCS)", "10-20x compression vs CSV means far less I/O and cloud storage cost", "Column projection + predicate push-down means only reading what queries need", "Databricks Spark reads partitioned Parquet natively at any scale"], weaknesses: ["Concurrent writes without Delta Lake overlay can corrupt partitions", "File management (compaction, small files) requires periodic maintenance jobs"] },
        },
        ml: {
          small: { rating: 4, strengths: ["Fast feature reads; select only needed columns with minimal I/O", "Consistent schema enables reproducible, versioned training datasets", "PyArrow → numpy conversion is zero-copy for most dtypes"], weaknesses: ["Slightly more setup than CSV for quick ad-hoc ML experiments"] },
          medium: { rating: 5, strengths: ["PyArrow reads Parquet directly into pandas/numpy efficiently with column pruning", "Partitioned by date, label, or cohort for efficient training data sampling", "R arrow package reads Parquet for R-based ML without full load into memory", "SAS Viya can import Parquet for CAS-based ML pipelines"], weaknesses: ["Very large individual Parquet files require streaming reads to avoid OOM"] },
          large: { rating: 5, strengths: ["Standard format for large ML training dataset storage on object storage", "Databricks reads Parquet partitions directly into Spark DataFrames for distributed feature engineering", "HuggingFace Datasets library uses Parquet as its native backing format"], weaknesses: ["Raw Parquet without Delta Lake lacks ACID; concurrent training data writes risk corruption"] },
        },
        staging: {
          small: { rating: 4, strengths: ["Compact, fast staging layer in a data lake or local file system", "DuckDB, Python, R, and SAS Viya can all query Parquet as an external table or caslib"], weaknesses: ["No built-in query engine; must bring your own compute to query"] },
          medium: { rating: 5, strengths: ["External tables in Databricks SQL over partitioned Parquet = highly efficient staging", "Eliminates data duplication: query Parquet directly without ingesting into a proprietary format", "SAS Viya can register Parquet as a CAS caslib for direct query"], weaknesses: ["Stale partition metadata if files are updated outside the registered catalog"] },
          large: { rating: 5, strengths: ["Lakehouse staging pattern — Parquet on object storage + Databricks SQL external table — is the most cost-efficient approach at scale", "SAS Viya CAS can load Parquet into memory for fast staging-layer queries"], weaknesses: ["Without Delta Lake, concurrent staging writes are unsafe", "File listing overhead in very large Parquet directories can slow query planning"] },
        },
        eda: {
          small: { rating: 4, strengths: ["DuckDB or Python read Parquet instantly for EDA queries with column pruning", "R arrow + dplyr for lazy EDA without full file load", "SAS Viya imports Parquet for CAS-based profiling"], weaknesses: ["Cannot open in Excel or inspect in a text editor without tooling"] },
          medium: { rating: 5, strengths: ["Column pruning means EDA queries only read relevant columns; much faster than CSV at GB scale", "ydata-profiling (Python) and DataExplorer (R) both read Parquet via arrow backends", "DuckDB provides the fastest local EDA on Parquet files of any tool at this scale"], weaknesses: ["All EDA queries require a compute layer; no ad-hoc spreadsheet inspection"] },
          large: { rating: 5, strengths: ["Only viable format for large-scale EDA via Databricks SQL, PySpark, or SAS Viya CAS", "Partition pruning means EDA queries on date ranges read a fraction of total data", "Databricks SQL can query partitioned Parquet lakes interactively at 100GB+ scale"], weaknesses: ["Always requires a running compute engine; cold-start latency on first query"] },
        },
        viz: {
          small: { rating: 3, strengths: ["Observable Plot, Evidence.dev, and Rill can read Parquet natively for embedded analytics", "Pre-aggregate Parquet with DuckDB, export to CSV for any viz tool"], weaknesses: ["Most traditional BI tools cannot directly open Parquet; need a SQL query layer in between"] },
          medium: { rating: 4, strengths: ["Databricks SQL over Parquet feeds all major BI tools via JDBC/ODBC", "SAS Visual Analytics can connect to Parquet via CAS caslib"], weaknesses: ["BI tools need a SQL compute layer between them and the Parquet files"] },
          large: { rating: 4, strengths: ["Parquet on object storage + Databricks SQL is the most cost-efficient large-scale BI backend", "Pre-aggregated Parquet exports from Databricks feed all BI tools effectively"], weaknesses: ["Direct BI tool → Parquet connection requires intermediary SQL engine"] },
        },
      },
      {
        name: "CSV / Tab-Delimited",
        subtitle: "Flat text format",
        etl: {
          small: { rating: 4, strengths: ["Universal compatibility: every tool reads CSV without configuration", "Human-readable and debuggable in any text editor or Excel", "Zero tooling required to inspect, share, or validate data manually", "SAS (PROC IMPORT/INFILE), R (readr), Python (Pandas), and all databases ingest CSV natively"], weaknesses: ["No schema enforcement; type inference errors are common and silent", "2-10x larger file size than equivalent Parquet", "No compression of repeated values; large with high-cardinality categorical columns"] },
          medium: { rating: 2, strengths: ["Still universally readable; useful as an interchange format between systems", "SAS PROC IMPORT and INFILE handle large CSV files with reasonable options"], weaknesses: ["Terrible performance at GB scale: no predicate push-down, no column pruning, full sequential scan required", "5-10x slower to read than equivalent Parquet in Python, R, or SAS Viya", "Type parsing overhead on every read; no stored schema"] },
          large: { rating: 1, strengths: ["Only valid use case: source system exports data in CSV and you have no control over the format"], weaknesses: ["Convert to Parquet immediately upon ingestion; never use CSV as a processing or storage format at this scale", "Prohibitively slow to process directly with any engine", "Storage and egress costs are extreme vs columnar formats"] },
        },
        ml: {
          small: { rating: 3, strengths: ["Easy to inspect and validate training data manually before use", "Universally supported by all ML libraries (sklearn, SAS, R caret) as input format"], weaknesses: ["Slower reads than Parquet; repeated training runs amplify this cost", "No column selection at read time; always reads full file"] },
          medium: { rating: 2, strengths: [], weaknesses: ["Much slower than Parquet for feature reads at GB scale; multiply this by training epochs", "Convert to Parquet before building training pipelines at this scale"] },
          large: { rating: 1, strengths: [], weaknesses: ["Never use CSV as a training data format at 100GB+ scale", "I/O will dominate training time; convert to Parquet or Delta Lake immediately"] },
        },
        staging: {
          small: { rating: 3, strengths: ["Simple staging for small reporting exports", "Easily shared with downstream consumers who may not have database access"], weaknesses: ["No query capability without loading into a compute engine; no indexing", "Manual column type management required"] },
          medium: { rating: 1, strengths: [], weaknesses: ["Too slow and too large for reliable staging of GB-scale data", "Downstream tools will struggle with load times; use a database or Parquet"] },
          large: { rating: 1, strengths: [], weaknesses: ["Completely inappropriate as a staging format at this scale"] },
        },
        eda: {
          small: { rating: 5, strengths: ["Open in Excel instantly for quick sanity checks with no tooling", "Preview in any text editor; zero friction for inspecting data quality", "Zero friction for sharing sample data with stakeholders for validation"], weaknesses: ["Excel row limit (1,048,576 rows) means larger CSVs cannot be fully explored in Excel"] },
          medium: { rating: 2, strengths: ["Readable in any tool; good for sharing sampled exports with stakeholders"], weaknesses: ["Very slow EDA at GB scale; always convert to Parquet first for analysis", "Full-file reads required every time; no caching or index"] },
          large: { rating: 1, strengths: [], weaknesses: ["Completely impractical for EDA at 100GB+; convert to Parquet immediately upon ingestion"] },
        },
        viz: {
          small: { rating: 4, strengths: ["D3.js, Observable Plot, Vega-Lite, and Excel all read CSV natively for viz", "Easiest format to share with business stakeholders for self-service charting"], weaknesses: ["Browsers cannot handle more than ~50MB CSV without significant performance degradation"] },
          medium: { rating: 1, strengths: [], weaknesses: ["Not suitable as a visualization data source at GB scale; aggregate to smaller output first"] },
          large: { rating: 1, strengths: [], weaknesses: ["Completely impractical as a viz data source at this scale"] },
        },
      },
      {
        name: "SAS Dataset (.sas7bdat)",
        subtitle: "Proprietary SAS binary format",
        etl: {
          small: { rating: 4, strengths: ["Native SAS format: zero conversion overhead within SAS pipelines", "Extremely fast read/write within SAS DATA step and PROCs", "Preserves SAS metadata: variable labels, formats, and lengths natively", "Excellent for regulated industry pipelines (pharma, finance, government) where SAS is the standard"], weaknesses: ["Proprietary format: Python (pyreadstat) and R (haven) can read but not write efficiently", "Databricks cannot read .sas7bdat natively; conversion required before use in Spark"] },
          medium: { rating: 3, strengths: ["SAS Viya CAS can load .sas7bdat files into distributed memory for processing", "Within SAS-only pipelines, remains the most efficient format at this scale"], weaknesses: ["Large SAS datasets are slow to transfer to non-SAS systems", "Not a practical interoperability format at GB scale outside the SAS ecosystem", "File size larger than equivalent Parquet; no columnar compression benefits"] },
          large: { rating: 2, strengths: ["SAS Viya CAS can distribute .sas7bdat content across nodes once loaded"], weaknesses: ["Loading 100GB+ SAS datasets into CAS is slow and memory-intensive", "Proprietary format becomes a major liability: not readable by Databricks, cloud warehouses, or open-source tools without conversion", "No predicate push-down or partition pruning; always full sequential scan"] },
        },
        ml: {
          small: { rating: 3, strengths: ["Directly usable in SAS Model Studio without conversion", "Variable formats and labels preserved for feature documentation in SAS"], weaknesses: ["Python and R ML libraries cannot write .sas7bdat; one-way street for training pipelines", "pyreadstat read-only support limits iterative Python ML workflows"] },
          medium: { rating: 2, strengths: ["SAS Viya ML on CAS can use loaded .sas7bdat as training source"], weaknesses: ["Must load fully into CAS memory; inefficient for iterative ML at GB scale", "Python/R ML frameworks cannot use .sas7bdat as training format; convert to Parquet first"] },
          large: { rating: 1, strengths: [], weaknesses: ["Not a viable ML training data format at 100GB+ outside SAS Viya", "Convert to Parquet for any multi-tool or Databricks-based ML pipeline"] },
        },
        staging: {
          small: { rating: 4, strengths: ["Ideal staging format when all downstream consumers are SAS processes", "Variable labels and formats make staged data self-documenting within SAS"], weaknesses: ["Locks staging layer to SAS consumers; non-SAS BI tools cannot read without conversion"] },
          medium: { rating: 3, strengths: ["SAS Viya pipelines staging to .sas7bdat work well within SAS-only ecosystems"], weaknesses: ["Non-SAS BI tools (Tableau, Power BI) cannot connect without SAS/ACCESS or conversion", "GB-scale SAS datasets have high memory cost when loaded for querying"] },
          large: { rating: 1, strengths: [], weaknesses: ["Not appropriate as a staging format at 100GB+", "No partitioning, no columnar storage; large-scale staging is impractical", "Convert to Parquet or a database for any mixed-tool staging layer"] },
        },
        eda: {
          small: { rating: 4, strengths: ["PROC CONTENTS gives instant metadata profile: variable types, lengths, formats", "PROC MEANS, PROC FREQ, PROC UNIVARIATE work directly on .sas7bdat without conversion", "Variable labels provide human-readable context during exploration"], weaknesses: ["Requires SAS license to open; cannot inspect in any free tool natively", "R (haven) and Python (pyreadstat) can read but statistical summaries are not as rich as SAS PROCs"] },
          medium: { rating: 3, strengths: ["SAS Viya loads .sas7bdat to CAS for fast distributed EDA", "All SAS PROC suite runs on CAS tables derived from .sas7bdat"], weaknesses: ["Must load fully into CAS for distributed EDA; sequential access otherwise", "Cross-tool EDA combining SAS datasets with Python notebooks requires format conversion"] },
          large: { rating: 1, strengths: [], weaknesses: ["Not suitable for EDA at 100GB+ as .sas7bdat files", "Load subset to CAS or convert to Parquet; do not attempt to EDA raw .sas7bdat at this scale"] },
        },
        viz: {
          small: { rating: 3, strengths: ["SAS Visual Analytics (Viya) reads SAS datasets natively for drag-and-drop dashboarding", "ODS output from SAS programs on .sas7bdat produces formatted HTML/PDF reports"], weaknesses: ["No connection to Tableau, Power BI, or Looker without conversion or SAS/ACCESS license", "SAS Visual Analytics is an additional licensing cost"] },
          medium: { rating: 2, strengths: ["SAS Visual Analytics via Viya CAS can visualize GB-scale SAS data"], weaknesses: ["Locked into SAS Visual Analytics for visualization; no interoperability with modern BI tools", "Purpose-built BI tools are significantly more capable for interactive dashboarding"] },
          large: { rating: 1, strengths: [], weaknesses: ["SAS datasets at 100GB+ are not a viable visualization data source", "Convert to columnar format and use Databricks SQL or a cloud warehouse for BI serving"] },
        },
      },
      {
        name: "Excel (.xlsx)",
        subtitle: "Spreadsheet format",
        etl: {
          small: { rating: 2, strengths: ["Universal business acceptance; stakeholders can validate inputs/outputs directly", "Python (openpyxl), R (readxl, writexl), and SAS (PROC IMPORT) all read Excel", "Useful as a source format for manually maintained reference or mapping tables"], weaknesses: ["Not designed for ETL: no schema enforcement, mixed types in columns, merged cells cause parsing failures", "1,048,576 row limit; will silently truncate larger datasets", "Extremely slow to read/write at even moderate row counts vs CSV or Parquet", "Formulae and pivot tables cause unpredictable behavior in automated pipelines"] },
          medium: { rating: 1, strengths: [], weaknesses: ["1M row limit means datasets at GB scale cannot fit in a single file", "I/O performance is orders of magnitude slower than Parquet or even CSV at GB scale", "Not appropriate as an ETL format at this scale; use only as a final reporting output"] },
          large: { rating: 1, strengths: [], weaknesses: ["Completely inappropriate as an ETL format at 100GB+"] },
        },
        ml: {
          small: { rating: 1, strengths: ["Can hold small feature tables or mapping lookups consumed by ML pipelines"], weaknesses: ["Not an ML training data format; always convert to DataFrame before use", "No schema enforcement means silent data quality errors in training features"] },
          medium: { rating: 1, strengths: [], weaknesses: ["Row limit and performance make Excel unusable as ML training data at GB scale"] },
          large: { rating: 1, strengths: [], weaknesses: ["Not applicable at this scale"] },
        },
        staging: {
          small: { rating: 2, strengths: ["Useful for small reference table staging where downstream consumers are Excel users", "Business stakeholders can directly validate staged data without tooling"], weaknesses: ["Not a reliable staging format; row limits, formula corruption risk, no versioning", "Cannot be queried by BI tools directly without conversion or Power BI Excel connector"] },
          medium: { rating: 1, strengths: [], weaknesses: ["Not suitable as a staging format at GB scale; row limit and performance are disqualifying"] },
          large: { rating: 1, strengths: [], weaknesses: ["Not applicable"] },
        },
        eda: {
          small: { rating: 3, strengths: ["Instant, zero-friction exploration for business analysts without coding skills", "Pivot tables and charts allow quick univariate profiling of small datasets", "Useful for reviewing small sample exports from larger datasets for quality checks"], weaknesses: ["1M row limit means even moderate datasets cannot be fully explored", "Pivot table performance degrades badly above ~100K rows", "No statistical depth vs Python/R/SAS for distributional analysis"] },
          medium: { rating: 1, strengths: [], weaknesses: ["Row limit and performance make Excel impractical for GB-scale EDA", "Use sampled CSV or database export instead for stakeholder review"] },
          large: { rating: 1, strengths: [], weaknesses: ["Not applicable"] },
        },
        viz: {
          small: { rating: 3, strengths: ["Instant charts for business communication on small summary tables", "Every stakeholder already has Excel; zero friction for consumption", "Power BI can connect directly to Excel files for simple dashboards"], weaknesses: ["Charts are static; not interactive or shareable as web dashboards", "Not a scalable visualization format; use for outputs only, never as a viz backend"] },
          medium: { rating: 1, strengths: [], weaknesses: ["Row limits and performance disqualify Excel as a viz data source at GB scale"] },
          large: { rating: 1, strengths: [], weaknesses: ["Not applicable"] },
        },
      },
    ],
  },
  cloud: {
    label: "Cloud Platform",
    options: [
      {
        name: "SAS Viya",
        subtitle: "Managed SAS cloud platform",
        etl: {
          small: { rating: 3, strengths: ["SAS Studio and Viya Pipelines provide a visual, low-code ETL environment", "Strong built-in connectors to enterprise databases and SAS datasets", "Excellent for regulated industries with built-in audit trails and data lineage", "Familiar to SAS shops; no retraining cost for existing teams"], weaknesses: ["Significant licensing cost even for small workloads", "Slower iteration cycle than Python/SQL on local or cheaper infrastructure", "Weak support for modern open-source formats and tools out of the box"] },
          medium: { rating: 4, strengths: ["CAS (Cloud Analytic Services) engine distributes compute across nodes for GB-scale processing", "PROC FEDSQL for federated queries across cloud storage and databases without full data movement", "SAS Data Studio for visual data preparation pipelines", "Strong data quality and MDM capabilities built into the platform"], weaknesses: ["CAS licensing is an additional cost on top of base Viya", "Performance per dollar does not match Databricks for raw ETL throughput", "Limited ability to leverage open-source ecosystem (dbt, Airflow) natively"] },
          large: { rating: 3, strengths: ["CAS distributes across nodes for large-scale in-memory processing", "Viya Pipelines provide scheduled, monitored ETL job orchestration", "Strong governance and data lineage for regulated industries at scale"], weaknesses: ["Dramatically more expensive than Databricks for equivalent compute at this scale", "CAS in-memory model struggles when data exceeds cluster RAM; spill to disk is slow", "Spark on Databricks is significantly faster for raw distributed ETL throughput at 100GB+"] },
        },
        ml: {
          small: { rating: 4, strengths: ["SAS Model Studio provides a visual drag-and-drop AutoML pipeline builder", "PROC LOGISTIC, PROC FOREST, PROC GRADBOOST are production-grade classical ML", "Excellent model documentation, governance, and audit trail built-in", "SAS Model Manager for model deployment and monitoring workflows"], weaknesses: ["No native deep learning; cannot match Python for neural networks", "Closed ecosystem: no XGBoost, LightGBM, or HuggingFace access natively", "Slow experimentation cycle vs Jupyter notebooks in Python/R"] },
          medium: { rating: 3, strengths: ["Viya Model Studio supports distributed ML training via CAS", "ONNX model import allows limited use of externally trained Python models", "Strong model governance and champion/challenger workflows in SAS Model Manager"], weaknesses: ["Cannot match Python's ML algorithm diversity or GPU acceleration", "Gradient boosting performance lags XGBoost/LightGBM significantly", "ML experimentation is slower and less notebook-interactive than Databricks"] },
          large: { rating: 2, strengths: ["CAS enables distributed feature engineering for ML at scale", "SAS Model Manager provides governance workflows for large model portfolios"], weaknesses: ["Not competitive with Databricks + Python for large-scale ML", "No native GPU training; deep learning is a fundamental gap vs Databricks Mosaic AI", "Cost of running Viya CAS for ML at 100GB+ is significantly higher than alternatives"] },
        },
        staging: {
          small: { rating: 4, strengths: ["Viya pipelines stage data to CAS, databases, or SAS datasets efficiently", "Built-in scheduling and dependency management", "Strong data quality validations built into staging workflows", "Excellent for regulated environments requiring signed-off staging outputs"], weaknesses: ["Expensive for simple staging tasks that SQL or Python could handle cheaply"] },
          medium: { rating: 3, strengths: ["CAS-based staging enables fast downstream querying via SAS Visual Analytics", "Federated query reduces data movement for some staging patterns"], weaknesses: ["Non-SAS BI tools (Tableau, Power BI) cannot consume CAS-staged data without SAS/ACCESS or export step", "Cost per staged GB is significantly higher than Databricks SQL"] },
          large: { rating: 2, strengths: ["Viya CAS can stage and serve large datasets to SAS Visual Analytics dashboards"], weaknesses: ["Extremely expensive to run CAS for 100GB+ staging compared to Databricks SQL", "Proprietary format locks staged data into the SAS ecosystem", "Concurrent dashboard user scaling is constrained by CAS node capacity"] },
        },
        eda: {
          small: { rating: 4, strengths: ["SAS Studio provides an integrated environment for SAS code EDA in the cloud", "All SAS PROCs (MEANS, FREQ, UNIVARIATE, SGPLOT) available with no local setup", "SAS Visual Analytics for drag-and-drop exploratory visualization", "Strong for statisticians familiar with SAS"], weaknesses: ["Interactive EDA iteration is slower than Jupyter notebooks for Python/R users", "SAS Visual Analytics is an additional license cost for visual EDA"] },
          medium: { rating: 3, strengths: ["CAS in-memory processing enables fast distributed EDA of GB-scale data", "PROC CAS distributed profiling (cardinality, summary stats) is fast on CAS tables"], weaknesses: ["Cost of running CAS for EDA sessions accrues quickly", "Databricks notebooks + Python/SQL are faster to iterate for exploratory analysis", "Less flexible than Python for multi-step custom EDA workflows"] },
          large: { rating: 3, strengths: ["CAS can profile 100GB+ data in distributed memory when nodes are sized correctly", "Scheduled PROC runs for batch statistical profiling of large data"], weaknesses: ["Interactive large-scale EDA requires large CAS cluster (expensive)", "Databricks SQL provides faster, cheaper interactive EDA at this scale", "Data must fit within CAS memory; disk spill is very slow"] },
        },
        viz: {
          small: { rating: 3, strengths: ["SAS Visual Analytics provides drag-and-drop dashboarding with no coding required", "Accessible to non-technical business users without SQL or Python skills", "CAS backend means fast aggregations for small-data dashboards"], weaknesses: ["Additional licensing cost on top of Viya base", "Cannot match Tableau, Power BI, or Looker for visualization sophistication and UX"] },
          medium: { rating: 3, strengths: ["SAS Visual Analytics handles GB-scale data via CAS backend efficiently", "Self-service dashboards for SAS-ecosystem organizations"], weaknesses: ["High cost per dashboard user at this scale", "Non-SAS BI tools are significantly better for complex interactive dashboards"] },
          large: { rating: 2, strengths: ["SAS Visual Analytics can connect to large CAS tables for enterprise dashboards"], weaknesses: ["Very expensive to serve high-concurrency dashboards via CAS at 100GB+", "Purpose-built BI tools (Tableau, Power BI, Looker) on Databricks SQL dramatically outperform on cost and capability", "Scaling concurrent users requires proportionally scaling the CAS cluster"] },
        },
      },
      {
        name: "Databricks",
        subtitle: "Unified data + AI platform",
        etl: {
          small: { rating: 2, strengths: ["Full Spark and Delta Lake API available if needed", "Serverless compute reduces cluster startup time significantly vs classic clusters"], weaknesses: ["Cost-prohibitive for small data; local Python/DuckDB is faster and free", "Minimum cluster cost is high relative to small-data job duration", "30+ second startup even for serverless; painful for iterative small-data ETL"] },
          medium: { rating: 5, strengths: ["Delta Live Tables for declarative, tested, auto-scaling ETL pipelines", "Auto Loader for efficient incremental file ingestion from object storage", "Photon engine provides 10-50x speed improvement over OSS Spark on many workloads", "dbt + Databricks SQL is a best-in-class combination for SQL-based ETL at this scale", "Multi-language notebooks: Python, SQL, R, and Scala in same session"], weaknesses: ["Cost is higher than single-server alternatives for GB-scale work that doesn't fully utilize cluster", "Cluster configuration (instance type, worker count) requires tuning expertise"] },
          large: { rating: 5, strengths: ["The gold standard for 100GB+ distributed ETL pipelines", "Photon-accelerated Spark for maximum throughput on columnar workloads", "Delta Lake provides ACID transactions, time travel, schema evolution at petabyte scale", "Unity Catalog for data governance and lineage across all Databricks assets", "Structured Streaming for real-time ETL with exactly-once guarantees", "Multi-cloud: runs identically on AWS, Azure, or GCP"], weaknesses: ["Premium pricing compared to DIY Spark on cloud VMs", "Unity Catalog and Delta Live Tables require Databricks-specific knowledge to operate well"] },
        },
        ml: {
          small: { rating: 2, strengths: ["MLflow is available and works well even at small scale for experiment tracking"], weaknesses: ["Too expensive for small-scale ML experimentation; use local Jupyter + mlflow OSS instead", "Cluster startup latency hurts rapid iteration on small training jobs"] },
          medium: { rating: 5, strengths: ["MLflow invented at Databricks; deepest integration for experiment tracking, model registry, and deployment", "Managed Feature Store for reusable, point-in-time correct feature computation", "AutoML for fast baseline model generation", "GPU cluster support for PyTorch/TensorFlow training", "Python, R, and SQL all available in same ML notebook"], weaknesses: ["GPU instance costs during active training can escalate quickly without budget guardrails", "Feature Store setup requires upfront investment to realize maximum value"] },
          large: { rating: 5, strengths: ["Best large-scale ML platform: distributed training + feature store + model serving unified", "Mosaic AI (MosaicML) for LLM fine-tuning and custom foundation model training", "Horovod and DeepSpeed for distributed multi-GPU/multi-node deep learning", "Delta Lake + Feature Store for versioned, ACID-safe training dataset management", "Unity Catalog for end-to-end ML governance from feature to model to prediction", "Model serving with Mosaic AI for low-latency inference at scale"], weaknesses: ["Premium cost tier; requires budget commitment and platform expertise to run efficiently", "Complex for teams without prior Spark/Databricks experience"] },
        },
        staging: {
          small: { rating: 1, strengths: [], weaknesses: ["Not cost-effective for small staging workloads", "Local database or simple Python script is the right tool at this scale"] },
          medium: { rating: 4, strengths: ["Databricks SQL Serverless for fast, auto-scaling dashboard staging warehouse", "Delta tables with OPTIMIZE + ZORDER for highly query-efficient staging layer", "dbt on Databricks for version-controlled, tested staging models", "Result caching in Databricks SQL for repeated dashboard queries at no additional compute cost"], weaknesses: ["Databricks SQL warehouse cost for high-concurrency dashboards requires Pro or Serverless tier", "Slightly more complex to configure than a managed warehouse for pure staging use cases"] },
          large: { rating: 5, strengths: ["Delta Live Tables for streaming + batch unified staging pipelines at any scale", "Databricks SQL Serverless auto-scales to serve any concurrency level", "Unity Catalog enforces row/column level security on staging tables for BI consumers", "Z-ordering on common query predicates makes large-table dashboard queries very fast", "Result cache eliminates repeated compute cost for common dashboard queries"], weaknesses: ["Premium SQL warehouse tier required for production-grade concurrent dashboard serving", "Initial Delta table optimization (OPTIMIZE, ZORDER) requires planning based on query patterns"] },
        },
        eda: {
          small: { rating: 2, strengths: ["Excellent notebook UX; Databricks Assistant for AI-assisted code generation"], weaknesses: ["Not cost-effective for interactive EDA on small data; local Jupyter is faster and free", "Cluster startup latency hurts fast iteration"] },
          medium: { rating: 5, strengths: ["Interactive notebooks with Python, R, SQL, and Scala in same session", "Databricks SQL for sub-second interactive SQL EDA on GB-scale Delta tables", "display() function renders DataFrames and charts inline instantly", "Databricks Assistant accelerates EDA code writing with AI suggestions", "Seamless connection to Hex, Deepnote, and other notebook IDEs"], weaknesses: ["Cluster cost accrues during active EDA sessions; idle time wastes money", "Slight cold-start latency vs always-on local tools"] },
          large: { rating: 5, strengths: ["Only practical interactive EDA platform at 100GB+ scale", "Databricks SQL provides sub-minute aggregations on 100GB+ Delta/Parquet tables", "PySpark + display() for distributed EDA with inline visualization", "TABLESAMPLE, APPROX functions for fast statistical profiling without full scans", "Databricks Assistant helps write complex distributed EDA code"], weaknesses: ["Cost management is essential; large cluster + long EDA sessions are expensive", "Iterative EDA is slower than small-scale tools due to distributed job overhead per cell"] },
        },
        viz: {
          small: { rating: 1, strengths: [], weaknesses: ["Not cost-effective for small-data visualization; use Python/R locally"] },
          medium: { rating: 3, strengths: ["Databricks SQL has built-in Lakeview dashboards and visualization capability", "Connects via JDBC/ODBC to all major BI tools: Tableau, Power BI, Looker, Metabase", "AI/BI Genie for natural language-driven analytics on Delta tables"], weaknesses: ["Native Lakeview dashboarding is good but not yet as feature-rich as Tableau or Power BI", "External BI tool connection is the recommended approach for sophisticated dashboards"] },
          large: { rating: 5, strengths: ["Gold standard backend for Tableau, Power BI, and Looker at enterprise scale", "Result caching makes high-concurrency dashboards cost-efficient", "AI/BI Genie for self-service natural language analytics on large Delta tables", "Unity Catalog enforces fine-grained access control for BI consumers", "Auto-scaling SQL warehouses handle variable dashboard load without over-provisioning"], weaknesses: ["Best dashboard experience requires an external BI tool on top; native Databricks dashboarding is still maturing", "Pro/Serverless SQL warehouse required for production-grade BI serving; additional cost tier"] },
        },
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
          <div key={i} style={{ width: "16px", height: "8px", borderRadius: "2px", background: i <= rating ? RATING_COLORS[rating - 1] : "#1e293b", transition: "background 0.2s" }} />
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
    <button onClick={onClick} style={{ padding: "6px 14px", borderRadius: "20px", border: "1px solid", borderColor: active ? "#38bdf8" : "#334155", background: active ? "rgba(56,189,248,0.15)" : "transparent", color: active ? "#38bdf8" : "#64748b", cursor: "pointer", fontSize: "12px", fontFamily: "'IBM Plex Mono', monospace", fontWeight: active ? 700 : 400, transition: "all 0.2s", whiteSpace: "nowrap" }}>
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

  return (
    <div style={{ minHeight: "100vh", background: "#020817", color: "#e2e8f0", fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=IBM+Plex+Sans:wght@300;400;500;600&family=Bebas+Neue&display=swap');
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        .option-card { transition: border-color 0.2s; }
        .option-card:hover { border-color: #38bdf8 !important; }
        .nav-btn:hover { background: rgba(56,189,248,0.08) !important; }
        .stack-tab:hover { color: #94a3b8 !important; }
      `}</style>

      <div style={{ borderBottom: "1px solid #0f2037", padding: "28px 40px 20px", background: "linear-gradient(180deg, #020c1b 0%, #020817 100%)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "36px", letterSpacing: "3px", color: "#f8fafc", lineHeight: 1 }}>DATA STACK DECISION MATRIX</div>
              <div style={{ fontSize: "12px", color: "#475569", fontFamily: "monospace", marginTop: "6px", letterSpacing: "1px" }}>
                STRENGTHS · WEAKNESSES · SCALE ANALYSIS &nbsp;|&nbsp; Python · SAS · SQL · R &nbsp;·&nbsp; SAS Viya · Databricks &nbsp;·&nbsp; DB · Parquet · CSV · SAS7bdat · Excel
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "11px", color: "#475569", fontFamily: "monospace", marginRight: "4px" }}>DATA SIZE:</span>
              {DATA_SCALES.map((s, i) => (
                <ScaleBadge key={s} scale={s} active={activeScale === i} onClick={() => setActiveScale(i)} />
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "20px", flexWrap: "wrap" }}>
            {CATEGORIES.map((cat) => (
              <button key={cat.id} className="nav-btn" onClick={() => setActiveCategory(cat.id)} style={{ padding: "7px 14px", borderRadius: "6px", border: "1px solid", borderColor: activeCategory === cat.id ? "#38bdf8" : "#1e293b", background: activeCategory === cat.id ? "rgba(56,189,248,0.12)" : "transparent", color: activeCategory === cat.id ? "#e2e8f0" : "#64748b", cursor: "pointer", fontSize: "12px", fontWeight: activeCategory === cat.id ? 600 : 400, transition: "all 0.15s", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ opacity: 0.7, fontFamily: "monospace" }}>{cat.icon}</span>
                <span>{cat.label}</span>
                <span style={{ background: activeCategory === cat.id ? "#38bdf8" : "#1e293b", color: activeCategory === cat.id ? "#020817" : "#475569", fontSize: "10px", fontFamily: "monospace", padding: "1px 5px", borderRadius: "3px", fontWeight: 700 }}>P{cat.priority}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 40px" }}>
        <div style={{ display: "flex", borderBottom: "1px solid #1e293b", marginBottom: "28px" }}>
          {Object.entries(STACK).map(([key, sec]) => (
            <button key={key} className="stack-tab" onClick={() => { setActiveStackSection(key); setExpandedOption(null); }} style={{ padding: "10px 20px", background: "transparent", border: "none", borderBottom: "2px solid", borderColor: activeStackSection === key ? "#38bdf8" : "transparent", color: activeStackSection === key ? "#38bdf8" : "#475569", cursor: "pointer", fontSize: "13px", fontWeight: activeStackSection === key ? 600 : 400, transition: "all 0.15s", marginBottom: "-1px" }}>
              {sec.label}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {section.options.map((opt) => {
            const catData = opt[activeCategory]?.[scaleKey];
            if (!catData) return null;
            const isExpanded = expandedOption === opt.name;
            return (
              <div key={opt.name} className="option-card" onClick={() => setExpandedOption(isExpanded ? null : opt.name)} style={{ background: "#0a1628", border: "1px solid", borderColor: isExpanded ? "#38bdf8" : "#1e293b", borderRadius: "12px", padding: "20px", cursor: "pointer", gridColumn: isExpanded ? "1 / -1" : undefined }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: "#f1f5f9", marginBottom: "2px" }}>{opt.name}</div>
                    {opt.subtitle && <div style={{ fontSize: "11px", color: "#475569", fontFamily: "monospace", marginBottom: "8px" }}>{opt.subtitle}</div>}
                    <RatingBar rating={catData.rating} />
                  </div>
                  <div style={{ fontSize: "11px", color: "#475569", fontFamily: "monospace", background: "#0f172a", padding: "3px 8px", borderRadius: "4px", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s", marginLeft: "10px", flexShrink: 0 }}>▾</div>
                </div>
                {!isExpanded && catData.strengths.length > 0 && (
                  <div style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.5" }}>
                    {catData.strengths[0]}
                    {catData.strengths.length > 1 && <span style={{ color: "#334155" }}> +{catData.strengths.length - 1} more</span>}
                  </div>
                )}
                {isExpanded && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #1e293b" }}>
                    {SCALE_KEYS.map((sk, si) => {
                      const d = opt[activeCategory]?.[sk];
                      if (!d) return null;
                      return (
                        <div key={sk} style={{ background: sk === scaleKey ? "rgba(56,189,248,0.05)" : "transparent", border: "1px solid", borderColor: sk === scaleKey ? "rgba(56,189,248,0.2)" : "#1e293b", borderRadius: "8px", padding: "14px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                            <span style={{ fontSize: "11px", color: "#475569", fontFamily: "monospace" }}>{DATA_SCALES[si]}</span>
                            <RatingBar rating={d.rating} />
                          </div>
                          {d.strengths.length > 0 && (
                            <div style={{ marginBottom: "10px" }}>
                              <div style={{ fontSize: "10px", color: "#22c55e", fontFamily: "monospace", letterSpacing: "1px", marginBottom: "6px" }}>STRENGTHS</div>
                              {d.strengths.map((s, i) => (
                                <div key={i} style={{ display: "flex", gap: "6px", fontSize: "12px", color: "#94a3b8", lineHeight: "1.5", marginBottom: "4px" }}>
                                  <span style={{ color: "#22c55e", flexShrink: 0, marginTop: "2px" }}>+</span><span>{s}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {d.weaknesses.length > 0 && (
                            <div>
                              <div style={{ fontSize: "10px", color: "#ef4444", fontFamily: "monospace", letterSpacing: "1px", marginBottom: "6px" }}>WEAKNESSES</div>
                              {d.weaknesses.map((w, i) => (
                                <div key={i} style={{ display: "flex", gap: "6px", fontSize: "12px", color: "#94a3b8", lineHeight: "1.5", marginBottom: "4px" }}>
                                  <span style={{ color: "#ef4444", flexShrink: 0, marginTop: "2px" }}>−</span><span>{w}</span>
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
                  { role: "Language", rec: "Python (primary) or R for statistical modeling/viz" },
                  { role: "SAS Role", rec: "Fully viable if team is SAS-native; PROCs excel here" },
                  { role: "SQL Layer", rec: "SQL + dbt against a relational DB for staging" },
                  { role: "Format", rec: "Parquet (analysis), CSV (sharing), Excel (reporting output)" },
                  { role: "Storage", rec: "Relational DB for staging; Parquet/SAS7bdat for analysis" },
                  { role: "Cloud", rec: "Neither required; local or lightweight VM sufficient" },
                ],
                note: "Cloud platform cost is hard to justify at this scale. Python or SAS locally outperforms any cluster. SAS datasets are viable if the pipeline is SAS-only. Avoid Excel as an ETL or staging format; reserve it for final reporting outputs only.",
              },
              {
                scale: "> 1 GB",
                label: "Mid-Scale / Cloud Pays Off",
                color: "#f59e0b",
                stack: [
                  { role: "Language", rec: "Python + SQL (dbt); R for statistical EDA/viz" },
                  { role: "Cloud", rec: "Databricks Serverless for ETL + ML; SAS Viya if regulated" },
                  { role: "Format", rec: "Parquet as primary; CSV only as source/interchange" },
                  { role: "Storage", rec: "Parquet on object storage + DB for staging layer" },
                  { role: "SAS Role", rec: "SAS Viya CAS for distributed SAS workflows; compare cost vs Databricks" },
                  { role: "Excel/SAS7bdat", rec: "Output reporting only; never source or staging at this scale" },
                ],
                note: "Python + SQL + Databricks is the most capable, flexible, and cost-efficient stack. SAS Viya is justified when regulatory compliance, existing SAS investment, or a SAS-skilled team is the primary constraint. Parquet is non-negotiable as the analysis format.",
              },
              {
                scale: "> 100 GB",
                label: "Enterprise / Distributed",
                color: "#ef4444",
                stack: [
                  { role: "Language", rec: "Python (PySpark) + SQL (Spark SQL / dbt)" },
                  { role: "Cloud", rec: "Databricks — clear choice at this scale" },
                  { role: "Format", rec: "Parquet via Delta Lake; CSV only at ingestion boundary" },
                  { role: "Storage", rec: "Delta Lake on object storage; DB for small staging marts only" },
                  { role: "SAS Role", rec: "SAS Viya possible but cost and throughput disadvantages are significant" },
                  { role: "Excel/SAS7bdat", rec: "Output format only; never used for storage, staging, or analysis" },
                ],
                note: "Databricks with Delta Lake is the unambiguous choice. SAS Viya at this scale is significantly more expensive per compute unit and CAS lacks Spark's raw distributed throughput. R and SAS remain valuable for consuming pre-aggregated results downstream. SAS datasets and Excel are output formats only.",
              },
            ].map((rec) => (
              <div key={rec.scale} style={{ borderLeft: `3px solid ${rec.color}`, paddingLeft: "16px" }}>
                <div style={{ fontSize: "11px", fontFamily: "monospace", color: rec.color, letterSpacing: "1px", marginBottom: "2px" }}>{rec.scale}</div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#f1f5f9", marginBottom: "12px" }}>{rec.label}</div>
                {rec.stack.map((s) => (
                  <div key={s.role} style={{ display: "flex", gap: "8px", fontSize: "12px", marginBottom: "5px" }}>
                    <span style={{ color: "#475569", minWidth: "80px", fontFamily: "monospace", fontSize: "11px", paddingTop: "1px", flexShrink: 0 }}>{s.role}</span>
                    <span style={{ color: "#cbd5e1" }}>{s.rec}</span>
                  </div>
                ))}
                <div style={{ marginTop: "12px", fontSize: "11px", color: "#64748b", lineHeight: "1.6", borderTop: "1px solid #1e293b", paddingTop: "10px" }}>{rec.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
