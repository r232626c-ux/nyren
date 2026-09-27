const { sequelize } = require('./config/db');

const COLI_ACADEMY_CURRICULUM = [
  // ========== LEVEL 1: FOUNDATIONS ==========
  {
    level: 1,
    levelName: 'FOUNDATIONS',
    category: 'CORE_AI',
    modules: [
      {
        title: 'Python for Biological Data',
        description: 'Master Python fundamentals with a focus on biological data analysis. Learn variables, functions, file handling, and introduction to Pandas and NumPy.',
        difficulty: 'beginner',
        estimatedDurationMinutes: 480,
        subcategory: 'Python Programming',
        topics: [
          'Python basics',
          'Variables and data types',
          'Functions',
          'File handling',
          'Introduction to Pandas',
          'Introduction to NumPy'
        ],
        labs: [
          'Lab 1: Read DNA sequences from FASTA files',
          'Lab 2: Parse and analyze biological sequences'
        ],
        assignment: {
          title: 'DNA Analysis Tool',
          description: 'Create a Python script that counts nucleotides, calculates GC content, and finds open reading frames',
          deliverable: 'Python script + analysis report'
        },
        dataset: 'Sample DNA sequences from National Center for Biotechnology Information (NCBI)',
        resources: [
          'https://www.ncbi.nlm.nih.gov/genbank/',
          'NumPy Documentation',
          'Pandas Documentation'
        ]
      },
      {
        title: 'Molecular Biology Fundamentals',
        description: 'Understand the central dogma: DNA → RNA → Protein. Learn DNA structure, transcription, translation, and the molecular basis of life.',
        difficulty: 'beginner',
        estimatedDurationMinutes: 360,
        subcategory: 'Molecular Biology',
        topics: [
          'DNA structure',
          'RNA transcription',
          'Protein translation',
          'Central dogma',
          'Genetic code',
          'Gene expression'
        ],
        labs: [
          'Lab 1: Simulate transcription process',
          'Lab 2: Model protein translation from mRNA'
        ],
        assignment: {
          title: 'Mutation Impact Analysis',
          description: 'Analyze mutations and predict their effects on protein sequences',
          deliverable: 'Mutation impact report with predictions'
        },
        dataset: 'Human hemoglobin gene sequence from NCBI',
        resources: [
          'NCBI Gene Database',
          'UniProt Database',
          'PubMed Articles'
        ]
      },
      {
        title: 'Statistics for Bioinformatics',
        description: 'Learn statistical methods essential for analyzing biological data: hypothesis testing, correlations, distributions, and data interpretation.',
        difficulty: 'beginner',
        estimatedDurationMinutes: 420,
        subcategory: 'Biostatistics',
        topics: [
          'Mean, median, mode',
          'Standard deviation and variance',
          'Hypothesis testing (t-tests, ANOVA)',
          'Correlation analysis',
          'Statistical distributions',
          'P-values and significance'
        ],
        labs: [
          'Lab 1: Gene expression statistics',
          'Lab 2: Statistical comparison of datasets'
        ],
        assignment: {
          title: 'Expression Level Comparison',
          description: 'Compare gene expression levels between healthy and diseased samples using statistical tests',
          deliverable: 'Statistical analysis notebook with visualizations'
        },
        dataset: 'Gene expression dataset from Gene Expression Omnibus (GEO)',
        resources: [
          'GEO Database: https://www.ncbi.nlm.nih.gov/geo/',
          'SciPy Statistics Documentation',
          'R ggplot2 Guide'
        ]
      },
      {
        title: 'Linux & Scientific Computing',
        description: 'Master Linux command-line tools, bash scripting, and high-performance computing basics for bioinformatics workflows.',
        difficulty: 'beginner',
        estimatedDurationMinutes: 300,
        subcategory: 'Computing Infrastructure',
        topics: [
          'Linux commands and file systems',
          'Bash scripting',
          'HPC basics',
          'Job scheduling',
          'Remote computing',
          'Pipeline automation'
        ],
        labs: [
          'Lab 1: Create bash workflows',
          'Lab 2: FASTQ file processing pipeline'
        ],
        assignment: {
          title: 'FASTQ Processing Workflow',
          description: 'Create a complete bash workflow for processing FASTQ sequencing files',
          deliverable: 'Automated bash script with documentation'
        },
        dataset: 'Example FASTQ files from public sequencing projects',
        resources: [
          'Linux Command Reference',
          'Bash Scripting Guide',
          'HPC Cluster Documentation'
        ]
      }
    ]
  },

  // ========== LEVEL 2: CORE BIOINFORMATICS ==========
  {
    level: 2,
    levelName: 'CORE BIOINFORMATICS',
    category: 'CORE_BIOINFORMATICS',
    modules: [
      {
        title: 'DNA Sequence Analysis',
        description: 'Learn sequence formats (FASTA, FASTQ), pairwise alignment algorithms, and BLAST for sequence similarity searching.',
        difficulty: 'intermediate',
        estimatedDurationMinutes: 420,
        subcategory: 'Sequence Analysis',
        topics: [
          'FASTA and FASTQ formats',
          'Pairwise alignment algorithms',
          'BLAST (Basic Local Alignment Search Tool)',
          'Scoring matrices',
          'Gap penalties',
          'Multiple sequence alignment'
        ],
        labs: [
          'Lab 1: Perform BLAST searches',
          'Lab 2: Analyze alignment results'
        ],
        assignment: {
          title: 'Unknown Sequence Identification',
          description: 'Use BLAST to identify unknown DNA sequences against reference databases',
          deliverable: 'Sequence identification report'
        },
        dataset: 'DNA sequences from NCBI GenBank',
        resources: [
          'NCBI BLAST: https://blast.ncbi.nlm.nih.gov/',
          'BioPython Documentation',
          'Sequence Alignment Best Practices'
        ]
      },
      {
        title: 'Genomics & Genome Browsers',
        description: 'Understand genome structure, gene annotation, SNPs, and use tools like Ensembl and NCBI Gene Database.',
        difficulty: 'intermediate',
        estimatedDurationMinutes: 360,
        subcategory: 'Genomics',
        topics: [
          'Genome structure and organization',
          'Gene annotation',
          'SNPs and genetic variants',
          'Genome browsers',
          'Functional annotation',
          'Gene ontology'
        ],
        labs: [
          'Lab 1: Navigate Ensembl Genome Browser',
          'Lab 2: Explore NCBI Gene Database'
        ],
        assignment: {
          title: 'Disease-Associated Gene Annotation',
          description: 'Annotate a disease-associated gene (like BRCA1) and document findings',
          deliverable: 'Gene annotation report with genomic context'
        },
        dataset: 'BRCA1 genomic region from Ensembl/NCBI',
        resources: [
          'Ensembl Genome Browser: https://www.ensembl.org',
          'NCBI Gene Database: https://www.ncbi.nlm.nih.gov/gene/',
          'Genome Browser User Guide'
        ]
      },
      {
        title: 'RNA-Seq Analysis',
        description: 'Complete RNA-seq pipeline: quality control, alignment, quantification, and differential expression analysis.',
        difficulty: 'intermediate',
        estimatedDurationMinutes: 540,
        subcategory: 'Transcriptomics',
        topics: [
          'RNA sequencing technology',
          'Quality control with FastQC',
          'Read alignment with HISAT2',
          'Gene expression quantification',
          'Differential expression with DESeq2',
          'Visualization and interpretation'
        ],
        labs: [
          'Lab 1: RNA-seq QC and alignment',
          'Lab 2: Differential expression analysis'
        ],
        assignment: {
          title: 'Differential Gene Expression Study',
          description: 'Identify differentially expressed genes in cancer vs. control samples',
          deliverable: 'RNA-seq analysis report with volcano plots'
        },
        dataset: 'Breast cancer RNA-seq samples from The Cancer Genome Atlas (TCGA)',
        resources: [
          'FastQC: https://www.bioinformatics.babraham.ac.uk/projects/fastqc/',
          'HISAT2 Documentation',
          'DESeq2 Vignette',
          'RNA-seq Best Practices'
        ]
      },
      {
        title: 'Phylogenetics & Evolution',
        description: 'Build evolutionary trees using neighbor-joining and maximum likelihood methods to study evolutionary relationships.',
        difficulty: 'intermediate',
        estimatedDurationMinutes: 360,
        subcategory: 'Evolutionary Biology',
        topics: [
          'Evolutionary trees and phylogenetics',
          'Neighbor-joining algorithm',
          'Maximum likelihood methods',
          'Bayesian inference',
          'Molecular clocks',
          'Dating species divergence'
        ],
        labs: [
          'Lab 1: Construct phylogenetic trees',
          'Lab 2: Analyze evolutionary relationships'
        ],
        assignment: {
          title: 'Phylogenetic Tree Construction',
          description: 'Build a phylogenetic tree of coronavirus spike protein sequences',
          deliverable: 'Phylogenetic tree with evolutionary insights'
        },
        dataset: 'Coronavirus spike protein sequences from NCBI',
        resources: [
          'MEGA Software',
          'IQ-TREE Documentation',
          'RAxML Guide'
        ]
      }
    ]
  },

  // ========== LEVEL 3: AI & MACHINE LEARNING ==========
  {
    level: 3,
    levelName: 'AI & MACHINE LEARNING',
    category: 'APPLIED_AI',
    modules: [
      {
        title: 'Machine Learning Fundamentals',
        description: 'Introduction to machine learning: classification, regression, model evaluation metrics, and practical applications in biology.',
        difficulty: 'intermediate',
        estimatedDurationMinutes: 480,
        subcategory: 'Machine Learning',
        topics: [
          'Supervised learning',
          'Classification and regression',
          'Training and testing',
          'Cross-validation',
          'Model evaluation metrics',
          'Overfitting and regularization'
        ],
        labs: [
          'Lab 1: Classification models',
          'Lab 2: Model evaluation and comparison'
        ],
        assignment: {
          title: 'Disease Status Prediction',
          description: 'Build ML models to predict disease status using gene expression data',
          deliverable: 'Machine learning notebook with model comparison'
        },
        dataset: 'Leukemia microarray dataset (Golub et al.)',
        resources: [
          'scikit-learn Documentation',
          'XGBoost Guide',
          'ML Best Practices in Biology'
        ]
      },
      {
        title: 'Feature Selection & Biomarker Discovery',
        description: 'Learn dimensionality reduction (PCA) and biomarker identification to reduce features and find predictive genes.',
        difficulty: 'intermediate',
        estimatedDurationMinutes: 420,
        subcategory: 'Feature Engineering',
        topics: [
          'Principal Component Analysis (PCA)',
          'Feature importance ranking',
          'Biomarker identification',
          'Dimensionality reduction',
          'Feature scaling and normalization',
          'Selection methods (filter, wrapper, embedded)'
        ],
        labs: [
          'Lab 1: PCA analysis',
          'Lab 2: Feature importance extraction'
        ],
        assignment: {
          title: 'Biomarker Panel Reduction',
          description: 'Reduce 20,000 genes to top 50 biomarkers for breast cancer prediction',
          deliverable: 'Biomarker panel with validation metrics'
        },
        dataset: 'TCGA Breast Cancer Dataset',
        resources: [
          'scikit-learn Feature Selection',
          'Boruta Algorithm',
          'Biomarker Discovery Literature'
        ]
      },
      {
        title: 'Deep Learning & Neural Networks',
        description: 'Master deep learning frameworks (TensorFlow, PyTorch) to build neural networks for genomic data analysis.',
        difficulty: 'advanced',
        estimatedDurationMinutes: 600,
        subcategory: 'Deep Learning',
        topics: [
          'Neural network architecture',
          'TensorFlow and Keras',
          'PyTorch basics',
          'Convolutional Neural Networks',
          'Recurrent Neural Networks',
          'Hyperparameter tuning'
        ],
        labs: [
          'Lab 1: Build neural networks with TensorFlow',
          'Lab 2: PyTorch implementation'
        ],
        assignment: {
          title: 'Deep Learning Classifier',
          description: 'Build a neural network to classify cancer gene expression profiles',
          deliverable: 'Trained model with performance analysis'
        },
        dataset: 'Cancer gene expression datasets',
        resources: [
          'TensorFlow Documentation',
          'PyTorch Tutorials',
          'Deep Learning for Biology'
        ]
      },
      {
        title: 'AI for DNA & Sequence Classification',
        description: 'Use CNNs and RNNs to predict genome features like promoter regions and regulatory elements from DNA sequences.',
        difficulty: 'advanced',
        estimatedDurationMinutes: 540,
        subcategory: 'Genomic AI',
        topics: [
          'Genomic prediction',
          'Sequence classification',
          'CNNs for DNA sequences',
          'RNNs for sequential data',
          'Attention mechanisms',
          'Transformer models'
        ],
        labs: [
          'Lab 1: CNN for DNA classification',
          'Lab 2: Promoter region prediction'
        ],
        assignment: {
          title: 'Promoter Region Prediction',
          description: 'Train a CNN to predict promoter regions from raw DNA sequences',
          deliverable: 'Model with accuracy metrics and visualizations'
        },
        dataset: 'Human genome promoter dataset',
        resources: [
          'DeepGenome Papers',
          'Kipoi Model Zoo',
          'Sequence DL Tutorial'
        ]
      }
    ]
  },

  // ========== LEVEL 4: ADVANCED BIO-AI ==========
  {
    level: 4,
    levelName: 'ADVANCED BIO-AI',
    category: 'ADVANCED_BIOINFORMATICS',
    modules: [
      {
        title: 'Cancer Genomics & Oncoinformatics',
        description: 'Analyze somatic mutations, identify driver genes, and apply precision oncology approaches to cancer genomics.',
        difficulty: 'advanced',
        estimatedDurationMinutes: 480,
        subcategory: 'Cancer Biology',
        topics: [
          'Somatic mutations vs. germline',
          'Driver genes and oncogenes',
          'Cancer signaling pathways',
          'Precision oncology',
          'Tumor evolution',
          'Immunotherapy biomarkers'
        ],
        labs: [
          'Lab 1: Mutation analysis',
          'Lab 2: Driver gene identification'
        ],
        assignment: {
          title: 'Cancer Biomarker Discovery',
          description: 'Identify potential cancer biomarkers from TCGA BRCA project data',
          deliverable: 'Biomarker discovery report with clinical implications'
        },
        dataset: 'TCGA BRCA (Breast Cancer) project',
        resources: [
          'TCGA Database: https://www.cancer.gov/tcga',
          'cBioPortal: https://www.cbioportal.org/',
          'Cancer Genomics Literature'
        ]
      },
      {
        title: 'Variant Calling & Annotation Pipeline',
        description: 'Complete variant discovery pipeline: alignment, variant detection, and functional annotation.',
        difficulty: 'advanced',
        estimatedDurationMinutes: 600,
        subcategory: 'Genomic Variants',
        topics: [
          'Read alignment with BWA',
          'Variant detection and calling',
          'Variant quality filtering',
          'Variant annotation with ANNOVAR',
          'Functional prediction',
          'Database integration'
        ],
        labs: [
          'Lab 1: BWA alignment',
          'Lab 2: GATK variant calling'
        ],
        assignment: {
          title: 'Variant Detection & Interpretation',
          description: 'Detect and annotate variants from whole-exome sequencing data',
          deliverable: 'VCF file with annotated variants and interpretation'
        },
        dataset: 'Public whole-exome sequencing data',
        resources: [
          'BWA Documentation',
          'GATK Best Practices',
          'ANNOVAR Guide',
          'Variant Calling Pipeline'
        ]
      },
      {
        title: 'Structural Bioinformatics & Protein Structure',
        description: 'Analyze protein 3D structures from PDB files, perform structural alignment, and drug interaction analysis.',
        difficulty: 'advanced',
        estimatedDurationMinutes: 420,
        subcategory: 'Structural Biology',
        topics: [
          'Protein structures and PDB files',
          'Structural alignment',
          'Molecular visualization',
          'Structure validation',
          'Domain analysis',
          'Quality assessment'
        ],
        labs: [
          'Lab 1: PyMOL protein visualization',
          'Lab 2: Structure analysis'
        ],
        assignment: {
          title: 'Protein-Drug Interaction Analysis',
          description: 'Analyze a protein structure and predict drug interaction sites',
          deliverable: 'Structural analysis with interaction predictions'
        },
        dataset: 'Protein structures from Protein Data Bank (PDB)',
        resources: [
          'PDB: https://www.rcsb.org/',
          'PyMOL Documentation',
          'Chimera User Guide',
          'Structural Analysis Tools'
        ]
      },
      {
        title: 'Molecular Docking & Drug-Protein Binding',
        description: 'Predict binding interactions between ligands and proteins using molecular docking simulations.',
        difficulty: 'advanced',
        estimatedDurationMinutes: 480,
        subcategory: 'Drug Design',
        topics: [
          'Molecular docking principles',
          'Ligand preparation',
          'Binding site identification',
          'Scoring functions',
          'Docking workflows',
          'Post-docking analysis'
        ],
        labs: [
          'Lab 1: AutoDock Vina setup',
          'Lab 2: Docking simulation and analysis'
        ],
        assignment: {
          title: 'Compound Docking Study',
          description: 'Dock multiple compounds against EGFR protein and rank by binding affinity',
          deliverable: 'Docking results with top candidate compounds'
        },
        dataset: 'EGFR protein structure + compound library',
        resources: [
          'AutoDock Vina Guide',
          'Discovery Studio Tutorial',
          'Docking Best Practices',
          'PubChem: https://pubchem.ncbi.nlm.nih.gov/'
        ]
      }
    ]
  },

  // ========== LEVEL 5: AI-DRIVEN DRUG DISCOVERY ==========
  {
    level: 5,
    levelName: 'AI-DRIVEN DRUG DISCOVERY',
    category: 'APPLIED_AI',
    modules: [
      {
        title: 'Drug Discovery Pipeline',
        description: 'End-to-end drug discovery: target identification, virtual screening, and lead optimization.',
        difficulty: 'advanced',
        estimatedDurationMinutes: 540,
        subcategory: 'Drug Development',
        topics: [
          'Target identification',
          'Virtual screening',
          'Lead identification',
          'Lead optimization',
          'Structure-activity relationships',
          'Clinical translation'
        ],
        labs: [
          'Lab 1: Virtual screening workflow',
          'Lab 2: Lead compound analysis'
        ],
        assignment: {
          title: 'Virtual Screening Campaign',
          description: 'Design a complete virtual screening workflow for drug discovery',
          deliverable: 'Screening protocol with candidate compounds ranked'
        },
        dataset: 'Drug-like molecules from PubChem',
        resources: [
          'PubChem API',
          'ZINC Database',
          'Drug Discovery Reviews'
        ]
      },
      {
        title: 'ADMET & Pharmacokinetics Prediction',
        description: 'Predict drug absorption, distribution, metabolism, excretion, and toxicity to evaluate drug candidates.',
        difficulty: 'advanced',
        estimatedDurationMinutes: 420,
        subcategory: 'Drug Properties',
        topics: [
          'ADMET properties',
          'Toxicity prediction',
          'Pharmacokinetics modeling',
          'Drug-like property filters',
          'Lipinski rules',
          'Bioavailability prediction'
        ],
        labs: [
          'Lab 1: Descriptor calculation',
          'Lab 2: ADMET prediction models'
        ],
        assignment: {
          title: 'Drug Candidate Evaluation',
          description: 'Evaluate drug candidates for ADMET properties and toxicity',
          deliverable: 'ADMET report with pass/fail recommendations'
        },
        dataset: 'FDA-approved drug dataset',
        resources: [
          'ADMET Predictor Tools',
          'ChemAxon Tools',
          'ADMET Literature'
        ]
      },
      {
        title: 'Multi-Omics Integration & Systems Biology',
        description: 'Integrate genomics, transcriptomics, and proteomics data to build systems-level understanding of disease.',
        difficulty: 'advanced',
        estimatedDurationMinutes: 480,
        subcategory: 'Omics Integration',
        topics: [
          'Genomic data integration',
          'Transcriptomic data integration',
          'Proteomic data analysis',
          'Pathway analysis',
          'Network biology',
          'Systems-level modeling'
        ],
        labs: [
          'Lab 1: Data harmonization',
          'Lab 2: Pathway enrichment analysis'
        ],
        assignment: {
          title: 'Multi-Omics Data Integration',
          description: 'Integrate genomics, transcriptomics, and proteomics datasets',
          deliverable: 'Integrated analysis with network visualization'
        },
        dataset: 'Cancer multi-omics samples from TCGA/GEO',
        resources: [
          'MOFA Framework',
          'mixOmics Package',
          'Systems Biology Tools'
        ]
      },
      {
        title: 'Biomedical NLP & Literature Mining',
        description: 'Use BioBERT and NLP techniques to extract biomedical knowledge from literature for drug discovery.',
        difficulty: 'advanced',
        estimatedDurationMinutes: 480,
        subcategory: 'Bioinformatics AI',
        topics: [
          'BioBERT and language models',
          'Named entity recognition',
          'Relation extraction',
          'Literature mining',
          'Clinical text analysis',
          'Knowledge graph construction'
        ],
        labs: [
          'Lab 1: BioBERT fine-tuning',
          'Lab 2: PubMed literature mining'
        ],
        assignment: {
          title: 'PubMed Paper Summarization System',
          description: 'Build an NLP system to summarize and extract insights from PubMed papers',
          deliverable: 'Summarization tool with use case examples'
        },
        dataset: 'PubMed abstracts from https://pubmed.ncbi.nlm.nih.gov/',
        resources: [
          'BioBERT GitHub',
          'Hugging Face Transformers',
          'PubMed API Documentation'
        ]
      }
    ]
  },

  // ========== LEVEL 6: CAPSTONE PROJECTS ==========
  {
    level: 6,
    levelName: 'CAPSTONE PROJECTS',
    category: 'AI_ENGINEERING',
    modules: [
      {
        title: 'Capstone: Cancer Biomarker Discovery System',
        description: 'Build an end-to-end ML system to discover, validate, and deploy cancer biomarkers using multi-omics data.',
        difficulty: 'advanced',
        estimatedDurationMinutes: 720,
        subcategory: 'Capstone Project',
        topics: [
          'Data collection and preprocessing',
          'Feature engineering',
          'Machine learning model development',
          'Biomarker validation',
          'Clinical significance',
          'Deployment and evaluation'
        ],
        labs: [
          'Lab 1: Data integration from TCGA',
          'Lab 2: Feature selection and validation',
          'Lab 3: Model development and testing'
        ],
        assignment: {
          title: 'Cancer Biomarker Discovery',
          description: 'Discover and validate predictive biomarkers for breast cancer prognosis',
          deliverable: 'Complete biomarker panel, ML models, research paper, and GitHub repository'
        },
        dataset: 'TCGA BRCA and GEO datasets',
        resources: [
          'TCGA Portal',
          'GEO Database',
          'Biomarker Discovery Literature'
        ]
      },
      {
        title: 'Capstone: AI Drug Discovery Platform',
        description: 'Develop a complete computational platform for virtual drug screening, docking, and ADMET prediction.',
        difficulty: 'advanced',
        estimatedDurationMinutes: 720,
        subcategory: 'Capstone Project',
        topics: [
          'Target selection',
          'Virtual screening workflow',
          'Molecular docking pipeline',
          'ADMET prediction',
          'Lead optimization',
          'Platform deployment'
        ],
        labs: [
          'Lab 1: Screening pipeline',
          'Lab 2: Docking and scoring',
          'Lab 3: End-to-end integration'
        ],
        assignment: {
          title: 'Drug Discovery Platform',
          description: 'Build a drug discovery platform with docking and ADMET screening',
          deliverable: 'Functional platform, documentation, candidate compounds, and GitHub code'
        },
        dataset: 'PDB proteins + PubChem compounds',
        resources: [
          'PDB, PubChem, AutoDock Vina',
          'Drug Discovery Pipeline Papers'
        ]
      },
      {
        title: 'Capstone: Genomic Disease Predictor',
        description: 'Create an AI system to predict disease status and prognosis from genomic and gene expression data.',
        difficulty: 'advanced',
        estimatedDurationMinutes: 720,
        subcategory: 'Capstone Project',
        topics: [
          'Genomic data analysis',
          'Gene expression profiling',
          'Variant interpretation',
          'Disease prediction models',
          'Risk stratification',
          'Visualization dashboard'
        ],
        labs: [
          'Lab 1: Data preprocessing',
          'Lab 2: Model training and validation',
          'Lab 3: Dashboard development'
        ],
        assignment: {
          title: 'Disease Prediction System',
          description: 'Build a web dashboard for disease prediction and risk stratification',
          deliverable: 'AI prediction model, interactive web dashboard, and documentation'
        },
        dataset: 'Gene expression and variant datasets',
        resources: [
          'Gene datasets, Prediction modeling',
          'Web framework (Flask/React)'
        ]
      },
      {
        title: 'Capstone: COLI BioAI Research Assistant',
        description: 'Build an intelligent AI chatbot that assists researchers with PubMed queries, data analysis, and knowledge discovery.',
        difficulty: 'advanced',
        estimatedDurationMinutes: 720,
        subcategory: 'Capstone Project',
        topics: [
          'Large language models',
          'Literature knowledge bases',
          'Question-answering systems',
          'Data retrieval and integration',
          'Multi-modal AI',
          'Conversational interfaces'
        ],
        labs: [
          'Lab 1: Knowledge base construction',
          'Lab 2: LLM fine-tuning',
          'Lab 3: Chatbot integration'
        ],
        assignment: {
          title: 'AI Research Assistant',
          description: 'Build a conversational AI that helps researchers explore biomedical literature and data',
          deliverable: 'Functional AI assistant, API backend, web/mobile interface'
        },
        dataset: 'PubMed, NCBI, Ensembl, biomedical knowledge bases',
        resources: [
          'PubMed API, OpenAI API',
          'Vector databases, LLM frameworks'
        ]
      }
    ]
  }
];

async function seedColiAcademy() {
  try {
    console.log('🌱 Seeding COLI Academy Full Curriculum...\n');
    
    let totalModules = 0;
    let totalContent = 0;

    for (const level of COLI_ACADEMY_CURRICULUM) {
      console.log(`\n📚 ${level.level}. ${level.levelName}`);
      console.log('='.repeat(50));

      for (const module of level.modules) {
        // Create module
        const moduleResult = await sequelize.query(`
          INSERT INTO learning_modules (
            id, title, description, category, subcategory, difficulty, 
            "estimatedDurationMinutes", content, "isActive", "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid(),
            '${module.title.replace(/'/g, "''")}',
            '${module.description.replace(/'/g, "''")}',
            '${level.category}',
            '${module.subcategory.replace(/'/g, "''")}',
            '${module.difficulty}',
            ${module.estimatedDurationMinutes},
            '${JSON.stringify({
              topics: module.topics,
              labs: module.labs,
              assignment: module.assignment,
              dataset: module.dataset,
              resources: module.resources
            }).replace(/'/g, "''")}',
            true,
            now(),
            now()
          )
          RETURNING id;
        `, { type: sequelize.QueryTypes.SELECT });

        const moduleId = moduleResult[0]?.id;
        if (!moduleId) {
          console.error(`❌ Failed to create module: ${module.title}`);
          continue;
        }

        totalModules++;

        // Create content items (topics/labs/assignment)
        let contentOrder = 1;

        // Add topics as reading materials
        for (const topic of module.topics) {
          await sequelize.query(`
            INSERT INTO module_contents (
              id, "moduleId", title, "contentType", content, "estimatedDurationMinutes",
              difficulty, "orderIndex", "isActive", "createdAt", "updatedAt"
            ) VALUES (
              gen_random_uuid(),
              '${moduleId}',
              'Topic: ${topic.replace(/'/g, "''")}',
              'reading',
              '${topic.replace(/'/g, "''")}',
              ${Math.ceil(module.estimatedDurationMinutes / (module.topics.length + 2))},
              '${module.difficulty}',
              ${contentOrder},
              true,
              now(),
              now()
            );
          `);
          contentOrder++;
          totalContent++;
        }

        // Add labs
        for (let i = 0; i < module.labs.length; i++) {
          await sequelize.query(`
            INSERT INTO module_contents (
              id, "moduleId", title, "contentType", content, "estimatedDurationMinutes",
              difficulty, "orderIndex", "isActive", "createdAt", "updatedAt"
            ) VALUES (
              gen_random_uuid(),
              '${moduleId}',
              '${module.labs[i].replace(/'/g, "''")}',
              'lab',
              '${module.labs[i].replace(/'/g, "''")}',
              ${Math.ceil(module.estimatedDurationMinutes / 3)},
              '${module.difficulty}',
              ${contentOrder},
              true,
              now(),
              now()
            );
          `);
          contentOrder++;
          totalContent++;
        }

        // Add assignment
        await sequelize.query(`
          INSERT INTO module_contents (
            id, "moduleId", title, "contentType", content, "estimatedDurationMinutes",
            difficulty, "orderIndex", "isActive", "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid(),
            '${moduleId}',
            'Assignment: ${module.assignment.title.replace(/'/g, "''")}',
            'exercise',
            '${(module.assignment.description + ' Deliverable: ' + module.assignment.deliverable).replace(/'/g, "''")}',
            ${Math.ceil(module.estimatedDurationMinutes / 2)},
            '${module.difficulty}',
            ${contentOrder},
            true,
            now(),
            now()
          );
        `);
        contentOrder++;
        totalContent++;

        console.log(`  ✓ ${module.title} (${module.difficulty})`);
      }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ Seeded ${totalModules} modules with ${totalContent} content items`);
    console.log(`📊 Coverage:`);
    console.log(`   • Level 1: 4 foundation modules`);
    console.log(`   • Level 2: 4 core bioinformatics modules`);
    console.log(`   • Level 3: 4 AI & ML modules`);
    console.log(`   • Level 4: 4 advanced bio-AI modules`);
    console.log(`   • Level 5: 4 drug discovery modules`);
    console.log(`   • Level 6: 4 capstone projects`);
    console.log(`\n🎓 Total: 24 comprehensive modules covering 6 levels of the COLI Academy curriculum`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

seedColiAcademy();
