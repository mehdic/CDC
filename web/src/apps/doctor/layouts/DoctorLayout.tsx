/**
 * Doctor Layout Component
 * Main layout with sidebar navigation and header
 * Task: T4-034 - Navigation & Layout
 */

import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PatientsIcon,
  MedicalServices as TreatmentIcon,
  Message as MessageIcon,
  TrendingUp as StatsIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

// ============================================================================
// Constants
// ============================================================================

const DRAWER_WIDTH = 280;

const NAVIGATION_ITEMS = [
  {
    label: 'Tableau de Bord',
    icon: <DashboardIcon />,
    path: '/doctor',
    testId: 'nav-dashboard',
  },
  {
    label: 'Patients',
    icon: <PatientsIcon />,
    path: '/doctor/patients',
    testId: 'nav-patients',
  },
  {
    label: 'Traitements',
    icon: <TreatmentIcon />,
    path: '/doctor/treatments',
    testId: 'nav-treatments',
  },
  {
    label: 'Messagerie',
    icon: <MessageIcon />,
    path: '/doctor/messages',
    testId: 'nav-messages',
  },
  {
    label: 'Observance',
    icon: <StatsIcon />,
    path: '/doctor/observance',
    testId: 'nav-observance',
  },
];

// ============================================================================
// Navigation Item Component
// ============================================================================

interface NavItemProps {
  label: string;
  icon: React.ReactElement;
  path: string;
  isActive: boolean;
  onNavigate: (path: string) => void;
  testId: string;
  onClose?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ label, icon, path, isActive, onNavigate, testId, onClose }) => (
  <ListItem disablePadding>
    <ListItemButton
      selected={isActive}
      onClick={() => {
        onNavigate(path);
        onClose?.();
      }}
      sx={{
        px: 3,
        py: 1.5,
        '&.Mui-selected': {
          backgroundColor: 'primary.light',
          borderRight: '4px solid',
          borderRightColor: 'primary.main',
          '& .MuiListItemIcon-root': {
            color: 'primary.main',
          },
          '& .MuiListItemText-primary': {
            fontWeight: 600,
            color: 'primary.main',
          },
        },
        '&:hover': {
          backgroundColor: 'action.hover',
        },
      }}
      data-testid={testId}
    >
      <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
      <ListItemText primary={label} />
    </ListItemButton>
  </ListItem>
);

// ============================================================================
// Doctor Layout Component
// ============================================================================

export const DoctorLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  const isUserMenuOpen = Boolean(userMenuAnchor);

  const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    // In a real app, would call logout API
    navigate('/login');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // ============================================================================
  // Sidebar Content
  // ============================================================================

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Branding */}
      <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 40, height: 40, backgroundColor: 'primary.main' }} data-testid="sidebar-logo">
            M
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight="bold">
              MetaPharm
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Médecin
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation Items */}
      <List sx={{ flex: 1, pt: 2 }} data-testid="navigation-list">
        {NAVIGATION_ITEMS.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <NavItem
              key={item.path}
              label={item.label}
              icon={item.icon}
              path={item.path}
              isActive={isActive}
              onNavigate={handleNavigate}
              testId={item.testId}
              onClose={isMobile ? () => setMobileOpen(false) : undefined}
            />
          );
        })}
      </List>

      {/* Bottom Section */}
      <Box sx={{ borderTop: '1px solid #e0e0e0', p: 2 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => {
              navigate('/doctor/settings');
              isMobile && setMobileOpen(false);
            }}
            sx={{ px: 2, py: 1.5 }}
            data-testid="settings-button"
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Paramètres" />
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }} data-testid="doctor-layout">
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1,
        }}
        data-testid="app-bar"
      >
        <Toolbar>
          {/* Mobile Menu Button */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ display: { md: 'none' } }}
            data-testid="menu-button"
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </IconButton>

          {/* Spacer */}
          <Box sx={{ flex: 1 }} />

          {/* User Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={handleUserMenuClick}
              size="small"
              data-testid="user-menu-button"
            >
              <Avatar sx={{ width: 36, height: 36, backgroundColor: 'primary.main' }}>
                DR
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={userMenuAnchor}
              open={isUserMenuOpen}
              onClose={handleUserMenuClose}
              data-testid="user-menu"
            >
              <MenuItem disabled>
                <Typography variant="body2" fontWeight="600">
                  Dr. Jean Dupont
                </Typography>
              </MenuItem>
              <Divider />
              <MenuItem
                onClick={() => {
                  navigate('/doctor/profile');
                  handleUserMenuClose();
                }}
                data-testid="profile-menu-item"
              >
                Profil
              </MenuItem>
              <MenuItem
                onClick={() => {
                  navigate('/doctor/settings');
                  handleUserMenuClose();
                }}
                data-testid="settings-menu-item"
              >
                Paramètres
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} data-testid="logout-menu-item">
                <LogoutIcon sx={{ mr: 1 }} />
                Déconnexion
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      {/* Desktop Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: DRAWER_WIDTH,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: '1px solid #e0e0e0',
            backgroundColor: '#fafafa',
          },
        }}
        data-testid="desktop-drawer"
      >
        {sidebarContent}
      </Drawer>

      {/* Mobile Sidebar */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
        data-testid="mobile-drawer"
      >
        {sidebarContent}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#f5f5f5',
        }}
        data-testid="main-content"
      >
        {/* Toolbar spacer for fixed AppBar */}
        <Toolbar />

        {/* Content Area */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            py: 2,
            px: { xs: 1, sm: 2, md: 3 },
          }}
          data-testid="content-area"
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default DoctorLayout;
