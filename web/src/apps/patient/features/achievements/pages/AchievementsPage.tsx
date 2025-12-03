/**
 * Achievements Page
 * Main page for displaying all achievements, progress, and gamification features
 * Task: T6-021
 */

import React, { useState, useMemo } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  Tab,
  Tabs,
  Card,
  CardContent,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  LinearProgress,
} from '@mui/material';
import { useAchievements } from '../hooks/useAchievements';
import { AchievementCard } from '../components/AchievementCard';
import { AchievementDetail } from '../components/AchievementDetail';
import { LeaderboardWidget } from '../components/LeaderboardWidget';
import { ProgressTracker } from '../components/ProgressTracker';
import {
  Achievement,
  PatientAchievement,
  AchievementCategory,
  HealthGoal,
} from '../types/achievement.types';

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
      id={`achievement-tabpanel-${index}`}
      aria-labelledby={`achievement-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const AchievementsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>(
    'all'
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(
    null
  );
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    goalType: 'weight',
    targetValue: 0,
    targetDate: '',
  });

  const patientId = 'current-patient-id'; // Would come from auth context
  const { achievements, patientAchievements, stats, goals, leaderboard, loading, createGoal } =
    useAchievements({ patientId, autoFetch: true });

  // Filter achievements by category
  const filteredAchievements = useMemo(() => {
    if (selectedCategory === 'all') {
      return achievements;
    }
    return achievements.filter((a) => a.category === selectedCategory);
  }, [achievements, selectedCategory]);

  // Get achievements grouped by unlock status
  const unlockedAchievements = useMemo(() => {
    return filteredAchievements.filter((a) => {
      const patientAch = patientAchievements.find(
        (pa) => pa.achievementId === a.achievementId
      );
      return patientAch && !patientAch.isLocked;
    });
  }, [filteredAchievements, patientAchievements]);

  const lockedAchievements = useMemo(() => {
    return filteredAchievements.filter((a) => {
      const patientAch = patientAchievements.find(
        (pa) => pa.achievementId === a.achievementId
      );
      return !patientAch || patientAch.isLocked;
    });
  }, [filteredAchievements, patientAchievements]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAchievementClick = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setDetailOpen(true);
  };

  const handleCreateGoal = async () => {
    try {
      await createGoal({
        goalType: newGoal.goalType as any,
        targetValue: newGoal.targetValue,
        currentValue: 0,
        startDate: new Date(),
        targetDate: new Date(newGoal.targetDate),
        status: 'active',
        progress: 0,
        checkIns: [],
      });
      setGoalDialogOpen(false);
      setNewGoal({ goalType: 'weight', targetValue: 0, targetDate: '' });
    } catch (error) {
      console.error('Failed to create goal:', error);
    }
  };

  const getSelectedAchievementData = () => {
    if (!selectedAchievement) return undefined;
    return patientAchievements.find(
      (pa) => pa.achievementId === selectedAchievement.achievementId
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Mes Succès
        </Typography>
        <Typography color="textSecondary">
          Suivez votre progression et débloquez des succès pour gagner des points
        </Typography>
      </Box>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="textSecondary" variant="caption">
                  Points totaux
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#FFD700' }}>
                  {stats.totalPoints}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="textSecondary" variant="caption">
                  Succès débloqués
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
                  {stats.unlockedCount}/{stats.totalAchievements}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="textSecondary" variant="caption">
                  Taux de déverrouillage
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {Math.round(
                    (stats.unlockedCount / stats.totalAchievements) * 100
                  )}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="textSecondary" variant="caption">
                  Objectifs actifs
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {goals.filter((g) => g.status === 'active').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Main Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="achievement tabs"
        >
          <Tab label="Succès" id="achievement-tab-0" aria-controls="achievement-tabpanel-0" />
          <Tab label="Progression" id="achievement-tab-1" aria-controls="achievement-tabpanel-1" />
          <Tab label="Objectifs" id="achievement-tab-2" aria-controls="achievement-tabpanel-2" />
          <Tab label="Classement" id="achievement-tab-3" aria-controls="achievement-tabpanel-3" />
        </Tabs>
      </Box>

      {/* Tab: Achievements */}
      <TabPanel value={tabValue} index={0}>
        {/* Category Filter */}
        <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="Tous"
            variant={selectedCategory === 'all' ? 'filled' : 'outlined'}
            onClick={() => setSelectedCategory('all')}
            color={selectedCategory === 'all' ? 'primary' : 'default'}
          />
          {(['adherence', 'health', 'engagement', 'loyalty', 'social'] as const).map(
            (category) => (
              <Chip
                key={category}
                label={category.charAt(0).toUpperCase() + category.slice(1)}
                variant={selectedCategory === category ? 'filled' : 'outlined'}
                onClick={() => setSelectedCategory(category)}
                color={selectedCategory === category ? 'primary' : 'default'}
              />
            )
          )}
        </Box>

        {/* Unlocked Achievements */}
        {unlockedAchievements.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              ✓ Débloqués ({unlockedAchievements.length})
            </Typography>
            <Grid container spacing={2}>
              {unlockedAchievements.map((achievement) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={achievement.achievementId}>
                  <AchievementCard
                    achievement={achievement}
                    patientAchievement={patientAchievements.find(
                      (pa) => pa.achievementId === achievement.achievementId
                    )}
                    onClick={() => handleAchievementClick(achievement)}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Locked Achievements */}
        {lockedAchievements.length > 0 && (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              🔒 Verrouillés ({lockedAchievements.length})
            </Typography>
            <Grid container spacing={2}>
              {lockedAchievements.map((achievement) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={achievement.achievementId}>
                  <AchievementCard
                    achievement={achievement}
                    patientAchievement={patientAchievements.find(
                      (pa) => pa.achievementId === achievement.achievementId
                    )}
                    isLocked={true}
                    onClick={() => handleAchievementClick(achievement)}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </TabPanel>

      {/* Tab: Progress */}
      <TabPanel value={tabValue} index={1}>
        <ProgressTracker
          achievements={achievements}
          patientAchievements={patientAchievements}
          loading={loading}
        />
      </TabPanel>

      {/* Tab: Goals */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setGoalDialogOpen(true)}
          >
            Créer un nouvel objectif
          </Button>
        </Box>

        <Grid container spacing={2}>
          {goals.map((goal) => (
            <Grid item xs={12} md={6} key={goal.goalId}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 2,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {goal.goalType}
                    </Typography>
                    <Chip
                      label={goal.status}
                      size="small"
                      color={goal.status === 'active' ? 'success' : 'default'}
                    />
                  </Box>

                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    {goal.currentValue} / {goal.targetValue}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((goal.progress / 100) * 100, 100)}
                    />
                  </Box>

                  <Typography variant="caption" color="textSecondary">
                    Cible: {new Date(goal.targetDate).toLocaleDateString('fr-FR')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {goals.length === 0 && (
          <Typography color="textSecondary">
            Aucun objectif. Créez-en un pour commencer!
          </Typography>
        )}
      </TabPanel>

      {/* Tab: Leaderboard */}
      <TabPanel value={tabValue} index={3}>
        <LeaderboardWidget
          leaderboard={leaderboard}
          currentUserRank={10}
          loading={loading}
        />
      </TabPanel>

      {/* Achievement Detail Dialog */}
      <AchievementDetail
        achievement={selectedAchievement || undefined}
        patientAchievement={getSelectedAchievementData()}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />

      {/* Goal Creation Dialog */}
      <Dialog open={goalDialogOpen} onClose={() => setGoalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Créer un nouvel objectif</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              select
              label="Type d'objectif"
              value={newGoal.goalType}
              onChange={(e) =>
                setNewGoal({ ...newGoal, goalType: e.target.value })
              }
              fullWidth
            >
              <MenuItem value="weight">Poids</MenuItem>
              <MenuItem value="blood_pressure">Tension artérielle</MenuItem>
              <MenuItem value="blood_sugar">Glycémie</MenuItem>
              <MenuItem value="steps">Pas</MenuItem>
              <MenuItem value="medication">Médicament</MenuItem>
              <MenuItem value="custom">Personnalisé</MenuItem>
            </TextField>

            <TextField
              label="Valeur cible"
              type="number"
              value={newGoal.targetValue}
              onChange={(e) =>
                setNewGoal({ ...newGoal, targetValue: parseFloat(e.target.value) })
              }
              fullWidth
            />

            <TextField
              label="Date cible"
              type="date"
              value={newGoal.targetDate}
              onChange={(e) =>
                setNewGoal({ ...newGoal, targetDate: e.target.value })
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGoalDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleCreateGoal} variant="contained">
            Créer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AchievementsPage;
