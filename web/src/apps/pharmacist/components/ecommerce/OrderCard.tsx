/**
 * Order Card Component
 * Displays individual order with status and actions
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import {
  CheckCircle as ProcessIcon,
  Undo as ReturnIcon,
  AttachMoney as RefundIcon,
} from '@mui/icons-material';
import { Order, OrderStatus, PaymentStatus } from '../../../../shared/hooks/useOrders';

interface OrderCardProps {
  order: Order;
  onProcess?: (orderId: string) => void;
  onReturn?: (orderId: string) => void;
  onRefund?: (orderId: string) => void;
  onViewDetails?: (orderId: string) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onProcess,
  onReturn,
  onRefund,
  onViewDetails,
}) => {
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'warning';
      case OrderStatus.PROCESSING:
        return 'info';
      case OrderStatus.COMPLETED:
        return 'success';
      case OrderStatus.CANCELLED:
      case OrderStatus.REFUNDED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return 'success';
      case PaymentStatus.PENDING:
        return 'warning';
      case PaymentStatus.FAILED:
      case PaymentStatus.REFUNDED:
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Card data-testid={`order-${order.id}`} sx={{ mb: 2 }}>
      <CardContent>
        <Stack spacing={2}>
          {/* Order Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" component="h3">
              Commande #{order.id.slice(0, 8)}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip
                label={order.status}
                color={getStatusColor(order.status)}
                size="small"
              />
              <Chip
                label={order.payment_status}
                color={getPaymentStatusColor(order.payment_status)}
                size="small"
                variant="outlined"
              />
            </Stack>
          </Box>

          <Divider />

          {/* Order Items */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Articles ({order.items.length})
            </Typography>
            {order.items.map((item, idx) => (
              <Typography key={idx} variant="body2">
                {item.product_name} x{item.quantity} - {item.total_price.toFixed(2)} CHF
              </Typography>
            ))}
          </Box>

          {/* Order Total */}
          <Box>
            <Typography variant="h6" color="primary" fontWeight="bold">
              Total: {order.total_amount.toFixed(2)} CHF
            </Typography>
          </Box>

          {/* Order Date */}
          <Typography variant="caption" color="text.secondary">
            Créé le: {new Date(order.created_at).toLocaleString('fr-CH')}
          </Typography>
        </Stack>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Stack direction="row" spacing={1} width="100%">
          {onViewDetails && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => onViewDetails(order.id)}
            >
              Détails
            </Button>
          )}
          {onProcess && order.status === OrderStatus.PENDING && (
            <Button
              variant="contained"
              size="small"
              startIcon={<ProcessIcon />}
              onClick={() => onProcess(order.id)}
            >
              Traiter
            </Button>
          )}
          {onReturn && order.status === OrderStatus.COMPLETED && (
            <Button
              variant="outlined"
              size="small"
              color="warning"
              startIcon={<ReturnIcon />}
              onClick={() => onReturn(order.id)}
            >
              Retourner
            </Button>
          )}
          {onRefund &&
            (order.status === OrderStatus.REFUNDED ||
              order.status === OrderStatus.CANCELLED) && (
              <Button
                variant="outlined"
                size="small"
                color="error"
                startIcon={<RefundIcon />}
                onClick={() => onRefund(order.id)}
              >
                Rembourser
              </Button>
            )}
        </Stack>
      </CardActions>
    </Card>
  );
};
