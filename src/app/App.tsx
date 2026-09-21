import { BrowserRouter, HashRouter, Route, Routes } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AccountPage } from '../routes/AccountPage';
import { ApiDocsPage } from '../routes/ApiDocsPage';
import { CartPage } from '../routes/CartPage';
import { CataloguePage } from '../routes/CataloguePage';
import { CheckoutPage } from '../routes/CheckoutPage';
import { ContactPage } from '../routes/ContactPage';
import { ForgotPasswordPage, ResetPasswordPage } from '../routes/PasswordPages';
import { HomePage } from '../routes/HomePage';
import { LoginPage } from '../routes/LoginPage';
import { NotFoundPage } from '../routes/NotFoundPage';
import { OrderDetailPage } from '../routes/OrderDetailPage';
import { OrdersPage } from '../routes/OrdersPage';
import { ProductPage } from '../routes/ProductPage';
import { RegisterPage } from '../routes/RegisterPage';
import { AuthProvider } from './AuthContext';
import { CartProvider } from './CartContext';
import { QaProvider } from './QaContext';
import { ToastProvider } from './ToastContext';

export function App() {
  const Router = import.meta.env.VITE_STATIC_PREVIEW === 'true' ? HashRouter : BrowserRouter;
  return (
    <Router>
      <QaProvider>
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <Routes>
                <Route element={<Layout />}>
                  <Route index element={<HomePage />} />
                  <Route path="products" element={<CataloguePage />} />
                  <Route path="search" element={<CataloguePage />} />
                  <Route path="category/:category" element={<CataloguePage />} />
                  <Route path="products/:slug" element={<ProductPage />} />
                  <Route path="cart" element={<CartPage />} />
                  <Route path="contact" element={<ContactPage />} />
                  <Route path="api-docs" element={<ApiDocsPage />} />
                  <Route path="login" element={<LoginPage />} />
                  <Route path="register" element={<RegisterPage />} />
                  <Route path="forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="reset-password" element={<ResetPasswordPage />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="account" element={<AccountPage />} />
                    <Route path="checkout" element={<CheckoutPage />} />
                    <Route path="orders" element={<OrdersPage />} />
                    <Route path="orders/:orderNumber" element={<OrderDetailPage />} />
                  </Route>
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </QaProvider>
    </Router>
  );
}
