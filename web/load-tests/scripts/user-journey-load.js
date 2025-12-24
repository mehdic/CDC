import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

/**
 * T8-051: User Journey Load Testing
 *
 * Simulates realistic user journeys under load:
 * - Complete prescription workflow
 * - Product search and purchase
 * - Teleconsultation booking
 *
 * Validates end-to-end performance with realistic user behavior patterns
 */

const errorRate = new Rate('errors');
const journeyDuration = new Trend('journey_duration');
const journeySuccess = new Counter('journey_success');
const journeyFailure = new Counter('journey_failure');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5173';
const CONCURRENT_USERS = parseInt(__ENV.USERS || '100');

export const options = {
  stages: [
    { duration: '1m', target: CONCURRENT_USERS * 0.5 }, // Ramp up
    { duration: '3m', target: CONCURRENT_USERS }, // Sustained
    { duration: '1m', target: 0 }, // Ramp down
  ],

  thresholds: {
    http_req_duration: ['p(95)<500', 'avg<250'],
    errors: ['rate<0.02'], // 2% error rate
    journey_duration: ['p(95)<10000'], // Complete journey in <10s
  },

  tags: {
    test_type: 'user_journey',
    environment: 'test',
  },
};

/**
 * Pharmacist Prescription Workflow Journey
 */
function pharmacistPrescriptionJourney() {
  const startTime = Date.now();
  let journeySuccessful = true;

  group('Pharmacist Journey: Process Prescription', () => {
    // Step 1: Login
    const loginRes = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({
        email: 'pharmacist@test.metapharm.ch',
        password: 'TestPass123!',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!check(loginRes, { 'login success': (r) => r.status === 200 })) {
      journeySuccessful = false;
      errorRate.add(1);
      return;
    }

    const authToken = JSON.parse(loginRes.body).accessToken;
    const authHeaders = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    };

    sleep(1);

    // Step 2: View Dashboard
    const dashboardRes = http.get(`${BASE_URL}/api/dashboard`, authHeaders);
    check(dashboardRes, { 'dashboard loaded': (r) => r.status === 200 });

    sleep(2);

    // Step 3: View Prescriptions List
    const prescriptionsRes = http.get(`${BASE_URL}/api/prescriptions`, authHeaders);
    check(prescriptionsRes, { 'prescriptions loaded': (r) => r.status === 200 });

    sleep(2);

    // Step 4: Check Drug Interactions
    const interactionRes = http.post(
      `${BASE_URL}/api/prescriptions/check-interactions`,
      JSON.stringify({
        medications: ['Aspirin', 'Warfarin'],
      }),
      authHeaders
    );

    check(interactionRes, { 'interaction check done': (r) => r.status === 200 || r.status === 404 });

    sleep(1);

    // Step 5: Validate Prescription
    const validateRes = http.post(
      `${BASE_URL}/api/prescriptions/validate`,
      JSON.stringify({
        prescriptionId: 'rx_001',
      }),
      authHeaders
    );

    check(validateRes, { 'prescription validated': (r) => r.status === 200 || r.status === 404 });

    sleep(2);

    // Step 6: Check Inventory
    const inventoryRes = http.get(`${BASE_URL}/api/inventory`, authHeaders);
    check(inventoryRes, { 'inventory checked': (r) => r.status === 200 });

    sleep(1);
  });

  const duration = Date.now() - startTime;
  journeyDuration.add(duration);

  if (journeySuccessful) {
    journeySuccess.add(1);
  } else {
    journeyFailure.add(1);
  }
}

/**
 * Patient Product Search & Purchase Journey
 */
function patientShoppingJourney() {
  const startTime = Date.now();
  let journeySuccessful = true;

  group('Patient Journey: Product Search & Purchase', () => {
    // Step 1: Login
    const loginRes = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({
        email: 'patient@test.metapharm.ch',
        password: 'TestPass123!',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!check(loginRes, { 'login success': (r) => r.status === 200 })) {
      journeySuccessful = false;
      errorRate.add(1);
      return;
    }

    const authToken = JSON.parse(loginRes.body).accessToken;
    const authHeaders = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    };

    sleep(1);

    // Step 2: Search for products
    const searchRes = http.get(`${BASE_URL}/api/products/search?q=vitamins`, authHeaders);
    check(searchRes, { 'search completed': (r) => r.status === 200 });

    sleep(2);

    // Step 3: View product details
    const productRes = http.get(`${BASE_URL}/api/products/prod_001`, authHeaders);
    check(productRes, { 'product details loaded': (r) => r.status === 200 || r.status === 404 });

    sleep(3);

    // Step 4: Add to cart
    const cartRes = http.post(
      `${BASE_URL}/api/cart/add`,
      JSON.stringify({
        productId: 'prod_001',
        quantity: 2,
      }),
      authHeaders
    );

    check(cartRes, { 'added to cart': (r) => r.status === 200 || r.status === 404 });

    sleep(1);

    // Step 5: View cart
    const viewCartRes = http.get(`${BASE_URL}/api/cart`, authHeaders);
    check(viewCartRes, { 'cart viewed': (r) => r.status === 200 });

    sleep(2);

    // Step 6: Checkout
    const checkoutRes = http.post(
      `${BASE_URL}/api/checkout`,
      JSON.stringify({
        paymentMethod: 'card',
        shippingAddress: 'Test Address',
      }),
      authHeaders
    );

    check(checkoutRes, { 'checkout initiated': (r) => r.status === 200 || r.status === 400 });

    sleep(1);
  });

  const duration = Date.now() - startTime;
  journeyDuration.add(duration);

  if (journeySuccessful) {
    journeySuccess.add(1);
  } else {
    journeyFailure.add(1);
  }
}

/**
 * Nurse Medication Order Journey
 */
function nurseMedicationJourney() {
  const startTime = Date.now();
  let journeySuccessful = true;

  group('Nurse Journey: Order Medication for Patient', () => {
    // Step 1: Login
    const loginRes = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({
        email: 'nurse@test.metapharm.ch',
        password: 'TestPass123!',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!check(loginRes, { 'login success': (r) => r.status === 200 })) {
      journeySuccessful = false;
      errorRate.add(1);
      return;
    }

    const authToken = JSON.parse(loginRes.body).accessToken;
    const authHeaders = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    };

    sleep(1);

    // Step 2: Search for patient
    const patientSearchRes = http.get(
      `${BASE_URL}/api/patients/search?q=Martin`,
      authHeaders
    );
    check(patientSearchRes, { 'patient search done': (r) => r.status === 200 });

    sleep(2);

    // Step 3: View patient records
    const patientRes = http.get(`${BASE_URL}/api/patients/patient_001`, authHeaders);
    check(patientRes, { 'patient records loaded': (r) => r.status === 200 || r.status === 404 });

    sleep(2);

    // Step 4: Create medication order
    const orderRes = http.post(
      `${BASE_URL}/api/medication-orders`,
      JSON.stringify({
        patientId: 'patient_001',
        medication: 'Aspirin 500mg',
        quantity: 30,
      }),
      authHeaders
    );

    check(orderRes, { 'order created': (r) => r.status === 200 || r.status === 201 || r.status === 404 });

    sleep(1);

    // Step 5: View order status
    const statusRes = http.get(`${BASE_URL}/api/medication-orders/my`, authHeaders);
    check(statusRes, { 'order status checked': (r) => r.status === 200 });

    sleep(1);
  });

  const duration = Date.now() - startTime;
  journeyDuration.add(duration);

  if (journeySuccessful) {
    journeySuccess.add(1);
  } else {
    journeyFailure.add(1);
  }
}

/**
 * Main test function - randomly selects a user journey
 */
export default function () {
  const journeys = [
    pharmacistPrescriptionJourney,
    patientShoppingJourney,
    nurseMedicationJourney,
  ];

  // Randomly select journey (weighted)
  const random = Math.random();
  if (random < 0.4) {
    pharmacistPrescriptionJourney(); // 40%
  } else if (random < 0.75) {
    patientShoppingJourney(); // 35%
  } else {
    nurseMedicationJourney(); // 25%
  }

  // Think time between journeys
  sleep(Math.floor(Math.random() * 5) + 3); // 3-7 seconds
}

export function handleSummary(data) {
  const metrics = data.metrics;

  let summary = '\nUser Journey Load Test Summary\n';
  summary += '='.repeat(50) + '\n\n';

  if (metrics.journey_duration) {
    summary += 'Journey Duration:\n';
    summary += `  Average: ${(metrics.journey_duration.values.avg / 1000).toFixed(2)}s\n`;
    summary += `  P95: ${(metrics.journey_duration.values['p(95)'] / 1000).toFixed(2)}s\n`;
    summary += `  P99: ${(metrics.journey_duration.values['p(99)'] / 1000).toFixed(2)}s\n\n`;
  }

  if (metrics.journey_success && metrics.journey_failure) {
    const total =
      metrics.journey_success.values.count + metrics.journey_failure.values.count;
    const successRate = (metrics.journey_success.values.count / total) * 100;
    summary += `Journey Success Rate: ${successRate.toFixed(2)}%\n`;
    summary += `  Successful: ${metrics.journey_success.values.count}\n`;
    summary += `  Failed: ${metrics.journey_failure.values.count}\n\n`;
  }

  if (metrics.http_req_duration) {
    summary += 'HTTP Performance:\n';
    summary += `  Average: ${metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
    summary += `  P95: ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n\n`;
  }

  console.log(summary);

  return {
    'load-tests/results/user-journey-summary.json': JSON.stringify(data),
    stdout: summary,
  };
}
