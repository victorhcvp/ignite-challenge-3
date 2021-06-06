import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get('/stock');
      const stock: Stock[] = response.data;

      if(stock[productId].amount <= 0) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const productExists = cart.find(p => p.id === productId);

      if(productExists) {

        if(stock[productId].amount <= productExists.amount + 1) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        const newCart = cart.map(product => {
          if(product.id === productId) {
            return {
              ...product,
              amount: product.amount + 1,
            }
          }
          return product;
        });

        setCart(newCart);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }
      else {
        const productsResponse = await api.get('/products');
        const products: Product[] = productsResponse.data;

        const productToAdd = products.find(p => p.id === productId);

        if(productToAdd) {

          if(stock[productId].amount <= productToAdd.amount + 1) {
            toast.error('Quantidade solicitada fora de estoque');
            return;
          }

          setCart([
            ...cart,
            {
              ...productToAdd,
              amount: 1,
            },
          ]);

        }
        else {
          throw new Error();
        }

        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, {
          ...productToAdd,
          amount: 1,
        }]));
      }

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {

      const findProduct = cart.find(p => p.id === productId);

      if(!findProduct) {
        throw new Error();
      }

      const newCart = cart.filter(p => {
        return p.id !== productId;
      });

      setCart(newCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      var product = cart.find(p => p.id === productId);

      if(product) {
        if(product.amount <= 0) {
          return;
        }

        const response = await api.get('/stock');
        const stock: Stock[] = response.data;

        if(stock[productId].amount <= amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        const newCart = cart.map(product => {
          if(product.id === productId) {
            return {
              ...product,
              amount: amount,
            }
          }

          return product;
        });

        setCart(newCart);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
