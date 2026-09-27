# Antibacterial Medicinal Chemistry Intelligence - Frontend Module

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: 2024  
**Type**: React Native (Expo) + Web-compatible module

---

## 📋 Overview

The Antibacterial Medicinal Chemistry Intelligence system provides a complete scientific analysis framework for evaluating antibiotic compounds. This frontend module integrates with the backend scientific engines to deliver real-time molecular analysis, target prediction, resistance risk assessment, and lead optimization recommendations.

### Key Features

- **Real-time Compound Analysis**: Submit SMILES strings → receive comprehensive analysis
- **Multi-Target Prediction**: Protein, ribosome, membrane, DNA/RNA targeting with confidence scores
- **Antibiotic-Likeness Scoring**: Chemistry-based scoring aligned with known antibiotics
- **Resistance Risk Analysis**: Scaffold novelty, cross-resistance potential, resistance mechanisms
- **Lead Optimization**: Multi-objective optimization (activity, permeability, toxicity, resistance, synthesis)
- **Chemical Space Visualization**: 2D plots, descriptor ranges, structure comparisons
- **Production-Grade Error Handling**: User-friendly messages, validation, recovery
- **React Hooks**: Complete state management and lifecycle integration
- **Type-Safe Utilities**: Formatting, validation, classification, reporting

---

## 🏗️ Module Structure

```
scientific/antibacterial/
├── screens/
│   └── AntibacterialAnalysisScreen.js        # Main UI screen
├── components/
│   ├── analysisComponents.js                 # Data display cards
│   └── ChartComponents.js                    # Visualization charts
├── services/
│   └── AntibacterialAPI.js                   # Backend API client
├── hooks/
│   └── useAntibacterialHooks.js              # Custom React hooks
├── utils/
│   └── analysisUtils.js                      # Utilities & formatters
├── index.js                                  # Main export (this file)
└── README.md                                 # Full documentation
```

### File Sizes
- **AntibacterialAnalysisScreen.js**: ~450 lines (complete UI)
- **analysisComponents.js**: ~350 lines (4 card components)
- **ChartComponents.js**: ~400 lines (3 visualization components)
- **useAntibacterialHooks.js**: ~400 lines (10 custom hooks)
- **analysisUtils.js**: ~600 lines (utilities & formatting)
- **Total**: ~2,200 lines of production code

---

## 🚀 Quick Start

### 1. Basic Analysis

```javascript
import { AntibacterialAnalysisScreen } from '@scientific/antibacterial';

export default function App() {
  return <AntibacterialAnalysisScreen />;
}
```

### 2. Using Hooks for Fine-Grained Control

```javascript
import { useAntibacterialAnalysis, Classifications } from '@scientific/antibacterial';

export function MyCompoundAnalyzer() {
  const { smiles, setSmiles, analysisResult, loading, error, analyze } = 
    useAntibacterialAnalysis();

  const handleAnalyze = async () => {
    const result = await analyze(smiles);
    if (result) {
      console.log('Analysis complete:', result);
    }
  };

  return (
    <View>
      <TextInput 
        value={smiles} 
        onChangeText={setSmiles}
        placeholder="Enter SMILES..."
      />
      <Button onPress={handleAnalyze} title="Analyze" />
      
      {analysisResult && (
        <Text>
          Target: {Classifications.getTargetInfo(
            analysisResult.summary.primaryTarget
          ).name}
        </Text>
      )}
    </View>
  );
}
```

### 3. Custom Visualization

```javascript
import { 
  ChemicalSpaceChart, 
  DescriptorRangeVisualization,
  MultiObjectiveChart 
} from '@scientific/antibacterial';

export function CustomDashboard({ analysis }) {
  const desc = analysis.descriptors.physicochemical;
  
  return (
    <View>
      <ChemicalSpaceChart mw={desc.mw} tpsa={desc.tpsa} />
      <DescriptorRangeVisualization descriptors={desc} />
      <MultiObjectiveChart objectives={analysis.optimization.objectives} />
    </View>
  );
}
```

---

## 📚 API Reference

### Screens

#### `<AntibacterialAnalysisScreen />`
Complete analysis dashboard with SMILES input, tab-based results, error handling.

**Props**: None (manages internal state)

**State**:
- `smiles`: Current SMILES string
- `analysisResult`: Current full analysis result
- `loading`: API call in progress
- `error`: Error message (if any)
- `activeTab`: Current active tab ('overview', 'descriptors', 'target', 'resistance')

**Tabs**:
- **Overview**: Overall score, metrics, key recommendations
- **Descriptors**: Physicochemical properties with Ro5 compliance
- **Target**: Target classification with confidence and explanation
- **Resistance**: Risk analysis with factors and mechanisms

---

### Components

#### `<DescriptorCard />`
Display individual molecular descriptor with status indicators.

**Props**:
```javascript
{
  label: string,           // e.g., "Molecular Weight"
  value: number,           // e.g., 425.5
  unit: string,            // e.g., "Da"
  min?: number,            // minimum acceptable value
  max?: number,            // maximum acceptable value
  ideal?: string,          // ideal range description
  status?: 'good'|'warning'|'critical'
}
```

#### `<TargetPredictionCard />`
Show target class prediction with confidence level.

**Props**:
```javascript
{
  targetClass: string,     // e.g., "Ribosome Targeting"
  confidence: number,      // 0.0-1.0, shown as percentage
  explanation: string      // Why this target was predicted
}
```

#### `<OptimizationPanel />`
Display multi-objective optimization scores and recommendations.

**Props**:
```javascript
{
  objectives: Array<{
    objective: string,     // e.g., "Activity Potential"
    score: number,         // 0.0-1.0
    effort?: number        // Estimated effort in hours
  }>,
  recommendations: Array<string>  // Action items
}
```

#### `<ResistanceRiskCard />`
Show resistance risk with contributing factors and mechanisms.

**Props**:
```javascript
{
  riskLevel: 'Low'|'Moderate'|'High',
  factors: Array<{
    name: string,
    score: number          // 0.0-1.0
  }>,
  mechanisms: Array<string>  // Expected resistance pathways
}
```

---

### Visualization Components

#### `<ChemicalSpaceChart />`
2D scatter plot showing compound position in chemical property space.

**Props**:
```javascript
{
  mw: number,              // Molecular weight (Da)
  tpsa: number,            // Topological polar surface area (Ų)
  showRegions?: boolean    // Show antibiotic regions (default: true)
}
```

**Features**:
- Compound plotted as blue point
- Background regions show antibiotic target zones
- Grid for reference
- Coordinate label displaying exact values

#### `<DescriptorRangeVisualization />`
Show how each descriptor compares to drug-like ranges.

**Props**:
```javascript
{
  descriptors: {
    mw: number,
    logp: number,
    tpsa: number,
    hbd: number,
    hba: number
  }
}
```

**Features**:
- Visual bars showing value position in range
- Green ✓ for in-range, red ✗ for out-of-range
- Optimal ranges highlighted

#### `<MultiObjectiveChart />`
Show multi-objective optimization scores with effort indicators.

**Props**:
```javascript
{
  objectives: Array<{
    objective: string,
    score: number,
    effort?: number,
    impact?: number
  }>
}
```

**Features**:
- Average score calculation
- Color coding (green/yellow/red)
- Effort estimates for prioritization

---

### Hooks

#### `useAntibacterialAnalysis()`
Main hook for compound analysis with history tracking.

```javascript
const {
  smiles,                    // Current SMILES string
  setSmiles,                 // Update SMILES
  analysisResult,            // Full analysis result or null
  setAnalysisResult,         // Manual result update
  loading,                   // API call in progress
  error,                     // Error message or null
  history,                   // Array of past analyses
  analyze,                   // async (smiles) => result
  clearHistory,              // Clear all history
  loadFromHistory            // Load previous analysis
} = useAntibacterialAnalysis();
```

**Example**:
```javascript
const hook = useAntibacterialAnalysis();
await hook.analyze('CC(C)Cc1ccc(cc1)[C@@H](C)C(=O)O');
console.log(hook.analysisResult);
hook.loadFromHistory(hook.history[0]);
```

#### `useTargetPrediction()`
Isolated target class prediction.

```javascript
const {
  prediction,       // Current prediction or null
  loading,          // API call in progress
  error,            // Error message or null
  predict           // async (smiles) => prediction
} = useTargetPrediction();
```

#### `useAntibioticLikenessScore()`
Isolated antibiotic-likeness scoring.

```javascript
const {
  score,            // Current score or null
  loading,
  error,
  scoreCompound     // async (smiles, targetClass) => score
} = useAntibioticLikenessScore();
```

#### `useResistanceAnalysis()`
Isolated resistance risk analysis.

```javascript
const {
  analysis,         // Current analysis or null
  loading,
  error,
  analyze           // async (smiles) => analysis
} = useResistanceAnalysis();
```

#### `useOptimizationEngine()`
Isolated lead optimization.

```javascript
const {
  optimization,     // Current optimization or null
  loading,
  error,
  optimize          // async (smiles) => optimization
} = useOptimizationEngine();
```

#### `useServiceHealth()`
Check API service availability.

```javascript
const {
  isHealthy,        // Boolean or null
  loading,
  checkHealth       // async () => void
} = useServiceHealth();
```

#### `useCompoundComparison()`
Compare multiple compounds.

```javascript
const {
  compounds,        // Array of compound analyses
  loading,
  error,
  addCompound,      // async (smiles, label?) => void
  removeCompound,   // (id) => void
  clearCompounds    // () => void
} = useCompoundComparison();
```

#### `useDescriptorValidation()`
Real-time descriptor validation.

```javascript
const {
  validation,       // { mw, logp, tpsa, hbd, hba }
  validateDescriptors  // (descriptors) => validation
} = useDescriptorValidation();
```

#### `useSmilesParser()`
SMILES validation and parsing.

```javascript
const {
  validateSmiles    // (smiles) => { valid, error? }
} = useSmilesParser();
```

#### `useAnalysisCache()`
Cache analysis results to reduce API calls.

```javascript
const {
  getCached,        // (smiles) => result | undefined
  setCached,        // (smiles, result) => void
  clearCache,       // () => void
  cacheSize         // Number of cached entries
} = useAnalysisCache();
```

---

### Utilities

#### `DescriptorFormatters`
Format descriptors for display.

```javascript
import { DescriptorFormatters } from '@scientific/antibacterial';

DescriptorFormatters.formatMW(425.5)           // "425.5 Da"
DescriptorFormatters.formatLogP(-0.5)          // "-0.50"
DescriptorFormatters.formatTPSA(85.2)          // "85.2 Ų"
DescriptorFormatters.formatScore(0.82)         // "82%"
```

#### `Classifications`
Get information about target classes and risk levels.

```javascript
import { Classifications } from '@scientific/antibacterial';

const info = Classifications.getTargetInfo('ribosome-targeting');
// {
//   name: "Ribosome Targeting",
//   color: "#a855f7",
//   icon: "nuclear",
//   description: "Binds to bacterial ribosomal subunits..."
// }

const risk = Classifications.getRiskInfo('High');
// {
//   color: "#ef4444",
//   icon: "alert-circle",
//   description: "High probability of resistance..."
// }
```

#### `ScoringUtils`
Interpret and calculate scores.

```javascript
import { ScoringUtils } from '@scientific/antibacterial';

ScoringUtils.interpretAntibioticScore(0.75)    
// { level: "Good", color: "#84cc16" }

ScoringUtils.calculateDevelopmentPotential(0.8, 'Low', 0.75)
// "Excellent" | "Good" | "Promising" | "Concerning" | "Poor"

ScoringUtils.getOptimizationPriority(objectives)
// "critical" | "high" | "medium" | "low"
```

#### `ReportGenerators`
Generate summaries and exports.

```javascript
import { ReportGenerators } from '@scientific/antibacterial';

// Generate display summary
ReportGenerators.generateSummary(analysis)
// "82% likely Ribosome Targeting with Low resistance risk"

// Generate exportable report
const report = ReportGenerators.generateReport(smiles, analysis);

// Export as CSV
const csv = ReportGenerators.exportAsCSV(compounds);
```

#### `ErrorHandling`
User-friendly error handling.

```javascript
import { ErrorHandling } from '@scientific/antibacterial';

ErrorHandling.getErrorMessage(error)
// Extracts user-friendly message

ErrorHandling.getErrorAction('INVALID_SMILES')
// "Please check your SMILES string format..."
```

#### `Validators`
Validation utilities.

```javascript
import { Validators } from '@scientific/antibacterial';

Validators.isValidSmiles('CC(C)Cc1ccc(cc1)[C@@H](C)C(=O)O')
// true

const errors = Validators.validateDescriptorRanges(descriptors);
// Array of validation errors or []
```

#### `DataAggregation`
Analyze multiple compounds.

```javascript
import { DataAggregation } from '@scientific/antibacterial';

const comparison = DataAggregation.compareCompounds(compounds);
// { topScored, topAntibioticLike, lowestResistanceRisk, averageScore }

const grouped = DataAggregation.groupByTargetClass(compounds);
// { "ribosome-targeting": [...], "membrane-targeting": [...], ... }
```

---

## 🔧 Integration Guide

### Step 1: Ensure Backend is Running

Verify the antibacterial backend is mounted:

```bash
cd backend
npm start  # Starts on http://localhost:5000
```

Check health:
```bash
curl http://localhost:5000/api/scientific/antibacterial/health
```

### Step 2: Configure Backend URL

Edit [config.js](../../../backend/config/config.js) to point to your backend:

```javascript
export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
```

### Step 3: Import and Use

```javascript
import { AntibacterialAnalysisScreen } from '@scientific/antibacterial';

export default function App() {
  return <AntibacterialAnalysisScreen />;
}
```

### Step 4: Add to Navigation (if using navigation stack)

```javascript
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AntibacterialAnalysisScreen } from '@scientific/antibacterial';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Antibacterial" 
          component={AntibacterialAnalysisScreen}
          options={{ title: 'Antibacterial Intelligence' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

## 📊 Data Flow

```
User Input (SMILES)
        ↓
[Validation] → SmilesParser.validateSmiles()
        ↓
[Analysis Request] → AntibacterialAPI.analyzeCompound()
        ↓
[Backend Processing] → All 8 scientific engines
        ↓
[Result Received] → AnalysisResult cached
        ↓
[Display] → Tab-based UI with components
        ↓
[Export/Share] → ReportGenerators format data
```

---

## 🎨 Styling & Theme

All components follow the Coli premium design system:

**Colors**:
- Primary: `#38bdf8` (Cyan)
- Success: `#22c55e` (Green)
- Warning: `#f59e0b` (Amber)
- Error: `#ef4444` (Red)
- Secondary: `#a855f7` (Purple)
- Accent: `#ec4899` (Pink)
- Background: `#020617` (Dark Navy)
- Surface: `rgba(30, 41, 59, 0.5)` (Glass)
- Text: `#e2e8f0` (Light)
- Muted: `#64748b` (Slate)

**Typography**:
- Headers: 18-24px, 700-800 weight, #38bdf8
- Body: 12-13px, 400-600 weight, #cbd5e1
- Labels: 10-11px, 600 weight, #94a3b8

**Layout**:
- Padding: 16px (screens), 12-14px (cards)
- Border radius: 8-12px
- Border color: `rgba(56, 189, 248, 0.1)`
- Shadows: BoxShadow on web, native on mobile

---

## 🧪 Testing

### Basic Analysis Test

```javascript
import { AntibacterialAPI } from '@scientific/antibacterial';

async function testAnalysis() {
  try {
    const result = await AntibacterialAPI.analyzeCompound(
      'CC(C)Cc1ccc(cc1)[C@@H](C)C(=O)O'  // Ibuprofen
    );
    console.log('✓ Analysis successful:', result.data.summary);
  } catch (error) {
    console.error('✗ Analysis failed:', error.message);
  }
}
```

### Health Check Test

```javascript
import { useServiceHealth } from '@scientific/antibacterial';

export function HealthTest() {
  const { isHealthy, checkHealth } = useServiceHealth();
  
  useEffect(() => {
    checkHealth();
  }, []);
  
  return <Text>{isHealthy ? '✓ Service Online' : '✗ Service Offline'}</Text>;
}
```

---

## 🚨 Error Handling

The system provides comprehensive error handling:

```javascript
import { ErrorHandling, Validators } from '@scientific/antibacterial';

async function safeAnalyze(smiles) {
  // Validate SMILES first
  const validation = Validators.isValidSmiles(smiles);
  if (!validation) {
    console.error('Invalid SMILES:', smiles);
    return;
  }
  
  try {
    const result = await AntibacterialAPI.analyzeCompound(smiles);
    return result.data;
  } catch (error) {
    const message = ErrorHandling.getErrorMessage(error);
    const action = ErrorHandling.getErrorAction(error.code);
    console.error('Error:', message);
    console.info('Action:', action);
  }
}
```

---

## 📈 Performance Optimization

### Caching

```javascript
import { useAnalysisCache } from '@scientific/antibacterial';

export function OptimizedAnalyzer() {
  const { getCached, setCached } = useAnalysisCache();
  
  const analyze = async (smiles) => {
    // Check cache first
    let result = getCached(smiles);
    
    if (!result) {
      // API call only if not cached
      result = await AntibacterialAPI.analyzeCompound(smiles);
      setCached(smiles, result);
    }
    
    return result;
  };
}
```

### Lazy Loading with React.memo

```javascript
import React from 'react';
import { DescriptorCard } from '@scientific/antibacterial';

const MemoizedDescriptorCard = React.memo(DescriptorCard);

// Now re-renders only when props change
<MemoizedDescriptorCard label="MW" value={425} unit="Da" />
```

---

## 🔐 Security Best Practices

- ✅ SMILES validation before submission
- ✅ Input length limits (500 chars max)
- ✅ Safe error messages (no stack traces to user)
- ✅ API timeout protection
- ✅ No sensitive data logging
- ✅ HTTPS-only in production

---

## 📝 Common Recipes

### Compare Two Compounds

```javascript
import { useCompoundComparison, DataAggregation } from '@scientific/antibacterial';

export function CompareCompounds() {
  const { compounds, addCompound } = useCompoundComparison();
  
  const handleCompare = async () => {
    await addCompound('CC(C)Cc1ccc(cc1)[C@@H](C)C(=O)O', 'Ibuprofen');
    await addCompound('CC(=O)Oc1ccccc1C(=O)O', 'Aspirin');
    
    const comparison = DataAggregation.compareCompounds(compounds);
    console.log('Best:', comparison.topScored);
    console.log('Lowest Risk:', comparison.lowestResistanceRisk);
  };
}
```

### Export Results as CSV

```javascript
import { ReportGenerators } from '@scientific/antibacterial';
import { Share } from 'react-native';

export function ExportResults({ compounds }) {
  const handleExport = async () => {
    const csv = ReportGenerators.exportAsCSV(compounds);
    
    Share.share({
      message: csv,
      title: 'Antibacterial Analysis Report',
      url: 'data:text/csv;base64,' + btoa(csv)
    });
  };
}
```

### Custom Analysis Dashboard

```javascript
import {
  ChemicalSpaceChart,
  DescriptorRangeVisualization,
  MultiObjectiveChart,
  Classifications
} from '@scientific/antibacterial';

export function CustomDashboard({ analysis }) {
  const desc = analysis.descriptors.physicochemical;
  const target = Classifications.getTargetInfo(analysis.targetClassification.topPrediction.targetClass);
  
  return (
    <ScrollView>
      <Text style={{ color: target.color, fontSize: 20, fontWeight: 'bold' }}>
        {target.name}
      </Text>
      <ChemicalSpaceChart mw={desc.mw} tpsa={desc.tpsa} />
      <DescriptorRangeVisualization descriptors={desc} />
      <MultiObjectiveChart objectives={analysis.optimization.objectives} />
    </ScrollView>
  );
}
```

---

## 📞 Support & Troubleshooting

### Backend Not Responding

**Error**: `NETWORK_ERROR` or `SERVICE_UNAVAILABLE`

**Solutions**:
1. Verify backend is running: `curl http://localhost:5000/api/scientific/antibacterial/health`
2. Check backend logs for errors
3. Verify backend URL in config matches where backend is running
4. On Android emulator, use `10.0.2.2` instead of `localhost`

###  Invalid SMILES

**Error**: `INVALID_SMILES` or `Invalid SMILES characters detected`

**Solutions**:
1. Verify SMILES format using https://www.chemspider.com/
2. Ensure no Unicode characters, only ASCII
3. Check brackets and parentheses are balanced
4. Use standard SMILES notation (not extended SMILES)

### Timeout

**Error**: `TIMEOUT` or request takes > 30 seconds

**Solutions**:
1. Try with a simpler molecule
2. Check backend performance (`npm run monitor`)
3. Verify network connection
4. Increase timeout in `ANTIBACTERIAL_CONFIG.TIMEOUTS`

---

## 🔄 Version History

**v1.0.0** (Current)
- ✅ Complete frontend module (2,200 lines)
- ✅ 10 custom hooks with full state management
- ✅ 4 analysis visualization components
- ✅ 3 charting components
- ✅ 7 utility modules
- ✅ Production-grade error handling
- ✅ Comprehensive documentation

---

## 📄 License

This module is part of the Nyran/Coli scientific AI system.

---

## 🙋 Contributing

To extend or modify this module:

1. **Add new hooks**: Update `hooks/useAntibacterialHooks.js`
2. **Add components**: Create new file in `components/`
3. **Add utilities**: Update `utils/analysisUtils.js`
4. **Update exports**: Always export new items in `index.js`
5. **Update docs**: Add usage examples to this README

---

**Status**: ✅ Ready for Production  
**Next Phase**: Database persistence + Visualization library integration
