import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  styled,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Description as PrescriptionIcon,
  Inventory as InventoryIcon,
  VideoCall as VideoCallIcon,
  Analytics as AnalyticsIcon,
  Campaign as MarketingIcon,
  LocalShipping as DeliveryIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';

/**
 * Navigation item configuration
 */
export interface NavigationItem {
  id: string;
  label: string;
  path?: string;
  icon: React.ReactNode;
  roles?: string[]; // Roles that can see this item
  children?: NavigationItem[];
}

/**
 * Navigation props
 */
export interface NavigationProps {
  userRole?: string;
  onNavigate?: (path: string) => void;
}

/**
 * Styled components
 */
const NavigationContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  backgroundColor: theme.palette.background.paper,
}));

const StyledListItemButton = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active?: boolean }>(({ theme, active }) => ({
  borderRadius: theme.shape.borderRadius,
  margin: theme.spacing(0.5, 1),
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  ...(active && {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.contrastText,
    },
  }),
}));

/**
 * Default navigation items for pharmacist portal
 */
const defaultNavigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    path: '/',
    icon: <DashboardIcon />,
  },
  {
    id: 'prescriptions',
    label: 'Prescriptions',
    icon: <PrescriptionIcon />,
    children: [
      {
        id: 'prescriptions-queue',
        label: 'File d\'attente',
        path: '/prescriptions',
        icon: <PrescriptionIcon />,
      },
      {
        id: 'prescriptions-review',
        label: 'Vérification',
        path: '/prescriptions/review',
        icon: <PrescriptionIcon />,
      },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventaire',
    path: '/inventory',
    icon: <InventoryIcon />,
  },
  {
    id: 'teleconsultation',
    label: 'Téléconsultation',
    path: '/teleconsultation',
    icon: <VideoCallIcon />,
  },
  {
    id: 'analytics',
    label: 'Analyses',
    path: '/analytics',
    icon: <AnalyticsIcon />,
    roles: ['pharmacist', 'admin'],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    path: '/marketing',
    icon: <MarketingIcon />,
    roles: ['pharmacist', 'admin'],
  },
  {
    id: 'delivery',
    label: 'Livraisons',
    path: '/delivery',
    icon: <DeliveryIcon />,
  },
  {
    id: 'settings',
    label: 'Paramètres',
    path: '/settings',
    icon: <SettingsIcon />,
  },
];

/**
 * Check if user has access to navigation item
 */
const hasAccess = (item: NavigationItem, userRole?: string): boolean => {
  if (!item.roles || item.roles.length === 0) {
    return true;
  }
  return userRole ? item.roles.includes(userRole) : false;
};

/**
 * Navigation component
 */
export const Navigation: React.FC<NavigationProps> = ({
  userRole = 'pharmacist',
  onNavigate,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const renderNavigationItem = (item: NavigationItem, depth: number = 0) => {
    if (!hasAccess(item, userRole)) {
      return null;
    }

    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openSections[item.id];

    if (hasChildren) {
      return (
        <React.Fragment key={item.id}>
          <ListItem disablePadding>
            <StyledListItemButton onClick={() => toggleSection(item.id)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
              {isOpen ? <ExpandLess /> : <ExpandMore />}
            </StyledListItemButton>
          </ListItem>
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map((child) => renderNavigationItem(child, depth + 1))}
            </List>
          </Collapse>
        </React.Fragment>
      );
    }

    return (
      <ListItem key={item.id} disablePadding>
        <StyledListItemButton
          active={isActive(item.path)}
          onClick={() => item.path && handleNavigate(item.path)}
          sx={{ pl: depth > 0 ? 4 : 2 }}
        >
          <ListItemIcon>{item.icon}</ListItemIcon>
          <ListItemText primary={item.label} />
        </StyledListItemButton>
      </ListItem>
    );
  };

  return (
    <NavigationContainer>
      <List component="nav" aria-label="navigation principale">
        {defaultNavigationItems.map((item) => renderNavigationItem(item))}
      </List>
    </NavigationContainer>
  );
};

export default Navigation;
