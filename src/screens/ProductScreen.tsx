import React, { useEffect, useMemo, useState } from 'react';
import css from './ProductScreen.module.css';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { selectProduct } from '@/store/products/selectors';
import { addToCart, removeFromCart } from '@/store/cart/reducer';
import { selectCartItemById } from '@/store/cart/selectors';
import { ProductBullets, ProductImage, ProductModifiers, ProductVariants } from '@/components/Product';
import { Button } from '@/components/uikit';
import { ArrowLeftIcon, CloseIcon } from '@/components/uikit/Icon';
import { useTelegram } from '@/context/TelegramContext';
import { toast } from 'react-toastify';
import { selectIsCartButtonEnabled } from '@/store/ui/selectors';
import Swipe from 'react-easy-swipe';
import { ROUTES } from '@/constants/routes';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { ButtonVariant } from '@/components/uikit/Button/Button';
import useSafeAreaInsets from '@/hooks/useSafeAreaInsets';

export const ProductScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { webApp } = useTelegram();
  const { impactOccurred, notificationOccurred } = useHapticFeedback();
  const safeAreaInsets = useSafeAreaInsets();
  
  // Стили для кнопки закрытия с учетом Safe Area Inset
  const closeButtonStyle = useMemo(() => ({
    top: safeAreaInsets.top ? `${safeAreaInsets.top}px` : '16px',
  }), [safeAreaInsets.top]);
  
  // Стили для контейнера с учетом Safe Area Inset снизу
  const containerStyle = useMemo(() => ({
    paddingBottom: safeAreaInsets.bottom ? `${safeAreaInsets.bottom}px` : '0',
  }), [safeAreaInsets.bottom]);

  const { productId } = router.query as { productId: string };
  const product = useSelector(selectProduct(productId));
  const cartItem = useSelector(selectCartItemById(productId));
  const isCartButtonEnabled = useSelector(selectIsCartButtonEnabled);

  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  const selectedVariantObject = useMemo(() => {
    if (!selectedVariant || !product?.variants?.length) return null;
    return product.variants.find((v) => v.id === selectedVariant) || null;
  }, [product?.variants, selectedVariant]);

  const productPrice = useMemo(() => {
    if (selectedVariantObject) {
      return selectedVariantObject.price;
    }
    return product?.price || 0;
  }, [product?.price, selectedVariantObject]);

  const productName = useMemo(() => {
    if (selectedVariantObject) {
      return `${product?.name} ${selectedVariantObject.name}`;
    }
    return product?.name || '';
  }, [product?.name, selectedVariantObject]);

  const productInCart = !!cartItem;

  const handleAddToCart = () => {
    if (!product) return;

    if (productInCart) {
      dispatch(removeFromCart({ id: product.id }));
      notificationOccurred('error');
      return;
    }

    dispatch(
      addToCart({
        id: product.id,
        name: productName,
        price: productPrice,
        quantity: 1,
        modifiers: selectedModifiers,
        variantId: selectedVariant,
      })
    );
    
    impactOccurred('medium');
    toast.success('Добавлено в корзину');
  };

  const hasVariants = !!(product?.variants && product.variants.length > 0);
  const hasModifiers = !!(product?.modifiers && product.modifiers.length > 0);

  const handleBack = () => {
    impactOccurred('light');
    router.back();
  };

  const handleSwipeRight = () => {
    impactOccurred('light');
    router.back();
  };

  useEffect(() => {
    if (hasVariants && product?.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0].id);
    }
  }, [hasVariants, product?.variants]);

  if (!product) {
    return <div>Loading...</div>;
  }

  const handleModifierToggle = (modifierId: string) => {
    impactOccurred('light');
    setSelectedModifiers((prev) => {
      if (prev.includes(modifierId)) {
        return prev.filter((id) => id !== modifierId);
      } else {
        return [...prev, modifierId];
      }
    });
  };

  const handleVariantSelect = (variantId: string) => {
    impactOccurred('light');
    setSelectedVariant(variantId);
  };

  const showCompleteOrderButton = productInCart;
  const buttonText = showCompleteOrderButton ? 'Перейти к оформлению' : (productInCart ? 'Удалить' : 'Добавить');
  const buttonVariant: ButtonVariant = productInCart ? 'outline' : 'primary';

  const handleActionButtonClick = () => {
    if (showCompleteOrderButton) {
      impactOccurred('medium');
      router.push(ROUTES.CART);
    } else {
      handleAddToCart();
    }
  };

  return (
    <Swipe onSwipeRight={handleSwipeRight} tolerance={100}>
      <div className={css.productScreen} style={containerStyle}>
        <div className={css.back} onClick={handleBack}>
          <ArrowLeftIcon width={24} height={24} />
        </div>
        <button className={css.close} onClick={handleBack} style={closeButtonStyle}>
          <CloseIcon width={16} height={16} />
        </button>

        <ProductImage image={product.image} name={product.name} />

        <div className={css.content}>
          <h1 className={css.title}>{product.name}</h1>
          <div className={css.description}>{product.description}</div>

          {hasVariants && (
            <ProductVariants
              variants={product.variants || []}
              selectedVariant={selectedVariant}
              onSelect={handleVariantSelect}
            />
          )}

          {hasModifiers && (
            <ProductModifiers
              modifiers={product.modifiers || []}
              selectedModifiers={selectedModifiers}
              onToggle={handleModifierToggle}
            />
          )}

          {product.bullets && product.bullets.length > 0 && <ProductBullets bullets={product.bullets} />}
        </div>

        <div className={css.bottomBar}>
          <Button 
            variant={buttonVariant} 
            onClick={handleActionButtonClick} 
            disabled={!isCartButtonEnabled} 
            className={css.actionButton}
          >
            <span>{buttonText}</span>
            <span className={css.price}>{productPrice} ₽</span>
          </Button>
        </div>
      </div>
    </Swipe>
  );
}; 