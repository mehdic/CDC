import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Container,
  styled,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

/**
 * Error types
 */
export type ErrorType = '404' | '500' | 'generic';

/**
 * Error page props
 */
export interface ErrorPageProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  showHomeButton?: boolean;
  showBackButton?: boolean;
}

/**
 * Styled components
 */
const ErrorContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  textAlign: 'center',
  padding: theme.spacing(3),
}));

const ErrorIconWrapper = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  '& .MuiSvgIcon-root': {
    fontSize: 120,
    color: theme.palette.error.main,
  },
}));

const ButtonGroup = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  marginTop: theme.spacing(4),
  flexWrap: 'wrap',
  justifyContent: 'center',
}));

/**
 * Error configurations
 */
const errorConfigs: Record<
  ErrorType,
  { title: string; message: string; code: string }
> = {
  '404': {
    code: '404',
    title: 'Page non trouvée',
    message:
      "La page que vous recherchez n'existe pas ou a été déplacée.",
  },
  '500': {
    code: '500',
    title: 'Erreur serveur',
    message:
      'Une erreur est survenue sur le serveur. Veuillez réessayer plus tard.',
  },
  generic: {
    code: '',
    title: 'Une erreur est survenue',
    message:
      'Nous avons rencontré un problème. Veuillez réessayer ou contacter le support.',
  },
};

/**
 * Error page component
 * Displays different error pages (404, 500, generic)
 */
export const ErrorPage: React.FC<ErrorPageProps> = ({
  type = 'generic',
  title,
  message,
  showHomeButton = true,
  showBackButton = true,
}) => {
  const navigate = useNavigate();
  const config = errorConfigs[type];

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <ErrorContainer maxWidth="md">
      <ErrorIconWrapper>
        <ErrorIcon />
      </ErrorIconWrapper>

      {config.code && (
        <Typography
          variant="h1"
          component="div"
          sx={{ fontSize: '6rem', fontWeight: 700, color: 'text.secondary' }}
        >
          {config.code}
        </Typography>
      )}

      <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 2 }}>
        {title || config.title}
      </Typography>

      <Typography
        variant="body1"
        color="textSecondary"
        sx={{ mt: 2, maxWidth: 600 }}
      >
        {message || config.message}
      </Typography>

      <ButtonGroup>
        {showBackButton && (
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleGoBack}
            size="large"
          >
            Retour
          </Button>
        )}
        {showHomeButton && (
          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={handleGoHome}
            size="large"
          >
            Accueil
          </Button>
        )}
      </ButtonGroup>
    </ErrorContainer>
  );
};

/**
 * 404 Not Found page
 */
export const NotFoundPage: React.FC = () => <ErrorPage type="404" />;

/**
 * 500 Server Error page
 */
export const ServerErrorPage: React.FC = () => <ErrorPage type="500" />;

/**
 * Generic error page
 */
export const GenericErrorPage: React.FC<{
  title?: string;
  message?: string;
}> = ({ title, message }) => (
  <ErrorPage type="generic" title={title} message={message} />
);

export default ErrorPage;
