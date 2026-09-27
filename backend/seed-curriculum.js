const { sequelize } = require('./config/db');

const LearningModule = require('./models/LearningModule');
const ModuleContent = require('./models/ModuleContent');

const CURRICULUM_DATA = [
  {
    category: 'CORE_AI',
    subcategory: 'Machine Learning',
    modules: [
      {
        title: 'Introduction to Machine Learning',
        description: 'Fundamentals of ML: supervised vs unsupervised learning, feature engineering, model evaluation metrics, and cross-validation techniques.',
        difficulty: 'beginner',
        estimatedDurationMinutes: 120,
        content: {
          sections: [
            { title: 'What is Machine Learning?', subsections: ['Definitions', 'Types of Learning', 'Applications'] },
            { title: 'Core Concepts', subsections: ['Features and Labels', 'Training vs Testing', 'Overfitting'] },
            { title: 'Common Algorithms', subsections: ['Linear Regression', 'Logistic Regression', 'Decision Trees'] }
          ]
        }
      },
      {
        title: 'Neural Networks & Deep Learning',
        description: 'Deep dive into neural networks, backpropagation, activation functions, and introduction to deep learning architectures.',
        difficulty: 'intermediate',
        estimatedDurationMinutes: 180,
        content: {
          sections: [
            { title: 'Neural Network Basics', subsections: ['Perceptron', 'Layers', 'Weights and Biases'] },
            { title: 'Backpropagation', subsections: ['Gradient Descent', 'Chain Rule', 'Optimization'] },
            { title: 'Deep Learning', subsections: ['CNNs', 'RNNs', 'LSTMs'] }
          ]
        }
      }
    ]
  },
  {
    category: 'APPLIED_AI',
    subcategory: 'Healthcare AI',
    modules: [
      {
        title: 'Medical Image Analysis with AI',
        description: 'Learn how AI is used in radiology, CT scans, MRI analysis, and disease detection using computer vision and deep learning.',
        difficulty: 'intermediate',
        estimatedDurationMinutes: 150,
        content: {
          sections: [
            { title: 'Medical Imaging Fundamentals', subsections: ['X-Ray', 'CT', 'MRI'] },
            { title: 'AI in Diagnosis', subsections: ['Disease Detection', 'Tumor Segmentation', 'Classification'] },
            { title: 'Clinical Applications', subsections: ['Validation', 'Ethics', 'FDA Approval'] }
          ]
        }
      },
      {
        title: 'Drug Discovery using Machine Learning',
        description: 'Explore how ML accelerates drug discovery, molecular modeling, protein structure prediction, and clinical trial optimization.',
        difficulty: 'advanced',
        estimatedDurationMinutes: 180,
        content: {
          sections: [
            { title: 'Drug Development Pipeline', subsections: ['Target Identification', 'Lead Optimization', 'Trials'] },
            { title: 'AI Methods', subsections: ['Molecular Docking', 'QSAR Models', 'Graph Neural Networks'] },
            { title: 'Real-World Cases', subsections: ['AlphaFold', 'COVID-19 Vaccines', 'Rare Diseases'] }
          ]
        }
      }
    ]
  },
  {
    category: 'AI_ENGINEERING',
    subcategory: 'MLOps & Production',
    modules: [
      {
        title: 'Model Deployment & Production Systems',
        description: 'Best practices for deploying ML models in production, containerization, CI/CD pipelines, and monitoring.',
        difficulty: 'intermediate',
        estimatedDurationMinutes: 140,
        content: {
          sections: [
            { title: 'Deployment Strategies', subsections: ['Docker', 'Kubernetes', 'Serverless'] },
            { title: 'CI/CD for ML', subsections: ['Model Versioning', 'Automated Testing', 'Rollback'] },
            { title: 'Monitoring & Observability', subsections: ['Performance Metrics', 'Data Drift', 'Alerts'] }
          ]
        }
      }
    ]
  },
  {
    category: 'BIOLOGY',
    subcategory: 'Molecular Biology',
    modules: [
      {
        title: 'DNA, RNA, and Protein Synthesis',
        description: 'Explore the central dogma of molecular biology: how DNA is transcribed to RNA and translated to proteins.',
        difficulty: 'beginner',
        estimatedDurationMinutes: 100,
        content: {
          sections: [
            { title: 'DNA Structure', subsections: ['Double Helix', 'Base Pairing', 'Chromosomes'] },
            { title: 'Transcription & Translation', subsections: ['mRNA', 'tRNA', 'Ribosomes'] },
            { title: 'Genetic Code', subsections: ['Codons', 'Mutations', 'Gene Expression'] }
          ]
        }
      }
    ]
  },
  {
    category: 'CHEMISTRY',
    subcategory: 'Organic Chemistry',
    modules: [
      {
        title: 'Chemical Bonding & Molecular Structure',
        description: 'Fundamentals of chemical bonds, molecular geometry, and how molecular structure determines properties.',
        difficulty: 'beginner',
        estimatedDurationMinutes: 120,
        content: {
          sections: [
            { title: 'Types of Bonds', subsections: ['Covalent', 'Ionic', 'Hydrogen'] },
            { title: 'Molecular Geometry', subsections: ['VSEPR Theory', 'Hybridization', '3D Structure'] },
            { title: 'Properties & Reactivity', subsections: ['Polarity', 'Electronegativity', 'Reaction Types'] }
          ]
        }
      }
    ]
  },
  {
    category: 'PHYSICS_MATHS',
    subcategory: 'Linear Algebra & Calculus',
    modules: [
      {
        title: 'Linear Algebra for Machine Learning',
        description: 'Essential linear algebra concepts: vectors, matrices, eigenvalues, and their applications in ML.',
        difficulty: 'intermediate',
        estimatedDurationMinutes: 160,
        content: {
          sections: [
            { title: 'Vectors & Matrices', subsections: ['Operations', 'Norms', 'Determinants'] },
            { title: 'Eigenvalues & Eigenvectors', subsections: ['Concepts', 'Diagonalization', 'PCA'] },
            { title: 'Applications in ML', subsections: ['Dimensionality Reduction', 'Optimization', 'Transformations'] }
          ]
        }
      }
    ]
  },
  {
    category: 'CORE_BIOINFORMATICS',
    subcategory: 'Sequence Analysis',
    modules: [
      {
        title: 'DNA Sequence Analysis & Alignment',
        description: 'Learn bioinformatics algorithms: sequence alignment, BLAST, and phylogenetic analysis.',
        difficulty: 'intermediate',
        estimatedDurationMinutes: 140,
        content: {
          sections: [
            { title: 'Sequence Alignment', subsections: ['Pairwise Alignment', 'Multiple Alignment', 'Algorithms'] },
            { title: 'BLAST & Database Searches', subsections: ['Similarity Searching', 'E-values', 'Interpretation'] },
            { title: 'Phylogenetics', subsections: ['Tree Building', 'Evolution', 'Comparative Analysis'] }
          ]
        }
      }
    ]
  },
  {
    category: 'ADVANCED_BIOINFORMATICS',
    subcategory: 'Genomics & Systems Biology',
    modules: [
      {
        title: 'Whole Genome Analysis & Variant Calling',
        description: 'Advanced genomics: NGS analysis, variant detection, annotation, and genome-wide association studies.',
        difficulty: 'advanced',
        estimatedDurationMinutes: 200,
        content: {
          sections: [
            { title: 'NGS Fundamentals', subsections: ['Sequencing Technologies', 'Quality Control', 'Assembly'] },
            { title: 'Variant Analysis', subsections: ['SNP Detection', 'Indels', 'Annotation'] },
            { title: 'GWAS & Population Genetics', subsections: ['Association Studies', 'Statistical Methods', 'Interpretation'] }
          ]
        }
      }
    ]
  }
];

(async () => {
  try {
    console.log('🌱 Seeding curriculum content...\n');
    
    let moduleCount = 0;
    let contentCount = 0;
    
    for (const category of CURRICULUM_DATA) {
      for (const module of category.modules) {
        // Create module - let PostgreSQL generate the UUID
        const moduleResult = await sequelize.query(`
          INSERT INTO learning_modules (id, title, description, category, subcategory, difficulty, "estimatedDurationMinutes", content, "isActive", "createdAt", "updatedAt")
          VALUES (
            gen_random_uuid(),
            '${module.title.replace(/'/g, "''")}',
            '${module.description.replace(/'/g, "''")}',
            '${category.category}',
            '${category.subcategory.replace(/'/g, "''")}',
            '${module.difficulty}',
            ${module.estimatedDurationMinutes},
            '${JSON.stringify(module.content).replace(/'/g, "''")}',
            true,
            now(),
            now()
          )
          RETURNING id;
        `, { type: sequelize.QueryTypes.SELECT });
        
        const moduleId = moduleResult[0]?.id;
        
        moduleCount++;
        console.log(`✓ Created module: ${module.title} (${category.category})`);
      }
    }
    
    console.log(`\n✅ Seeded ${moduleCount} modules successfully!`);
    console.log('📚 Categories: CORE_AI, APPLIED_AI, AI_ENGINEERING, BIOLOGY, CHEMISTRY, PHYSICS_MATHS, CORE_BIOINFORMATICS, ADVANCED_BIOINFORMATICS\n');
    
    process.exit(0);
    
  } catch(err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
})();
