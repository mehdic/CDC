/**
 * Analytics Dashboard Page
 * Comprehensive analytics and reporting for pharmacist operations
 */

import React, { useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  LocalPharmacy as PharmacyIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Mock data for charts
const revenueData = [
  { month: 'Jan', revenue: 12500, prescriptions: 450, otc: 3200 },
  { month: 'Feb', revenue: 13200, prescriptions: 470, otc: 3500 },
  { month: 'Mar', revenue: 14100, prescriptions: 490, otc: 3800 },
  { month: 'Apr', revenue: 13800, prescriptions: 480, otc: 3600 },
  { month: 'May', revenue: 15200, prescriptions: 520, otc: 4100 },
  { month: 'Jun', revenue: 16500, prescriptions: 560, otc: 4500 },
];

const prescriptionData = [
  { name: 'Antibiotics', value: 230 },
  { name: 'Pain Relief', value: 180 },
  { name: 'Cardiovascular', value: 150 },
  { name: 'Diabetes', value: 120 },
  { name: 'Other', value: 320 },
];

const customerData = [
  { day: 'Mon', new: 12, returning: 45 },
  { day: 'Tue', new: 15, returning: 52 },
  { day: 'Wed', new: 18, returning: 48 },
  { day: 'Thu', new: 14, returning: 55 },
  { day: 'Fri', new: 20, returning: 60 },
  { day: 'Sat', new: 25, returning: 70 },
  { day: 'Sun', new: 10, returning: 35 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const Analytics: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState('30days');
  const [loading] = useState(false);

  // Key metrics
  const metrics = {
    totalRevenue: 85300,
    revenueChange: 12.5,
    totalPrescriptions: 2970,
    prescriptionsChange: 8.3,
    totalCustomers: 1245,
    customersChange: 15.2,
    averageOrderValue: 42.50,
    orderValueChange: 5.1,
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 'bold' }}>
          <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Analytics Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Comprehensive analytics and insights for your pharmacy operations
        </Typography>
      </Box>

      {/* Time Range Selector */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value="7days">Last 7 Days</MenuItem>
            <MenuItem value="30days">Last 30 Days</MenuItem>
            <MenuItem value="90days">Last 90 Days</MenuItem>
            <MenuItem value="1year">Last Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && (
        <>
          {/* Key Metrics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <MoneyIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Revenue
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    CHF {metrics.totalRevenue.toLocaleString()}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUpIcon fontSize="small" color="success" />
                    <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                      +{metrics.revenueChange}% from last period
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PharmacyIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Prescriptions Filled
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {metrics.totalPrescriptions.toLocaleString()}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUpIcon fontSize="small" color="success" />
                    <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                      +{metrics.prescriptionsChange}% from last period
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PeopleIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Customers
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {metrics.totalCustomers.toLocaleString()}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUpIcon fontSize="small" color="success" />
                    <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                      +{metrics.customersChange}% from last period
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ShoppingCartIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Avg Order Value
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    CHF {metrics.averageOrderValue.toFixed(2)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUpIcon fontSize="small" color="success" />
                    <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                      +{metrics.orderValueChange}% from last period
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Tabs for Different Analytics Views */}
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => setTabValue(newValue)}
              aria-label="analytics tabs"
            >
              <Tab label="Revenue" id="analytics-tab-0" />
              <Tab label="Prescriptions" id="analytics-tab-1" />
              <Tab label="Customers" id="analytics-tab-2" />
              <Tab label="Inventory" id="analytics-tab-3" />
            </Tabs>
          </Paper>

          {/* Revenue Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Revenue Trend
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#8884d8"
                        name="Total Revenue"
                      />
                      <Line
                        type="monotone"
                        dataKey="prescriptions"
                        stroke="#82ca9d"
                        name="Prescriptions"
                      />
                      <Line type="monotone" dataKey="otc" stroke="#ffc658" name="OTC Sales" />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Revenue by Source
                  </Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="prescriptions" fill="#82ca9d" name="Prescriptions" />
                      <Bar dataKey="otc" fill="#ffc658" name="OTC" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Revenue Breakdown
                  </Typography>
                  <Alert severity="info">
                    Detailed revenue breakdown and margin analysis coming soon.
                  </Alert>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Prescriptions Tab */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Prescription Categories
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={prescriptionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {prescriptionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Prescription Metrics
                  </Typography>
                  <Alert severity="info">
                    Prescription processing times, fill rates, and quality metrics coming soon.
                  </Alert>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Customers Tab */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Customer Activity
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={customerData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="new" fill="#82ca9d" name="New Customers" />
                      <Bar dataKey="returning" fill="#8884d8" name="Returning Customers" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Customer Insights
                  </Typography>
                  <Alert severity="info">
                    Customer demographics, retention rates, and loyalty metrics coming soon.
                  </Alert>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Inventory Tab */}
          <TabPanel value={tabValue} index={3}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Inventory Analytics
              </Typography>
              <Alert severity="info">
                Inventory turnover, stock levels, and reorder analytics coming soon. Link to
                Inventory Management page for detailed view.
              </Alert>
            </Paper>
          </TabPanel>
        </>
      )}
    </Container>
  );
};

export default Analytics;
