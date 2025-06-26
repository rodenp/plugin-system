import type { Plugin, PluginProps } from '../../types/plugin-interface';
import * as React from 'react';
import { defaultTheme } from '../shared/default-theme';

interface MerchandiseProps extends PluginProps {
  // Data passed from host app (optional for now)
  products?: any[];
  cart?: any[];
  categories?: string[];
  loading?: boolean;
  error?: string;
  
  // Action callbacks to host app (optional)
  onAddProduct?: (product: any) => Promise<void>;
  onAddToCart?: (productId: string) => Promise<void>;
  onRemoveFromCart?: (productId: string) => Promise<void>;
  onUpdateCartQuantity?: (productId: string, quantity: number) => Promise<void>;
  onLoadProducts?: () => Promise<void>;
  onViewCart?: () => Promise<void>;
}

// Component wrapper for the Merch tab
const MerchComponent: React.FC<MerchandiseProps> = ({ currentUser, communityId, community, userRole, theme, ...props }) => {
  const groupname = currentUser?.profile?.groupname || 'courzey';
  const pluginPath = `/${groupname}/merchandise`;
  
  // Update document title and URL without causing page reload
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', pluginPath);
      document.title = `Merchandise - ${groupname}`;
    }
  }, [groupname, pluginPath]);
  
  const context = {
    currentUser,
    communityId,
    community,
    isOwner: userRole === 'owner' || userRole === 'admin'
  };

  // Apply theme
  const appliedTheme = theme || defaultTheme;

  // Use theme colors or defaults
  const themeColors = {
    primary: theme?.colors?.secondary || appliedTheme.colors.secondary,
    secondary: theme?.colors?.accent || appliedTheme.colors.accent,
    danger: theme?.colors?.danger || appliedTheme.colors.danger,
    muted: theme?.colors?.muted || appliedTheme.colors.muted
  };

  const products = props.products || [];

  // Event handlers
  const handleAddProduct = async () => {
    if (props.onAddProduct) {
      try {
        await props.onAddProduct({
          name: 'New Product',
          price: '$0',
          description: 'Product description',
          image: '🛍️'
        });
      } catch (error) {
        console.error('Failed to add product:', error);
      }
    }
  };

  const handleAddToCart = async (productId: string) => {
    if (props.onAddToCart) {
      try {
        await props.onAddToCart(productId);
      } catch (error) {
        console.error('Failed to add to cart:', error);
      }
    }
  };

  const handleViewCart = async () => {
    if (props.onViewCart) {
      try {
        await props.onViewCart();
      } catch (error) {
        console.error('Failed to view cart:', error);
      }
    }
  };

  return React.createElement('div', { 
    style: {
      padding: appliedTheme.spacing.lg
    }
  },
    React.createElement('div', { 
      style: {
        backgroundColor: appliedTheme.colors.surface,
        borderRadius: appliedTheme.borders.borderRadius,
        boxShadow: appliedTheme.borders.boxShadow,
        padding: appliedTheme.spacing.lg
      }
    },
      React.createElement('div', { 
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          marginBottom: appliedTheme.spacing.lg
        }
      },
        React.createElement('div', {
          style: {
            display: 'flex',
            gap: appliedTheme.spacing.md
          }
        },
          props.cart && props.cart.length > 0 && React.createElement('button', { 
            style: {
              color: 'white',
              padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
              borderRadius: appliedTheme.borders.borderRadius,
              fontSize: appliedTheme.font.sizeSm,
              fontWeight: 500,
              backgroundColor: themeColors.secondary,
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity 0.2s'
            },
            onClick: handleViewCart,
            onMouseEnter: (e: any) => e.target.style.opacity = '0.9',
            onMouseLeave: (e: any) => e.target.style.opacity = '1'
          }, `Cart (${props.cart.length})`),
          context.isOwner && React.createElement('button', { 
            style: {
              color: 'white',
              padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
              borderRadius: appliedTheme.borders.borderRadius,
              fontSize: appliedTheme.font.sizeSm,
              fontWeight: 500,
              backgroundColor: themeColors.primary,
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity 0.2s'
            },
            onClick: handleAddProduct,
            onMouseEnter: (e: any) => e.target.style.opacity = '0.9',
            onMouseLeave: (e: any) => e.target.style.opacity = '1'
          }, '+ Add Product')
        )
      ),
      // Product Grid
      React.createElement('div', { 
        style: {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: appliedTheme.spacing.lg
        }
      },
        products.map((product: any, i: number) =>
          React.createElement('div', { 
            key: product.id || i, 
            style: {
              border: `1px solid ${appliedTheme.borders.borderColor}`,
              borderRadius: appliedTheme.borders.borderRadius,
              overflow: 'hidden',
              position: 'relative',
              backgroundColor: appliedTheme.colors.surface
            }
          },
            product.soldOut && React.createElement('div', { 
              style: {
                position: 'absolute',
                top: appliedTheme.spacing.sm,
                right: appliedTheme.spacing.sm,
                color: 'white',
                padding: `${appliedTheme.spacing.xs} ${appliedTheme.spacing.sm}`,
                fontSize: appliedTheme.font.sizeXs,
                fontWeight: 500,
                borderRadius: appliedTheme.borders.borderRadius,
                backgroundColor: themeColors.danger,
                zIndex: 1
              }
            }, 'SOLD OUT'),
            React.createElement('div', { 
              style: {
                height: '192px',
                backgroundColor: appliedTheme.colors.surfaceAlt,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '4rem'
              }
            }, product.image),
            React.createElement('div', { 
              style: {
                padding: appliedTheme.spacing.md
              }
            },
              React.createElement('h3', { 
                style: {
                  fontWeight: 600,
                  marginBottom: appliedTheme.spacing.xs,
                  color: appliedTheme.colors.textPrimary
                }
              }, product.name),
              React.createElement('p', { 
                style: {
                  fontSize: appliedTheme.font.sizeSm,
                  color: appliedTheme.colors.textSecondary,
                  marginBottom: appliedTheme.spacing.sm,
                  lineHeight: 1.4
                }
              }, product.description),
              React.createElement('div', { 
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }
              },
                React.createElement('span', { 
                  style: {
                    fontWeight: 'bold',
                    fontSize: appliedTheme.font.sizeLg,
                    color: appliedTheme.colors.textPrimary
                  }
                }, product.price),
                React.createElement('button', { 
                  style: {
                    color: product.soldOut ? appliedTheme.colors.muted : 'white',
                    padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
                    borderRadius: appliedTheme.borders.borderRadius,
                    fontSize: appliedTheme.font.sizeSm,
                    fontWeight: 500,
                    backgroundColor: product.soldOut ? appliedTheme.colors.surfaceAlt : themeColors.primary,
                    border: 'none',
                    cursor: product.soldOut ? 'not-allowed' : 'pointer',
                    transition: 'opacity 0.2s'
                  },
                  onClick: product.soldOut ? undefined : () => handleAddToCart(product.id),
                  disabled: product.soldOut,
                  onMouseEnter: product.soldOut ? undefined : (e: any) => e.target.style.opacity = '0.9',
                  onMouseLeave: product.soldOut ? undefined : (e: any) => e.target.style.opacity = '1'
                }, product.soldOut ? 'Sold Out' : 'Add to Cart')
              )
            )
          )
        )
      ),
      // Empty state
      products.length === 0 && React.createElement('div', {
        style: {
          textAlign: 'center',
          padding: `${appliedTheme.spacing.xl} 0`,
          color: appliedTheme.colors.textSecondary
        }
      },
        React.createElement('div', {
          style: {
            fontSize: '3rem',
            marginBottom: appliedTheme.spacing.md
          }
        }, '🛍️'),
        React.createElement('h3', {
          style: {
            fontSize: appliedTheme.font.sizeLg,
            fontWeight: 600,
            marginBottom: appliedTheme.spacing.sm
          }
        }, 'No products yet'),
        React.createElement('p', {
          style: {
            marginBottom: appliedTheme.spacing.md
          }
        }, 'Start selling merchandise to your community'),
        context.isOwner && React.createElement('button', {
          style: {
            color: 'white',
            padding: `${appliedTheme.spacing.md} ${appliedTheme.spacing.lg}`,
            borderRadius: appliedTheme.borders.borderRadius,
            fontSize: appliedTheme.font.sizeSm,
            fontWeight: 500,
            backgroundColor: themeColors.primary,
            border: 'none',
            cursor: 'pointer'
          },
          onClick: handleAddProduct
        }, 'Add Your First Product')
      ),
      // Error display
      props.error && React.createElement('div', { 
        style: {
          margin: `${appliedTheme.spacing.lg} 0`,
          padding: appliedTheme.spacing.md,
          backgroundColor: appliedTheme.colors.danger + '10',
          border: `1px solid ${appliedTheme.colors.danger}`,
          borderRadius: appliedTheme.borders.borderRadius,
          color: appliedTheme.colors.danger,
          fontSize: appliedTheme.font.sizeSm
        }
      }, props.error)
    )
  );
};

export const merchandisePlugin: Plugin = {
  id: 'merchandise',
  name: 'Merchandise',
  component: MerchComponent,
  icon: '',
  order: 5
};