/**
 * Marketing Management Page
 * Campaign creation, promotion management, and analytics
 * P2-MARKETING Tasks
 */

import React, { useState, useCallback } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  BarChart as AnalyticsIcon,
  LocalOffer as PromoIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

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
      id={`marketing-tabpanel-${index}`}
      aria-labelledby={`marketing-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const MarketingManagement: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [tabValue, setTabValue] = useState(0);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Campaign Dialog State
  const [campaignDialog, setCampaignDialog] = useState({
    open: false,
    edit: false,
    name: '',
    type: 'email',
    subject: '',
    content: '',
    targetAudience: ['all_customers'],
    scheduledAt: '',
  });

  // Promotion Dialog State
  const [promotionDialog, setPromotionDialog] = useState({
    open: false,
    edit: false,
    name: '',
    code: '',
    type: 'percentage_discount',
    discountValue: 0,
    startDate: '',
    expiryDate: '',
  });

  // Template Dialog State
  const [templateDialog, setTemplateDialog] = useState({
    open: false,
    edit: false,
    name: '',
    channel: 'email',
    subject: '',
    body: '',
    variables: '',
  });

  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  // ============================================================================
  // Campaign Handlers
  // ============================================================================

  const handleOpenCampaignDialog = useCallback((campaign?: any) => {
    if (campaign) {
      setCampaignDialog({
        open: true,
        edit: true,
        name: campaign.name,
        type: campaign.type,
        subject: campaign.subject,
        content: campaign.content,
        targetAudience: campaign.targetAudience,
        scheduledAt: campaign.scheduledAt || '',
      });
    } else {
      setCampaignDialog({
        open: false,
        edit: false,
        name: '',
        type: 'email',
        subject: '',
        content: '',
        targetAudience: ['all_customers'],
        scheduledAt: '',
      });
    }
    setCampaignDialog((prev) => ({ ...prev, open: true }));
  }, []);

  const handleCloseCampaignDialog = useCallback(() => {
    setCampaignDialog((prev) => ({ ...prev, open: false }));
  }, []);

  const handleSaveCampaign = useCallback(async () => {
    try {
      setLoading(true);
      // TODO: API call to save campaign
      enqueueSnackbar(
        campaignDialog.edit ? 'Campaign updated successfully' : 'Campaign created successfully',
        { variant: 'success' },
      );
      handleCloseCampaignDialog();
    } catch (error) {
      enqueueSnackbar('Failed to save campaign', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [campaignDialog, handleCloseCampaignDialog, enqueueSnackbar]);

  const handleDeleteCampaign = useCallback(
    async (campaignId: string) => {
      try {
        setLoading(true);
        // TODO: API call to delete campaign
        setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
        enqueueSnackbar('Campaign deleted successfully', { variant: 'success' });
      } catch (error) {
        enqueueSnackbar('Failed to delete campaign', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    },
    [enqueueSnackbar],
  );

  const handleExecuteCampaign = useCallback(
    async (campaignId: string) => {
      try {
        setLoading(true);
        // TODO: API call to execute campaign
        enqueueSnackbar('Campaign started successfully', { variant: 'success' });
      } catch (error) {
        enqueueSnackbar('Failed to execute campaign', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    },
    [enqueueSnackbar],
  );

  // ============================================================================
  // Promotion Handlers
  // ============================================================================

  const handleOpenPromotionDialog = useCallback((promotion?: any) => {
    if (promotion) {
      setPromotionDialog({
        open: true,
        edit: true,
        name: promotion.name,
        code: promotion.code,
        type: promotion.type,
        discountValue: promotion.discountValue,
        startDate: promotion.startDate,
        expiryDate: promotion.expiryDate,
      });
    } else {
      setPromotionDialog({
        open: false,
        edit: false,
        name: '',
        code: '',
        type: 'percentage_discount',
        discountValue: 0,
        startDate: '',
        expiryDate: '',
      });
    }
    setPromotionDialog((prev) => ({ ...prev, open: true }));
  }, []);

  const handleClosePromotionDialog = useCallback(() => {
    setPromotionDialog((prev) => ({ ...prev, open: false }));
  }, []);

  const handleSavePromotion = useCallback(async () => {
    try {
      setLoading(true);
      // TODO: API call to save promotion
      enqueueSnackbar(
        promotionDialog.edit
          ? 'Promotion updated successfully'
          : 'Promotion created successfully',
        { variant: 'success' },
      );
      handleClosePromotionDialog();
    } catch (error) {
      enqueueSnackbar('Failed to save promotion', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [promotionDialog, handleClosePromotionDialog, enqueueSnackbar]);

  const handleDeletePromotion = useCallback(
    async (promotionId: string) => {
      try {
        setLoading(true);
        // TODO: API call to delete promotion
        setPromotions((prev) => prev.filter((p) => p.id !== promotionId));
        enqueueSnackbar('Promotion deleted successfully', { variant: 'success' });
      } catch (error) {
        enqueueSnackbar('Failed to delete promotion', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    },
    [enqueueSnackbar],
  );

  // ============================================================================
  // Template Handlers
  // ============================================================================

  const handleOpenTemplateDialog = useCallback((template?: any) => {
    if (template) {
      setTemplateDialog({
        open: true,
        edit: true,
        name: template.name,
        channel: template.channel,
        subject: template.subject,
        body: template.body,
        variables: template.variables?.join(', ') || '',
      });
    } else {
      setTemplateDialog({
        open: false,
        edit: false,
        name: '',
        channel: 'email',
        subject: '',
        body: '',
        variables: '',
      });
    }
    setTemplateDialog((prev) => ({ ...prev, open: true }));
  }, []);

  const handleCloseTemplateDialog = useCallback(() => {
    setTemplateDialog((prev) => ({ ...prev, open: false }));
  }, []);

  const handleSaveTemplate = useCallback(async () => {
    try {
      setLoading(true);
      // TODO: API call to save template
      enqueueSnackbar(
        templateDialog.edit ? 'Template updated successfully' : 'Template created successfully',
        { variant: 'success' },
      );
      handleCloseTemplateDialog();
    } catch (error) {
      enqueueSnackbar('Failed to save template', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [templateDialog, handleCloseTemplateDialog, enqueueSnackbar]);

  const handleDeleteTemplate = useCallback(
    async (templateId: string) => {
      try {
        setLoading(true);
        // TODO: API call to delete template
        setTemplates((prev) => prev.filter((t) => t.id !== templateId));
        enqueueSnackbar('Template deleted successfully', { variant: 'success' });
      } catch (error) {
        enqueueSnackbar('Failed to delete template', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    },
    [enqueueSnackbar],
  );

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 'bold' }}>
          Marketing Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create and manage campaigns, promotions, and email templates
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          aria-label="marketing tabs"
        >
          <Tab label="Campaigns" id="marketing-tab-0" aria-controls="marketing-tabpanel-0" />
          <Tab label="Promotions" id="marketing-tab-1" aria-controls="marketing-tabpanel-1" />
          <Tab label="Templates" id="marketing-tab-2" aria-controls="marketing-tabpanel-2" />
          <Tab label="Analytics" id="marketing-tab-3" aria-controls="marketing-tabpanel-3" />
        </Tabs>
      </Paper>

      {/* Campaigns Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6">Campaign List</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenCampaignDialog()}
          >
            Create Campaign
          </Button>
        </Box>

        {loading && <CircularProgress />}

        {campaigns.length === 0 ? (
          <Alert severity="info">No campaigns yet. Create your first campaign to get started.</Alert>
        ) : (
          <Grid container spacing={2}>
            {campaigns.map((campaign) => (
              <Grid item xs={12} sm={6} md={4} key={campaign.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {campaign.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {campaign.type.toUpperCase()}
                    </Typography>
                    <Chip label={campaign.status} size="small" sx={{ mb: 1 }} />
                    <Typography variant="caption" display="block">
                      Recipients: {campaign.totalRecipients}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={campaign.openRate || 0}
                      sx={{ mt: 1, mb: 1 }}
                    />
                    <Typography variant="caption">
                      Open Rate: {(campaign.openRate || 0).toFixed(1)}%
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" startIcon={<AnalyticsIcon />}>
                      Analytics
                    </Button>
                    <Button size="small" startIcon={<EditIcon />} onClick={() => handleOpenCampaignDialog(campaign)}>
                      Edit
                    </Button>
                    <Button
                      size="small"
                      startIcon={<SendIcon />}
                      onClick={() => handleExecuteCampaign(campaign.id)}
                    >
                      Send
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteCampaign(campaign.id)}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Promotions Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6">Promotion List</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenPromotionDialog()}
          >
            Create Promotion
          </Button>
        </Box>

        {loading && <CircularProgress />}

        {promotions.length === 0 ? (
          <Alert severity="info">No promotions yet. Create your first promotion.</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Valid Until</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {promotions.map((promotion) => (
                  <TableRow key={promotion.id}>
                    <TableCell>{promotion.name}</TableCell>
                    <TableCell>
                      <Chip label={promotion.code} variant="outlined" size="small" />
                    </TableCell>
                    <TableCell>{promotion.type.replace(/_/g, ' ')}</TableCell>
                    <TableCell>
                      {promotion.discountValue}
                      {promotion.discountUnit}
                    </TableCell>
                    <TableCell>{new Date(promotion.expiryDate).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenPromotionDialog(promotion)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeletePromotion(promotion.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* Templates Tab */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6">Email/SMS Templates</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenTemplateDialog()}
          >
            Create Template
          </Button>
        </Box>

        {loading && <CircularProgress />}

        {templates.length === 0 ? (
          <Alert severity="info">No templates yet. Create reusable templates for your campaigns.</Alert>
        ) : (
          <Grid container spacing={2}>
            {templates.map((template) => (
              <Grid item xs={12} sm={6} key={template.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{template.name}</Typography>
                    <Chip label={template.channel.toUpperCase()} size="small" sx={{ mt: 1, mb: 1 }} />
                    <Typography variant="body2" sx={{ mt: 1, mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {template.subject || template.body}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenTemplateDialog(template)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Analytics Tab */}
      <TabPanel value={tabValue} index={3}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Campaign Performance Analytics
        </Typography>
        <Alert severity="info">
          Select a campaign from the Campaigns tab to view detailed analytics and performance metrics.
        </Alert>
      </TabPanel>

      {/* Campaign Dialog */}
      <Dialog open={campaignDialog.open} onClose={handleCloseCampaignDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{campaignDialog.edit ? 'Edit Campaign' : 'Create Campaign'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Campaign Name"
              fullWidth
              value={campaignDialog.name}
              onChange={(e) =>
                setCampaignDialog((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={campaignDialog.type}
                onChange={(e) =>
                  setCampaignDialog((prev) => ({ ...prev, type: e.target.value }))
                }
                label="Type"
              >
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="sms">SMS</MenuItem>
                <MenuItem value="in_app">In-App</MenuItem>
                <MenuItem value="push">Push Notification</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Subject"
              fullWidth
              value={campaignDialog.subject}
              onChange={(e) =>
                setCampaignDialog((prev) => ({ ...prev, subject: e.target.value }))
              }
            />
            <TextField
              label="Content"
              fullWidth
              multiline
              rows={4}
              value={campaignDialog.content}
              onChange={(e) =>
                setCampaignDialog((prev) => ({ ...prev, content: e.target.value }))
              }
            />
            <TextField
              label="Schedule Date (optional)"
              type="datetime-local"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={campaignDialog.scheduledAt}
              onChange={(e) =>
                setCampaignDialog((prev) => ({ ...prev, scheduledAt: e.target.value }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCampaignDialog}>Cancel</Button>
          <Button onClick={handleSaveCampaign} variant="contained">
            {campaignDialog.edit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Promotion Dialog */}
      <Dialog open={promotionDialog.open} onClose={handleClosePromotionDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{promotionDialog.edit ? 'Edit Promotion' : 'Create Promotion'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Promotion Name"
              fullWidth
              value={promotionDialog.name}
              onChange={(e) =>
                setPromotionDialog((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <TextField
              label="Promo Code"
              fullWidth
              value={promotionDialog.code}
              onChange={(e) =>
                setPromotionDialog((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
              }
              inputProps={{ maxLength: 20 }}
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={promotionDialog.type}
                onChange={(e) =>
                  setPromotionDialog((prev) => ({ ...prev, type: e.target.value }))
                }
                label="Type"
              >
                <MenuItem value="percentage_discount">Percentage Discount</MenuItem>
                <MenuItem value="fixed_amount">Fixed Amount</MenuItem>
                <MenuItem value="buy_x_get_y">Buy X Get Y</MenuItem>
                <MenuItem value="free_shipping">Free Shipping</MenuItem>
                <MenuItem value="loyalty_points">Loyalty Points</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Discount Value"
              type="number"
              fullWidth
              value={promotionDialog.discountValue}
              onChange={(e) =>
                setPromotionDialog((prev) => ({ ...prev, discountValue: Number(e.target.value) }))
              }
            />
            <TextField
              label="Start Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={promotionDialog.startDate}
              onChange={(e) =>
                setPromotionDialog((prev) => ({ ...prev, startDate: e.target.value }))
              }
            />
            <TextField
              label="Expiry Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={promotionDialog.expiryDate}
              onChange={(e) =>
                setPromotionDialog((prev) => ({ ...prev, expiryDate: e.target.value }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePromotionDialog}>Cancel</Button>
          <Button onClick={handleSavePromotion} variant="contained">
            {promotionDialog.edit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={templateDialog.open} onClose={handleCloseTemplateDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{templateDialog.edit ? 'Edit Template' : 'Create Template'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Template Name"
              fullWidth
              value={templateDialog.name}
              onChange={(e) =>
                setTemplateDialog((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <FormControl fullWidth>
              <InputLabel>Channel</InputLabel>
              <Select
                value={templateDialog.channel}
                onChange={(e) =>
                  setTemplateDialog((prev) => ({ ...prev, channel: e.target.value }))
                }
                label="Channel"
              >
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="sms">SMS</MenuItem>
                <MenuItem value="in_app">In-App</MenuItem>
                <MenuItem value="push">Push Notification</MenuItem>
              </Select>
            </FormControl>
            {(templateDialog.channel === 'email' || templateDialog.channel === 'push') && (
              <TextField
                label="Subject"
                fullWidth
                value={templateDialog.subject}
                onChange={(e) =>
                  setTemplateDialog((prev) => ({ ...prev, subject: e.target.value }))
                }
              />
            )}
            <TextField
              label="Body"
              fullWidth
              multiline
              rows={4}
              value={templateDialog.body}
              onChange={(e) =>
                setTemplateDialog((prev) => ({ ...prev, body: e.target.value }))
              }
              helperText="Use {{variable}} format for dynamic content"
            />
            <TextField
              label="Variables (comma-separated)"
              fullWidth
              placeholder="firstName, discount, expiryDate"
              value={templateDialog.variables}
              onChange={(e) =>
                setTemplateDialog((prev) => ({ ...prev, variables: e.target.value }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTemplateDialog}>Cancel</Button>
          <Button onClick={handleSaveTemplate} variant="contained">
            {templateDialog.edit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MarketingManagement;
