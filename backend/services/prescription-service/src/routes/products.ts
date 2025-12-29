/**
 * Product Search Routes
 * GET /products/search - Search products/medications for autocomplete
 * Task: Medication Autocomplete Feature
 */

import { Router, Request, Response } from 'express';

const router = Router();

// ============================================================================
// Mock Product Data for Development
// ============================================================================

interface MockProduct {
  id: string;
  name: string;
  sku: string;
  manufacturer: string;
  price: number;
  stock: number;
  requires_prescription: boolean;
  category: string;
  dosage_form: string;
}

const MOCK_PRODUCTS: MockProduct[] = [
  // Common medications (Paracetamol/Acetaminophen family)
  { id: 'prod-001', name: 'Paracetamol 500mg', sku: 'PARA-500', manufacturer: 'Sandoz', price: 8.50, stock: 150, requires_prescription: false, category: 'analgesics', dosage_form: 'tablet' },
  { id: 'prod-002', name: 'Paracetamol 1g', sku: 'PARA-1000', manufacturer: 'Sandoz', price: 12.00, stock: 100, requires_prescription: false, category: 'analgesics', dosage_form: 'tablet' },
  { id: 'prod-003', name: 'Dafalgan 500mg', sku: 'DAF-500', manufacturer: 'UPSA', price: 9.80, stock: 85, requires_prescription: false, category: 'analgesics', dosage_form: 'tablet' },
  { id: 'prod-004', name: 'Dafalgan 1g', sku: 'DAF-1000', manufacturer: 'UPSA', price: 14.50, stock: 120, requires_prescription: false, category: 'analgesics', dosage_form: 'tablet' },
  { id: 'prod-005', name: 'Dafalgan Odis 500mg', sku: 'DAF-ODIS-500', manufacturer: 'UPSA', price: 11.20, stock: 45, requires_prescription: false, category: 'analgesics', dosage_form: 'orodispersible' },

  // Ibuprofen family
  { id: 'prod-006', name: 'Ibuprofène 200mg', sku: 'IBU-200', manufacturer: 'Mepha', price: 7.50, stock: 200, requires_prescription: false, category: 'nsaid', dosage_form: 'tablet' },
  { id: 'prod-007', name: 'Ibuprofène 400mg', sku: 'IBU-400', manufacturer: 'Mepha', price: 10.00, stock: 180, requires_prescription: false, category: 'nsaid', dosage_form: 'tablet' },
  { id: 'prod-008', name: 'Algifor 200mg', sku: 'ALG-200', manufacturer: 'Verfora', price: 9.20, stock: 95, requires_prescription: false, category: 'nsaid', dosage_form: 'tablet' },
  { id: 'prod-009', name: 'Algifor 400mg', sku: 'ALG-400', manufacturer: 'Verfora', price: 13.40, stock: 75, requires_prescription: false, category: 'nsaid', dosage_form: 'tablet' },

  // Antibiotics (prescription required)
  { id: 'prod-010', name: 'Amoxicilline 500mg', sku: 'AMOX-500', manufacturer: 'Sandoz', price: 18.50, stock: 60, requires_prescription: true, category: 'antibiotic', dosage_form: 'capsule' },
  { id: 'prod-011', name: 'Amoxicilline 1g', sku: 'AMOX-1000', manufacturer: 'Sandoz', price: 24.00, stock: 45, requires_prescription: true, category: 'antibiotic', dosage_form: 'tablet' },
  { id: 'prod-012', name: 'Augmentin 625mg', sku: 'AUG-625', manufacturer: 'GSK', price: 28.50, stock: 30, requires_prescription: true, category: 'antibiotic', dosage_form: 'tablet' },
  { id: 'prod-013', name: 'Augmentin 1g', sku: 'AUG-1000', manufacturer: 'GSK', price: 35.00, stock: 25, requires_prescription: true, category: 'antibiotic', dosage_form: 'tablet' },
  { id: 'prod-014', name: 'Ciprofloxacine 500mg', sku: 'CIPRO-500', manufacturer: 'Bayer', price: 22.00, stock: 40, requires_prescription: true, category: 'antibiotic', dosage_form: 'tablet' },
  { id: 'prod-015', name: 'Azithromycine 250mg', sku: 'AZITH-250', manufacturer: 'Pfizer', price: 32.00, stock: 35, requires_prescription: true, category: 'antibiotic', dosage_form: 'tablet' },

  // Cardiovascular
  { id: 'prod-016', name: 'Lisinopril 10mg', sku: 'LIS-10', manufacturer: 'Mepha', price: 15.00, stock: 80, requires_prescription: true, category: 'cardiovascular', dosage_form: 'tablet' },
  { id: 'prod-017', name: 'Lisinopril 20mg', sku: 'LIS-20', manufacturer: 'Mepha', price: 18.00, stock: 65, requires_prescription: true, category: 'cardiovascular', dosage_form: 'tablet' },
  { id: 'prod-018', name: 'Amlodipine 5mg', sku: 'AMLO-5', manufacturer: 'Pfizer', price: 12.00, stock: 90, requires_prescription: true, category: 'cardiovascular', dosage_form: 'tablet' },
  { id: 'prod-019', name: 'Amlodipine 10mg', sku: 'AMLO-10', manufacturer: 'Pfizer', price: 16.00, stock: 70, requires_prescription: true, category: 'cardiovascular', dosage_form: 'tablet' },
  { id: 'prod-020', name: 'Atorvastatine 20mg', sku: 'ATOR-20', manufacturer: 'Pfizer', price: 20.00, stock: 100, requires_prescription: true, category: 'cardiovascular', dosage_form: 'tablet' },
  { id: 'prod-021', name: 'Atorvastatine 40mg', sku: 'ATOR-40', manufacturer: 'Pfizer', price: 28.00, stock: 55, requires_prescription: true, category: 'cardiovascular', dosage_form: 'tablet' },
  { id: 'prod-022', name: 'Aspirine Cardio 100mg', sku: 'ASP-C-100', manufacturer: 'Bayer', price: 8.00, stock: 200, requires_prescription: false, category: 'cardiovascular', dosage_form: 'tablet' },

  // Diabetes
  { id: 'prod-023', name: 'Metformine 500mg', sku: 'MET-500', manufacturer: 'Mepha', price: 10.00, stock: 120, requires_prescription: true, category: 'diabetes', dosage_form: 'tablet' },
  { id: 'prod-024', name: 'Metformine 850mg', sku: 'MET-850', manufacturer: 'Mepha', price: 14.00, stock: 90, requires_prescription: true, category: 'diabetes', dosage_form: 'tablet' },
  { id: 'prod-025', name: 'Metformine 1g', sku: 'MET-1000', manufacturer: 'Mepha', price: 16.00, stock: 80, requires_prescription: true, category: 'diabetes', dosage_form: 'tablet' },
  { id: 'prod-026', name: 'Gliclazide 30mg', sku: 'GLIC-30', manufacturer: 'Servier', price: 18.00, stock: 50, requires_prescription: true, category: 'diabetes', dosage_form: 'tablet' },

  // Gastrointestinal
  { id: 'prod-027', name: 'Oméprazole 20mg', sku: 'OME-20', manufacturer: 'AstraZeneca', price: 15.00, stock: 110, requires_prescription: false, category: 'gastrointestinal', dosage_form: 'capsule' },
  { id: 'prod-028', name: 'Oméprazole 40mg', sku: 'OME-40', manufacturer: 'AstraZeneca', price: 22.00, stock: 70, requires_prescription: true, category: 'gastrointestinal', dosage_form: 'capsule' },
  { id: 'prod-029', name: 'Pantoprazole 20mg', sku: 'PANTO-20', manufacturer: 'Nycomed', price: 14.00, stock: 95, requires_prescription: false, category: 'gastrointestinal', dosage_form: 'tablet' },
  { id: 'prod-030', name: 'Pantoprazole 40mg', sku: 'PANTO-40', manufacturer: 'Nycomed', price: 20.00, stock: 75, requires_prescription: true, category: 'gastrointestinal', dosage_form: 'tablet' },
  { id: 'prod-031', name: 'Gaviscon 200ml', sku: 'GAV-200', manufacturer: 'Reckitt', price: 12.50, stock: 60, requires_prescription: false, category: 'gastrointestinal', dosage_form: 'liquid' },

  // Respiratory
  { id: 'prod-032', name: 'Ventolin 100µg', sku: 'VENT-100', manufacturer: 'GSK', price: 25.00, stock: 40, requires_prescription: true, category: 'respiratory', dosage_form: 'inhaler' },
  { id: 'prod-033', name: 'Sérétide 250', sku: 'SERET-250', manufacturer: 'GSK', price: 55.00, stock: 25, requires_prescription: true, category: 'respiratory', dosage_form: 'inhaler' },
  { id: 'prod-034', name: 'Symbicort 200', sku: 'SYMB-200', manufacturer: 'AstraZeneca', price: 52.00, stock: 30, requires_prescription: true, category: 'respiratory', dosage_form: 'inhaler' },

  // Thyroid
  { id: 'prod-035', name: 'Lévothyroxine 25µg', sku: 'LEVO-25', manufacturer: 'Merck', price: 8.00, stock: 100, requires_prescription: true, category: 'thyroid', dosage_form: 'tablet' },
  { id: 'prod-036', name: 'Lévothyroxine 50µg', sku: 'LEVO-50', manufacturer: 'Merck', price: 9.00, stock: 120, requires_prescription: true, category: 'thyroid', dosage_form: 'tablet' },
  { id: 'prod-037', name: 'Lévothyroxine 100µg', sku: 'LEVO-100', manufacturer: 'Merck', price: 11.00, stock: 80, requires_prescription: true, category: 'thyroid', dosage_form: 'tablet' },

  // Psychiatric
  { id: 'prod-038', name: 'Fluoxétine 20mg', sku: 'FLUX-20', manufacturer: 'Lilly', price: 18.00, stock: 60, requires_prescription: true, category: 'psychiatric', dosage_form: 'capsule' },
  { id: 'prod-039', name: 'Sertraline 50mg', sku: 'SERT-50', manufacturer: 'Pfizer', price: 20.00, stock: 55, requires_prescription: true, category: 'psychiatric', dosage_form: 'tablet' },
  { id: 'prod-040', name: 'Citalopram 20mg', sku: 'CIT-20', manufacturer: 'Lundbeck', price: 16.00, stock: 70, requires_prescription: true, category: 'psychiatric', dosage_form: 'tablet' },
  { id: 'prod-041', name: 'Alprazolam 0.25mg', sku: 'ALPRA-025', manufacturer: 'Pfizer', price: 12.00, stock: 45, requires_prescription: true, category: 'psychiatric', dosage_form: 'tablet' },
  { id: 'prod-042', name: 'Alprazolam 0.5mg', sku: 'ALPRA-05', manufacturer: 'Pfizer', price: 15.00, stock: 35, requires_prescription: true, category: 'psychiatric', dosage_form: 'tablet' },

  // Pain management
  { id: 'prod-043', name: 'Tramadol 50mg', sku: 'TRAM-50', manufacturer: 'Grunenthal', price: 22.00, stock: 40, requires_prescription: true, category: 'pain', dosage_form: 'capsule' },
  { id: 'prod-044', name: 'Tramadol 100mg', sku: 'TRAM-100', manufacturer: 'Grunenthal', price: 30.00, stock: 25, requires_prescription: true, category: 'pain', dosage_form: 'tablet' },

  // Corticosteroids
  { id: 'prod-045', name: 'Prednisone 5mg', sku: 'PRED-5', manufacturer: 'Pfizer', price: 10.00, stock: 80, requires_prescription: true, category: 'corticosteroid', dosage_form: 'tablet' },
  { id: 'prod-046', name: 'Prednisone 20mg', sku: 'PRED-20', manufacturer: 'Pfizer', price: 16.00, stock: 50, requires_prescription: true, category: 'corticosteroid', dosage_form: 'tablet' },

  // Antihistamines
  { id: 'prod-047', name: 'Cétirizine 10mg', sku: 'CET-10', manufacturer: 'UCB', price: 8.00, stock: 150, requires_prescription: false, category: 'antihistamine', dosage_form: 'tablet' },
  { id: 'prod-048', name: 'Loratadine 10mg', sku: 'LOR-10', manufacturer: 'Schering', price: 9.00, stock: 130, requires_prescription: false, category: 'antihistamine', dosage_form: 'tablet' },
  { id: 'prod-049', name: 'Desloratadine 5mg', sku: 'DESL-5', manufacturer: 'MSD', price: 12.00, stock: 90, requires_prescription: false, category: 'antihistamine', dosage_form: 'tablet' },

  // Additional common medications
  { id: 'prod-050', name: 'Dompéridone 10mg', sku: 'DOMP-10', manufacturer: 'Janssen', price: 11.00, stock: 75, requires_prescription: true, category: 'gastrointestinal', dosage_form: 'tablet' },
];

// ============================================================================
// Search Helper Functions
// ============================================================================

/**
 * Normalize string for search (remove accents, lowercase)
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Search products by query
 * Matches against name, manufacturer, and SKU
 */
function searchProducts(query: string, limit: number = 10): MockProduct[] {
  const normalizedQuery = normalizeString(query);

  if (!normalizedQuery || normalizedQuery.length < 2) {
    return [];
  }

  // Filter products matching the query
  const results = MOCK_PRODUCTS.filter((product) => {
    const normalizedName = normalizeString(product.name);
    const normalizedManufacturer = normalizeString(product.manufacturer);
    const normalizedSku = normalizeString(product.sku);

    return (
      normalizedName.includes(normalizedQuery) ||
      normalizedManufacturer.includes(normalizedQuery) ||
      normalizedSku.includes(normalizedQuery)
    );
  });

  // Sort by relevance (exact match first, then by name)
  results.sort((a, b) => {
    const normalizedA = normalizeString(a.name);
    const normalizedB = normalizeString(b.name);

    // Exact match at start gets priority
    const aStartsWith = normalizedA.startsWith(normalizedQuery);
    const bStartsWith = normalizedB.startsWith(normalizedQuery);

    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;

    // Then sort by name
    return normalizedA.localeCompare(normalizedB);
  });

  return results.slice(0, limit);
}

// ============================================================================
// Route Handlers
// ============================================================================

/**
 * GET /products/search
 * Search products for medication autocomplete
 *
 * Query parameters:
 * - q: Search query (required, min 2 characters)
 * - limit: Maximum number of results (optional, default: 10, max: 50)
 *
 * Response:
 * {
 *   "products": [...],
 *   "query": "parac",
 *   "total": 5
 * }
 */
router.get('/search', (req: Request, res: Response) => {
  const query = req.query.q as string | undefined;
  const limitParam = req.query.limit as string | undefined;

  // Validate query parameter
  if (!query || typeof query !== 'string') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Query parameter "q" is required',
      timestamp: new Date().toISOString(),
    });
  }

  if (query.length < 2) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Query must be at least 2 characters',
      timestamp: new Date().toISOString(),
    });
  }

  // Parse and validate limit
  let limit = 10;
  if (limitParam) {
    const parsedLimit = parseInt(limitParam, 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      limit = Math.min(parsedLimit, 50); // Cap at 50
    }
  }

  // Search products
  const results = searchProducts(query, limit);

  // Transform results for frontend
  const products = results.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    manufacturer: product.manufacturer,
    price: product.price,
    stock: product.stock,
    stock_status: product.stock > 20 ? 'in_stock' : product.stock > 0 ? 'low_stock' : 'out_of_stock',
    requires_prescription: product.requires_prescription,
    category: product.category,
    dosage_form: product.dosage_form,
  }));

  return res.json({
    products,
    query,
    total: products.length,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /products/:id
 * Get single product by ID
 */
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  const product = MOCK_PRODUCTS.find((p) => p.id === id);

  if (!product) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Product with ID ${id} not found`,
      timestamp: new Date().toISOString(),
    });
  }

  return res.json({
    product: {
      id: product.id,
      name: product.name,
      sku: product.sku,
      manufacturer: product.manufacturer,
      price: product.price,
      stock: product.stock,
      stock_status: product.stock > 20 ? 'in_stock' : product.stock > 0 ? 'low_stock' : 'out_of_stock',
      requires_prescription: product.requires_prescription,
      category: product.category,
      dosage_form: product.dosage_form,
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
